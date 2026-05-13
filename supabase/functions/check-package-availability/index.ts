import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger, generateTraceId } from "../_shared/structuredLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AvailabilityRequest {
  packageId: string;
  startDate: string;
  endDate: string;
  participants: number;
}

interface AvailabilityResponse {
  available: boolean;
  totalCapacity: number;
  bookedCapacity: number;
  remainingCapacity: number;
  conflicts?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  logger.setContext({ traceId });

  try {
    logger.info("Package availability check started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { packageId, startDate, endDate, participants }: AvailabilityRequest = await req.json();

    if (!packageId || !startDate || !endDate || !participants) {
      logger.warn("Missing required fields", { packageId, startDate, endDate, participants });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get package details
    const { data: packageData, error: packageError } = await supabaseClient
      .from("package_marketing_materials")
      .select("max_capacity, available_from, available_until")
      .eq("id", packageId)
      .single();

    if (packageError || !packageData) {
      logger.error("Package not found", packageError, { packageId });
      return new Response(
        JSON.stringify({ error: "Package not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check date range validity
    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);
    const availableFrom = packageData.available_from ? new Date(packageData.available_from) : null;
    const availableUntil = packageData.available_until ? new Date(packageData.available_until) : null;

    const conflicts: string[] = [];

    if (availableFrom && requestStart < availableFrom) {
      conflicts.push(`Package not available until ${availableFrom.toISOString()}`);
    }

    if (availableUntil && requestEnd > availableUntil) {
      conflicts.push(`Package not available after ${availableUntil.toISOString()}`);
    }

    // Get existing bookings in date range
    const { data: bookings, error: bookingError } = await supabaseClient
      .from("package_bookings")
      .select("participants_count, start_date, end_date")
      .eq("package_id", packageId)
      .in("status", ["confirmed", "pending"])
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (bookingError) {
      logger.error("Error fetching bookings", bookingError, { packageId });
      return new Response(
        JSON.stringify({ error: "Failed to check availability" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const bookedCapacity = bookings?.reduce((sum, b) => sum + (b.participants_count || 0), 0) || 0;
    const remainingCapacity = (packageData.max_capacity || 0) - bookedCapacity;
    const available = conflicts.length === 0 && remainingCapacity >= participants;

    const response: AvailabilityResponse = {
      available,
      totalCapacity: packageData.max_capacity || 0,
      bookedCapacity,
      remainingCapacity,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };

    logger.info("Availability check completed", {
      packageId,
      available,
      remainingCapacity,
      requestedParticipants: participants,
    });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    logger.fatal("Unexpected error in availability check", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  } finally {
    logger.clearContext();
  }
});
