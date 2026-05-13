import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { bookingId, cancellationReason } = await req.json();
    
    console.log("Processing cancellation request:", { bookingId, cancellationReason });

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found or access denied");
    }

    // Check if booking is already cancelled
    if (booking.cancellation_status !== "active") {
      throw new Error(`Booking is already ${booking.cancellation_status}`);
    }

    // Calculate hours until check-in/departure
    const checkInDate = new Date(booking.check_in_date || booking.departure_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    console.log("Hours until check-in:", hoursUntilCheckIn);

    // Find applicable cancellation policy
    const { data: policies, error: policiesError } = await supabaseClient
      .from("booking_cancellation_policies")
      .select("*")
      .eq("booking_type", booking.booking_type)
      .eq("is_active", true)
      .order("hours_before_checkin", { ascending: false });

    if (policiesError) {
      throw new Error("Failed to fetch cancellation policies");
    }

    // Find the most favorable policy that applies
    let applicablePolicy = null;
    for (const policy of policies || []) {
      if (hoursUntilCheckIn >= policy.hours_before_checkin) {
        applicablePolicy = policy;
        break;
      }
    }

    // If no policy found, use the strictest one (0% refund)
    if (!applicablePolicy && policies && policies.length > 0) {
      applicablePolicy = policies[policies.length - 1];
    }

    if (!applicablePolicy) {
      throw new Error("No cancellation policy found");
    }

    console.log("Applicable policy:", applicablePolicy);

    // Calculate refund amount
    const originalAmount = booking.total_price || 0;
    const refundPercentage = applicablePolicy.refund_percentage;
    const refundAmount = (originalAmount * refundPercentage) / 100;

    // Create cancellation record
    const { data: cancellation, error: cancellationError } = await supabaseClient
      .from("booking_cancellations")
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        cancellation_reason: cancellationReason,
        policy_applied_id: applicablePolicy.id,
        refund_percentage: refundPercentage,
        refund_amount: refundAmount,
        original_amount: originalAmount,
        currency: booking.currency || "USD",
        status: refundAmount > 0 ? "pending" : "completed",
      })
      .select()
      .single();

    if (cancellationError) {
      throw new Error(`Failed to create cancellation: ${cancellationError.message}`);
    }

    // Update booking status
    const { error: updateError } = await supabaseClient
      .from("bookings")
      .update({
        cancellation_status: refundAmount > 0 ? "cancellation_requested" : "cancelled",
        status: "cancelled",
      })
      .eq("id", bookingId);

    if (updateError) {
      throw new Error("Failed to update booking status");
    }

    // If refund amount is 0, mark cancellation as completed
    if (refundAmount === 0) {
      await supabaseClient
        .from("booking_cancellations")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", cancellation.id);
    }

    // Create notification
    await supabaseClient.from("notifications").insert({
      user_id: user.id,
      type: "system_announcement",
      title: "Cancellation Request Received",
      message: refundAmount > 0 
        ? `Your cancellation request has been received. You will receive a refund of ${refundPercentage}% (${booking.currency} ${refundAmount.toFixed(2)}).`
        : "Your booking has been cancelled. No refund is available due to the cancellation policy.",
      entity_type: 'booking_cancellation',
      entity_id: cancellation.id,
    });

    console.log("Cancellation created successfully:", cancellation.id);

    return new Response(
      JSON.stringify({
        success: true,
        cancellation,
        refundAmount,
        refundPercentage,
        message: refundAmount > 0
          ? `Cancellation requested. You will receive ${refundPercentage}% refund (${booking.currency} ${refundAmount.toFixed(2)}).`
          : "Booking cancelled. No refund available per cancellation policy.",
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing cancellation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
