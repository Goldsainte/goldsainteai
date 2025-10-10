import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content_type, content_id, text_content, image_urls } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build AI prompt for content analysis
    let prompt = `Analyze the following content for policy violations. Check for:
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      action: analysis.violates_policy ? 'flagged' : 'approved',
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[MODERATE-CONTENT-ERROR]', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
