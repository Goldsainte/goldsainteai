import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Goldsainte Verified — role-based subscription checkout.
// The price is ALWAYS resolved server-side from the caller's role so an agent
// can never purchase the cheaper tier by tampering with the request body.
//   agent    → VERIFICATION_PRICE_AGENT    ($8.99/mo)
//   creator  → VERIFICATION_PRICE_CREATOR  ($3.99/mo)
//   traveler → VERIFICATION_PRICE_TRAVELER ($3.99/mo)
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.get("origin") || "";
  const origin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : (ALLOWED_ORIGINS[0] || Deno.env.get("SITE_URL") || "https://goldsainte.ai");

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  // Service-role client for role lookups (user_roles is not readable via anon).
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // ---- Resolve role server-side ----
    // Agents come from the security-canonical user_roles table.
    // Creators are identified by a creator_profiles row.
    // Everyone else is a traveler.
    let role: "agent" | "creator" | "traveler" = "traveler";
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if ((roles ?? []).some((r: { role: string }) => r.role === "agent")) {
      role = "agent";
    } else {
      const { data: creator } = await supabaseAdmin
        .from("creator_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (creator) role = "creator";
    }

    const PRICE_ENV: Record<typeof role, string> = {
      agent: "VERIFICATION_PRICE_AGENT",
      creator: "VERIFICATION_PRICE_CREATOR",
      traveler: "VERIFICATION_PRICE_TRAVELER",
    };
    const priceId = Deno.env.get(PRICE_ENV[role]);
    if (!priceId) {
      throw new Error(`Missing ${PRICE_ENV[role]} environment variable`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    // Cached Stripe customer, else look up by email and cache.
    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    let customerId = profileData?.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      }
    }

    // Refuse a second active verification subscription.
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("verification_active")
      .eq("id", user.id)
      .single();
    if (existing?.verification_active) {
      return new Response(
        JSON.stringify({ error: "already_verified" }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 409 }
      );
    }

    // SELF-HEAL: the profile says "not verified", but Stripe may disagree —
    // e.g. a payment completed while the webhook wasn't wired. If an active
    // verification subscription already exists for this customer, repair the
    // profile right here instead of charging a second time.
    if (customerId) {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 20,
      });
      const verSub = subs.data.find(
        (sub) => (sub.metadata?.subscription_type === "verification")
      );
      if (verSub) {
        const healedRole =
          (verSub.metadata?.verification_role as string) || role;
        await supabaseAdmin
          .from("profiles")
          .update({
            verification_active: true,
            verification_role: healedRole,
            verification_subscription_id: verSub.id,
            verification_period_end: new Date(
              verSub.current_period_end * 1000
            ).toISOString(),
          })
          .eq("id", user.id);

        // Send the welcome receipt that the missed webhook never sent.
        const item = verSub.items?.data?.[0];
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("email, preferred_language")
          .eq("id", user.id)
          .single();
        if (prof?.email) {
          const amount = item?.price?.unit_amount != null
            ? `${(item.price.currency || "usd").toUpperCase()} ${(item.price.unit_amount / 100).toFixed(2)}`
            : "";
          const planNames: Record<string, string> = {
            agent: "Goldsainte Verified — Agent",
            creator: "Goldsainte Verified — Creator",
            traveler: "Goldsainte Verified — Traveler",
          };
          fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              templateName: "verification-welcome",
              recipientEmail: prof.email,
              templateData: {
                lang: prof.preferred_language?.split("-")[0] || "en",
                planName: planNames[healedRole] || planNames.traveler,
                amount,
                nextBillingDate: new Date(verSub.current_period_end * 1000)
                  .toISOString()
                  .slice(0, 10),
              },
            }),
          }).catch((e) => console.error("welcome email dispatch failed", e));
        }

        return new Response(
          JSON.stringify({ recovered: true, role: healedRole }),
          { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    const meta = {
      user_id: user.id,
      subscription_type: "verification",
      verification_role: role,
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/settings?verification=success`,
      cancel_url: `${origin}/settings?verification=cancelled`,
      metadata: meta,
      // CRITICAL: copy metadata onto the subscription itself so that
      // customer.subscription.* and invoice.* webhook events carry it.
      subscription_data: { metadata: meta },
    });

    return new Response(JSON.stringify({ url: session.url, role }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
