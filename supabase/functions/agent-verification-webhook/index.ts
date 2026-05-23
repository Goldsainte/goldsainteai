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
    // Deno SubtleCrypto is async-only — must use constructEventAsync.
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET_IDENTITY);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    if (
      event.type === "identity.verification_session.verified" ||
      event.type === "identity.verification_session.requires_input" ||
      event.type === "identity.verification_session.canceled"
    ) {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const sessionId = session.id;
      const agentId = session.metadata?.agent_id;

      if (!sessionId || !agentId) {
        console.error("Missing sessionId or agentId in Identity metadata");
        return new Response("OK", { status: 200 });
      }

      const { data: app, error: appError } = await supabaseAdmin
        .from("agent_applications")
        .select("id")
        .eq("agent_id", agentId)
        .eq("kyc_session_id", sessionId)
        .maybeSingle();

      if (appError || !app) {
        console.error("Error loading agent application in webhook", appError);
        return new Response("OK", { status: 200 });
      }

      if (event.type === "identity.verification_session.verified") {
        await supabaseAdmin
          .from("agent_applications")
          .update({
            verification_status: "verified",
            rejection_reason: null,
          })
          .eq("id", app.id);

        await supabaseAdmin
          .from("profiles")
          .update({
            agent_verification_status: "verified",
          })
          .eq("id", agentId);

        console.log("Agent verification completed for", agentId);
      } else {
        const reason =
          session.last_error?.reason ||
          session.last_error?.code ||
          "Verification not completed";

        await supabaseAdmin
          .from("agent_applications")
          .update({
            verification_status: "rejected",
            rejection_reason: reason,
          })
          .eq("id", app.id);

        await supabaseAdmin
          .from("profiles")
          .update({
            agent_verification_status: "rejected",
          })
          .eq("id", agentId);

        console.log("Agent verification rejected or canceled for", agentId);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error handling Stripe Identity webhook", err);
    return new Response("OK", { status: 200 });
  }
});
