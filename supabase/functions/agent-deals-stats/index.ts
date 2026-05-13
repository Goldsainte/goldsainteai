import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", userError);
    return new Response(
      JSON.stringify({ message: "Not authenticated" }),
      { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  console.log("Loading stats for user:", user.id);

  const { data: collabs, error: collabError } = await supabase
    .from("creator_collab_requests")
    .select("id, creator_id, trip_title, status, compensation, created_at, estimated_revenue, actual_revenue")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  if (collabError) {
    console.error("Error loading collab requests:", collabError);
    return new Response(
      JSON.stringify({ message: "Error loading collabs" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const totalDeals = collabs?.length ?? 0;
  const pendingDeals = collabs?.filter((c) => c.status === "pending").length ?? 0;
  const activeDeals = collabs?.filter((c) => c.status === "live" || c.status === "accepted").length ?? 0;

  // Calculate total revenue from completed deals
  const totalRevenue = collabs
    ?.filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + (c.actual_revenue || 0), 0) ?? 0;

  const recentDeals = (collabs ?? []).slice(0, 5).map((c) => ({
    id: c.id,
    tripTitle: c.trip_title,
    status: c.status,
    compensation: c.compensation,
    createdAt: c.created_at,
  }));

  console.log("Stats calculated:", { totalDeals, pendingDeals, activeDeals, totalRevenue });

  const body = {
    totalDeals,
    pendingDeals,
    activeDeals,
    totalRevenue,
    recentDeals,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
