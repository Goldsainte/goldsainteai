// src/pages/trips/TripRequestDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getTripRequestDetail,
  type TripRequestDetail,
} from "@/services/tripRequestsService";
import { TrustSafetyInline } from "@/components/trust/TrustSafetyInline";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  // Journey timeline (31 Jul): the booking page's "step by step" device,
  // adapted for requests — founder ask, with an honesty constraint: only
  // stages the data can PROVE. "Creator acknowledged / working on it" needs
  // creator-side signals that don't exist yet (phase 2).
  const [preferredCreatorName, setPreferredCreatorName] = useState<string | null>(null);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    const pid = (trip as any)?.preferred_creator_id;
    if (!pid) { setPreferredCreatorName(null); return; }
    supabase
      .from("profiles")
      .select("display_name, full_name, username")
      .eq("id", pid)
      .maybeSingle()
      .then(({ data }) => {
        setPreferredCreatorName(data?.display_name || data?.full_name || data?.username || null);
      });
  }, [(trip as any)?.preferred_creator_id]);

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
  const canDelete = isTraveler || isAdmin;

  // Ported from the marketplace owner view (31 Jul) so nothing is lost when
  // owners are redirected here: Close pulls the request off the marketplace
  // (status "cancelled") but keeps the record; Delete removes it entirely.
  const [closing, setClosing] = useState(false);
  const handleCloseRequest = async () => {
    if (!trip || !window.confirm("Close this trip request? It will leave the open marketplace immediately and agents and creators will no longer be able to submit proposals.")) return;
    setClosing(true);
    try {
      const { error } = await supabase
        .from("trip_requests")
        .update({ status: "cancelled" })
        .eq("id", trip.id);
      if (error) throw error;
      setTrip({ ...trip, status: "cancelled" } as any);
      toast.success("Your request is closed and off the marketplace.");
    } catch (err: any) {
      console.error("Failed to close trip request", err);
      toast.error(err.message || "Could not close the request");
    } finally {
      setClosing(false);
    }
  };

  const handleDelete = async () => {
    if (!trip) return;
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from("trip_requests")
      .delete()
      .eq("id", trip.id);
    
    if (deleteError) {
      toast.error("Failed to delete trip request");
      setDeleting(false);
      return;
    }
    
    toast.success("Trip request deleted");
    navigate(isTraveler ? "/my-trips" : "/marketplace");
  };
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
    <div className="flex-1 bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-8 pb-6 md:pt-10 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to={isTraveler ? "/my-trips" : "/marketplace"}
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            {isTraveler ? "Back to My Trips" : "Back to Marketplace"}
          </Link>

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                {trip?.status === "open" && (
                  <button
                    type="button"
                    onClick={handleCloseRequest}
                    disabled={closing}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0a2225]/15 bg-white px-3 py-1.5 text-[12px] text-[#0a2225]/70 transition-colors hover:border-[#C7A962] disabled:opacity-50"
                  >
                    {closing ? "Closing…" : "Close request"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {deleting ? "Deleting…" : "Delete trip"}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this trip request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the trip request and all associated messages. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
                      {trip.travelers_adults || 0} {(trip.travelers_adults || 0) === 1 ? "adult" : "adults"}
                      {typeof trip.travelers_children === "number" && trip.travelers_children > 0
                        ? ` • ${trip.travelers_children} ${trip.travelers_children === 1 ? "child" : "children"}`
                        : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-flex items-center rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3.5 py-1.5 text-[11px] tracking-wide">
                  {trip.status === "open"
                    ? "Open for proposals"
                    : trip.status === "matched"
                    ? "Matching in progress"
                    : trip.status === "closed"
                    ? "Closed"
                    : trip.status}
                </span>
                {trip.traveler?.display_name && (
                  <p className="text-[12px] text-[#6B7280]">
                    Posted by{" "}
                    <span className="text-[#0a2225] font-semibold">
                      {trip.traveler.display_name}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Chips row: budget / pace / occasion / roles */}
            <div className="flex flex-wrap gap-2 text-[12px] mb-4">
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
            {/* Editorial re-cut (31 Jul): the launch-day page was white
                bubble cards set in 9-11px type — off the house baseline
                (kicker + serif + hairlines, files 270/271/312). Logic,
                conditions and handlers untouched; skin only. */}
            <div className="space-y-10 text-[15px]">
              {(() => {
                const total = trip.proposals_summary?.total ?? 0;
                const accepted = trip.proposals_summary?.accepted ?? 0;
                const stages = [
                  {
                    title: preferredCreatorName ? `Sent to ${preferredCreatorName}` : "Posted to the marketplace",
                    desc: preferredCreatorName
                      ? "They've been notified directly about your trip."
                      : "Specialists across the marketplace can see your brief.",
                    state: "done",
                  },
                  {
                    // Direct requests are private to ONE named recipient (the
                    // marketplace filter from Jul 26 keeps them off the public
                    // board) — the copy must not imply plural "specialists".
                    title: total > 0
                      ? "Reviewed and responded"
                      : preferredCreatorName
                      ? `Awaiting ${preferredCreatorName}'s response`
                      : "Specialists are reviewing",
                    desc: total > 0
                      ? "Your brief has been picked up and responded to."
                      : preferredCreatorName
                      ? "Direct requests are private — only they can see and respond to this brief."
                      : "Proposals typically arrive within a day or two.",
                    state: total > 0 ? "done" : "current",
                  },
                  {
                    title: total > 0
                      ? `${total} proposal${total === 1 ? "" : "s"} delivered`
                      : "Proposals delivered",
                    desc: total > 0
                      ? "Compare them side by side and ask questions in chat."
                      : "Each arrives with an itinerary, price, and timeline.",
                    state: total > 0 ? (accepted > 0 ? "done" : "current") : "future",
                  },
                  {
                    title: accepted > 0 ? "Booked" : "You choose & book",
                    desc: accepted > 0
                      ? "Payment and details flow into your booking view."
                      : "Accept the one that fits — payment stays protected on platform.",
                    state: accepted > 0 ? "done" : "future",
                  },
                ];
                const doneCount = stages.filter((st) => st.state === "done").length;
                const pct = Math.round((doneCount / stages.length) * 100);
                const current = stages.find((st) => st.state === "current");
                return (
                  <div className="border-y border-[#0a2225]/10 py-8">
                    <p className="text-center text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                      Your request, step by step
                    </p>
                    <p className="mt-4 text-center font-secondary text-5xl text-[#0a2225]">{pct}%</p>
                    <p className="mt-1 text-center text-[11px] uppercase tracking-[0.22em] text-[#6B7280]">
                      of the way to booked
                    </p>
                    <div className="mx-auto mt-5 h-1 w-full max-w-md overflow-hidden rounded-full bg-[#C7A962]/25">
                      <div className="h-full rounded-full bg-[#C7A962]" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="mt-9 space-y-7">
                      {stages.map((st, idx) => (
                        <div key={st.title} className="flex gap-4">
                          {st.state === "done" ? (
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6]">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-secondary text-[15px] ${
                              st.state === "current"
                                ? "border-[#C7A962] text-[#8D6B2F]"
                                : "border-[#0a2225]/15 text-[#0a2225]/35"
                            }`}>
                              {idx + 1}
                            </span>
                          )}
                          <div className={st.state === "future" ? "opacity-45" : ""}>
                            <p className={`text-[17px] ${st.state === "future" ? "" : "font-medium"} text-[#0a2225]`}>
                              {st.title}
                            </p>
                            <p className="mt-0.5 text-[14px] leading-relaxed text-[#6B7280]">{st.desc}</p>
                            {st.state === "current" && (
                              <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                                You're here
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {current && (
                      <div className="mt-9 border-l-2 border-[#C7A962] py-1 pl-5">
                        <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Happening now</p>
                        <p className="mt-2 font-secondary text-xl text-[#0a2225]">{current.title}.</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">{current.desc}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="border-y border-[#0a2225]/10 py-8 space-y-6">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Trip brief</p>
                  <h2 className="mt-2 font-secondary text-2xl text-[#0a2225]">
                    What they&apos;re hoping for
                  </h2>
                </div>

                {trip.interests && trip.interests.length > 0 && (
                  <div>
                    <p className="text-[12px] uppercase tracking-wide text-[#6B7280] mb-2">
                      What matters most
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {trip.interests.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full bg-[#f7f3ea] border border-[#E5DFC6] px-3.5 py-1.5 text-[13px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {trip.accommodation_style && (
                  <div>
                    <p className="text-[12px] uppercase tracking-wide text-[#6B7280] mb-1.5">
                      Where they&apos;d like to stay
                    </p>
                    <p className="text-[15px] leading-relaxed text-[#0a2225]/80">
                      {trip.accommodation_style}
                    </p>
                  </div>
                )}

                {trip.flexibility && (
                  <div>
                    <p className="text-[12px] uppercase tracking-wide text-[#6B7280] mb-1.5">
                      Flexibility
                    </p>
                    <p className="text-[15px] leading-relaxed text-[#0a2225]/80 whitespace-pre-line">
                      {trip.flexibility}
                    </p>
                  </div>
                )}

                {trip.special_notes && (
                  <div>
                    <p className="text-[12px] uppercase tracking-wide text-[#6B7280] mb-1.5">
                      Notes for creator / agent
                    </p>
                    <p className="text-[15px] leading-relaxed text-[#0a2225]/80 whitespace-pre-line">
                      {trip.special_notes}
                    </p>
                  </div>
                )}

                {!trip.special_notes &&
                  !trip.flexibility &&
                  !trip.interests?.length &&
                  !trip.accommodation_style && (
                    <p className="text-[14px] text-[#6B7280]">
                      The essentials are here. Partners can use this plus your
                      chat to shape a proposal.
                    </p>
                  )}
              </div>

              {/* Trust & safety */}
              <TrustSafetyInline />
            </div>

            {/* Right: proposals + actions */}
            <div className="space-y-10 text-[15px]">
              <div className="border-y border-[#0a2225]/10 py-8 space-y-5">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Proposals</p>
                  <h2 className="mt-2 font-secondary text-2xl text-[#0a2225]">
                    {trip.proposals_summary.total > 0
                      ? `${trip.proposals_summary.total} proposal${
                          trip.proposals_summary.total === 1 ? "" : "s"
                        } received`
                      : "No proposals yet"}
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#0a2225]/55">
                    {trip.proposals_summary.accepted > 0
                      ? `${trip.proposals_summary.accepted} accepted`
                      : "You can wait for more, or accept a proposal when you're ready."}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div />

                  {isTraveler && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/proposals?tripId=${trip.id}`)
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-6 py-2.5 text-sm hover:bg-[#073331] transition-colors"
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
                      className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-6 py-2.5 text-sm hover:bg-[#073331] transition-colors"
                    >
                      Send a proposal
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <p className="text-[13px] leading-relaxed text-[#0a2225]/45">
                  Proposals and booking details will flow into your booking
                  view once a proposal is accepted and payment moves into
                  Goldsainte&apos;s protected flow.
                </p>
              </div>

              {isTraveler && (
                <div className="border-b border-[#0a2225]/10 pb-8 space-y-3">
                  <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                    Make a change
                  </p>
                  <p className="text-[14px] leading-relaxed text-[#0a2225]/70">
                    Want to adjust something big — like destination, dates or
                    budget? You can post a new trip if your plans have shifted
                    meaningfully.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/post-trip")}
                    className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/20 px-6 py-2.5 text-sm text-[#0a2225] transition-colors hover:border-[#C7A962]"
                  >
                    Post another trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
