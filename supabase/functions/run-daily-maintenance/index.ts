/**
 * Daily Maintenance Runner
 * Central orchestrator for scheduled maintenance tasks
 * 
 * Schedule in Supabase Dashboard:
 * SELECT cron.schedule(
 *   'daily-maintenance',
 *   '0 2 * * *', -- 2 AM UTC daily
 *   $$
 *   SELECT net.http_post(
 *     url := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/run-daily-maintenance',
 *     headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
 *   );
 *   $$
 * );
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  const startTime = Date.now();
  console.log("[daily-maintenance] Starting maintenance run");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const results: Record<string, any> = {};

  try {
    // 1. Expire stale marketplace jobs
    try {
      await supabase.rpc("expire_old_marketplace_jobs");
      results.expireJobs = "success";
      console.log("[daily-maintenance] ✓ Expired old marketplace jobs");
    } catch (error) {
      results.expireJobs = { error: error instanceof Error ? error.message : String(error) };
      console.error("[daily-maintenance] ✗ Failed to expire jobs:", error);
    }

    // 2. Clean expired OAuth states
    try {
      await supabase.rpc("cleanup_expired_oauth_states");
      results.cleanupOAuth = "success";
      console.log("[daily-maintenance] ✓ Cleaned expired OAuth states");
    } catch (error) {
      results.cleanupOAuth = { error: error instanceof Error ? error.message : String(error) };
      console.error("[daily-maintenance] ✗ Failed to cleanup OAuth:", error);
    }

    // 3. Clean expired search cache
    try {
      await supabase.rpc("cleanup_expired_cache");
      results.cleanupCache = "success";
      console.log("[daily-maintenance] ✓ Cleaned expired cache");
    } catch (error) {
      results.cleanupCache = { error: error instanceof Error ? error.message : String(error) };
      console.error("[daily-maintenance] ✗ Failed to cleanup cache:", error);
    }

    // 4. Check expiring subscriptions
    try {
      const { data, error } = await supabase.functions.invoke("check-expiring-subscriptions");
      if (error) throw error;
      results.checkSubscriptions = data;
      console.log("[daily-maintenance] ✓ Checked expiring subscriptions");
    } catch (error) {
      results.checkSubscriptions = { error: error instanceof Error ? error.message : String(error) };
      console.error("[daily-maintenance] ✗ Failed to check subscriptions:", error);
    }

    // 5. Prune old presence heartbeats (if tracked in DB)
    // Uncomment if presence is stored in database:
    // try {
    //   const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    //   await supabase
    //     .from("presence_heartbeats")
    //     .delete()
    //     .lt("last_seen", threshold.toISOString());
    //   results.prunePresence = "success";
    //   console.log("[daily-maintenance] ✓ Pruned old presence data");
    // } catch (error) {
    //   results.prunePresence = { error: error instanceof Error ? error.message : String(error) };
    //   console.error("[daily-maintenance] ✗ Failed to prune presence:", error);
    // }

    const duration = Date.now() - startTime;
    console.log(`[daily-maintenance] Completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: new Date().toISOString(),
        durationMs: duration,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[daily-maintenance] Fatal error:", error);

    return new Response(
      JSON.stringify({
        error: "Maintenance run failed",
        correlationId: crypto.randomUUID(),
        durationMs: duration,
        results,
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
