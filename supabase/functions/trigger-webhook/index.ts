import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

interface WebhookTriggerRequest {
  eventType: string;
  entityId: string;
  payload: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { eventType, entityId, payload } = await req.json() as WebhookTriggerRequest;

    // Get all active webhooks subscribed to this event
    const { data: webhooks } = await supabaseClient
      .from("webhook_configurations")
      .select("*")
      .eq("is_active", true)
      .contains("events", [eventType]);

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active webhooks for this event" }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Trigger all matching webhooks
    const deliveryPromises = webhooks.map(async (webhook) => {
      const deliveryPayload = {
        event: eventType,
        entity_id: entityId,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      let attempt = 0;
      let success = false;
      let responseStatus = null;
      let responseBody = null;
      let errorMessage = null;

      // Retry logic
      while (attempt < webhook.retry_attempts && !success) {
        attempt++;
        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": webhook.secret || "",
              "X-Event-Type": eventType,
            },
            body: JSON.stringify(deliveryPayload),
            signal: AbortSignal.timeout(webhook.timeout_seconds * 1000),
          });

          responseStatus = response.status;
          responseBody = await response.text();
          
          if (response.ok) {
            success = true;
          } else {
            errorMessage = `HTTP ${responseStatus}: ${responseBody}`;
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error("Unknown error");
          errorMessage = err.message;
        }

        // Wait before retry (exponential backoff)
        if (!success && attempt < webhook.retry_attempts) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      // Log delivery attempt
      await supabaseClient.from("webhook_delivery_logs").insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload: deliveryPayload,
        response_status: responseStatus,
        response_body: responseBody?.substring(0, 1000), // Limit size
        error_message: errorMessage,
        attempt_number: attempt,
        delivered_at: success ? new Date().toISOString() : null,
      });

      // Update last triggered timestamp
      if (success) {
        await supabaseClient
          .from("webhook_configurations")
          .update({ last_triggered_at: new Date().toISOString() })
          .eq("id", webhook.id);
      }

      return { webhook_id: webhook.id, success, attempts: attempt };
    });

    const results = await Promise.all(deliveryPromises);

    return new Response(
      JSON.stringify({
        message: "Webhooks triggered",
        results,
        total: webhooks.length,
        successful: results.filter(r => r.success).length,
      }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 400 }
    );
  }
});
