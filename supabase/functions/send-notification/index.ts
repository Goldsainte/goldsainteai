import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  link?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, type, title, message, metadata, link }: NotificationRequest = await req.json();

    if (!userId || !type || !title || !message) {
      throw new Error('Missing required fields: userId, type, title, message');
    }

    // Insert notification into database
    const { data, error } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: type,
        title,
        message,
        metadata: metadata || {},
        link: link || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    console.log(`Notification sent to user ${userId}: ${type}`);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
