import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface Database {
  public: {
    Tables: {
      group_trips: any;
      trip_members: any;
      trip_notifications: any;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    console.log('Starting trip reminder check...');

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Calculate reminder dates
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysDate = sevenDaysFromNow.toISOString().split('T')[0];

    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysDate = threeDaysFromNow.toISOString().split('T')[0];

    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayDate = oneDayFromNow.toISOString().split('T')[0];

    console.log('Checking for trips starting on:', { sevenDaysDate, threeDaysDate, oneDayDate });

    // Fetch trips that need reminders
    const { data: trips, error: tripsError } = await supabase
      .from('group_trips')
      .select('*')
      .in('start_date', [sevenDaysDate, threeDaysDate, oneDayDate])
      .eq('status', 'planning');

    if (tripsError) {
      console.error('Error fetching trips:', tripsError);
      throw tripsError;
    }

    console.log(`Found ${trips?.length || 0} trips requiring reminders`);

    let notificationsCreated = 0;

    for (const trip of trips || []) {
      const tripStartDate = trip.start_date.split('T')[0];
      let daysUntil = 0;
      let reminderType = '';

      if (tripStartDate === sevenDaysDate) {
        daysUntil = 7;
        reminderType = '7 days';
      } else if (tripStartDate === threeDaysDate) {
        daysUntil = 3;
        reminderType = '3 days';
      } else if (tripStartDate === oneDayDate) {
        daysUntil = 1;
        reminderType = '1 day';
      }

      console.log(`Processing trip "${trip.title}" - ${reminderType} reminder`);

      // Get all accepted members for this trip
      const { data: members, error: membersError } = await supabase
        .from('trip_members')
        .select('user_id')
        .eq('trip_id', trip.id)
        .eq('status', 'accepted');

      if (membersError) {
        console.error(`Error fetching members for trip ${trip.id}:`, membersError);
        continue;
      }

      // Check if notifications were already sent for this reminder
      const { data: existingNotifications, error: checkError } = await supabase
        .from('trip_notifications')
        .select('id')
        .eq('trip_id', trip.id)
        .eq('type', 'departure_reminder')
        .gte('created_at', today);

      if (checkError) {
        console.error(`Error checking existing notifications:`, checkError);
        continue;
      }

      // Skip if notifications were already sent today
      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Reminders already sent for trip ${trip.title} today`);
        continue;
      }

      // Create notifications for all members
      const notifications = members?.map((member) => ({
        user_id: member.user_id,
        trip_id: trip.id,
        type: 'departure_reminder',
        title: `🚀 Trip Reminder: ${trip.title}`,
        message: `Your trip to ${trip.destination} starts in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}! Make sure you're all set.`,
        data: {
          days_until: daysUntil,
          destination: trip.destination,
          start_date: trip.start_date,
        },
        read: false,
      })) || [];

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('trip_notifications')
          .insert(notifications);

        if (notifError) {
          console.error(`Error creating notifications for trip ${trip.id}:`, notifError);
        } else {
          notificationsCreated += notifications.length;
          console.log(`Created ${notifications.length} notifications for trip "${trip.title}"`);
        }
      }
    }

    console.log(`Trip reminder check complete. Created ${notificationsCreated} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${notificationsCreated} trip reminders`,
        trips_processed: trips?.length || 0,
      }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in send-trip-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
