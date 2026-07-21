// src/pages/bookings/BookingDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert, CalendarX, CheckCircle2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResidenceSelect } from "@/components/compliance/ResidenceSelect";
import { isSotBlockedState } from "@/lib/residency";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { ContractStatusCard } from "@/components/contracts/ContractStatusCard";
import { BookingConversation } from "@/components/chat/BookingConversation";
import { TripPoliciesPanel } from "@/components/trips/TripPoliciesPanel";
import { TripCoverImage } from "@/components/marketplace/TripCoverImage";
import { getTripRequestImageUrl } from "@/utils/tripImages";
import { createDispute, getBookingDisputes } from "@/services/disputeService";
import {
  buildDeliverables,
  deliverablesHeading,
  buildJourneyCopy,
  DELIVERABLES_FALLBACK,
} from "@/lib/bookingDeliverables";

type DisputeRow = {
  id: string;
  booking_id: string;
  reason: string;
  status: string;
  created_at: string;
};

type CancellationRow = {
  id: string;
  status: string;
  reason: string;
  refund_amount: number | null;
  currency: string | null;
  created_at: string;
};

type BookingRow = {
  id: string;
  status: string;
  traveler_id: string;
  partner_id: string | null;
  partner_role: string | null;
  total_price: number | null;
  deposit_amount: number | null;
  currency: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
  stripe_payment_intent_id: string | null;
};

