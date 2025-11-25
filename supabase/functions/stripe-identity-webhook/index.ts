import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET_IDENTITY = Deno.env.get("STRIPE_WEBHOOK_SECRET_IDENTITY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const sig = req.headers.get("Stripe-Signature");
  if (!sig) {
    return new Response("Missing Stripe-Signature", { status: 400 });
  }

  const rawBody = await req.text();
  const startTime = Date.now();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET_IDENTITY);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  // ============================================================================
  // IDEMPOTENCY CHECK
  // ============================================================================
  
  const { error: insertError } = await supabaseAdmin
    .from("webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      event_source: "stripe_identity",
      payload: event.data.object,
      processing_duration_ms: null, // Will update at end
    });

  if (insertError?.code === "23505") {
    // Duplicate event
    console.log(`✅ Duplicate webhook ignored: ${event.id}`);
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (insertError) {
    console.error("Error logging webhook event:", insertError);
    // Continue processing anyway
  }

  try {
    // ============================================================================
    // HANDLE IDENTITY VERIFICATION EVENTS
    // ============================================================================

    if (
      event.type === "identity.verification_session.verified" ||
      event.type === "identity.verification_session.requires_input" ||
      event.type === "identity.verification_session.canceled"
    ) {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const sessionId = session.id;
      const email = session.metadata?.email;
      const applicationType = session.metadata?.application_type as "agent" | "brand";
      const applicationId = session.metadata?.application_id;

      if (!sessionId || !email || !applicationType || !applicationId) {
        console.error("Missing required metadata in Stripe Identity session");
        return new Response("OK", { status: 200 });
      }

      console.log(`📨 Processing ${event.type} for ${applicationType}: ${email}`);

      // Determine new status
      let newStatus: string;
      let rejectionReason: string | null = null;

      if (event.type === "identity.verification_session.verified") {
        newStatus = "verified";
        console.log(`✅ Identity verified: ${email}`);
      } else if (event.type === "identity.verification_session.requires_input") {
        newStatus = "failed";
        rejectionReason =
          session.last_error?.reason ||
          session.last_error?.code ||
          "Document could not be verified";
        console.log(`⚠️ Identity verification failed: ${email} - ${rejectionReason}`);
      } else {
        newStatus = "failed";
        rejectionReason = "Verification was canceled by applicant";
        console.log(`❌ Identity verification canceled: ${email}`);
      }

      // Update application table
      const tableName =
        applicationType === "agent" ? "agent_applications" : "brand_applications";

      const { error: appUpdateError } = await supabaseAdmin
        .from(tableName)
        .update({
          status: newStatus,
          stripe_session_id: sessionId,
          stripe_verification_status: newStatus,
          stripe_verified_at:
            newStatus === "verified" ? new Date().toISOString() : null,
          stripe_verification_report:
            newStatus === "verified" ? session.last_verification_report : null,
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (appUpdateError) {
        console.error(`Error updating ${tableName}:`, appUpdateError);
        throw appUpdateError;
      }

      // Log audit event
      await supabaseAdmin.from("application_audit_log").insert({
        application_id: applicationId,
        application_type: applicationType,
        action: newStatus === "verified" ? "identity_verified" : "identity_failed",
        actor_type: "webhook",
        details: {
          email,
          session_id: sessionId,
          event_type: event.type,
          rejection_reason: rejectionReason,
        },
      });

      // If verified, notify admins to review application
      if (newStatus === "verified") {
        try {
          await supabaseAdmin.functions.invoke("notify-admin-new-application", {
            body: {
              email,
              applicationType,
              applicationId,
            },
          });
        } catch (notifyError) {
          console.error("Error sending admin notification:", notifyError);
          // Don't fail webhook if notification fails
        }
      }

      // If failed, notify applicant
      if (newStatus === "failed") {
        try {
          await supabaseAdmin.functions.invoke("notify-applicant-verification-failed", {
            body: {
              email,
              applicationType,
              rejectionReason,
            },
          });
        } catch (notifyError) {
          console.error("Error sending applicant notification:", notifyError);
        }
      }
    }

    // Update webhook event with processing duration
    const processingDuration = Date.now() - startTime;
    await supabaseAdmin
      .from("webhook_events")
      .update({
        processing_duration_ms: processingDuration,
      })
      .eq("event_id", event.id);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error handling Stripe Identity webhook:", err);

    // Log error in webhook_events
    await supabaseAdmin
      .from("webhook_events")
      .update({
        error_message: err instanceof Error ? err.message : String(err),
        processing_duration_ms: Date.now() - startTime,
      })
      .eq("event_id", event.id);

    // Return 200 to prevent Stripe retries (we logged the error)
    return new Response("OK", { status: 200 });
  }
});
