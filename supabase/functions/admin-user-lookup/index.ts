// admin-user-lookup — platform-wide per-person ledger for admins (30 Jul).
// Deploys automatically on commit (supabase/functions/**).
//
// Two modes, both admin-only (authoritative user_roles check, same pattern
// as approve-application):
//   { query: "tanya powell" | "9804750399" | "t@x.com" }
//     -> up to 10 matching profiles (name / email / username / phone digits)
//   { userId: "<uuid>" }
//     -> everything linked to that person, service-role queries so no RLS
//        gaps: profile + agent/creator standing, trip requests, proposals,
//        bookings (as traveler AND as the servicing agent/creator), tips
//        received & given (gross + net sums), guide & bundle purchases
//        (Rail C), and earnings ledger with per-status totals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const corsHeaders = (req: Request) => ({
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
});

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ---- Admin gate: identity from JWT, role from user_roles ----
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json(req, { error: "Not authenticated" }, 401);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json(req, { error: "Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));

    // ---- Mode 1: search ----
    if (body.query) {
      const q = String(body.query).trim();
      const digits = q.replace(/\D/g, "");
      let builder = admin
        .from("profiles")
        .select("id, full_name, first_name, last_name, email, username, phone, account_type, role, created_at")
        .limit(10);
      if (digits.length >= 7 && digits.length === q.replace(/[\s()+-]/g, "").length) {
        builder = builder.ilike("phone", `%${digits}%`);
      } else {
        const esc = q.replace(/[%_,]/g, "");
        builder = builder.or(
          `full_name.ilike.%${esc}%,first_name.ilike.%${esc}%,last_name.ilike.%${esc}%,email.ilike.%${esc}%,username.ilike.%${esc}%`,
        );
      }
      const { data, error } = await builder;
      if (error) throw error;
      return json(req, { results: data ?? [] });
    }

    // ---- Mode 2: full ledger for one user ----
    const userId = body.userId;
    if (!userId) return json(req, { error: "query or userId required" }, 400);

    const LIMIT = 25;
    const [
      profile, agent, creator,
      tripRequests, proposals,
      bookingsAsTraveler,
      tipsReceived, tipsGiven,
      guidePurchases, bundlePurchases,
      earnings,
      applicationsAll,
    ] = await Promise.all([
      admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      admin.from("travel_agents").select("id, agency_name, status, terms_accepted, stripe_connect_account_id, created_at").eq("user_id", userId).maybeSingle(),
      admin.from("creator_profiles").select("user_id, created_at").eq("user_id", userId).maybeSingle(),
      admin.from("trip_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      admin.from("trip_proposals").select("*").eq("proposer_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      admin.from("bookings").select("*").eq("traveler_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      admin.from("tips").select("id, amount_cents, net_cents, platform_fee_cents, currency, note, tipper_id, created_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      admin.from("tips").select("id, amount_cents, currency, note, recipient_id, created_at").eq("tipper_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      admin.from("itinerary_purchases").select("*").eq("buyer_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      admin.from("bundle_purchases").select("*").eq("buyer_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      admin.from("earnings_ledger").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      // Applications, matched by user_id OR the profile's email — pre-auth
      // application rows can exist before user_id is linked.
      admin.from("agent_applications")
        .select("id, user_id, email, status, agency_name, stripe_verification_status, created_at, reviewed_at, rejected_at, rejection_reason")
        .order("created_at", { ascending: false }).limit(LIMIT),
    ]);

    // Bookings where this person was the SERVICING side (agent id is the
    // travel_agents row id, not the user id — resolve first).
    let bookingsAsAgent: unknown[] = [];
    if (agent.data?.id) {
      const r = await admin.from("bookings").select("*").eq("agent_id", agent.data.id).order("created_at", { ascending: false }).limit(LIMIT);
      bookingsAsAgent = r.data ?? [];
    }
    const bookingsAsCreator = await admin.from("bookings").select("*").eq("creator_id", userId).order("created_at", { ascending: false }).limit(LIMIT);

    const profileEmail = (profile.data?.email || "").toLowerCase();
    const applications = (applicationsAll.data ?? []).filter(
      (a: any) => a.user_id === userId ||
        (profileEmail && (a.email || "").toLowerCase() === profileEmail),
    );

    const sumCents = (rows: any[] | null, key: string) =>
      (rows ?? []).reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

    return json(req, {
      profile: profile.data ?? null,
      agent: agent.data ?? null,
      isCreator: !!creator.data,
      tripRequests: tripRequests.data ?? [],
      proposals: proposals.data ?? [],
      bookings: {
        asTraveler: bookingsAsTraveler.data ?? [],
        asAgent: bookingsAsAgent,
        asCreator: bookingsAsCreator.data ?? [],
      },
      tips: {
        received: tipsReceived.data ?? [],
        given: tipsGiven.data ?? [],
        receivedGrossCents: sumCents(tipsReceived.data, "amount_cents"),
        receivedNetCents: sumCents(tipsReceived.data, "net_cents"),
        givenCents: sumCents(tipsGiven.data, "amount_cents"),
      },
      purchases: {
        guides: guidePurchases.data ?? [],
        bundles: bundlePurchases.data ?? [],
      },
      applications,
      earnings: {
        entries: earnings.data ?? [],
        totalCents: sumCents(earnings.data, "amount"),
      },
      limits: { perSection: LIMIT },
    });
  } catch (e: any) {
    console.error("[admin-user-lookup]", e);
    return json(req, { error: e?.message || "Lookup failed" }, 500);
  }
});
