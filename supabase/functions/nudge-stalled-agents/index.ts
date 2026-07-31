// nudge-stalled-agents — finds people who chose "agent" at signup but never
// completed the Documents step (so no application row exists — the invisible
// state Yassine Bouaichi sat in for three days, 30 Jul), and sends them a
// branded "finish your application" email. Deploys automatically on commit.
//
// Callers:
//   - weekly pg_cron (service-role bearer) — real send
//   - admin dashboard { dryRun: true }  — returns the stalled list, no email
//   - admin dashboard { dryRun: false } — manual "send nudges now"
//
// Guardrails: only accounts older than 2 days (don't nudge someone mid-flow),
// at most one nudge per 7 days (profiles.stalled_nudge_sent_at, migration 296),
// anyone with ANY application row or an agent account is excluded.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";
import { sendBrandedEmail } from "../_shared/brandEmail.ts";

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

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_AGE_DAYS = 2;
const NUDGE_COOLDOWN_DAYS = 7;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceKey);

    // ---- Gate: service-role bearer (cron) OR a signed-in admin ----
    const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    let authorized = bearer === serviceKey;
    if (!authorized) {
      const { data: userData } = await admin.auth.getUser(bearer);
      if (userData?.user) {
        const { data: roleRow } = await admin
          .from("user_roles").select("role")
          .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
        authorized = !!roleRow;
      }
    }
    if (!authorized) return json(req, { error: "Admin or service access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // default TRUE — sending is explicit

    // ---- Candidates: agent-typed profiles with no application, no agency ----
    const [profilesRes, appsRes, agentsRes] = await Promise.all([
      admin.from("profiles")
        .select("id, email, first_name, full_name, created_at, stalled_nudge_sent_at")
        .eq("account_type", "agent"),
      admin.from("agent_applications").select("user_id, email"),
      admin.from("travel_agents").select("user_id"),
    ]);
    if (profilesRes.error) throw profilesRes.error;

    const appUserIds = new Set((appsRes.data ?? []).map((a: any) => a.user_id).filter(Boolean));
    const appEmails = new Set((appsRes.data ?? []).map((a: any) => (a.email || "").toLowerCase()).filter(Boolean));
    const agentUserIds = new Set((agentsRes.data ?? []).map((a: any) => a.user_id));
    const now = Date.now();

    const stalled = (profilesRes.data ?? []).filter((p: any) => {
      if (!p.email) return false;
      if (appUserIds.has(p.id)) return false;
      if (appEmails.has(p.email.toLowerCase())) return false;
      if (agentUserIds.has(p.id)) return false;
      if (now - new Date(p.created_at).getTime() < MIN_AGE_DAYS * DAY_MS) return false;
      return true;
    });

    const dueForNudge = stalled.filter((p: any) =>
      !p.stalled_nudge_sent_at ||
      now - new Date(p.stalled_nudge_sent_at).getTime() > NUDGE_COOLDOWN_DAYS * DAY_MS
    );

    if (dryRun) {
      return json(req, {
        dryRun: true,
        stalledCount: stalled.length,
        dueForNudgeCount: dueForNudge.length,
        stalled: stalled.map((p: any) => ({
          id: p.id,
          email: p.email,
          name: p.full_name || p.first_name || null,
          joined: p.created_at,
          lastNudged: p.stalled_nudge_sent_at,
        })),
      });
    }

    // ---- Send ----
    let sent = 0;
    const failures: string[] = [];
    for (const p of dueForNudge) {
      const first = (p.first_name || p.full_name || "there").split(" ")[0];
      const ok = await sendBrandedEmail(
        p.email,
        "Your Goldsainte agent application is waiting",
        `Pick up where you left off, ${first}.`,
        `<p>You started joining Goldsainte's advisor network but didn't get the chance to finish your application. It takes about ten minutes — your details, credentials, and a quick identity check — and travelers on the marketplace are posting trips right now.</p>
         <p>Your progress on the form is saved in your browser, so you can continue right where you stopped.</p>`,
        "Finish my application",
        "https://goldsainte.ai/apply/agent",
      );
      if (ok) {
        sent++;
        await admin.from("profiles")
          .update({ stalled_nudge_sent_at: new Date().toISOString() })
          .eq("id", p.id);
      } else {
        failures.push(p.email);
      }
    }

    console.log(`[nudge-stalled-agents] stalled=${stalled.length} due=${dueForNudge.length} sent=${sent} failed=${failures.length}`);
    return json(req, { dryRun: false, stalledCount: stalled.length, sent, failed: failures });
  } catch (e: any) {
    console.error("[nudge-stalled-agents]", e);
    return json(req, { error: e?.message || "Nudge run failed" }, 500);
  }
});
