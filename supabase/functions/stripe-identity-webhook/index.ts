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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET_IDENTITY);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    // Handle Identity verification session events
    if (
      event.type === "identity.verification_session.verified" ||
      event.type === "identity.verification_session.requires_input" ||
      event.type === "identity.verification_session.canceled"
    ) {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const sessionId = session.id;
      const userId = session.metadata?.user_id;
      const applicationType = session.metadata?.application_type as 'agent' | 'brand';
      const applicationId = session.metadata?.application_id;

      if (!sessionId || !userId || !applicationType) {
        console.error("Missing required metadata in Stripe Identity session");
        return new Response("OK", { status: 200 });
      }

      // Determine new status based on event type
      let newStatus: string;
      let rejectionReason: string | null = null;

      if (event.type === "identity.verification_session.verified") {
        newStatus = "verified";
        console.log(`✅ Verification successful for ${applicationType}:`, userId);
      } else if (event.type === "identity.verification_session.requires_input") {
        newStatus = "failed";
        rejectionReason = session.last_error?.reason || session.last_error?.code || "Document could not be verified";
        console.log(`⚠️ Verification requires input for ${applicationType}:`, userId, rejectionReason);
      } else {
        newStatus = "failed";
        rejectionReason = "Verification was canceled";
        console.log(`❌ Verification canceled for ${applicationType}:`, userId);
      }

      // Update application table if applicationId provided
      if (applicationId) {
        const tableName = applicationType === 'agent' ? 'agent_applications' : 'brand_applications';
        
        const { error: appUpdateError } = await supabaseAdmin
          .from(tableName)
          .update({
            stripe_verification_status: newStatus,
            stripe_verified_at: newStatus === 'verified' ? new Date().toISOString() : null,
            rejection_reason: rejectionReason,
          })
          .eq("id", applicationId);

        if (appUpdateError) {
          console.error(`Error updating ${tableName}:`, appUpdateError);
        }
      }

      // Update profile verification status
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          [`${applicationType}_verification_status`]: newStatus,
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile verification status:", profileError);
      }

      // If verified, send notification to admins
      if (newStatus === "verified") {
        try {
          await supabaseAdmin.functions.invoke('notify-admin-verification-complete', {
            body: {
              userId,
              applicationType,
              applicationId,
              sessionId,
            },
          });
        } catch (notifyError) {
          console.error("Error sending admin notification:", notifyError);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error handling Stripe Identity webhook:", err);
    return new Response("OK", { status: 200 });
  }
});
