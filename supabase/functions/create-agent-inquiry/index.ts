import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, getUserTier, getTieredRateLimit, type SubscriptionTier } from "../_shared/rateLimiter.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

// ⚠️ SECURITY: Input validation schema
const validateInquiry = (data: any): { success: boolean; error?: string; data?: any } => {
  const { travelerInfo, travelDetails } = data;
  
  // Validate traveler info
  if (!travelerInfo || typeof travelerInfo !== 'object') {
    return { success: false, error: 'Traveler information is required' };
  }
  
  const name = travelerInfo.name?.trim();
  const email = travelerInfo.email?.trim();
  const phone = travelerInfo.phone?.trim();
  
  if (!name || name.length < 2 || name.length > 100) {
    return { success: false, error: 'Name must be between 2 and 100 characters' };
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 255) {
    return { success: false, error: 'Valid email address is required' };
  }
  
  // Phone validation (optional but if provided must be valid)
  if (phone && (phone.length < 10 || phone.length > 20 || !/^[\d\s+()-]+$/.test(phone))) {
    return { success: false, error: 'Phone number must be 10-20 digits' };
  }
  
  // Sanitize inputs
  return {
    success: true,
    data: {
      travelerInfo: {
        name: name.substring(0, 100),
        email: email.toLowerCase().substring(0, 255),
        phone: phone ? phone.substring(0, 20) : undefined,
        additionalEmails: Array.isArray(travelerInfo.additionalEmails) 
          ? travelerInfo.additionalEmails.slice(0, 5).map((e: string) => e.trim().toLowerCase().substring(0, 255))
          : []
      },
      travelDetails: travelDetails || {}
    }
  };
};

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
    // ⚠️ SECURITY: Rate limiting to prevent inquiry spam
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    let tier: SubscriptionTier = 'unauthenticated';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          tier = await getUserTier(userId);
        }
      } catch (error) {
        console.log('Failed to authenticate user, treating as unauthenticated');
      }
    }
    
    const clientId = getClientIdentifier(req, userId);
    const limits = getTieredRateLimit(tier, 'create-agent-inquiry');
    
    const rateLimit = await checkRateLimit({
      ...limits,
      identifier: clientId,
      endpoint: 'create-agent-inquiry',
      tier
    });
    
    if (!rateLimit.allowed) {
      console.log('❌ [RATE LIMIT] Inquiry request blocked for:', clientId);
      return createRateLimitResponse(rateLimit, corsHeaders(req));
    }
    
    console.log(`✅ [RATE LIMIT] ${rateLimit.remaining} inquiry requests remaining`);

    const body = await req.json();
    
    // ⚠️ SECURITY: Validate and sanitize input
    console.log('🔒 [VALIDATION] Validating inquiry data');
    const validation = validateInquiry(body);
    if (!validation.success) {
      console.error('❌ [VALIDATION] Invalid inquiry data:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ [VALIDATION] Inquiry data validated');
    
    const { travelerInfo, travelDetails } = validation.data;
    const { conversationData, inquirySource = 'ai_chat', priority = 'medium' } = body;

    console.log('Creating agent inquiry:', { travelerEmail: travelerInfo.email, inquirySource });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    userId = userId || undefined;

    const additionalEmails = travelerInfo.additionalEmails || [];

    const { data: inquiry, error: inquiryError } = await supabase
      .from('agent_inquiries')
      .insert({
        user_id: userId,
        guest_name: travelerInfo.name,
        guest_email: travelerInfo.email,
        guest_phone: travelerInfo.phone,
        additional_emails: additionalEmails,
        inquiry_source: inquirySource,
        conversation_data: { travelerInfo, travelDetails, ...conversationData },
        status: 'pending',
        priority: priority
      })
      .select()
      .single();

    if (inquiryError) throw inquiryError;

    const referenceNumber = `INQ-${inquiry.id.slice(0, 8).toUpperCase()}`;

    // Convert to marketplace job
    const { data: jobResult } = await supabase.functions.invoke(
      'convert-inquiry-to-marketplace-job',
      { body: { inquiryId: inquiry.id } }
    );

    const jobId = jobResult?.jobId;

    // Trigger AI matching with inquiryId to update inquiry record
    await supabase.functions.invoke('ai-agent-matching', {
      body: { jobId, inquiryId: inquiry.id, generateScores: true }
    });

    // Notify agents
    if (jobId) {
      await supabase.functions.invoke('notify-agents-new-job', {
        body: { 
          jobId,
          title: jobResult.jobTitle,
          destination: travelDetails?.destination,
          budget: travelDetails?.budget?.amount,
          currency: travelDetails?.budget?.currency || 'USD'
        }
      });
    }

    // Send confirmation email
    await supabase.functions.invoke('send-traveler-confirmation-email', {
      body: { inquiryId: inquiry.id, jobId, referenceNumber }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        inquiryId: inquiry.id,
        jobId,
        jobUrl: jobResult?.jobUrl,
        referenceNumber,
        message: "Your request has been posted to our agent marketplace!",
        contactEmail: travelerInfo.email,
        contactPhone: travelerInfo.phone,
        estimatedResponseTime: "2-4 hours",
        nextSteps: [
          "Your trip is now live in the marketplace",
          "AI matched you with certified agents",
          "Agents will submit bids within 2-4 hours",
          `You'll be notified at ${travelerInfo.email}`,
          `Track bids at ${jobResult?.jobUrl || '/marketplace'}`
        ]
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-agent-inquiry:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
