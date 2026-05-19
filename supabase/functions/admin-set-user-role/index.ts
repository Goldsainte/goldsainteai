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

const VALID_ACCOUNT_TYPES = new Set(["traveler", "creator", "agent", "brand"]);
const VALID_ROLES = new Set(["admin", "agent", "brand", "moderator", "user"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const headers = { ...corsHeaders(req), "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const adminUserId = claimsData.claims.sub as string;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId);
    const isAdmin = callerRoles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), { status: 403, headers });
    }

    const body = await req.json();
    const { targetUserId, accountType, addRoles = [], removeRoles = [] } = body ?? {};

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "targetUserId is required" }), { status: 400, headers });
    }

    // Prevent admin from removing their own admin role (lockout protection)
    if (targetUserId === adminUserId && removeRoles.includes("admin")) {
      return new Response(JSON.stringify({ error: "Cannot remove your own admin role" }), { status: 400, headers });
    }

    // 1. Update account_type on profile if requested
    if (accountType) {
      if (!VALID_ACCOUNT_TYPES.has(accountType)) {
        return new Response(JSON.stringify({ error: `Invalid accountType: ${accountType}` }), { status: 400, headers });
      }
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ account_type: accountType, role: accountType })
        .eq("id", targetUserId);
      if (profileError) {
        return new Response(JSON.stringify({ error: `Profile update failed: ${profileError.message}` }), { status: 500, headers });
      }
    }

    // 2. Add roles
    for (const role of addRoles) {
      if (!VALID_ROLES.has(role)) continue;
      await adminClient.from("user_roles").upsert(
        { user_id: targetUserId, role },
        { onConflict: "user_id,role" }
      );
    }

    // 3. Remove roles
    for (const role of removeRoles) {
      if (!VALID_ROLES.has(role)) continue;
      await adminClient.from("user_roles").delete().eq("user_id", targetUserId).eq("role", role);
    }

    // 4. Audit log
    await adminClient.from("application_audit_log").insert({
      application_id: targetUserId,
      application_type: "role_change",
      action: "role_updated",
      actor_id: adminUserId,
      actor_type: "admin",
      details: { accountType, addRoles, removeRoles, changed_at: new Date().toISOString() },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err: any) {
    console.error("admin-set-user-role error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), { status: 500, headers });
  }
});