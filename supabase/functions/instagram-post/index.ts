import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const { imageUrl, caption } = await req.json();
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get user's Instagram token
    const { data: tokenData, error: tokenError } = await supabase
      .from('instagram_tokens')
      .select('access_token, instagram_user_id')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Instagram account not connected. Please connect your account first.');
    }

    const { access_token, instagram_user_id } = tokenData;

    // Step 1: Create media container
    const containerUrl = `https://graph.instagram.com/v21.0/${instagram_user_id}/media`;
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption: caption || '',
      access_token: access_token,
    });

    console.log('Creating media container...');
    const containerResponse = await fetch(`${containerUrl}?${containerParams}`, {
      method: 'POST',
    });

    if (!containerResponse.ok) {
      const error = await containerResponse.text();
      console.error('Container creation error:', error);
      throw new Error(`Failed to create media container: ${error}`);
    }

    const { id: containerId } = await containerResponse.json();
    console.log('Container created:', containerId);

    // Step 2: Publish the media
    const publishUrl = `https://graph.instagram.com/v21.0/${instagram_user_id}/media_publish`;
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: access_token,
    });

    console.log('Publishing media...');
    const publishResponse = await fetch(`${publishUrl}?${publishParams}`, {
      method: 'POST',
    });

    if (!publishResponse.ok) {
      const error = await publishResponse.text();
      console.error('Publish error:', error);
      throw new Error(`Failed to publish media: ${error}`);
    }

    const publishData = await publishResponse.json();
    console.log('Media published:', publishData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: publishData.id,
        message: 'Posted to Instagram successfully!' 
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Instagram post error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } 
      }
    );
  }
});