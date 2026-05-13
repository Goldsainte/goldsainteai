import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendNotification, NotificationPayload, NotificationChannel } from "../_shared/notificationService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'message' | 'milestone' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  data?: Record<string, any>;
  channels?: Partial<NotificationChannel>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData = await req.json() as SendNotificationRequest;

    const payload: NotificationPayload = {
      userId: requestData.userId,
      title: requestData.title,
      body: requestData.body,
      type: requestData.type,
      priority: requestData.priority || 'medium',
      actionUrl: requestData.actionUrl,
      data: requestData.data,
    };

    const result = await sendNotification(
      supabaseClient,
      payload,
      requestData.channels
    );

    console.log(`[NOTIFICATION] Sent to user ${requestData.userId} via ${result.channels.join(', ')}`);

    return new Response(
      JSON.stringify({
        success: result.success,
        channels: result.channels,
        errors: result.errors.length > 0 ? result.errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
