// src/pages/BookingDetailPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, MapPin, MessageCircle, ShieldAlert, Users } from "lucide-react";
import { BookingTimeline } from "@/components/BookingTimeline";
import { BookingStatusBadge, BookingStateExplainer } from "@/components/bookings/BookingStatusBadge";
import { PayoutStatusCard } from "@/components/bookings/PayoutStatusCard";

type Booking = {
  id: string;
  status: string;
  payout_status?: string;
  currency: string;
  total_price: number;
  partner_payout: number;
  created_at: string;
  escrow_released_at?: string | null;
  trip_requests: {
    id: string;
    title: string | null;
    destination: string | null;
    travelers_adults: number | null;
    travelers_children: number | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
  traveler_id: string;
  partner_id: string;
};

type Cancellation = {
  id: string;
  status: string;
  reason_short: string;
  requested_at: string;
};

type Dispute = {
  id: string;
  status: string;
  reason: string;
  created_at: string;
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // cancellation form
  const [cancelReasonShort, setCancelReasonShort] = useState("");
  const [cancelReasonDetails, setCancelReasonDetails] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeCreated, setDisputeCreated] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      setLoading(true);
      setActionError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate(`/auth?returnTo=/booking/${id}`, { replace: true });
        return;
      }
      if (!isMounted) return;
      setCurrentUserId(user.id);

      const { data: bookingData, error: bookingError } = await supabase
        .from("trip_bookings")
        .select(
          `
          id,
          status,
          currency,
          total_price,
          partner_payout,
          created_at,
          traveler_id,
          partner_id,
          trip_requests:trip_request_id (
            id,
            title,
            destination,
            travelers_adults,
            travelers_children,
            start_date,
            end_date
          )
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (bookingError || !bookingData) {
        console.error("Error loading booking:", bookingError);
        setActionError("Booking not found.");
        setLoading(false);
        return;
      }

      // Check that current user is participant
      if (
        bookingData.traveler_id !== user.id &&
        bookingData.partner_id !== user.id
      ) {
        setActionError("You do not have access to this booking.");
        setLoading(false);
        return;
      }

      setBooking(bookingData as Booking);

      const { data: cancelsData } = await supabase
        .from("booking_cancellations")
        .select("id, status, reason_short, requested_at")
        .eq("booking_id", id)
        .order("requested_at", { ascending: false });

      if (cancelsData) {
        setCancellations(cancelsData as Cancellation[]);
      }

      const { data: disputesData } = await supabase
        .from("disputes")
        .select("id, status, reason, created_at")
        .eq("booking_id", id)
        .order("created_at", { ascending: false });

      if (disputesData) {
        setDisputes(disputesData as Dispute[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const isTraveler = booking && currentUserId === booking.traveler_id;
  const isPartner = booking && currentUserId === booking.partner_id;

  async function submitCancellation(e: React.FormEvent) {
    e.preventDefault();
    if (!booking || !id || !currentUserId) return;

    if (!cancelReasonShort.trim()) {
      setActionError("Please provide a short reason for cancellation.");
      return;
    }

    setCancelSubmitting(true);
    setActionError(null);

    try {
      const { error } = await supabase.functions.invoke("booking-actions", {
        body: {
          action: "request_cancellation",
          userId: currentUserId,
          data: {
            bookingId: booking.id,
            role: isTraveler ? "traveler" : "partner",
            reasonShort: cancelReasonShort.trim(),
            reasonDetails: cancelReasonDetails.trim() || undefined,
          },
        },
      });

      if (error) {
        console.error("Error in request_cancellation:", error);
        setActionError("Could not submit cancellation request. Please try again.");
      } else {
        setCancelReasonShort("");
        setCancelReasonDetails("");

        const { data: cancelsData } = await supabase
          .from("booking_cancellations")
          .select("id, status, reason_short, requested_at")
          .eq("booking_id", id)
          .order("requested_at", { ascending: false });

        if (cancelsData) {
          setCancellations(cancelsData as Cancellation[]);
        }
      }
    } finally {
      setCancelSubmitting(false);
    }
  }

  async function handleOpenDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeReason.trim() || !id) return;

    setDisputeSubmitting(true);
    setActionError(null);

    try {
      const { createDispute } = await import("@/services/disputeService");
      await createDispute({
        bookingId: id,
        reason: disputeReason.trim(),
      });

      setDisputeCreated(true);
      setDisputeReason("");

      // Refresh disputes
      const { getBookingDisputes } = await import("@/services/disputeService");
      const disputesData = await getBookingDisputes(id);
      setDisputes(disputesData as Dispute[]);

      // Update booking status
      setBooking((prev) =>
        prev ? { ...prev, status: "disputed" } : prev,
      );
    } catch (err: any) {
      console.error("Error opening dispute:", err);
      setActionError(err.message || "Could not open dispute. Please try again.");
    } finally {
      setDisputeSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm">
          Loading booking…
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6]">
        <div className="mx-auto max-w-3xl px-4 py-10 space-y-3 text-sm">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-[11px] text-[#E5DFC6]/80 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
          <p>{actionError || "Booking not found or not accessible."}</p>
        </div>
      </main>
    );
  }

  const trip = booking.trip_requests;
  const travelers =
    (trip?.travelers_adults || 0) + (trip?.travelers_children || 0);

  const total =
    booking.total_price != null
      ? `$${(booking.total_price / 100).toFixed(2)} ${booking.currency}`
      : "—";

  const payout =
    booking.partner_payout != null
      ? `$${(booking.partner_payout / 100).toFixed(2)} ${booking.currency}`
      : "—";


  return (
    <>
      <Helmet>
        <title>Booking · Goldsainte</title>
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6] text-[#E5DFC6]">
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-[11px] text-[#E5DFC6]/80 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>

          {/* Top summary */}
          <section className="rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225]/95 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-[#E5DFC6]/70">
                  Booking created {new Date(booking.created_at).toLocaleDateString()}
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight md:text-xl">
                  {trip?.title || trip?.destination || "Goldsainte trip"}
                </h1>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <BookingStatusBadge status={booking.status as any} />
                <p className="text-[11px]">
                  Total: <span className="font-semibold">{total}</span>
                </p>
                {isPartner && (
                  <p className="text-[10px] text-[#E5DFC6]/75">
                    Your payout: <span className="font-semibold">{payout}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Booking state explainer */}
            {!isPartner && (
              <div className="mt-4 rounded-2xl bg-[#f7f3ea] p-3">
                <BookingStateExplainer status={booking.status as any} />
              </div>
            )}

            {trip && (
              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[#E5DFC6]/85">
                {trip.destination && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#BFAD72]" />
                    {trip.destination}
                  </span>
                )}
                {travelers > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3 text-[#BFAD72]" />
                    {travelers} travelers
                  </span>
                )}
                {(trip.start_date || trip.end_date) && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#BFAD72]" />
                    {trip.start_date && trip.end_date
                      ? `${trip.start_date} → ${trip.end_date}`
                      : "Dates flexible / not set"}
                  </span>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <Link
                to={`/trip-request/${trip?.id}/chat`}
                className="inline-flex items-center gap-1 rounded-full bg-[#BFAD72] px-3 py-1.5 font-semibold text-[#0a2225] hover:bg-[#d4c58d]"
              >
                <MessageCircle className="h-3 w-3" />
                Open trip chat
              </Link>
            </div>
          </section>

          {actionError && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-2xl px-3 py-2">
              {actionError}
            </p>
          )}

          {/* Booking Timeline */}
          <BookingTimeline status={booking.status} />

          {/* Payout Status Card for partners */}
          {isPartner && (
            <PayoutStatusCard 
              payoutStatus={(booking.payout_status as any) || "not_eligible"} 
              nextPayoutDate={booking.escrow_released_at}
            />
          )}

          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            {/* Cancellation panel */}
            <section className="rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225]/95 p-4 md:p-5 text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#BFAD72]" />
                <h2 className="text-sm font-semibold">
                  Cancellation & protection
                </h2>
              </div>
              <p className="mt-1 text-[11px] text-[#E5DFC6]/80">
                If something changes, you can request a cancellation. Our team
                will review each request case-by-case according to Goldsainte's
                policies.
              </p>

              <form onSubmit={submitCancellation} className="mt-3 space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">
                    Why are you cancelling?
                  </label>
                  <Input
                    value={cancelReasonShort}
                    onChange={(e) => setCancelReasonShort(e.target.value)}
                    placeholder="Flight issues, health, property no longer available..."
                    className="rounded-xl border border-[#BFAD72]/40 bg-black/40 text-xs text-[#E5DFC6] placeholder:text-[#E5DFC6]/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">
                    Additional details (optional)
                  </label>
                  <Textarea
                    rows={3}
                    value={cancelReasonDetails}
                    onChange={(e) => setCancelReasonDetails(e.target.value)}
                    placeholder="Share anything that helps us understand what happened."
                    className="rounded-xl border border-[#BFAD72]/40 bg-black/40 text-xs text-[#E5DFC6] placeholder:text-[#E5DFC6]/60"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="w-full rounded-full bg-black/80 text-xs font-semibold hover:bg-black"
                >
                  {cancelSubmitting ? "Sending request..." : "Request cancellation"}
                </Button>
              </form>

              {cancellations.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-semibold">
                    Cancellation history
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-[#E5DFC6]/80">
                    {cancellations.map((c) => (
                      <li key={c.id}>
                        {new Date(c.requested_at).toLocaleDateString()} —{" "}
                        <span className="font-medium">{c.status}</span> —{" "}
                        {c.reason_short}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Dispute panel */}
            <section className="rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225]/95 p-4 md:p-5 text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#BFAD72]" />
                <h2 className="text-sm font-semibold">
                  {disputeCreated ? "Dispute opened" : "Open a dispute"}
                </h2>
              </div>

              {disputeCreated ? (
                <div className="mt-3 space-y-2 rounded-2xl bg-[#BFAD72]/10 p-3">
                  <p className="text-[11px] text-[#E5DFC6]">
                    Your dispute has been opened. Goldsainte will review this booking and
                    follow up via email and in-app notifications.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-[11px] text-[#E5DFC6]/80">
                    If something feels off—quality issues, misrepresentation, or serious
                    concerns—you can open a dispute. Our team will review and mediate.
                  </p>

                  <form onSubmit={handleOpenDispute} className="mt-3 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium">
                        Tell us what went wrong
                      </label>
                      <Textarea
                        rows={3}
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Describe the issue with this booking..."
                        className="rounded-xl border border-[#BFAD72]/40 bg-black/40 text-xs text-[#E5DFC6] placeholder:text-[#E5DFC6]/60"
                        required
                      />
                    </div>

                    {actionError && (
                      <p className="text-[10px] text-red-600">{actionError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={disputeSubmitting || !disputeReason.trim()}
                      className="w-full rounded-full bg-[#BFAD72] text-xs font-semibold text-[#0a2225] hover:bg-[#d4c58d]"
                    >
                      {disputeSubmitting ? "Submitting..." : "Open dispute"}
                    </Button>
                  </form>
                </>
              )}

              {disputes.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-semibold">
                    Dispute history
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-[#E5DFC6]/80">
                    {disputes.map((d) => (
                      <li key={d.id}>
                        {new Date(d.created_at).toLocaleDateString()} —{" "}
                        <span className="font-medium capitalize">
                          ({d.status})
                        </span>{" "}
                        — {d.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <p className="text-[10px] text-[#E5DFC6]/60">
            To protect creators, agents, and travelers, all cancellations and disputes
            are reviewed by Goldsainte. Off-platform payments and contact are not
            permitted and may result in account removal.
          </p>
        </div>
      </main>
    </>
  );
}
