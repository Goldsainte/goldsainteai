import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, getUserTier, getTieredRateLimit, type SubscriptionTier } from "../_shared/rateLimiter.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

// ⚠️ SECURITY: Zod validation for input sanitization
const z = {
  object: (shape: any) => ({
    safeParse: (data: any) => {
      try {
        const query = data.query;
        if (typeof query !== 'string') {
          return { success: false, error: { message: 'Query must be a string' } };
        }
        const trimmed = query.trim();
        if (trimmed.length === 0) {
          return { success: false, error: { message: 'Query cannot be empty' } };
        }
        if (trimmed.length > 100) {
          return { success: false, error: { message: 'Query must be less than 100 characters' } };
        }
        // Block potential injection patterns
        if (/<script|javascript:|onerror=/i.test(trimmed)) {
          return { success: false, error: { message: 'Invalid characters in query' } };
        }
        return { success: true, data: { query: trimmed } };
      } catch (error) {
        return { success: false, error: { message: 'Invalid input format' } };
      }
    }
  })
};

const searchSchema = z.object({
  query: true // Validated above
});

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
    // ⚠️ SECURITY: Rate limiting for destination searches
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    let tier: SubscriptionTier = 'unauthenticated';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const tempClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        const { data: { user } } = await tempClient.auth.getUser(token);
        if (user) {
          userId = user.id;
          tier = await getUserTier(userId);
        }
      } catch (error) {
        console.log('Failed to authenticate user, treating as unauthenticated');
      }
    }
    
    const clientId = getClientIdentifier(req, userId);
    const limits = getTieredRateLimit(tier, 'search-destinations');
    
    const rateLimit = await checkRateLimit({
      ...limits,
      identifier: clientId,
      endpoint: 'search-destinations',
      tier
    });
    
    if (!rateLimit.allowed) {
      console.log('❌ [RATE LIMIT] Destination search blocked for:', clientId);
      return createRateLimitResponse(rateLimit, corsHeaders(req));
    }
    
    console.log(`✅ [RATE LIMIT] ${rateLimit.remaining} destination searches remaining`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const body = await req.json();
    
    // ⚠️ SECURITY: Validate input with schema
    console.log('🔒 [VALIDATION] Validating search query');
    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ [VALIDATION] Invalid input:', validation.error);
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({ 
          error: validation.error?.message || 'Invalid input',
          results: [] 
        }),
        {
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    if (!validation.data) {
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid query data',
          results: [] 
        }),
        {
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    const { query } = validation.data;
    console.log('✅ [VALIDATION] Input validated');
    
    console.log('Search destinations request:', { query });

    const apiKey = Deno.env.get('BOOKING_API_KEY');
    if (!apiKey) {
      clearTimeout(timeoutId);
      throw new Error('BOOKING_API_KEY not configured');
    }

    const response = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", results: [] }), {
          status: 429,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Destination search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Destinations found:', data.data?.length || 0);

    return new Response(JSON.stringify({ results: data.data || [] }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    console.error('Error in search-destinations:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: "Request timed out. Please try again.", results: [] }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 408,
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage, results: [] }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});