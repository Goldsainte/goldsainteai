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

    // Get Shopify connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from('ecommerce_connections')
      .select('*')
      .eq('creator_id', user.id)
      .eq('platform', 'shopify')
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      throw new Error('No active Shopify connection found');
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

    let allProducts: any[] = [];
    let pageInfo = null;
    let hasNextPage = true;

    console.log('Starting Shopify product sync for:', connection.store_url);

    // Fetch all products with pagination
    while (hasNextPage) {
      const url: string = pageInfo 
        ? `https://${connection.store_url}/admin/api/2024-01/products.json?limit=250&page_info=${pageInfo}`
        : `https://${connection.store_url}/admin/api/2024-01/products.json?limit=250`;

      const response: Response = await fetch(url, {
        headers: { 'X-Shopify-Access-Token': connection.access_token },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`);
      }

      const data = await response.json();
      allProducts = allProducts.concat(data.products || []);

      // Check for next page
      const linkHeader: string | null = response.headers.get('Link');
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)>; rel="next"/);
        pageInfo = match ? match[1] : null;
        hasNextPage = !!pageInfo;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`Fetched ${allProducts.length} products from Shopify`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process each product
    for (const product of allProducts) {
      try {
        // Only import active products
        if (product.status !== 'active') {
          skipped++;
          continue;
        }

        // Get first variant for pricing
        const variant = product.variants?.[0];
        if (!variant) {
          skipped++;
          continue;
        }

        // Strip HTML from description
        const description = product.body_html 
          ? product.body_html.replace(/<[^>]*>/g, '').trim()
          : '';

        // Map images
        const images = product.images?.map((img: any) => img.src) || [];

        const productData = {
          creator_id: user.id,
          title: product.title,
          description: description.substring(0, 500), // Limit length
          price: parseFloat(variant.price),
          currency: 'USD', // Shopify returns shop currency
          is_active: true,
          inventory_count: variant.inventory_quantity || 0,
          category: product.product_type || 'General',
          images,
          external_product_id: product.id.toString(),
          external_store_id: connection.id,
          sync_source: 'shopify',
          external_url: `https://${connection.store_url}/products/${product.handle}`,
          last_synced_at: new Date().toISOString(),
        };

        // Check if product already exists
        const { data: existing } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('external_product_id', product.id.toString())
          .eq('external_store_id', connection.id)
          .maybeSingle();

        if (existing) {
          // Update existing product
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
          // Create new product
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
        console.error('Error processing product:', error);
        skipped++;
      }
    }

    // Update sync history
    await supabaseAdmin
      .from('sync_history')
      .update({
        completed_at: new Date().toISOString(),
        status: 'success',
        products_fetched: allProducts.length,
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

    console.log('Sync complete:', { created, updated, skipped });

    return new Response(JSON.stringify({ 
      success: true,
      created,
      updated,
      skipped,
      total: allProducts.length,
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in sync-shopify-products:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
