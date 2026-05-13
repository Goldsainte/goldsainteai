import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

// ⚠️ SECURITY: Input validation for content moderation
const ALLOWED_CONTENT_TYPES = ['post', 'comment', 'moment', 'message', 'profile'] as const;
type AllowedContentType = typeof ALLOWED_CONTENT_TYPES[number];

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const isValidUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const sanitizeText = (text: string, maxLength: number = 50000): string => {
  if (typeof text !== 'string') return '';
  return text
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
};

interface ModerationInput {
  content_type: string;
  content_id: string;
  text_content?: string;
  image_urls?: string[];
}

const validateModerationInput = (data: unknown): { success: true; data: ModerationInput } | { success: false; error: string } => {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }

  const input = data as Record<string, unknown>;

  // Validate content_type
  if (!input.content_type || typeof input.content_type !== 'string') {
    return { success: false, error: 'content_type is required and must be a string' };
  }
  if (!ALLOWED_CONTENT_TYPES.includes(input.content_type as AllowedContentType)) {
    return { success: false, error: `content_type must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}` };
  }

  // Validate content_id
  if (!input.content_id || typeof input.content_id !== 'string') {
    return { success: false, error: 'content_id is required and must be a string' };
  }
  if (!isValidUUID(input.content_id)) {
    return { success: false, error: 'content_id must be a valid UUID' };
  }

  // Validate text_content (optional)
  let sanitizedText: string | undefined;
  if (input.text_content !== undefined) {
    if (typeof input.text_content !== 'string') {
      return { success: false, error: 'text_content must be a string' };
    }
    sanitizedText = sanitizeText(input.text_content);
  }

  // Validate image_urls (optional)
  let validatedImageUrls: string[] | undefined;
  if (input.image_urls !== undefined) {
    if (!Array.isArray(input.image_urls)) {
      return { success: false, error: 'image_urls must be an array' };
    }
    if (input.image_urls.length > 20) {
      return { success: false, error: 'Maximum 20 image URLs allowed' };
    }
    for (const url of input.image_urls) {
      if (typeof url !== 'string' || !isValidUrl(url)) {
        return { success: false, error: 'Each image_url must be a valid HTTP/HTTPS URL' };
      }
    }
    validatedImageUrls = input.image_urls;
  }

  return {
    success: true,
    data: {
      content_type: input.content_type as string,
      content_id: input.content_id as string,
      text_content: sanitizedText,
      image_urls: validatedImageUrls,
    }
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    // ⚠️ SECURITY: Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔒 [VALIDATION] Validating moderation input');
    const validation = validateModerationInput(rawBody);
    if (!validation.success) {
      console.error('❌ [VALIDATION] Invalid input:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ [VALIDATION] Input validated');

    const { content_type, content_id, text_content, image_urls } = validation.data;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build AI prompt for content analysis
    const prompt = `Analyze the following content for policy violations. Check for:
- Nudity or sexual content
- Hate speech or harassment
- Graphic violence
- Spam or scams
- Misinformation
- Self-harm content
- Dangerous organizations
- Minor safety concerns

Content Type: ${content_type}
Text Content: ${text_content || 'None'}
${image_urls ? `Image URLs: ${image_urls.join(', ')}` : ''}

Respond with a JSON object containing:
{
  "violates_policy": boolean,
  "violation_types": string[], // array of violation types found
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": number, // 0-1 confidence score
  "explanation": string,
  "recommended_action": "approve" | "flag_for_review" | "auto_remove"
}`;

    // Call Lovable AI for content analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a content moderation AI. Analyze content strictly and flag anything that violates community guidelines. Be conservative in your judgments to ensure user safety.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI moderation failed');
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    console.log('[CONTENT-MODERATION]', {
      content_type,
      content_id,
      violates: analysis.violates_policy,
      severity: analysis.severity
    });

    // If content violates policy, create moderation flag
    if (analysis.violates_policy) {
      const { error: flagError } = await supabase
        .from('content_moderation_flags')
        .insert({
          content_type,
          content_id,
          flag_source: 'ai',
          violation_type: analysis.violation_types[0] || 'other',
          severity: analysis.severity,
          confidence_score: analysis.confidence,
          ai_analysis: analysis,
          status: analysis.recommended_action === 'auto_remove' ? 'confirmed' : 'pending'
        });

      if (flagError) {
        console.error('[MODERATION-FLAG-ERROR]', flagError);
      }

      // Auto-remove critical violations
      if (analysis.severity === 'critical' || analysis.recommended_action === 'auto_remove') {
        // Hide the content based on type
        if (content_type === 'post') {
          await supabase.from('travel_posts').update({ is_hidden: true }).eq('id', content_id);
        } else if (content_type === 'comment') {
          await supabase.from('post_comments').update({ is_hidden: true }).eq('id', content_id);
        }

        return new Response(JSON.stringify({
          action: 'removed',
          reason: 'Automatic removal due to severe policy violation',
          analysis
        }), {
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      action: analysis.violates_policy ? 'flagged' : 'approved',
      analysis
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[MODERATE-CONTENT-ERROR]', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
