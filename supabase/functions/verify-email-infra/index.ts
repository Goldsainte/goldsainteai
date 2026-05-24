// Email infrastructure health check.
//
// Returns HTTP 200 only when EVERY critical piece of the email pipeline is
// wired up. Returns HTTP 503 with a structured failure list otherwise so the
// problem is loud, machine-readable, and can be alerted on instead of being
// discovered hours later when users complain that booking confirmations
// never arrived.
//
// Checks:
//   1. Vault secret `email_queue_service_role_key` exists
//   2. Cron job `process-email-queue` exists and is active
//   3. No queue backlog older than 10 minutes
//   4. No spike of `dlq` rows in the last hour
//
// Anyone with the project anon key can call this — it returns no secret
// values, only boolean health. Wire it into uptime monitoring or call it
// from an admin dashboard.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const checks: Check[] = [];

  // 1. Vault secret present
  try {
    const { data, error } = await sb.rpc(
      "email_infra_vault_secret_exists",
      { _name: "email_queue_service_role_key" },
    );
    checks.push({
      name: "vault_secret_email_queue_service_role_key",
      ok: !error && data === true,
      detail: error
        ? `vault check RPC failed: ${error.message}`
        : data === true
        ? undefined
        : "MISSING — cron dispatcher cannot authenticate to process-email-queue. Run setup_email_infra to repair.",
    });
  } catch (e) {
    checks.push({
      name: "vault_secret_email_queue_service_role_key",
      ok: false,
      detail: `vault check threw: ${(e as Error).message}`,
    });
  }

  // 2. Cron job exists and active
  const { data: jobs, error: jobErr } = await sb.rpc("email_infra_cron_status").select("*");
  if (jobErr) {
    // Fallback: try a direct query through a tiny RPC we declare in migration below.
    checks.push({
      name: "process_email_queue_cron_job",
      ok: false,
      detail: `cron status RPC missing: ${jobErr.message}`,
    });
  } else {
    const job = (jobs as any[])?.find?.(
      (j: any) => j.jobname === "process-email-queue",
    );
    checks.push({
      name: "process_email_queue_cron_job",
      ok: !!job && job.active === true,
      detail: job
        ? job.active
          ? `active, schedule=${job.schedule}`
          : "EXISTS but disabled — re-enable in cron.job"
        : "MISSING — emails will never dispatch. Run setup_email_infra.",
    });
  }

  // 3. Queue backlog — TRUE stuck count.
  // email_send_log is append-only: a successful send leaves BOTH a 'pending'
  // row AND a 'sent' row sharing the same message_id. Counting raw pending
  // rows produces a false-positive every time the dispatcher works.
  // We only flag a message as stuck if NO terminal-status row exists for it
  // and the pending row is older than 10 minutes.
  const { data: stuckRows, error: stuckErr } = await sb.rpc(
    "email_infra_count_stuck_pending",
    { _older_than_minutes: 10 },
  );
  const stuckCount = typeof stuckRows === "number" ? stuckRows : 0;
  checks.push({
    name: "no_stuck_pending_emails",
    ok: !stuckErr && stuckCount === 0,
    detail: stuckErr
      ? `query failed: ${stuckErr.message}`
      : stuckCount > 0
      ? `${stuckCount} emails truly stuck in 'pending' >10min (no sent/dlq/failed terminal row) — dispatcher may be broken`
      : undefined,
  });

  // 4. DLQ spike in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count: dlqCount, error: dlqErr } = await sb
    .from("email_send_log")
    .select("id", { count: "exact", head: true })
    .eq("status", "dlq")
    .gte("created_at", oneHourAgo);
  checks.push({
    name: "no_dlq_spike_last_hour",
    ok: !dlqErr && (dlqCount ?? 0) < 10,
    detail: dlqErr
      ? `query failed: ${dlqErr.message}`
      : (dlqCount ?? 0) >= 10
      ? `${dlqCount} emails in DLQ in last hour — provider or template failure`
      : undefined,
  });

  const healthy = checks.every((c) => c.ok);
  return new Response(
    JSON.stringify({ healthy, checks, checked_at: new Date().toISOString() }, null, 2),
    {
      status: healthy ? 200 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
