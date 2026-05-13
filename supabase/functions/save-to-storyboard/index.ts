import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssetData {
  media_url?: string;
  caption?: string;
  location?: string;
  category?: string;
  data?: any;
}

interface RequestBody {
  userId: string;
  storyboardId: string;
  assetType: 'photo' | 'video' | 'experience' | 'note' | 'brand_collection' | 'creator_profile';
  assetData: AssetData;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { userId, storyboardId, assetType, assetData } = body;

    console.log('Save to storyboard request:', { userId, storyboardId, assetType });

    // Verify user owns the storyboard
    const { data: storyboard, error: storyboardError } = await supabaseClient
      .from('storyboards')
      .select('id, owner_id')
      .eq('id', storyboardId)
      .single();

    if (storyboardError || !storyboard) {
      console.error('Storyboard not found:', storyboardError);
      return new Response(
        JSON.stringify({ success: false, error: 'Storyboard not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (storyboard.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authorized to edit this storyboard' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the next position
    const { data: maxOrderData } = await supabaseClient
      .from('storyboard_items')
      .select('position')
      .eq('storyboard_id', storyboardId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (maxOrderData?.position ?? -1) + 1;

    // Map assetType to item_type (actual column)
    const itemTypeMap: Record<string, string> = {
      photo: 'image',
      video: 'video',
      experience: 'experience',
      note: 'note',
      brand_collection: 'image',
      creator_profile: 'image',
    };

    // Map assetType to source_type (actual column)
    const sourceTypeMap: Record<string, string> = {
      photo: assetData.data?.source || 'manual',
      video: 'manual',
      experience: 'viator',
      note: 'manual',
      brand_collection: 'media_library',
      creator_profile: 'creator',
    };

    // Insert into storyboard_items using correct column names
    const { data: newItem, error: insertError } = await supabaseClient
      .from('storyboard_items')
      .insert({
        storyboard_id: storyboardId,
        item_type: itemTypeMap[assetType] || 'image',
        source_type: sourceTypeMap[assetType] || 'manual',
        source_id: assetData.data?.source_id || null,
        image_url: assetData.media_url || assetData.data?.cover_image_url || null,
        title: assetData.caption || null,
        subtitle: assetData.location || null,
        description: assetData.data?.description || null,
        position: nextPosition,
        metadata: assetData.data || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to insert storyboard item:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save item to storyboard' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully saved item to storyboard:', newItem.id);

    return new Response(
      JSON.stringify({ success: true, itemId: newItem.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-to-storyboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
