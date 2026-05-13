// Active monitor for email infrastructure.
// Runs every 5 minutes via pg_cron. On breach:
//   1. Inserts a row into email_infra_alerts (deduped on alert_key while open)
//   2. Sends a direct Resend alert email (BYPASSES the queue — the queue may be the thing that's broken)
// On recovery: marks open alerts as resolved.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALERT_TO = Deno.env.get("EMAIL_INFRA_ALERT_TO") || "info@goldsainte.com";
const ALERT_FROM = "Goldsainte Infra <alerts@notify.goldsainte.com>";
const QUEUE_DEPTH_THRESHOLD = 100;
const STUCK_PENDING_MIN = 10;
const DLQ_THRESHOLD = 10;
const CRON_STALE_MIN = 60;
const CRON_FAILURE_THRESHOLD = 5;

interface Breach { key: string; severity: "critical" | "warning"; detail: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const breaches: Breach[] = [];

  // 1. Vault secret
  const { data: vaultOk } = await sb.rpc("email_infra_vault_secret_exists", {
    _name: "email_queue_service_role_key",
  });
  if (vaultOk !== true) breaches.push({
    key: "vault_secret_missing", severity: "critical",
    detail: "email_queue_service_role_key missing from Vault — cron cannot authenticate.",
  });

  // 2. Cron job active
  const { data: jobs } = await sb.rpc("email_infra_cron_status").select("*");
  const job = (jobs as any[] | null)?.find((j) => j.jobname === "process-email-queue");
  if (!job || job.active !== true) breaches.push({
    key: "cron_job_inactive", severity: "critical",
    detail: job ? "process-email-queue cron is disabled." : "process-email-queue cron is missing.",
  });

  // 3. Queue depth (pgmq) > threshold
  const { data: depthData } = await sb.rpc("email_infra_queue_depth");
  const depth = (depthData as any[] | null)?.reduce((s, r: any) => s + Number(r.queue_length || 0), 0) ?? 0;
  if (depth > QUEUE_DEPTH_THRESHOLD) breaches.push({
    key: "queue_depth_high", severity: "warning",
    detail: `pgmq queue depth = ${depth} (threshold ${QUEUE_DEPTH_THRESHOLD}). Dispatcher may be stalled or rate-limited.`,
  });

  // 4. Stuck pending > 10 min
  const stuckCutoff = new Date(Date.now() - STUCK_PENDING_MIN * 60_000).toISOString();
  const { count: stuck } = await sb.from("email_send_log")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending").lt("created_at", stuckCutoff);
  if ((stuck ?? 0) > 0) breaches.push({
    key: "stuck_pending_emails", severity: "critical",
    detail: `${stuck} email(s) stuck in 'pending' for >${STUCK_PENDING_MIN} min — cron not draining.`,
  });

  // 5. DLQ spike (last hour)
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: dlq } = await sb.from("email_send_log")
    .select("id", { count: "exact", head: true })
    .eq("status", "dlq").gte("created_at", hourAgo);
  if ((dlq ?? 0) >= DLQ_THRESHOLD) breaches.push({
    key: "dlq_spike", severity: "warning",
    detail: `${dlq} emails moved to DLQ in last hour (threshold ${DLQ_THRESHOLD}). Provider/template failure likely.`,
  });

  // 6. Global pg_cron staleness — no job has succeeded in the last hour
  const { data: cronHealth } = await sb.rpc("email_infra_cron_last_run");
  const ch = Array.isArray(cronHealth) ? cronHealth[0] : cronHealth;
  if (ch) {
    const lastSuccess = ch.last_successful_run ? new Date(ch.last_successful_run).getTime() : 0;
    const ageMin = lastSuccess ? Math.round((Date.now() - lastSuccess) / 60_000) : Infinity;
    if (ageMin > CRON_STALE_MIN) {
      breaches.push({
        key: "cron_stale",
        severity: "critical",
        detail: `No pg_cron job has succeeded in ${ageMin === Infinity ? "any recorded run" : ageMin + " min"} (threshold ${CRON_STALE_MIN} min). ${ch.total_active_jobs} active jobs scheduled. pg_cron worker may be stuck — check Supabase status.`,
      });
    }
    if ((ch.recent_failures ?? 0) >= CRON_FAILURE_THRESHOLD) {
      breaches.push({
        key: "cron_failures_spike",
        severity: "warning",
        detail: `${ch.recent_failures} cron job runs failed in the last hour (threshold ${CRON_FAILURE_THRESHOLD}). Inspect cron.job_run_details.`,
      });
    }
  }

  // Reconcile alerts: open new, resolve recovered
  const breachKeys = breaches.map((b) => b.key);
  const newlyOpened: Breach[] = [];

  for (const b of breaches) {
    const { data: existing } = await sb.from("email_infra_alerts")
      .select("id").eq("alert_key", b.key).is("resolved_at", null).maybeSingle();
    if (!existing) {
      await sb.from("email_infra_alerts").insert({
        alert_key: b.key, severity: b.severity, detail: b.detail,
      });
      newlyOpened.push(b);
    }
  }

  // Auto-resolve open alerts no longer breaching
  const { data: openAlerts } = await sb.from("email_infra_alerts")
    .select("id, alert_key").is("resolved_at", null);
  const toResolve = (openAlerts as any[] | null)?.filter((a) => !breachKeys.includes(a.alert_key)) ?? [];
  if (toResolve.length) {
    await sb.from("email_infra_alerts")
      .update({ resolved_at: new Date().toISOString() })
      .in("id", toResolve.map((a) => a.id));
  }

  // Send direct alert email for newly opened critical/warning breaches (BYPASS QUEUE)
  if (newlyOpened.length) {
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_KEY) {
      const html = `
        <h2 style="color:#0c4d47">Email infrastructure alert</h2>
        <p>The following checks failed at ${new Date().toISOString()}:</p>
        <ul>${newlyOpened.map((b) =>
          `<li><strong>[${b.severity.toUpperCase()}] ${b.key}</strong><br>${b.detail}</li>`
        ).join("")}</ul>
        <p>Endpoint: <code>/functions/v1/verify-email-infra</code></p>
      `;
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: ALERT_FROM,
            to: [ALERT_TO],
            subject: `[Goldsainte] Email infra alert — ${newlyOpened.length} new breach(es)`,
            html,
          }),
        });
        if (!r.ok) console.error("alert resend failed", r.status, await r.text());
      } catch (e) {
        console.error("alert send threw", e);
      }
    }
  }

  return new Response(JSON.stringify({
    healthy: breaches.length === 0,
    breaches,
    newly_opened: newlyOpened.length,
    auto_resolved: toResolve.length,
    queue_depth: depth,
    checked_at: new Date().toISOString(),
  }, null, 2), {
    status: breaches.length === 0 ? 200 : 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
