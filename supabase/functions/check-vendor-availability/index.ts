import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { vendorId, date, startTime, endTime, vehicleType } = await req.json();

    console.log('Checking availability:', { vendorId, date, startTime, endTime, vehicleType });

    // Get vendor's fleet
    let fleetQuery = supabase
      .from('vendor_fleet')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true);

    if (vehicleType) {
      fleetQuery = fleetQuery.eq('vehicle_type', vehicleType);
    }

    const { data: fleet, error: fleetError } = await fleetQuery;

    if (fleetError) {
      console.error('Error fetching fleet:', fleetError);
      throw fleetError;
    }

    if (!fleet || fleet.length === 0) {
      return new Response(
        JSON.stringify({
          available: false,
          message: 'No vehicles available',
          availableVehicles: [],
        }),
        {
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const vehicleIds = fleet.map((v) => v.id);

    // Check availability records for conflicts
    const { data: availabilityRecords, error: availError } = await supabase
      .from('vendor_availability')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('date', date)
      .in('vehicle_id', vehicleIds)
      .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`);

    if (availError) {
      console.error('Error checking availability:', availError);
    }

    // Find vehicles that are not blocked
    const blockedVehicleIds = new Set(
      availabilityRecords
        ?.filter((record) => !record.is_available)
        .map((record) => record.vehicle_id) || []
    );

    const availableVehicles = fleet.filter(
      (vehicle) => !blockedVehicleIds.has(vehicle.id) && vehicle.currently_available
    );

    console.log(`Found ${availableVehicles.length} available vehicles`);

    return new Response(
      JSON.stringify({
        available: availableVehicles.length > 0,
        availableVehicles: availableVehicles.map((v) => ({
          id: v.id,
          vehicle_type: v.vehicle_type,
          make: v.make,
          model: v.model,
          year: v.year,
          passenger_capacity: v.passenger_capacity,
          hourly_rate: v.hourly_rate,
          daily_rate: v.daily_rate,
          amenities: v.amenities,
          photos: v.photos,
        })),
        totalAvailable: availableVehicles.length,
      }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in check-vendor-availability:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
