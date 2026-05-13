import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Runs on a 5-minute pg_cron schedule. Counts recent DLQ / failed / pending
// rows in email_send_log; if any threshold is breached, dispatches an
// admin-queue-alert email via send-transactional-email. Idempotency key
// is bucketed per 15-minute window so we don't spam during ongoing incidents.

const WINDOW_MINUTES = 15;
const THRESHOLDS = { dlq: 1, failed: 5, pending: 200 } as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const adminEmail = Deno.env.get("ADMIN_ALERT_EMAIL");
  if (!adminEmail) {
    return new Response(
      JSON.stringify({ error: "ADMIN_ALERT_EMAIL not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const countByStatus = async (status: string) => {
    const { count, error } = await supabase
      .from("email_send_log")
      .select("message_id", { count: "exact", head: true })
      .eq("status", status)
      .gte("created_at", since);
    if (error) throw error;
    return count ?? 0;
  };

  let dlqCount = 0, failedCount = 0, pendingCount = 0;
  try {
    [dlqCount, failedCount, pendingCount] = await Promise.all([
      countByStatus("dlq"),
      countByStatus("failed"),
      countByStatus("pending"),
    ]);
  } catch (err) {
    console.error("[monitor-email-queue] count error", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const breach =
    dlqCount >= THRESHOLDS.dlq ||
    failedCount >= THRESHOLDS.failed ||
    pendingCount >= THRESHOLDS.pending;

  if (!breach) {
    return new Response(
      JSON.stringify({ ok: true, dlqCount, failedCount, pendingCount, alerted: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Bucket the alert per 15-minute window so the queue's own idempotency
  // dedupe prevents repeated alerts during a sustained incident.
  const bucket = Math.floor(Date.now() / (WINDOW_MINUTES * 60_000));
  const idempotencyKey = `queue-alert-${bucket}`;

  const { error: invokeErr } = await supabase.functions.invoke(
    "send-transactional-email",
    {
      body: {
        templateName: "admin-queue-alert",
        recipientEmail: adminEmail,
        idempotencyKey,
        templateData: {
          dlqCount,
          failedCount,
          pendingCount,
          windowMinutes: WINDOW_MINUTES,
        },
      },
    },
  );

  if (invokeErr) {
    console.error("[monitor-email-queue] dispatch error", invokeErr);
    return new Response(
      JSON.stringify({ error: String(invokeErr), dlqCount, failedCount, pendingCount }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, alerted: true, dlqCount, failedCount, pendingCount }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});