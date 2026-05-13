import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Price Alerts] Starting price check...');

    // Get all active alerts that haven't been checked recently (last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('flight_price_alerts')
      .select('*')
      .eq('is_active', true)
      .or(`last_checked_at.is.null,last_checked_at.lt.${sixHoursAgo}`)
      .limit(50); // Process 50 alerts per run

    if (alertsError) {
      console.error('[Price Alerts] Error fetching alerts:', alertsError);
      throw alertsError;
    }

    console.log(`[Price Alerts] Found ${alerts?.length || 0} alerts to check`);

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No alerts to process', checked: 0 }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    let notificationsSent = 0;
    let pricesUpdated = 0;

    // Check each alert
    for (const alert of alerts) {
      try {
        // Skip if departure date is in the past
        if (new Date(alert.departure_date) < new Date()) {
          // Deactivate expired alert
          await supabaseClient
            .from('flight_price_alerts')
            .update({ is_active: false })
            .eq('id', alert.id);
          continue;
        }

        console.log(`[Price Alerts] Checking alert ${alert.id} for ${alert.origin_code}-${alert.destination_code}`);

        // Search for current prices
        const { data: flightData, error: flightError } = await supabaseClient.functions.invoke(
          'unified-search-flights',
          {
            body: {
              origin: alert.origin_code,
              destination: alert.destination_code,
              departureDate: alert.departure_date,
              returnDate: alert.return_date,
              adults: alert.adults,
              cabinClass: alert.cabin_class,
              sortBy: 'cheapest'
            }
          }
        );

        if (flightError || !flightData?.results || flightData.results.length === 0) {
          console.log(`[Price Alerts] No flights found for alert ${alert.id}`);
          // Update last checked time
          await supabaseClient
            .from('flight_price_alerts')
            .update({ last_checked_at: new Date().toISOString() })
            .eq('id', alert.id);
          continue;
        }

        // Get the cheapest flight
        const cheapestFlight = flightData.results[0];
        const currentPrice = parseFloat(cheapestFlight.price?.total || cheapestFlight.price || 0);

        console.log(`[Price Alerts] Current price: ${currentPrice}, Target: ${alert.target_price}`);

        // Update alert with current price
        await supabaseClient
          .from('flight_price_alerts')
          .update({
            current_price: currentPrice,
            last_checked_at: new Date().toISOString()
          })
          .eq('id', alert.id);

        pricesUpdated++;

        // Check if price is below target
        if (currentPrice > 0 && currentPrice <= alert.target_price) {
          // Check notification frequency
          const shouldNotify = alert.notification_frequency === 'instant' ||
            !alert.last_notified_at ||
            (alert.notification_frequency === 'daily' && 
             new Date(alert.last_notified_at).getTime() < Date.now() - 24 * 60 * 60 * 1000) ||
            (alert.notification_frequency === 'weekly' &&
             new Date(alert.last_notified_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000);

          if (shouldNotify) {
            // Create notification
            const savingsAmount = alert.target_price - currentPrice;
            const savingsPercent = ((savingsAmount / alert.target_price) * 100).toFixed(0);

            await supabaseClient
              .from('notifications')
              .insert({
                user_id: alert.user_id,
                type: 'price_alert',
                title: '✈️ Price Drop Alert!',
                message: `Flight from ${alert.origin_code} to ${alert.destination_code} is now ${alert.currency} ${currentPrice.toFixed(2)}! (${savingsPercent}% below your target)`,
                entity_type: 'flight_price_alert',
                entity_id: alert.id,
                action_url: `/search-results?type=flights&origin=${alert.origin_code}&destination=${alert.destination_code}&departureDate=${alert.departure_date}${alert.return_date ? `&returnDate=${alert.return_date}` : ''}&adults=${alert.adults}&cabinClass=${alert.cabin_class}`
              });

            // Update last notified time
            await supabaseClient
              .from('flight_price_alerts')
              .update({ last_notified_at: new Date().toISOString() })
              .eq('id', alert.id);

            notificationsSent++;
            console.log(`[Price Alerts] Notification sent for alert ${alert.id}`);
          }
        }
      } catch (error) {
        console.error(`[Price Alerts] Error processing alert ${alert.id}:`, error);
      }
    }

    console.log(`[Price Alerts] Complete. Prices updated: ${pricesUpdated}, Notifications sent: ${notificationsSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        checked: alerts.length,
        prices_updated: pricesUpdated,
        notifications_sent: notificationsSent
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Price Alerts] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
