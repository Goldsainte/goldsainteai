import * as React from 'npm:react@18.3.1'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { TripInquiryEmail } from "../_shared/email-templates/trip-inquiry.tsx";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "../_shared/rateLimiter.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

// ─── Constants ──────────────────────────────────────────────────────────────
const FROM_DOMAIN = 'goldsainte.com';

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

// ─── Input validation ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubmitPayload {
  email: string;
  firstName?: string;
  phone?: string;
  tripId: string;
  partnerId?: string;
  question: string;
  tripTitle?: string;
  hostName?: string;
}

function validatePayload(raw: unknown): { ok: true; data: SubmitPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }
  const body = raw as Record<string, unknown>;

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_REGEX.test(email) || email.length > 255) {
    return { ok: false, error: 'A valid email address is required' };
  }

  const tripId = typeof body.tripId === 'string' ? body.tripId.trim() : '';
  if (!tripId || !/^[0-9a-f-]{36}$/i.test(tripId)) {
    return { ok: false, error: 'A valid trip ID is required' };
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question || question.length < 2) {
    return { ok: false, error: 'A question is required' };
  }
  if (question.length > 1000) {
    return { ok: false, error: 'Question must be 1000 characters or fewer' };
  }

  const partnerId = typeof body.partnerId === 'string' ? body.partnerId.trim() : undefined;
  const tripTitle = typeof body.tripTitle === 'string' ? body.tripTitle.trim().substring(0, 200) : undefined;
  const hostName = typeof body.hostName === 'string' ? body.hostName.trim().substring(0, 100) : undefined;
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim().substring(0, 100) : undefined;
  const phone = typeof body.phone === 'string' ? body.phone.trim().substring(0, 30) : undefined;

  return {
    ok: true,
    data: {
      email,
      firstName: firstName || undefined,
      phone: phone || undefined,
      tripId,
      partnerId: partnerId || undefined,
      question: question.substring(0, 1000),
      tripTitle,
      hostName,
    },
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  // ── Rate limiting (5 inquiries per IP per hour) ───────────────────────────
  const clientId = getClientIdentifier(req);
  const rateLimitResult = await checkRateLimit({
    identifier: clientId,
    endpoint: 'submit-trip-inquiry',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, corsHeaders(req));
  }

  // ── Parse & validate body ─────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  const validation = validatePayload(body);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
  const { email, firstName, phone, tripId, partnerId, question, tripTitle, hostName } = validation.data;

  // Last-resort fallback only. The real responder is the package's creator,
  // resolved server-side from the packaged_trips row inside the handler below.
  const conciergeUserId = Deno.env.get('CONCIERGE_USER_ID') || null;

  // ── Service-role Supabase client ──────────────────────────────────────────
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── Resolve the responder from the package itself ─────────────────────
    // The conversation is owned by whoever created the package — even a
    // "Goldsainte Concierge" platform trip has a creator_id (the team member
    // who built it). We trust the server-side package row over the client's
    // partnerId. packaged_trips.creator_id is a real user id (profiles.id);
    // packaged_trips.agent_id points at travel_agents.id, so resolve that to
    // the agent's user_id. Fall back to the client value, then a concierge inbox.
    let responderId: string | null = null;
    let resolvedTripTitle = tripTitle ?? null;
    let resolvedHostName: string | null = hostName ?? null;

    const { data: pkg } = await supabaseAdmin
      .from('packaged_trips')
      .select('creator_id, agent_id, creator_type, title')
      .eq('id', tripId)
      .maybeSingle();

    if (pkg) {
      resolvedTripTitle = resolvedTripTitle ?? pkg.title ?? null;
      // Concierge/platform packages have no individual host — give them a warm,
      // branded label instead of the generic "your specialist".
      if (!resolvedHostName && pkg.creator_type === 'platform') {
        resolvedHostName = 'the Goldsainte Concierge team';
      }
      if (pkg.creator_id) {
        responderId = pkg.creator_id;
      } else if (pkg.agent_id) {
        const { data: agentRow } = await supabaseAdmin
          .from('travel_agents')
          .select('user_id')
          .eq('id', pkg.agent_id)
          .maybeSingle();
        responderId = agentRow?.user_id ?? null;
      }
    }

    responderId = responderId ?? partnerId ?? conciergeUserId;
    console.log('resolved inquiry responder', { tripId, responderId, fromPackage: !!pkg });

    // ── Dedup: one pending inquiry per email+trip ─────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existingInquiry } = await supabaseAdmin
      .from('pending_inquiries')
      .select('id, magic_link_sent_at')
      .eq('email', email)
      .eq('trip_id', tripId)
      .eq('status', 'pending')
      .gte('created_at', oneHourAgo)
      .limit(1)
      .maybeSingle();

    if (existingInquiry) {
      // Already submitted recently — return success without re-sending to avoid spam
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // ── Generate magic link — also creates the user if they don't exist yet.
    // The returned `linkData.user.id` gives us the userId without a separate
    // listUsers / createUser round-trip.
    // Build outbound links from the (allowlisted) request origin so localhost,
    // preview deploys, and production each get correct links from one deployment.
    // resolveAllowedOrigin() reflects the caller's Origin when it's in the CORS
    // allowlist (incl. http://localhost:8080) and otherwise falls back to the
    // ALLOWED_ORIGIN env override or https://goldsainte.ai.
    const siteUrl = resolveAllowedOrigin(req);
    const redirectTo = `${siteUrl}/auth/callback?action=ask&trip=${tripId}`;
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo,
        data: {
          account_type: 'traveler',
          signup_intent: 'trip_inquiry',
          source_trip_id: tripId,
          // first_name is safe in signup metadata (no unique constraint).
          // phone is NOT — profiles.phone is UNIQUE, so a duplicate would make
          // the handle_new_user trigger fail the whole signup ("Database error
          // saving new user"). Phone is set separately, best-effort, below.
          ...(firstName ? { first_name: firstName } : {}),
        },
      },
    });
    if (linkError) throw linkError;

    const userId: string = linkData.user.id;

    // first_name is applied by the handle_new_user trigger from the signup
    // metadata. phone has a UNIQUE constraint (profiles_phone_unique) and is
    // optional contact info, so set it on its own and tolerate a duplicate —
    // a phone collision must NEVER break the inquiry.
    if (phone) {
      const { error: phoneErr } = await supabaseAdmin
        .from('profiles')
        .update({ phone })
        .eq('id', userId);
      if (phoneErr) {
        console.warn('could not set traveller phone (likely duplicate) — skipping', { error: phoneErr.message });
      }
    }

    // Give the new traveller a display_name so they show by name in the inbox
    // (most UI reads display_name first). Only when it's currently empty, so we
    // never clobber an existing user's fuller name. Best-effort.
    if (firstName) {
      const { error: nameErr } = await supabaseAdmin
        .from('profiles')
        .update({ display_name: firstName })
        .eq('id', userId)
        .is('display_name', null);
      if (nameErr) {
        console.warn('could not set traveller display_name — skipping', { error: nameErr.message });
      }
    }

    // Rewrite the generated link through our branded /auth/verify page so the
    // user sees goldsainte.ai in their inbox instead of the raw Supabase URL.
    let magicLinkUrl = linkData.properties.action_link;
    const rawUrl = new URL(magicLinkUrl);
    const tokenHash = rawUrl.searchParams.get('token_hash') ?? rawUrl.searchParams.get('token');
    const emailType = rawUrl.searchParams.get('type') ?? 'magiclink';

    if (tokenHash) {
      magicLinkUrl = `${siteUrl}/auth/verify?token=${tokenHash}&type=${emailType}&redirect_to=${encodeURIComponent(redirectTo)}`;
    }

    // ── Persist pending_inquiry row ────────────────────────────────────────
    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from('pending_inquiries')
      .insert({
        email,
        trip_id: tripId,
        partner_id: responderId,
        trip_title: resolvedTripTitle,
        host_name: resolvedHostName,
        question,
        user_id: userId,
        status: 'pending',
        magic_link_sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (insertError) throw insertError;

    console.log('pending_inquiry created', { id: inquiry.id, email, tripId, responderId });

    // ── Send the question NOW (send-on-submit) ─────────────────────────────
    // Don't gate delivery behind the magic-link click: build the real
    // dm_conversation and post the question immediately, so the specialist can
    // reply even if the traveller never returns. The magic link then just signs
    // them in and opens this same thread. Mirrors send-direct-message's model.
    // Best-effort — on failure we leave the inquiry 'pending' and the magic-link
    // conversion (AuthCallback) creates it on click as a fallback.
    let conversationId: string | null = null;
    if (responderId && responderId !== userId) {
      try {
        const [p1, p2] = [userId, responderId].sort();
        const preview = question.slice(0, 100);

        const { data: existingConvo } = await supabaseAdmin
          .from('dm_conversations')
          .select('id')
          .eq('participant_1', p1)
          .eq('participant_2', p2)
          .maybeSingle();

        if (existingConvo) {
          conversationId = existingConvo.id;
        } else {
          const { data: newConvo, error: convoErr } = await supabaseAdmin
            .from('dm_conversations')
            .insert({
              participant_1: p1,
              participant_2: p2,
              status: 'request',
              initiated_by: userId,
              last_message_at: new Date().toISOString(),
              last_message_preview: preview,
              trip_id: tripId,
              trip_title: resolvedTripTitle,
            })
            .select('id')
            .single();
          if (convoErr) throw convoErr;
          conversationId = newConvo.id;
        }

        const { error: msgErr } = await supabaseAdmin.from('direct_messages').insert({
          conversation_id: conversationId,
          sender_id: userId,
          body: question,
        });
        if (msgErr) throw msgErr;

        // Mark the inquiry converted IMMEDIATELY — this is what stops the
        // magic-link click (AuthCallback) from re-posting the question. Record
        // it right after the message lands, before the non-critical bump below.
        await supabaseAdmin
          .from('pending_inquiries')
          .update({ status: 'converted', conversation_id: conversationId, converted_at: new Date().toISOString() })
          .eq('id', inquiry.id);

        // Bump the responder's unread counter + last-message info (best-effort —
        // must never abort the conversion above).
        try {
          const unreadCol = p1 === responderId ? 'unread_count_p1' : 'unread_count_p2';
          const { data: convoRow } = await supabaseAdmin
            .from('dm_conversations')
            .select(unreadCol)
            .eq('id', conversationId)
            .single();
          await supabaseAdmin
            .from('dm_conversations')
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: preview,
              [unreadCol]: (((convoRow as Record<string, number> | null)?.[unreadCol]) ?? 0) + 1,
            })
            .eq('id', conversationId);
        } catch (bumpErr) {
          const bm = bumpErr instanceof Error ? bumpErr.message : String(bumpErr);
          console.error('unread/last-message bump failed (non-fatal):', bm);
        }

        console.log('inquiry conversation created on submit', { conversationId, responderId });
      } catch (convErr) {
        const m = convErr instanceof Error ? convErr.message : String(convErr);
        console.error('send-on-submit failed (falling back to click-time conversion):', m);
        conversationId = null;
      }
    } else if (!responderId) {
      console.warn('no responder for inquiry — lead captured in pending_inquiries only', { tripId });
    }

    // ── Notify the responder ───────────────────────────────────────────────
    // Best-effort. Links straight to the conversation when we have one.
    if (responderId) {
      const { error: notifyError } = await supabaseAdmin.from('notifications').insert({
        user_id: responderId,
        type: 'message_received',
        title: 'New question about your trip',
        message: `A traveller asked about ${resolvedTripTitle ?? 'one of your trips'}: "${question.slice(0, 140)}"`,
        entity_type: conversationId ? 'conversation' : 'trip',
        entity_id: conversationId ?? tripId,
        action_url: conversationId ? `/messages?conversation=${conversationId}` : '/messages',
      });
      if (notifyError) {
        console.error('responder notification failed (non-fatal)', { error: notifyError.message });
      }
    }

    // ── Render and send email ─────────────────────────────────────────────
    const html = await renderAsync(
      React.createElement(TripInquiryEmail, {
        siteName: 'Goldsainte',
        confirmationUrl: magicLinkUrl,
        hostName: resolvedHostName ?? 'your specialist',
        tripTitle: resolvedTripTitle ?? 'this trip',
        question,
      })
    );
    const text = await renderAsync(
      React.createElement(TripInquiryEmail, {
        siteName: 'Goldsainte',
        confirmationUrl: magicLinkUrl,
        hostName: resolvedHostName ?? 'your specialist',
        tripTitle: resolvedTripTitle ?? 'this trip',
        question,
      }),
      { plainText: true }
    );

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Goldsainte <support@${FROM_DOMAIN}>`,
        to: [email],
        subject: `Your question is on its way to ${resolvedHostName ?? 'your specialist'}`,
        html,
        text,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend error', { status: resendRes.status, body: errBody });
      throw new Error(`Email send failed: ${resendRes.status}`);
    }

    console.log('trip-inquiry email sent', { email, tripId, inquiryId: inquiry.id });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error
      ? err.message
      : (typeof err === 'object' ? JSON.stringify(err) : String(err));
    console.error('submit-trip-inquiry error', { error: msg });
    return new Response(JSON.stringify({ error: 'Failed to submit inquiry. Please try again.' }), {
      status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
