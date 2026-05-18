import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🔒 AUTH: admin only
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } });
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } });
    }
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    if (!roles?.some((r: { role: string }) => r.role === 'admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const { confirmToken } = await req.json();
    
    // Safety check: require confirmation token
    if (confirmToken !== 'DELETE_ALL_SEEDED_DATA') {
      return new Response(
        JSON.stringify({ error: 'Invalid confirmation token' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting data cleanup...');
    
    // Get all creator profile IDs first
    const { data: creatorProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_type', 'creator');
    
    const creatorIds = creatorProfiles?.map(p => p.id) || [];
    
    if (creatorIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No seeded data found',
          deleted: { profiles: 0, posts: 0, follows: 0, collections: 0 }
        }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Delete in correct order (respect foreign keys)
    
    // 1. Delete collection_posts links (fetch collection ids first)
    const { data: collections } = await supabase
      .from('post_collections')
      .select('id')
      .in('user_id', creatorIds);

    const collectionIds = collections?.map((c: { id: string }) => c.id) || [];

    if (collectionIds.length > 0) {
      await supabase
        .from('collection_posts')
        .delete()
        .in('collection_id', collectionIds);
    }
    
    // 2. Delete post_collections
    await supabase
      .from('post_collections')
      .delete()
      .in('user_id', creatorIds);
    
    // 3. Delete user_follows where either follower or following is a creator
    const idsCSV = creatorIds.join(',');
    await supabase
      .from('user_follows')
      .delete()
      .or(`follower_id.in.(${idsCSV}),following_id.in.(${idsCSV})`);
    
    // 4. Delete travel_posts from creators
    await supabase
      .from('travel_posts')
      .delete()
      .in('user_id', creatorIds);
    
    // 5. Delete creator profiles (this cascades to auth.users via trigger)
    await supabase
      .from('profiles')
      .delete()
      .eq('account_type', 'creator');
    
    // 6. Delete auth users for seeded creators
    for (const id of creatorIds) {
      try {
        await supabase.auth.admin.deleteUser(id);
      } catch (err) {
        console.error(`Error deleting auth user ${id}:`, err);
      }
    }

    console.log('Cleanup completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All seeded data cleared',
        deleted: {
          profiles: creatorIds.length,
          posts: 0,
          follows: 0,
          collections: 0,
        }
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error clearing data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
