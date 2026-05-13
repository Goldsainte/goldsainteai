import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

// Refresh Etsy token if expired
async function refreshEtsyToken(connection: any): Promise<string> {
  const clientId = Deno.env.get('ETSY_CLIENT_ID');
  const clientSecret = Deno.env.get('ETSY_CLIENT_SECRET');

  const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Etsy token');
  }

  const tokens = await response.json();
  
  // Update stored tokens
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  await supabaseAdmin
    .from('ecommerce_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', connection.id);

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Etsy connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from('ecommerce_connections')
      .select('*')
      .eq('creator_id', user.id)
      .eq('platform', 'etsy')
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      throw new Error('No active Etsy connection found');
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt < new Date()) {
        console.log('Token expired, refreshing...');
        accessToken = await refreshEtsyToken(connection);
      }
    }

    // Create sync history record
    const { data: syncRecord } = await supabaseAdmin
      .from('sync_history')
      .insert({
        connection_id: connection.id,
        status: 'running',
      })
      .select()
      .single();

    // Update connection status
    await supabaseAdmin
      .from('ecommerce_connections')
      .update({ sync_status: 'syncing' })
      .eq('id', connection.id);

    const clientId = Deno.env.get('ETSY_CLIENT_ID');
    const shopId = connection.metadata?.shop_id;

    if (!shopId) {
      throw new Error('Shop ID not found in connection metadata');
    }

    console.log('Starting Etsy product sync for shop:', shopId);

    // Fetch active listings
    const listingsResponse = await fetch(
      `https://api.etsy.com/v3/application/shops/${shopId}/listings/active?limit=100`,
      {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': clientId || '',
        },
      }
    );

    if (!listingsResponse.ok) {
      const error = await listingsResponse.text();
      console.error('Etsy API error:', error);
      throw new Error(`Etsy API error: ${listingsResponse.statusText}`);
    }

    const listingsData = await listingsResponse.json();
    const listings = listingsData.results || [];

    console.log(`Fetched ${listings.length} listings from Etsy`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process each listing
    for (const listing of listings) {
      try {
        if (listing.state !== 'active') {
          skipped++;
          continue;
        }

        // Fetch listing images
        let images: string[] = [];
        try {
          const imagesResponse = await fetch(
            `https://api.etsy.com/v3/application/listings/${listing.listing_id}/images`,
            {
              headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'x-api-key': clientId || '',
              },
            }
          );

          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json();
            images = imagesData.results?.map((img: any) => img.url_fullxfull) || [];
          }
        } catch (error) {
          console.error('Error fetching images for listing:', listing.listing_id, error);
        }

        // Convert price from cents to dollars
        const price = listing.price?.amount ? listing.price.amount / 100 : 0;
        const currency = listing.price?.currency_code || 'USD';

        const productData = {
          creator_id: user.id,
          title: listing.title,
          description: listing.description || '',
          price,
          currency,
          is_active: true,
          inventory_count: listing.quantity || 0,
          category: listing.taxonomy_path?.[0] || 'General',
          images,
          external_product_id: listing.listing_id.toString(),
          external_store_id: connection.id,
          sync_source: 'etsy',
          external_url: listing.url,
          last_synced_at: new Date().toISOString(),
        };

        // Check if product exists
        const { data: existing } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('external_product_id', listing.listing_id.toString())
          .eq('external_store_id', connection.id)
          .maybeSingle();

        if (existing) {
          const { error: updateError } = await supabaseAdmin
            .from('products')
            .update(productData)
            .eq('id', existing.id);

          if (updateError) {
            console.error('Error updating product:', updateError);
            skipped++;
          } else {
            updated++;
          }
        } else {
          const { error: insertError } = await supabaseAdmin
            .from('products')
            .insert(productData);

          if (insertError) {
            console.error('Error inserting product:', insertError);
            skipped++;
          } else {
            created++;
          }
        }
      } catch (error) {
        console.error('Error processing listing:', error);
        skipped++;
      }
    }

    // Update sync history
    await supabaseAdmin
      .from('sync_history')
      .update({
        completed_at: new Date().toISOString(),
        status: 'success',
        products_fetched: listings.length,
        products_created: created,
        products_updated: updated,
        products_skipped: skipped,
      })
      .eq('id', syncRecord.id);

    // Update connection
    await supabaseAdmin
      .from('ecommerce_connections')
      .update({
        sync_status: 'success',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    console.log('Etsy sync complete:', { created, updated, skipped });

    return new Response(JSON.stringify({ 
      success: true,
      created,
      updated,
      skipped,
      total: listings.length,
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in sync-etsy-products:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
