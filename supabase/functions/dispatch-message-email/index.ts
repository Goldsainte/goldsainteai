import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Debounced dispatcher: emails recipients of unread messages older than 10 minutes
// (one email per message). Marks messages as notified to avoid duplicate sends.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: pending, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, body, created_at')
    .eq('is_read', false)
    .is('notification_email_sent_at', null)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('Failed to query pending messages', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  for (const msg of pending) {
    try {
      const { data: receiver } = await supabase.auth.admin.getUserById(msg.receiver_id)
      const recipientEmail = receiver?.user?.email
      if (!recipientEmail) {
        await supabase.from('messages').update({ notification_email_sent_at: new Date().toISOString() }).eq('id', msg.id)
        continue
      }

      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name, full_name, first_name, username, account_type')
        .eq('id', msg.sender_id)
        .maybeSingle()

      const senderName =
        senderProfile?.display_name ||
        senderProfile?.full_name ||
        senderProfile?.first_name ||
        senderProfile?.username ||
        'A Goldsainte member'

      const isProfessional = senderProfile?.account_type && ['agent', 'creator', 'brand'].includes(senderProfile.account_type)
      // Receiver template choice: if sender is professional → traveler email; else → professional email
      const templateName = isProfessional ? 'new-message-traveler' : 'new-message-professional'

      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName,
          recipientEmail,
          idempotencyKey: `msg-notify-${msg.id}`,
          templateData: { senderName, conversationId: msg.id },
        },
      })

      await supabase
        .from('messages')
        .update({ notification_email_sent_at: new Date().toISOString() })
        .eq('id', msg.id)

      sent += 1
    } catch (e) {
      console.error('Failed to dispatch message email', { messageId: msg.id, error: String(e) })
    }
  }

  return new Response(JSON.stringify({ processed: pending.length, sent }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})