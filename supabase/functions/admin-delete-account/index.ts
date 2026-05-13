import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders(req) });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders(req) });
    }

    const adminUserId = claimsData.claims.sub as string;

    // Check admin role using service role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId);

    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), { status: 403, headers: corsHeaders(req) });
    }

    const { targetUserId, reason } = await req.json();
    if (!targetUserId || !reason) {
      return new Response(JSON.stringify({ error: "targetUserId and reason are required" }), { status: 400, headers: corsHeaders(req) });
    }

    // Prevent self-deletion
    if (targetUserId === adminUserId) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), { status: 400, headers: corsHeaders(req) });
    }

    // Log the action before deletion
    await adminClient.from("application_audit_log").insert({
      application_id: targetUserId,
      application_type: "account_deletion",
      action: "account_deleted",
      actor_id: adminUserId,
      actor_type: "admin",
      details: { reason, deleted_at: new Date().toISOString() },
    });

    // Insert moderation action
    await adminClient.from("moderation_actions").insert({
      target_user_id: targetUserId,
      action_type: "account_disabled",
      reason,
      enforced_by_admin_id: adminUserId,
      is_active: true,
      enforced_at: new Date().toISOString(),
    });

    // Delete profile (cascading deletes should handle related data)
    await adminClient.from("profiles").delete().eq("id", targetUserId);

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      // Profile already deleted, log but don't fail
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
  } catch (err) {
    console.error("admin-delete-account error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), { status: 500, headers: corsHeaders(req) });
  }
});
