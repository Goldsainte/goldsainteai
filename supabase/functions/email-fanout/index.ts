// Universal email fanout: invoked by DB triggers + cron jobs.
// Body shape: { event: string, record?: any, old_record?: any }
// Maps event -> template, fetches required data, calls send-transactional-email.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'admin@goldsainte.ai'

const supabase = createClient(supabaseUrl, serviceKey)

async function getEmail(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null
  try {
    const { data } = await supabase.auth.admin.getUserById(userId)
    return data?.user?.email ?? null
  } catch { return null }
}

async function getProfileName(userId: string | null | undefined): Promise<string> {
  if (!userId) return 'there'
  const { data } = await supabase.from('profiles')
    .select('first_name, full_name, display_name, username')
    .eq('id', userId).maybeSingle()
  return data?.first_name || data?.display_name || data?.full_name || data?.username || 'there'
}

async function send(templateName: string, recipientEmail: string | null, idempotencyKey: string, templateData: Record<string, any> = {}) {
  if (!recipientEmail) {
    console.log('[fanout] no recipient for', templateName, idempotencyKey)
    return { skipped: 'no_recipient' }
  }
  const { error } = await supabase.functions.invoke('send-transactional-email', {
    body: { templateName, recipientEmail, idempotencyKey, templateData },
  })
  if (error) console.error('[fanout] send failed', templateName, error)
  return { ok: !error, templateName, recipientEmail }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let body: any
  try { body = await req.json() } catch { return new Response('bad json', { status: 400, headers: corsHeaders }) }

  const event: string = body.event
  const record: any = body.record || {}
  const old: any = body.old_record || {}
  const results: any[] = []

  try {
    switch (event) {
      // ---------- APPLICATIONS ----------
      case 'agent_application.created':
      case 'brand_application.created': {
        const isAgent = event === 'agent_application.created'
        const applicantEmail = isAgent ? record.email : record.primary_contact_email
        const applicantName = isAgent ? `${record.first_name ?? ''} ${record.last_name ?? ''}`.trim() : record.primary_contact_name
        const accountType = isAgent ? 'agent' : 'brand'
        results.push(await send('admin-new-user-pending', ADMIN_EMAIL,
          `admin-new-user-${record.id}`,
          { applicantName: applicantName || 'New applicant', applicantEmail, accountType, applicationId: record.id }))
        break
      }

      case 'agent_application.approved':
      case 'brand_application.approved': {
        // Approval email is sent by notify-applicant-status-change.
        // Welcome — Specialist now fires post-Identity verification from stripe-identity-webhook.
        break
      }

      case 'agent_application.identity_verified':
      case 'brand_application.identity_verified': {
        const isAgent = event === 'agent_application.identity_verified'
        const email = isAgent ? record.email : record.primary_contact_email
        const name = isAgent ? record.first_name : record.primary_contact_name
        results.push(await send('welcome-professional', email,
          `welcome-pro-verified-${record.id}`,
          { name: name || 'there', accountType: isAgent ? 'agent' : 'brand' }))
        break
      }

      // ---------- TRIP REQUESTS ----------
      case 'trip_request.created': {
        const travelerEmail = await getEmail(record.user_id)
        const travelerName = await getProfileName(record.user_id)
        results.push(await send('trip-request-received', travelerEmail,
          `trip-req-${record.id}`,
          { name: travelerName, destination: record.destination, tripRequestId: record.id }))
        break
      }

      // ---------- PROPOSALS ----------
      case 'trip_proposal.created': {
        // notify traveler
        const { data: trip } = await supabase.from('trip_requests')
          .select('user_id, destination, title').eq('id', record.trip_request_id).maybeSingle()
        if (trip) {
          const email = await getEmail(trip.user_id)
          const name = await getProfileName(trip.user_id)
          const proposerName = await getProfileName(record.proposer_id)
          results.push(await send('new-proposal-received', email,
            `new-prop-${record.id}`,
            { name, destination: trip.destination, proposerName, priceFrom: record.price_from, currency: record.price_currency }))
        }
        break
      }

      case 'trip_proposal.accepted': {
        // notify proposer
        const proposerEmail = await getEmail(record.proposer_id)
        const proposerName = await getProfileName(record.proposer_id)
        const { data: trip } = await supabase.from('trip_requests')
          .select('destination, title').eq('id', record.trip_request_id).maybeSingle()
        results.push(await send('proposal-accepted', proposerEmail,
          `prop-accept-${record.id}`,
          { name: proposerName, destination: trip?.destination, tripTitle: trip?.title }))
        break
      }

      case 'trip_proposal.declined':
      case 'trip_proposal.withdrawn': {
        const proposerEmail = await getEmail(record.proposer_id)
        const proposerName = await getProfileName(record.proposer_id)
        const { data: trip } = await supabase.from('trip_requests')
          .select('destination').eq('id', record.trip_request_id).maybeSingle()
        results.push(await send('proposal-declined', proposerEmail,
          `prop-decline-${record.id}`,
          { name: proposerName, destination: trip?.destination }))
        break
      }

      // ---------- INQUIRIES ----------
      case 'agent_inquiry.created': {
        if (record.assigned_agent_id) {
          const agentEmail = await getEmail(record.assigned_agent_id)
          const agentName = await getProfileName(record.assigned_agent_id)
          results.push(await send('new-inquiry-professional', agentEmail,
            `inquiry-${record.id}`,
            { name: agentName, guestName: record.guest_name, inquiryId: record.id }))
        }
        break
      }

      // ---------- BOOKINGS ----------
      case 'trip_booking.created': {
        const travelerEmail = await getEmail(record.traveler_id)
        const travelerName = await getProfileName(record.traveler_id)
        const partnerEmail = await getEmail(record.partner_id)
        const partnerName = await getProfileName(record.partner_id)
        const amount = record.total_price ? (Number(record.total_price) / 100).toFixed(2) : null
        results.push(await send('booking-confirmation-traveler', travelerEmail,
          `book-trav-${record.id}`,
          { name: travelerName, bookingId: record.id, amount, currency: record.currency }))
        results.push(await send('booking-confirmation-professional', partnerEmail,
          `book-pro-${record.id}`,
          { name: partnerName, bookingId: record.id, amount, currency: record.currency }))
        results.push(await send('payment-receipt', travelerEmail,
          `receipt-${record.id}`,
          { name: travelerName, bookingId: record.id, amount, currency: record.currency }))
        break
      }

      case 'booking.payout_paid': {
        if (record.creator_id && record.creator_payout_cents) {
          const email = await getEmail(record.creator_id)
          const name = await getProfileName(record.creator_id)
          results.push(await send('payout-sent', email,
            `payout-creator-${record.id}`,
            { name, amount: (Number(record.creator_payout_cents)/100).toFixed(2), currency: record.currency }))
        }
        if (record.agent_id && record.agent_payout_cents) {
          const email = await getEmail(record.agent_id)
          const name = await getProfileName(record.agent_id)
          results.push(await send('payout-sent', email,
            `payout-agent-${record.id}`,
            { name, amount: (Number(record.agent_payout_cents)/100).toFixed(2), currency: record.currency }))
        }
        break
      }

      // ---------- TRIPS ----------
      case 'packaged_trip.published': {
        const creatorId = record.creator_id || record.agent_id
        const creatorEmail = await getEmail(creatorId)
        const creatorName = await getProfileName(creatorId)
        results.push(await send('trip-published', creatorEmail,
          `trip-pub-${record.id}`,
          { name: creatorName, tripTitle: record.title, slug: record.slug }))
        // admin moderation notice
        results.push(await send('admin-new-trip-pending', ADMIN_EMAIL,
          `admin-trip-${record.id}`,
          { tripTitle: record.title, tripId: record.id, creatorName }))
        // matching travelers (best-effort: skip explicit fan-out here)
        break
      }

      // ---------- IDENTITY ----------
      case 'identity_verification.updated': {
        // For professionals (agent/brand), the dedicated `welcome-professional`
        // email is dispatched directly from stripe-identity-webhook on the
        // `*.identity_verified` event. Skip the generic notice for them to
        // avoid duplicate inbox messages. Travelers still receive this email.
        const { data: agentApp } = await supabase
          .from('agent_applications')
          .select('id')
          .eq('created_user_id', record.user_id)
          .maybeSingle()
        const { data: brandApp } = await supabase
          .from('brand_applications')
          .select('id')
          .eq('created_user_id', record.user_id)
          .maybeSingle()
        if (agentApp || brandApp) {
          results.push({ skipped: 'professional_uses_welcome_professional' })
          break
        }
        const email = await getEmail(record.user_id)
        const name = await getProfileName(record.user_id)
        results.push(await send('identity-verification-update', email,
          `kyc-${record.id}-${record.status}`,
          { name, status: record.status }))
        break
      }

      // ---------- DISPUTES ----------
      case 'dispute.opened': {
        // notify both parties + admin
        const filerEmail = await getEmail(record.filed_by || record.opened_by)
        const filerName = await getProfileName(record.filed_by || record.opened_by)
        results.push(await send('dispute-opened', filerEmail,
          `disp-filer-${record.id}`,
          { name: filerName, disputeId: record.id }))
        results.push(await send('dispute-opened', ADMIN_EMAIL,
          `disp-admin-${record.id}`,
          { name: 'Admin', disputeId: record.id }))
        break
      }

      // ---------- TRIP MATCHING (admin/cron) ----------
      case 'trip_match.notify_agent': {
        const agentEmail = await getEmail(record.agent_id)
        const agentName = await getProfileName(record.agent_id)
        results.push(await send('new-trip-match', agentEmail,
          `match-${record.trip_request_id}-${record.agent_id}`,
          { name: agentName, destination: record.destination, tripRequestId: record.trip_request_id }))
        break
      }

      // ---------- CRON: TRIP REMINDERS ----------
      case 'cron.trip_reminders': {
        // bookings starting in ~24h
        const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10)
        const { data: bookings } = await supabase.from('bookings')
          .select('id, traveler_id, destination, start_date')
          .eq('start_date', tomorrow)
          .in('status', ['confirmed','paid'])
        for (const b of (bookings ?? [])) {
          const email = await getEmail(b.traveler_id)
          const name = await getProfileName(b.traveler_id)
          results.push(await send('trip-reminder', email,
            `reminder-${b.id}`,
            { name, destination: b.destination, startDate: b.start_date }))
        }
        break
      }

      // ---------- CRON: REVIEW REQUESTS ----------
      case 'cron.review_requests': {
        const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().slice(0,10)
        const { data: bookings } = await supabase.from('bookings')
          .select('id, traveler_id, destination, end_date')
          .eq('end_date', yesterday)
          .in('status', ['confirmed','paid','completed'])
        for (const b of (bookings ?? [])) {
          const email = await getEmail(b.traveler_id)
          const name = await getProfileName(b.traveler_id)
          results.push(await send('review-request', email,
            `review-${b.id}`,
            { name, destination: b.destination, bookingId: b.id }))
        }
        break
      }

      default:
        return new Response(JSON.stringify({ error: 'unknown event', event }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify({ event, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('[fanout] error', event, e)
    return new Response(JSON.stringify({ error: String(e), event }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
