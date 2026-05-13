import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

type UpsertPayload = {
  displayName?: string;
  handle?: string;
  avatarUrl?: string;
  bio?: string;
  primaryNiches?: string[];
  primaryRegions?: string[];
  tiktokHandle?: string;
  tiktokUrl?: string;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders(req) 
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

  // 1) Auth
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(
      JSON.stringify({ message: "Not authenticated" }),
      { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  // 2) Parse payload
  let body: UpsertPayload;
  try {
    body = (await req.json()) as UpsertPayload;
  } catch {
    return new Response("Invalid JSON", { 
      status: 400,
      headers: corsHeaders(req) 
    });
  }

  const {
    displayName,
    handle,
    avatarUrl,
    bio,
    primaryNiches,
    primaryRegions,
    tiktokHandle,
    tiktokUrl,
  } = body;

  // 3) Upsert profile
  const { data: row, error: upsertError } = await supabase
    .from("creator_profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: displayName ?? null,
        handle: handle ?? null,
        avatar_url: avatarUrl ?? null,
        bio: bio ?? null,
        primary_niches: primaryNiches ?? [],
        primary_regions: primaryRegions ?? [],
        tiktok_handle: tiktokHandle ?? null,
        tiktok_url: tiktokUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select(
      "user_id, display_name, handle, avatar_url, bio, primary_niches, primary_regions, tiktok_handle, tiktok_url"
    )
    .maybeSingle();

  if (upsertError) {
    console.error("Error upserting creator_profile:", upsertError);

    // Handle unique handle conflict cleanly
    if (
      (upsertError as any).code === "23505" ||
      (upsertError as any).message?.includes("creator_profiles_handle_key")
    ) {
      return new Response(
        JSON.stringify({
          message: "That handle is already taken. Please choose another.",
          code: "HANDLE_TAKEN",
        }),
        { status: 409, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Failed to save profile" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ profile: row }), {
    status: 200,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
});