type TripRow = {
  id: string;
  title: string | null;
  destination: string | null;
  cover_image_url: string | null;
  duration_days: number | null;
  price_per_person: number | null;
};

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  if (amount == null) return "—";
  const cur = currency || "USD";
  // Show cents when they exist: a $562.50 deposit must read $562.50, not $563.
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(whole ? 0 : 2)}`;
  }
}

function humanBookingStatus(status: string) {
  switch (status) {
    case "payment_pending":
      return "Awaiting payment";
    case "confirmed":
      return "Confirmed";
    case "paid_in_full":
      return "Paid in full";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ");
  }
}

function humanCancellationStatus(status: string) {
  switch (status) {
    case "pending":
      return "Under review";
    case "approved":
      return "Approved — refund on the way";
    case "refunded":
      return "Refund issued";
    case "rejected":
      return "Declined";
    default:
      return status.replace(/_/g, " ");
  }
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [isHireBooking, setIsHireBooking] = useState(false);
  const [hireHeadline, setHireHeadline] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dispute / claim state
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimReason, setClaimReason] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Cancellation request state
  const [cancellations, setCancellations] = useState<CancellationRow[]>([]);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelRequestError, setCancelRequestError] = useState<string | null>(null);

  // Trip-complete confirmation (releases the final payout to the specialist)
  const [releasingFinal, setReleasingFinal] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [depositReleased, setDepositReleased] = useState(false);
  const [finalReleased, setFinalReleased] = useState(false);
  const [contractStatus, setContractStatus] = useState<string | null>(null);

  // Specialist (partner) profile for the sidebar card
  const [partnerProfile, setPartnerProfile] = useState<{
    display_name?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null>(null);

  // Hire capabilities drive the dynamic "what your specialist is arranging"
  // deliverables list. Neither booking page fetched this before the redesign;
  // it lives on trip_requests.source_metadata.hire_capabilities.
  const [hireCapabilities, setHireCapabilities] = useState<string[]>([]);

  // Returning from Stripe checkout (?paid=1). Stripe redirects the traveler
  // back BEFORE the webhook has necessarily updated the booking, so: greet
  // the payment immediately, strip the param from the URL, and quietly
  // refetch a few times so the numbers below catch up on their own.
  const [searchParams, setSearchParams] = useSearchParams();
  const [justPaid, setJustPaid] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    if (searchParams.get("paid") !== "1") return;
    setJustPaid(true);
    const next = new URLSearchParams(searchParams);
    next.delete("paid");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!justPaid) return;
    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (cancelled || tries >= 5) return;
      tries += 1;
      setReloadKey((k) => k + 1);
      timer = setTimeout(tick, 2500);
    };
    timer = setTimeout(tick, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [justPaid]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!bookingId) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: bookingRow, error: bookingErr } = await supabase
          .from("trip_bookings")
          .select(
            "id, status, traveler_id, partner_id, partner_role, total_price, proposal_id, deposit_amount, currency, created_at, metadata, stripe_payment_intent_id"
          )
          .eq("id", bookingId)
          .single();

        if (bookingErr) throw bookingErr;
        if (!bookingRow) throw new Error("Booking not found.");

        if (bookingRow.traveler_id !== user.id) {
          navigate("/my-bookings");
          return;
        }

        const tripId = (bookingRow.metadata as any)?.trip_id;
        let tripRow: TripRow | null = null;
        if (tripId) {
          const { data: t } = await supabase
            .from("packaged_trips")
            .select(
              "id, title, destination, cover_image_url, duration_days, price_per_person"
            )
            .eq("id", tripId)
            .maybeSingle();
          tripRow = t as TripRow | null;
        }

        // Existing claims for this booking (so we don't offer a duplicate).
        let disputeRows: DisputeRow[] = [];
        try {
          disputeRows = (await getBookingDisputes(bookingId!)) as DisputeRow[];
        } catch {
          disputeRows = [];
        }

        // Existing cancellation requests (RLS limits results to the
        // traveler's own rows; best-effort like disputes).
        let cancellationRows: CancellationRow[] = [];
        try {
          const { data: c } = await supabase
            .from("trip_cancellations")
            .select("id, status, reason, refund_amount, currency, created_at")
            .eq("trip_booking_id", bookingId)
            .order("created_at", { ascending: false });
          cancellationRows = (c ?? []) as CancellationRow[];
        } catch {
          cancellationRows = [];
        }

        // Released milestones (drives the escrow card; best-effort).
        let depositMilestoneReleased = false;
        let finalMilestoneReleased = false;
        try {
          const { data: payouts } = await supabase
            .from("trip_payouts")
            .select("milestone")
            .eq("trip_booking_id", bookingId);
          depositMilestoneReleased = (payouts ?? []).some(
            (p: any) => p.milestone === "deposit"
          );
          finalMilestoneReleased = (payouts ?? []).some(
            (p: any) => p.milestone === "final"
          );
        } catch {
          depositMilestoneReleased = false;
        }

        // Contract status for the journey tracker (same query the
        // ContractStatusCard uses; best-effort).
        let contractRow: { status?: string } | null = null;
        try {
          const { data: c } = await supabase
            .from("trip_contracts")
            .select("id, status")
            .eq("booking_id", bookingId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          contractRow = (c as any) ?? null;
        } catch {
          contractRow = null;
        }

        // Specialist profile (best-effort; platform bookings may have none)
        let partnerRow: any = null;
        if (bookingRow.partner_id) {
          const { data: p } = await supabase
            .from("profiles")
            .select("display_name, full_name, avatar_url")
            .eq("id", bookingRow.partner_id)
            .maybeSingle();
          partnerRow = p ?? null;
        }

        if (!cancelled) {
          setBooking(bookingRow as BookingRow);
        try {
          const pid = (bookingRow as any)?.proposal_id;
          if (pid) {
            const { data: pr } = await (supabase
              .from("trip_proposals")
              .select("price_breakdown, headline, trip_request_id" as any)
              .eq("id", pid)
              .maybeSingle() as any);
            const hire = Boolean((pr as any)?.price_breakdown?.hire);
            setIsHireBooking(hire);
            if (hire && (pr as any)?.headline) setHireHeadline((pr as any).headline);
            // Reach the agreed hire_capabilities through the trip request the
            // proposal was written against. Presentational + best-effort.
            const reqId = (pr as any)?.trip_request_id;
            if (reqId) {
              const { data: req } = await (supabase
                .from("trip_requests")
                .select("source_metadata" as any)
                .eq("id", reqId)
                .maybeSingle() as any);
              const caps = (req as any)?.source_metadata?.hire_capabilities;
              if (Array.isArray(caps)) {
                setHireCapabilities(caps.filter((c: any) => typeof c === "string"));
              }
            }
          }
        } catch { /* hire detection is presentational */ }
          setTrip(tripRow);
          setDisputes(disputeRows);
          setCancellations(cancellationRows);
          setDepositReleased(depositMilestoneReleased);
          setFinalReleased(finalMilestoneReleased);
          setContractStatus(contractRow?.status ?? null);
          setPartnerProfile(partnerRow);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load booking.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, navigate, reloadKey]);

  async function handleFileClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimReason.trim() || !bookingId) return;
    setClaimSubmitting(true);
    setClaimError(null);
    try {
      await createDispute({ bookingId, reason: claimReason.trim() });
      const refreshed = (await getBookingDisputes(bookingId)) as DisputeRow[];
      setDisputes(refreshed);
      setBooking((prev) => (prev ? { ...prev, status: "disputed" } : prev));
      setClaimReason("");
      setShowClaimForm(false);
    } catch (err: any) {
      setClaimError(err.message || "Could not file your claim. Please try again.");
    } finally {
      setClaimSubmitting(false);
    }
  }

  async function handleRequestCancellation(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelReason.trim() || !booking) return;
    setCancelSubmitting(true);
    setCancelRequestError(null);
    try {
      const { data, error: insertError } = await supabase
        .from("trip_cancellations")
        .insert({
          trip_booking_id: booking.id,
          traveler_id: booking.traveler_id,
          reason: cancelReason.trim(),
          currency: booking.currency,
        })
        .select("id, status, reason, refund_amount, currency, created_at")
        .single();
      if (insertError) throw insertError;
      setCancellations((prev) => [data as CancellationRow, ...prev]);
      setCancelReason("");
      setShowCancelForm(false);
    } catch (err: any) {
      setCancelRequestError(
        err.message || "Could not submit your cancellation request. Please try again."
      );
    } finally {
      setCancelSubmitting(false);
    }
  }

  const hasOpenClaim = disputes.some(
    (d) => d.status === "open" || d.status === "under_review"
  );

  async function handleReleaseMilestone(action: "release_deposit" | "release_final") {
    if (!booking || releasingFinal) return;
    const isDeposit = action === "release_deposit";
    const ok = await confirmDialog({
      title: isDeposit
        ? "Release your specialist's working capital?"
        : "Confirm your trip is complete?",
      description: isDeposit
        ? "Only do this after your specialist has shown you confirmed reservations (check your booking Messages). It releases 96.5% of your deposit to them so they can secure your trip. This can't be undone."
        : "This releases the remaining payment to your specialist. Only confirm once your trip has happened and you're satisfied. This can't be undone.",
      confirmText: isDeposit ? "Release working capital" : "Confirm & release payment",
    });
    if (!ok) return;
    setReleasingFinal(true);
    setReleaseError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "release-trip-deposit",
        { body: { tripBookingId: booking.id, action } }
      );
      if (fnError) {
        // Non-2xx bodies arrive via error.context — surface the real reason.
        let message = fnError.message;
        try {
          const resp = (fnError as any)?.context;
          if (resp && typeof resp.json === "function") {
            const bodyJson = await resp.json();
            if (bodyJson?.error) message = bodyJson.error;
          }
        } catch {
          /* keep original message */
        }
        throw new Error(message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      if (isDeposit) {
        setDepositReleased(true);
      } else {
        setBooking((prev) => (prev ? { ...prev, status: "completed" } : prev));
      }
    } catch (err: any) {
      setReleaseError(err.message || "Could not release the payment. Please try again.");
    } finally {
      setReleasingFinal(false);
    }
  }

  const activeCancellation = cancellations.find((c) =>
    ["pending", "approved", "refunded"].includes(c.status)
  );
  const canRequestCancellation =
    !!booking &&
    !["cancelled", "completed"].includes(booking.status) &&
    !activeCancellation;

  // Traveler consent gate for the final release — mirrors the server's
  // guard so the button never shows when the function would refuse:
  // balance must be collected (paid_in_full, or confirmed with no balance).
  const canConfirmComplete =
    !!booking &&
    !!booking.partner_id &&
    !activeCancellation &&
    (booking.status === "paid_in_full" ||
      (booking.status === "confirmed" &&
        (booking.total_price ?? 0) - (booking.deposit_amount ?? 0) <= 0));

  // Traveler consent gate for the DEPOSIT release — the working-capital
  // moment. Shows once the deposit is paid, while a balance remains, until
  // it's released. The traveler judges the specialist's reservation proof.
  const canReleaseDeposit =
    !!booking &&
    !!booking.partner_id &&
    !activeCancellation &&
    !depositReleased &&
    booking.status === "confirmed" &&
    (booking.deposit_amount ?? 0) > 0 &&
    (booking.total_price ?? 0) - (booking.deposit_amount ?? 0) > 0;

  const [payingBalance, setPayingBalance] = useState(false);
  const [contractGate, setContractGate] = useState<{ contractId: string | null } | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [residenceState, setResidenceState] = useState("");

  async function handlePayBalance() {
    if (!booking || payingBalance) return;
    // Unpaid booking (e.g. arrived via a signed contract's "Continue to
    // deposit") → collect the DEPOSIT; confirmed booking → collect the balance.
    const collectedCentsNow = Math.round(
      Number((booking.metadata as any)?.amount_collected ?? 0) * 100
    );
    const isDepositStage = collectedCentsNow < (booking.deposit_amount ?? 0) - 1;
    // MONEY IS INTEGER CENTS: deposit_amount / total_price are cents columns.
    // The old code here treated them as dollars and re-multiplied by 100 —
    // the exact unit bug behind the $58,218.75 checkout. The server guard
    // refused those requests, which made this button look dead.
    const balanceDueCents = isDepositStage
      ? booking.deposit_amount ?? 0
      : Math.max(0, (booking.total_price ?? 0) - (booking.deposit_amount ?? 0));
    if (balanceDueCents <= 0) return;
    const isPrePaymentBooking = !["confirmed", "paid_in_full", "completed"].includes(String(booking.status));
    const priorAttested = (booking.metadata as any)?.residence_state as string | undefined;
    if (isPrePaymentBooking && !priorAttested && !residenceState) {
      setPayError("Please select your state of residence in the Payment section above, then try again.");
      return;
    }
    if (isSotBlockedState(residenceState)) {
      setPayError("Trip bookings aren't yet available to residents of California, Florida, Hawaii, Iowa, or Washington.");
      return;
    }
    setContractGate(null);
    setPayError(null);
    setPayingBalance(true);
    try {
      // Traveler-side 3.5% service fee on the amount collected, computed in
      // cents — matches the guard's withFee(): Math.round(c * 1.035).
      const feeCents = Math.round(balanceDueCents * 0.035);
      const amountTotalCents = balanceDueCents + feeCents;
      const { data, error: fnError } = await supabase.functions.invoke(
        "trip-checkout-create",
        {
          body: {
            tripBookingId: booking.id,
            amountTotalCents,
            residenceState: residenceState || undefined,
            currency: (booking.currency || "usd").toLowerCase(),
            // trip-checkout-create appends `&session_id=...`, so the URL must
            // already contain a query string (learned the hard way).
            successUrl: `${window.location.origin}/bookings/${booking.id}?paid=1`,
            cancelUrl: `${window.location.origin}/bookings/${booking.id}?canceled=1`,
          },
        }
      );
      if (fnError) throw fnError;
      if (!data?.paymentUrl) throw new Error("No checkout URL returned");
      window.location.href = data.paymentUrl;
    } catch (e: any) {
      console.error("Pay balance failed", e);
      let msg =
        "We couldn't start checkout. Please try again — if it persists, contact support.";
      try {
        const resp = e?.context;
        if (resp && typeof resp.json === "function") {
          const body = await resp.json();
          if (body?.code === "CONTRACT_NOT_EXECUTED") {
            setContractGate({ contractId: body.contractId ?? null });
            setPayingBalance(false);
            return;
          }
          if (typeof body?.error === "string" && body.error) msg = body.error;
        }
      } catch {
        /* ignore parse errors */
      }
      // Never fail silently at the money moment.
      setPayError(msg);
      setPayingBalance(false);
    }
  }

  const currency = booking?.currency || "USD";
  const total = (booking?.total_price ?? 0) / 100; // column stores cents
  const deposit = (booking?.deposit_amount ?? 0) / 100;
  const balance = Math.max(0, total - deposit);
  const reference = booking ? `GS-${booking.id.slice(0, 8).toUpperCase()}` : "";
  // Destination for the hero. Hire bookings have no packaged_trips row, so
  // cover_image_url is null — fall back to the destination image library
  // (same source every other surface uses) so the hero is never a flat box.
  const heroDestination =
    trip?.destination ||
    (booking?.metadata as any)?.destination ||
    (booking?.metadata as any)?.trip_title ||
    null;
  const heroImage = trip?.cover_image_url || getTripRequestImageUrl(heroDestination);

  // Auto-expand Messages only when there's something unread for this booking;
  // otherwise it stays collapsed so money/next-step lead the page.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!booking?.id) return;
      try {
        const { data: sess } = await supabase.auth.getUser();
        const uid = sess?.user?.id;
        if (!uid || !booking.traveler_id || !booking.partner_id) return;
        const [p1, p2] = [booking.traveler_id, booking.partner_id].sort();
        const { data: convo } = await (supabase as any)
          .from("dm_conversations")
          .select("unread_count_p1, unread_count_p2, participant_1")
          .eq("participant_1", p1)
          .eq("participant_2", p2)
          .eq("booking_id", booking.id)
          .maybeSingle();
        if (!alive || !convo) return;
        const mine =
          convo.participant_1 === uid ? convo.unread_count_p1 : convo.unread_count_p2;
        if ((mine ?? 0) > 0) {
          setHasUnread(true);
          setMessagesOpen(true);
        }
      } catch { /* unread is an enhancement */ }
    })();
    return () => { alive = false; };
  }, [booking?.id, booking?.traveler_id, booking?.partner_id]);
  const title =
    hireHeadline ||
    trip?.title ||
    (booking?.metadata as any)?.trip_title ||
    trip?.destination ||
    "Goldsainte trip";
  const specialistName =
    partnerProfile?.display_name ||
    partnerProfile?.full_name ||
    "Goldsainte Concierge";
  const specialistInitials =
    specialistName
      .split(/\s+/)
      .map((w: string) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "GS";
  // What has ACTUALLY been collected: the webhook accumulates fee-stripped
  // dollars into metadata.amount_collected on every checkout (deposit and
  // balance both land there). Bookings from before that tracking existed
  // won't have it — for those, a confirmed booking means the deposit was
  // paid. paid_in_full / completed always mean the full total.
  const collected = Number((booking?.metadata as any)?.amount_collected ?? 0); // fee-stripped DOLLARS (payoutMath boundary standard) — dividing by 100 here is what showed $0.03 for a $2.50 deposit
  const amountPaid =
    booking?.status === "paid_in_full" || booking?.status === "completed"
      ? total
      : collected > 0
        ? Math.min(collected, total)
        : booking?.status === "confirmed"
          ? deposit
          : 0;
  // Money-truth payment stage: what's actually in escrow decides which button
  // shows. Status alone lied today — a balance checkout regressed a confirmed
  // booking to payment_pending and re-offered the already-paid deposit.
  const depositPaid = deposit > 0 && collected >= deposit - 0.01;
  const fullyPaid =
    booking?.status === "paid_in_full" ||
    booking?.status === "completed" ||
    (total > 0 && collected >= total - 0.01);
  const paidPct =
    total > 0 ? Math.min(100, Math.round((amountPaid / total) * 100)) : 0;
  const progressPct = booking?.status === "paid_in_full" ? 100 : paidPct;



  // ── Journey timeline: hospitality-first, ZERO money nouns. Derived from
  //    real booking status + what the traveler has actually paid. Under the
  //    direct-charge model there is no "release" — the specialist is paid at
  //    checkout — so the arc is reserve → secure → arrange → design → begin →
  //    complete, matching the approved design. ──
  const tripComplete = booking?.status === "completed";
  const isConfirmed =
    booking?.status === "confirmed" ||
    booking?.status === "paid_in_full" ||
    booking?.status === "completed";
  const journeyPct = tripComplete
    ? 100
    : booking?.status === "paid_in_full"
      ? 80
      : isConfirmed
        ? 66
        : depositPaid
          ? 40
          : 0;

  // Persona-aware step copy (photographer vs trip specialist vs …), keyed off
  // the same hire_capabilities the deliverables use. The lifecycle STATE
  // (done/cur/next) is computed here from booking status; only the wording
  // comes from the shared journey table.
  const firstName = (specialistName || "your specialist").split(/\s+/)[0];
  const journeyCopy = buildJourneyCopy(hireCapabilities, "traveler", firstName);

  type TL = { title: string; sub: string; state: "done" | "cur" | "next"; when?: string };
  const stepStates: Array<{ state: TL["state"]; when?: string }> = [
    { state: depositPaid || isConfirmed ? "done" : "cur" },
    { state: isConfirmed ? "done" : depositPaid ? "cur" : "next" },
    {
      state:
        booking?.status === "paid_in_full" || tripComplete
          ? "done"
          : isConfirmed
            ? "cur"
            : "next",
    },
    {
      state: tripComplete ? "done" : booking?.status === "paid_in_full" ? "cur" : "next",
      when: booking?.status === "paid_in_full" ? "You're here" : undefined,
    },
    { state: tripComplete ? "done" : "next" },
    { state: tripComplete ? "cur" : "next" },
  ];
  const timeline: TL[] = journeyCopy.steps.map((s, i) => ({
    title: s.title,
    sub: s.sub,
    state: stepStates[i].state,
    when: stepStates[i].when,
  }));
  const currentStep = timeline.find((t) => t.state === "cur") || timeline[0];

  // Deliverables (dynamic, from hire_capabilities). Null → single fallback line.
  const deliverables = buildDeliverables(hireCapabilities);
  const deliverablesHead = deliverablesHeading(hireCapabilities, firstName, "traveler");

  // Has the traveler paid anything at all yet? Gate the payment container copy.
  const anyPaid = amountPaid > 0.01;

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {justPaid && (
        <div className="mx-auto max-w-[860px] px-6 pt-6">
          <div className="rounded-2xl border border-[#C7A962]/40 bg-[#C7A962]/10 px-5 py-4">
            <p className="font-secondary text-[17px] text-[#0a2225]">
              Payment received — thank you.
            </p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-[#0a2225]/65">
              {booking?.status === "paid_in_full" || booking?.status === "completed"
                ? "Your trip is paid in full. Your specialist will confirm the remaining details \u2014 keep an eye on your Messages, and a receipt is on its way to your email."
                : "A receipt is on its way to your email, and the numbers below may take a few seconds to update. Next: your specialist secures your reservations and shares them with you in Messages."}
            </p>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-[860px] px-8 pt-8 pb-2">
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.22em] text-[#0a2225]/50 transition-colors hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to My Bookings
        </Link>
      </section>

      {loading ? (
        <section className="mx-auto max-w-[860px] px-8 pb-16 pt-6">
          <div className="h-[96px] w-full animate-pulse rounded-2xl bg-white/40" />
          <div className="mx-auto mt-14 max-w-[520px] space-y-6">
            <div className="h-40 animate-pulse rounded-2xl bg-white/50" />
            <div className="h-40 animate-pulse rounded-2xl bg-white/50" />
          </div>
        </section>
      ) : error ? (
        <section className="mx-auto max-w-[860px] px-8 pb-16 pt-6">
          <p className="text-[15px] text-red-700">{error}</p>
        </section>
      ) : (
        booking && (
          <article className="mx-auto max-w-[860px] px-8 pb-40 pt-2">
            {/* ── Minimal hero: image band, then eyebrow + serif title + dates
                 + one status badge, centered. Nothing else. ── */}
            <div className="relative h-[96px] overflow-hidden rounded-2xl">
              <TripCoverImage
                src={heroImage}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061418]/40 to-[#061418]/[0.03]" />
            </div>

            <div className="mt-10 text-center">
              <p className="text-[12px] uppercase tracking-[0.24em] text-[#8D6B2F]">
                Your journey · {reference}
              </p>
              <h1 className="mt-3.5 font-secondary text-[30px] leading-[1.06] text-[#0a2225] md:text-4xl">
                {title}
              </h1>
              <p className="mt-3.5 text-[16px] text-[#0a2225]/60">
                {trip?.destination ? trip.destination : "Your custom trip"}
              </p>
              <span className="mt-5 inline-block rounded-full bg-[#0c4d47] px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#E5DFC6]">
                {humanBookingStatus(booking.status)}
              </span>
            </div>

            <hr className="mx-auto mt-20 h-[2px] w-12 border-none bg-[#C7A962]" />

            {/* ── Journey tracker: the emotional centerpiece. % + bar, then the
                 vertical animated timeline. Zero money nouns anywhere here. ── */}
            <section className="mt-14">
              <div className="text-center">
                <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                  {journeyCopy.trackerEyebrow}
                </p>
                <div className="mt-6 font-secondary text-[36px] leading-none text-[#0a2225]">
                  {journeyPct}%
                </div>
                <p className="mt-2 text-[13px] uppercase tracking-[0.16em] text-[#0a2225]/50">
                  {journeyCopy.progressLabel}
                </p>
                <div className="mx-auto mt-6 h-1 w-[280px] overflow-hidden rounded-full bg-[#EDE6D3]">
                  <div
                    className="h-full rounded-full bg-[#C7A962] transition-[width] duration-1000"
                    style={{ width: `${journeyPct}%` }}
                  />
                </div>
              </div>

              <div className="relative mx-auto mt-14 max-w-[520px] pl-1">
                <div className="absolute bottom-2 left-[17px] top-2 w-[2px] bg-[#0a2225]/10" />
                {timeline.map((t, i) => (
                  <div key={i} className="relative pb-8 pl-14 last:pb-0">
                    <span
                      className={
                        "absolute left-[5px] top-0.5 flex h-[25px] w-[25px] items-center justify-center rounded-full text-[12px] " +
                        (t.state === "done"
                          ? "bg-[#0c4d47] text-[#E5DFC6]"
                          : t.state === "cur"
                            ? "border-2 border-[#C7A962] bg-white font-medium text-[#8D6B2F] shadow-[0_0_0_7px_rgba(199,169,98,0.14)]"
                            : "border border-[#0a2225]/20 bg-white text-[#0a2225]/40")
                      }
                    >
                      {t.state === "done" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <h3
                      className={
                        "font-secondary text-[19px] " +
                        (t.state === "next" ? "text-[#0a2225]/40" : "text-[#0a2225]")
                      }
                    >
                      {t.title}
                    </h3>
                    <p className="mt-1 max-w-[400px] text-[15px] text-[#0a2225]/60">
                      {t.sub}
                    </p>
                    {t.when && (
                      <p className="mt-1.5 text-[12px] uppercase tracking-[0.12em] text-[#0a2225]/40">
                        {t.when}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Happening now */}
              <div className="mx-auto mt-14 max-w-[520px] rounded-[20px] bg-white p-9 text-center shadow-[0_24px_64px_-40px_rgba(10,34,37,0.35)]">
                <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                  Happening now
                </p>
                <h3 className="mt-4 font-secondary text-[21px] text-[#0a2225]">
                  {currentStep.title}.
                </h3>
                <p className="mx-auto mt-2 max-w-[420px] text-[15px] text-[#0a2225]/65">
                  {currentStep.sub}
                </p>
              </div>

              {/* Who's helping */}
              <div className="mx-auto mt-6 flex max-w-[520px] items-center justify-center gap-4">
                <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full bg-[#C7A962] text-[17px] font-medium text-[#0a2225]">
                  {partnerProfile?.avatar_url ? (
                    <img
                      src={partnerProfile.avatar_url}
                      alt={specialistName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    specialistInitials
                  )}
                </div>
                <div className="text-left">
                  <small className="block text-[12px] uppercase tracking-[0.16em] text-[#0a2225]/50">
                    Your specialist
                  </small>
                  <span className="font-secondary text-[20px] text-[#0a2225]">
                    {specialistName}
                  </span>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="mx-auto mt-6 flex max-w-[520px] flex-wrap justify-center gap-4">
                {booking.partner_id && (
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("messages")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="rounded-full bg-[#0c4d47] px-7 py-3.5 text-[13px] font-medium text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
                  >
                    Message {firstName}
                  </button>
                )}
              </div>
            </section>

            <hr className="mx-auto mt-20 h-[2px] w-12 border-none bg-[#C7A962]" />

            {/* ── Messages: auto-expands when unread. ── */}
            <section id="messages" className="mt-14">
              <div className="text-center">
                <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                  Messages
                </p>
              </div>
              {booking.partner_id ? (
                <div className="mx-auto mt-6 max-w-[520px]">
                  <button
                    type="button"
                    onClick={() => setMessagesOpen((o) => !o)}
                    className="flex w-full items-center justify-between border-y border-[#0a2225]/[0.14] py-6 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-secondary text-[20px] text-[#0a2225]">
                        {firstName}
                      </span>
                      {hasUnread && (
                        <span className="rounded-full bg-[#0c4d47] px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] text-[#E5DFC6]">
                          New
                        </span>
                      )}
                    </span>
                    <span className="text-[13px] font-medium text-[#8D6B2F]">
                      {messagesOpen ? "Collapse" : "Open"}
                    </span>
                  </button>
                  {messagesOpen && (
                    <div className="pt-6">
                      <BookingConversation
                        bookingId={booking.id}
                        travelerId={booking.traveler_id}
                        partnerId={booking.partner_id}
                        partnerName={specialistName}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="mx-auto mt-6 max-w-[520px] text-center text-[15px] text-[#0a2225]/55">
                  Messaging opens once your specialist is assigned.
                </p>
              )}
            </section>

            {/* ── Deliverables: dynamic from hire_capabilities. ── */}
            <section className="mt-20">
              <div className="text-center">
                <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                  Your trip, assembled
                </p>
                <h2 className="mt-4 font-secondary text-[22px] text-[#0a2225]">
                  {deliverablesHead}
                </h2>
              </div>
              <div className="mx-auto mt-6 max-w-[520px]">
                {deliverables ? (
                  deliverables.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-[#0a2225]/10 py-5"
                    >
                      <span className="font-secondary text-[18px] text-[#0a2225]">
                        {d.label}
                      </span>
                      <span
                        className={
                          "text-[12px] uppercase tracking-[0.14em] " +
                          (d.state === "active"
                            ? "text-[#8D6B2F]"
                            : "text-[#0a2225]/35")
                        }
                      >
                        {d.state === "active" ? "In progress" : "Upcoming"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[15px] text-[#0a2225]/60">
                    {DELIVERABLES_FALLBACK}.
                  </p>
                )}
              </div>
            </section>

            {/* ── Travel documents: honest placeholders until a specialist-side
                 upload control exists. Never fake a checkmark. ── */}
            <section className="mt-20">
              <div className="text-center">
                <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                  Travel documents
                </p>
              </div>
              <div className="mx-auto mt-6 max-w-[520px]">
                <div className="flex items-center justify-between gap-4 border-b border-[#0a2225]/10 py-5 text-[15px]">
                  <span className="text-[#0a2225]">Itinerary</span>
                  <span className="text-[13px] text-[#0a2225]/40">
                    Arrives when your specialist delivers
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[#0a2225]/10 py-5 text-[15px]">
                  <span className="text-[#0a2225]">Confirmations</span>
                  <span className="text-[13px] text-[#0a2225]/40">
                    Shared here as they're booked
                  </span>
                </div>
              </div>
            </section>

            {/* ── Payment: DIRECT-CHARGE model. Collapsed once paid. Shows what
                 the traveler paid / owes — never escrow "held/released". ── */}
            <section className="mt-20">
              <div className="text-center">
                <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                  Payment
                </p>
              </div>
              <div className="mx-auto mt-6 max-w-[520px]">
                <details open={!fullyPaid}>
                  <summary className="flex cursor-pointer list-none items-center justify-between border-y border-[#0a2225]/[0.14] py-6">
                    <span className="flex items-center">
                      <span className="font-secondary text-[26px] text-[#0a2225]">
                        {formatMoney(total, currency)}
                      </span>
                      <span className="ml-3.5 rounded-full bg-[#EAF3EC] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[#0c4d47]">
                        {fullyPaid
                          ? "Paid in full"
                          : anyPaid
                            ? "Balance due"
                            : "Due"}
                      </span>
                    </span>
                    <span className="text-[13px] font-medium text-[#8D6B2F]">
                      View breakdown
                    </span>
                  </summary>
                  <div className="py-6">
                    <div className="flex justify-between py-2 text-[15px] text-[#0a2225]/70">
                      <span>Deposit</span>
                      <span>
                        {formatMoney(deposit, currency)}
                        {depositPaid ? " \u2713" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 text-[15px] text-[#0a2225]/70">
                      <span>Balance</span>
                      <span>
                        {formatMoney(balance, currency)}
                        {fullyPaid ? " \u2713" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 text-[15px] text-[#0a2225]/70">
                      <span>Paid directly to your specialist</span>
                      <span>{Math.round((anyPaid ? amountPaid : 0) / (total || 1) * 100)}%</span>
                    </div>
                    <p className="mt-4 text-[13px] leading-relaxed text-[#0a2225]/50">
                      Payments are charged securely to your specialist, your
                      seller of record. A 3.5% service fee applies at checkout.
                    </p>
                    {!fullyPaid && booking.status !== "cancelled" && (deposit > 0 || balance > 0) && (
                      <button
                        type="button"
                        onClick={handlePayBalance}
                        disabled={payingBalance}
                        className="mt-5 w-full rounded-full bg-[#0c4d47] px-7 py-4 text-[13px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
                      >
                        {payingBalance
                          ? "Preparing\u2026"
                          : depositPaid
                            ? `Pay balance \u2014 ${formatMoney(balance, currency)} + 3.5% fee`
                            : `Pay deposit \u2014 ${formatMoney(deposit, currency)} + 3.5% fee`}
                      </button>
                    )}
                    {payError && (
                      <p className="mt-3 text-[13.5px] text-red-700">{payError}</p>
                    )}
                  </div>
                </details>
              </div>
            </section>

            {/* ── Support: quiet accordion at the very bottom. ── */}
            <section className="mt-20">
              <div className="text-center">
                <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                  Support
                </p>
                <h2 className="mt-4 font-secondary text-[22px] text-[#0a2225]">
                  If you need anything
                </h2>
              </div>
              <div className="mx-auto mt-6 max-w-[520px]">
                {booking.partner_id && (
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("messages")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="flex w-full items-center justify-between border-b border-[#0a2225]/10 py-5 text-left text-[15px]"
                  >
                    <span>Message your specialist</span>
                    <span className="text-[#0a2225]/35">{"\u2192"}</span>
                  </button>
                )}
                <div className="border-b border-[#0a2225]/10 py-5">
                  <TripPoliciesPanel bookingStatus={booking.status} />
                </div>
                <Link
                  to="/community-guidelines"
                  className="flex items-center justify-between border-b border-[#0a2225]/10 py-5 text-[15px]"
                >
                  <span>Community guidelines</span>
                  <span className="text-[#0a2225]/35">{"\u2192"}</span>
                </Link>
              </div>
            </section>

            {/* Contract (kept: real data, useful to the traveler) */}
            {booking.partner_id && (
              <section className="mt-20">
                <div className="text-center">
                  <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                    Agreement
                  </p>
                </div>
                <div className="mx-auto mt-6 max-w-[520px]">
                  <ContractStatusCard
                    variant="traveler"
                    bookingId={booking.id}
                    travelerId={booking.traveler_id}
                    destination={trip?.destination ?? null}
                  />
                </div>
              </section>
            )}
          </article>
        )
      )}

      {/* ── Sticky bottom action bar (mobile). Direct-charge copy. ── */}
      {booking && !fullyPaid && booking.status !== "cancelled" && (deposit > 0 || balance > 0) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#0a2225]/10 bg-[#fdfaf2]/95 px-4 py-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                {depositPaid ? "Balance" : "Deposit"}
              </p>
              <p className="truncate font-secondary text-[16px] text-[#0a2225]">
                {formatMoney(depositPaid ? balance : deposit, currency)} + 3.5% fee
              </p>
            </div>
            <button
              type="button"
              onClick={handlePayBalance}
              disabled={payingBalance}
              className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-[#0c4d47] px-6 py-3 text-[13.5px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
            >
              {payingBalance ? "Preparing\u2026" : depositPaid ? "Pay balance" : "Pay deposit"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
