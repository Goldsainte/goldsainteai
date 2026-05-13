import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: authData } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (!authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log("📊 [PLATFORM METRICS] Fetching metrics for admin:", authData.user.id);

    // Fetch platform metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Active users (last 30 days)
    const { count: activeUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", thirtyDaysAgo.toISOString());

    // New users (last 30 days)
    const { count: newUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Total bookings
    const { count: totalBookings } = await supabase
      .from("package_bookings")
      .select("*", { count: "exact", head: true });

    // Bookings this month
    const { count: monthlyBookings } = await supabase
      .from("package_bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Calculate growth rate (simplified)
    const growthRate =
      totalUsers && totalUsers > 0 ? ((newUsers || 0) / totalUsers) * 100 : 0;

    const metrics = {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        new: newUsers || 0,
        growthRate: parseFloat(growthRate.toFixed(2)),
      },
      bookings: {
        total: totalBookings || 0,
        monthly: monthlyBookings || 0,
      },
      revenue: {
        total: 0, // TODO: Calculate from creator_revenue_transactions
        monthly: 0,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("✅ [PLATFORM METRICS] Fetched successfully");

    return new Response(JSON.stringify({ success: true, metrics }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("❌ [PLATFORM METRICS ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
