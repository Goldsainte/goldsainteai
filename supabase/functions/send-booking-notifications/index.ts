import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRecipient {
  email: string;
  name?: string;
  role?: string;
}

interface NotificationPayload {
  type: 'booking_confirmation' | 'agent_assigned' | 'quote_received' | 'status_change' | 'payment_update';
  bookingId: string;
  primaryEmail: string;
  additionalEmails?: EmailRecipient[];
  notifyAll?: boolean;
  subject: string;
  message: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();
    const { 
      type, 
      bookingId, 
      primaryEmail, 
      additionalEmails = [], 
      notifyAll = true, 
      subject, 
      message,
      metadata = {}
    } = payload;

    // Collect all recipients
    const recipients: string[] = [primaryEmail];
    
    if (notifyAll && additionalEmails.length > 0) {
      const notifiableEmails = additionalEmails
        .filter(entry => entry.email && (!('notify' in entry) || (entry as any).notify))
        .map(entry => entry.email);
      recipients.push(...notifiableEmails);
    }

    // Send notifications to all recipients
    const notificationPromises = recipients.map(async (email) => {
      // Create in-app notification (if user exists)
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      if (profile) {
        await supabaseClient.from('notifications').insert({
          user_id: profile.id,
          type: type,
          title: subject,
          message,
          entity_type: 'booking',
          entity_id: bookingId,
          action_url: `/bookings/${bookingId}`
        });
      }

      // TODO: Send actual email via email service
      console.log(`Notification sent to ${email}: ${subject}`);
    });

    await Promise.all(notificationPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipientCount: recipients.length,
        recipients 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
