// src/pages/trips/TripRequestDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getTripRequestDetail,
  type TripRequestDetail,
} from "@/services/tripRequestsService";
import { TrustSafetyInline } from "@/components/trust/TrustSafetyInline";

type AccountType = "traveler" | "creator" | "agent" | "admin" | null;

function formatMoney(
  amount: number | null | undefined,
  currency: string = "USD"
) {
  if (!amount) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function summarizeBudgetLevel(level?: string | null) {
  switch (level) {
    case "accessible":
      return "Thoughtful, budget-aware";
    case "elevated":
      return "Elevated, 4–5⭐ mix";
    case "ultra_luxury":
      return "Ultra-luxury, 5⭐+ only";
    default:
      return null;
  }
}

export default function TripRequestDetailPage() {
  const { tripRequestId } = useParams<{ tripRequestId: string }>();
  const [trip, setTrip] = useState<TripRequestDetail | null>(null);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!tripRequestId) return;
      try {
        const [{ data: authData }, tripData] = await Promise.all([
          supabase.auth.getUser(),
          getTripRequestDetail(tripRequestId),
        ]);

        if (cancelled) return;

        const user = authData.user;
        if (user) {
          setCurrentUserId(user.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("account_type")
            .eq("id", user.id)
            .maybeSingle();
          const type = (profile?.account_type || "traveler") as AccountType;
          setAccountType(type);
        }

        setTrip(tripData);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load trip.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tripRequestId]);

  const isTraveler = trip && currentUserId === trip.user_id;
  const isPartner = !isTraveler && (accountType === "creator" || accountType === "agent");

  const budgetSummary =
    trip &&
    (trip.budget_min || trip.budget_max || trip.budget_level
      ? [
          trip.budget_min && trip.budget_max
            ? `${formatMoney(trip.budget_min)} – ${formatMoney(
                trip.budget_max
              )}`
            : null,
          summarizeBudgetLevel(trip.budget_level),
        ]
          .filter(Boolean)
          .join(" • ")
      : null);

  const title =
    trip?.title || trip?.destination || "Goldsainte trip request";

  const canSendProposal = isPartner && trip?.status === "open";

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to={isTraveler ? "/my-trips" : "/tiktok-lab"}
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            {isTraveler ? "Back to My Trips" : "Back to Goldsainte Creator Lab"}
          </Link>
        </div>

        {loading && (
          <p className="text-[11px] text-[#8D8D8D]">Loading trip…</p>
        )}
        {error && (
          <p className="text-[11px] text-red-600">
            {error}
          </p>
        )}

        {trip && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                  Trip brief
                </p>
                <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
                  {title}
                </h1>
                <div className="flex flex-wrap gap-2 text-[10px] text-[#4a4a4a]">
                  {trip.destination && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {trip.destination}
                    </span>
                  )}
                  {trip.start_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(trip.start_date)}
                      {trip.end_date &&
                        ` – ${formatDate(trip.end_date)}`}
                    </span>
                  )}
                  {(trip.travelers_adults || trip.travelers_children) && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {trip.travelers_adults || 0} adults
                      {typeof trip.travelers_children === "number"
                        ? ` • ${trip.travelers_children} children`
                        : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-flex items-center rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3 py-1 text-[10px]">
                  {trip.status === "open"
                    ? "Open for proposals"
                    : trip.status === "matched"
                    ? "Matching in progress"
                    : trip.status === "closed"
                    ? "Closed"
                    : trip.status}
                </span>
                {trip.traveler?.display_name && (
                  <p className="text-[10px] text-[#8D8D8D]">
                    Posted by{" "}
                    <span className="text-[#0a2225] font-semibold">
                      {trip.traveler.display_name}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Chips row: budget / pace / occasion / roles */}
            <div className="flex flex-wrap gap-1.5 text-[9px] mb-4">
              {budgetSummary && (
                <span className="inline-flex items-center rounded-full bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-1">
                  {budgetSummary}
                </span>
              )}
              {trip.pace && (
                <span className="inline-flex items-center rounded-full bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-1">
                  Pace:{" "}
                  {trip.pace === "slow"
                    ? "Slow"
                    : trip.pace === "balanced"
                    ? "Balanced"
                    : "Packed"}
                </span>
              )}
              {trip.occasion && (
                <span className="inline-flex items-center rounded-full bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-1">
                  Occasion: {trip.occasion}
                </span>
              )}
              {trip.wants_role && (
                <span className="inline-flex items-center rounded-full bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-1">
                  Wants:{" "}
                  {trip.wants_role === "creator"
                    ? "Creators"
                    : trip.wants_role === "agent"
                    ? "Travel agents"
                    : "Creators & agents"}
                </span>
              )}
            </div>
          </>
        )}
      </section>

      {trip && (
        <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Left: details */}
            <div className="space-y-5 text-[11px]">
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0c4d47]">
                      <Sparkles className="h-3 w-3 text-[#E5DFC6]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                        Trip mood
                      </p>
                      <p className="text-[12px] font-semibold">
                        What they&apos;re hoping for
                      </p>
                    </div>
                  </div>
                </div>

                {trip.interests && trip.interests.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#8D8D8D] mb-1">
                      What matters most
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {trip.interests.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-1 text-[10px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {trip.accommodation_style && (
                  <div>
                    <p className="text-[10px] text-[#8D8D8D] mb-1">
                      Where they&apos;d like to stay
                    </p>
                    <p className="text-[11px] text-[#4a4a4a]">
                      {trip.accommodation_style}
                    </p>
                  </div>
                )}

                {trip.flexibility && (
                  <div>
                    <p className="text-[10px] text-[#8D8D8D] mb-1">
                      Flexibility
                    </p>
                    <p className="text-[11px] text-[#4a4a4a] whitespace-pre-line">
                      {trip.flexibility}
                    </p>
                  </div>
                )}

                {trip.special_notes && (
                  <div>
                    <p className="text-[10px] text-[#8D8D8D] mb-1">
                      Notes for creator / agent
                    </p>
                    <p className="text-[11px] text-[#4a4a4a] whitespace-pre-line">
                      {trip.special_notes}
                    </p>
                  </div>
                )}

                {!trip.special_notes &&
                  !trip.flexibility &&
                  !trip.interests?.length &&
                  !trip.accommodation_style && (
                    <p className="text-[10px] text-[#8D8D8D]">
                      The essentials are here. Partners can use this plus your
                      chat to shape a proposal.
                    </p>
                  )}
              </div>

              {/* Trust & safety */}
              <TrustSafetyInline />
            </div>

            {/* Right: proposals + actions */}
            <div className="space-y-5 text-[11px]">
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                      Proposals
                    </p>
                    <p className="text-[12px] font-semibold">
                      Who has responded so far
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px]">
                      {trip.proposals_summary.total > 0
                        ? `${trip.proposals_summary.total} proposal${
                            trip.proposals_summary.total === 1 ? "" : "s"
                          } received`
                        : "No proposals yet"}
                    </p>
                    <p className="text-[10px] text-[#8D8D8D]">
                      {trip.proposals_summary.accepted > 0
                        ? `${trip.proposals_summary.accepted} accepted`
                        : "You can wait for more, or accept a proposal when you're ready."}
                    </p>
                  </div>

                  {isTraveler && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/proposals?tripId=${trip.id}`)
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-1.5 text-[10px] font-semibold hover:bg-[#073331]"
                    >
                      View proposals
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}

                  {isPartner && canSendProposal && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/proposals/new?tripId=${trip.id}`)
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-1.5 text-[10px] font-semibold hover:bg-[#073331]"
                    >
                      Send a proposal
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <p className="text-[9px] text-[#8D8D8D]">
                  Proposals and booking details will flow into your booking
                  view once a proposal is accepted and payment moves into
                  Goldsainte&apos;s protected flow.
                </p>
              </div>

              {isTraveler && (
                <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                    Make a change
                  </p>
                  <p className="text-[11px] text-[#4a4a4a]">
                    Want to adjust something big — like destination, dates or
                    budget? You can post a new trip if your plans have shifted
                    meaningfully.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/post-trip")}
                    className="inline-flex items-center gap-2 rounded-full bg-[#f7f3ea] text-[#0a2225] border border-[#E5DFC6] px-4 py-1.5 text-[10px] font-semibold hover:border-[#BFAD72]"
                  >
                    Post another trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
