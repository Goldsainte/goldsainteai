import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { cancellationId, action, customRefundPercentage, adminNotes } = await req.json();
    
    console.log("Admin processing cancellation:", { cancellationId, action, customRefundPercentage });

    // Get authenticated admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    // Check if user is admin
    const { data: userRoles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!userRoles) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get cancellation details
    const { data: cancellation, error: cancellationError } = await supabaseClient
      .from("booking_cancellations")
      .select(`
        *,
        bookings (
          id,
          booking_reference,
          total_price,
          currency,
          user_id
        )
      `)
      .eq("id", cancellationId)
      .single();

    if (cancellationError || !cancellation) {
      throw new Error("Cancellation not found");
    }

    if (cancellation.status !== "pending") {
      throw new Error(`Cancellation has already been ${cancellation.status}`);
    }

    const booking = cancellation.bookings as any;

    if (action === "approve") {
      // Calculate final refund amount (use custom percentage if provided)
      let finalRefundPercentage = cancellation.refund_percentage;
      let finalRefundAmount = cancellation.refund_amount;

      if (customRefundPercentage !== undefined && customRefundPercentage !== null) {
        if (customRefundPercentage < 0 || customRefundPercentage > 100) {
          throw new Error("Custom refund percentage must be between 0 and 100");
        }
        finalRefundPercentage = customRefundPercentage;
        finalRefundAmount = (cancellation.original_amount * customRefundPercentage) / 100;
      }

      // Update cancellation with admin approval
      const { error: updateError } = await supabaseClient
        .from("booking_cancellations")
        .update({
          status: "approved",
          refund_percentage: finalRefundPercentage,
          refund_amount: finalRefundAmount,
          admin_notes: adminNotes || null,
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq("id", cancellationId);

      if (updateError) {
        throw new Error(`Failed to approve cancellation: ${updateError.message}`);
      }

      // Create notification for user
      await supabaseClient.from("notifications").insert({
        user_id: cancellation.user_id,
        type: "system_announcement",
        title: "Cancellation Approved",
        message: finalRefundAmount > 0
          ? `Your cancellation has been approved. You will receive a refund of ${finalRefundPercentage}% (${booking.currency} ${finalRefundAmount.toFixed(2)}).`
          : "Your cancellation has been approved. No refund will be issued per the cancellation policy.",
        entity_type: 'booking_cancellation',
        entity_id: cancellationId,
      });

      console.log("Cancellation approved:", { cancellationId, finalRefundAmount, finalRefundPercentage });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Cancellation approved",
          refundAmount: finalRefundAmount,
          refundPercentage: finalRefundPercentage,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } else if (action === "reject") {
      // Reject the cancellation
      const { error: updateError } = await supabaseClient
        .from("booking_cancellations")
        .update({
          status: "rejected",
          admin_notes: adminNotes || null,
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq("id", cancellationId);

      if (updateError) {
        throw new Error(`Failed to reject cancellation: ${updateError.message}`);
      }

      // Restore booking to active status
      await supabaseClient
        .from("bookings")
        .update({
          cancellation_status: "active",
          status: "confirmed",
        })
        .eq("id", cancellation.booking_id);

      // Create notification for user
      await supabaseClient.from("notifications").insert({
        user_id: cancellation.user_id,
        type: "system_announcement",
        title: "Cancellation Request Rejected",
        message: adminNotes
          ? `Your cancellation request has been rejected. Reason: ${adminNotes}`
          : "Your cancellation request has been rejected. Please contact support for more information.",
        entity_type: 'booking_cancellation',
        entity_id: cancellationId,
      });

      console.log("Cancellation rejected:", { cancellationId });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Cancellation rejected",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } else {
      throw new Error("Invalid action. Must be 'approve' or 'reject'");
    }

  } catch (error) {
    console.error("Error processing cancellation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
