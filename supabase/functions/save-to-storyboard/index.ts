import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
  assetType: 'photo' | 'video' | 'experience' | 'note';
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

    // Get the next order_index
    const { data: maxOrderData } = await supabaseClient
      .from('storyboard_items')
      .select('order_index')
      .eq('storyboard_id', storyboardId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (maxOrderData?.order_index ?? -1) + 1;

    // Map assetType to kind
    const kindMap: Record<string, string> = {
      photo: 'photo',
      video: 'video',
      experience: 'experience',
      note: 'note',
    };

    // Map assetType to source
    const sourceMap: Record<string, string> = {
      photo: assetData.data?.source || 'manual',
      video: 'manual',
      experience: 'viator',
      note: 'manual',
    };

    // Insert into storyboard_items
    const { data: newItem, error: insertError } = await supabaseClient
      .from('storyboard_items')
      .insert({
        storyboard_id: storyboardId,
        kind: kindMap[assetType],
        source: sourceMap[assetType],
        media_url: assetData.media_url || null,
        caption: assetData.caption || null,
        location_label: assetData.location || null,
        category_tag: assetData.category || null,
        order_index: nextOrderIndex,
        layout_type: 'standard',
        data: assetData.data || null,
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
