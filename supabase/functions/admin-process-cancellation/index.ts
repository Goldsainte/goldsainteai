// ============================================================================
// admin-process-cancellation v2 — LIVE RIVER
// ============================================================================
// v1 read booking_cancellations and wrote the dead legacy `bookings` table.
// v2 runs entirely on trip_cancellations + trip_bookings (the canonical
// money table, dollars).
//
// Actions:
//   approve       — record the refund decision (amount in dollars, may be 0),
//                   set the booking status to 'cancelled', bell the traveler
//                   and the partner. Does NOT move money.
//   reject        — record the decision + required note, bell the traveler.
//                   Booking untouched.
//   mark_refunded — record that the refund was issued manually in the Stripe
//                   dashboard (explicit action, mirrors the Release click).
//
// No automatic Stripe refunds by design — money moves only by human hands.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function jsonResponse(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
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
    const { cancellationId, action, refundAmount, adminNotes, stripeRefundId } =
      await req.json();

    console.log("Admin processing cancellation:", { cancellationId, action });

    if (!cancellationId || typeof cancellationId !== "string") {
      return jsonResponse(req, 400, { error: "cancellationId is required" });
    }
    if (!["approve", "reject", "mark_refunded"].includes(action)) {
      return jsonResponse(req, 400, {
        error: "Invalid action. Must be 'approve', 'reject', or 'mark_refunded'",
      });
    }

    // ── Authenticate + verify admin via the authoritative user_roles table ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, 401, { error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse(req, 401, { error: "Authentication failed" });
    }

    const { data: roles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      return jsonResponse(req, 500, {
        error: `Failed to verify role: ${rolesError.message}`,
      });
    }
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) {
      return jsonResponse(req, 403, { error: "Unauthorized: Admin access required" });
    }

    // ── Load the cancellation and its booking from the live river ──
    const { data: cancellation, error: cancellationError } = await supabaseClient
      .from("trip_cancellations")
      .select("*")
      .eq("id", cancellationId)
      .single();

    if (cancellationError || !cancellation) {
      return jsonResponse(req, 404, { error: "Cancellation not found" });
    }

    const { data: booking, error: bookingError } = await supabaseClient
      .from("trip_bookings")
      .select("id, traveler_id, partner_id, status, total_price, deposit_amount, currency, payout_paid_at, metadata")
      .eq("id", cancellation.trip_booking_id)
      .single();

    if (bookingError || !booking) {
      return jsonResponse(req, 404, {
        error: `Booking not found for this cancellation: ${bookingError?.message ?? "no row"}`,
      });
    }

    const currency = (cancellation.currency || booking.currency || "USD").toUpperCase();
    const tripTitle = (booking.metadata as any)?.trip_title || "your trip";

    // Best-effort bell — a notification failure never blocks the decision.
    const bell = async (userId: string, title: string, message: string, actionUrl: string) => {
      try {
        const { error } = await supabaseClient.from("notifications").insert({
          user_id: userId,
          type: "system_announcement",
          title,
          message,
          action_url: actionUrl,
          entity_type: "trip_booking",
          entity_id: booking.id,
        });
        if (error) console.error("Notification insert failed:", error.message);
      } catch (e) {
        console.error("Notification insert threw:", e);
      }
    };

    if (action === "approve") {
      if (cancellation.status !== "pending") {
        return jsonResponse(req, 400, {
          error: `Cancellation has already been ${cancellation.status}`,
        });
      }
      const amount = Number(refundAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        return jsonResponse(req, 400, {
          error: "refundAmount must be a number ≥ 0 (dollars)",
        });
      }

      const { error: updateError } = await supabaseClient
        .from("trip_cancellations")
        .update({
          status: "approved",
          refund_amount: amount,
          admin_notes: adminNotes || null,
          decided_by: user.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", cancellationId);

      if (updateError) {
        return jsonResponse(req, 500, {
          error: `Failed to approve cancellation: ${updateError.message}`,
        });
      }

      // Cancel the booking itself. Status only — no money columns touched.
      const { error: bookingUpdateError } = await supabaseClient
        .from("trip_bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);

      if (bookingUpdateError) {
        // The decision is recorded but the booking didn't flip — say so honestly.
        return jsonResponse(req, 500, {
          error: `Cancellation approved, but the booking could not be marked cancelled: ${bookingUpdateError.message}`,
        });
      }

      await bell(
        booking.traveler_id,
        "Cancellation approved",
        amount > 0
          ? `Your cancellation for ${tripTitle} has been approved. A refund of ${currency} ${amount.toFixed(2)} is being processed.`
          : `Your cancellation for ${tripTitle} has been approved. Per the decision, no refund will be issued.`,
        `/bookings/${booking.id}`
      );
      if (booking.partner_id) {
        await bell(
          booking.partner_id,
          "Booking cancelled",
          `A booking for ${tripTitle} has been cancelled by the traveler and approved by Goldsainte.`,
          `/booking/${booking.id}`
        );
      }

      console.log("Cancellation approved:", { cancellationId, amount });
      return jsonResponse(req, 200, {
        success: true,
        message: "Cancellation approved — booking cancelled. Issue the refund in Stripe, then Mark refunded.",
        refundAmount: amount,
      });
    }

    if (action === "reject") {
      if (cancellation.status !== "pending") {
        return jsonResponse(req, 400, {
          error: `Cancellation has already been ${cancellation.status}`,
        });
      }
      if (!adminNotes || !String(adminNotes).trim()) {
        return jsonResponse(req, 400, {
          error: "adminNotes is required when rejecting — the traveler is told why",
        });
      }

      const { error: updateError } = await supabaseClient
        .from("trip_cancellations")
        .update({
          status: "rejected",
          admin_notes: String(adminNotes).trim(),
          decided_by: user.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", cancellationId);

      if (updateError) {
        return jsonResponse(req, 500, {
          error: `Failed to reject cancellation: ${updateError.message}`,
        });
      }

      await bell(
        booking.traveler_id,
        "Cancellation request declined",
        `Your cancellation request for ${tripTitle} was declined. Reason: ${String(adminNotes).trim()}`,
        `/bookings/${booking.id}`
      );

      console.log("Cancellation rejected:", { cancellationId });
      return jsonResponse(req, 200, { success: true, message: "Cancellation rejected" });
    }

    // action === "mark_refunded"
    if (cancellation.status !== "approved") {
      return jsonResponse(req, 400, {
        error: `Only approved cancellations can be marked refunded (current status: ${cancellation.status})`,
      });
    }

    const { error: refundUpdateError } = await supabaseClient
      .from("trip_cancellations")
      .update({
        status: "refunded",
        stripe_refund_id: stripeRefundId ? String(stripeRefundId).trim() : null,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", cancellationId);

    if (refundUpdateError) {
      return jsonResponse(req, 500, {
        error: `Failed to mark refunded: ${refundUpdateError.message}`,
      });
    }

    const refunded = Number(cancellation.refund_amount ?? 0);
    await bell(
      booking.traveler_id,
      "Refund issued",
      refunded > 0
        ? `Your refund of ${currency} ${refunded.toFixed(2)} for ${tripTitle} has been issued. It may take a few business days to appear.`
        : `Your cancellation for ${tripTitle} is fully processed.`,
      `/bookings/${booking.id}`
    );

    console.log("Cancellation marked refunded:", { cancellationId });
    return jsonResponse(req, 200, { success: true, message: "Refund recorded" });
  } catch (error) {
    console.error("Error processing cancellation:", error);
    return jsonResponse(req, 500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
