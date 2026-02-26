// src/pages/proposals/ProposalsForTripPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getProposalsForTrip,
  type ProposalListItem,
} from "@/services/proposalsService";
import { getTripRequestDetail, type TripRequestDetail } from "@/services/tripRequestsService";
import { TrustSafetyInline } from "@/components/trust/TrustSafetyInline";

function formatMoney(amount: number | null | undefined, currency = "USD") {
  if (!amount) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function humanStatus(status: string) {
  const map: Record<string, string> = {
    pending: "Awaiting Review",
    sent: "Awaiting Review",
    traveler_review: "Under Review",
    accepted: "Accepted",
    declined: "Declined",
    withdrawn: "Withdrawn",
    expired: "Expired",
  };
  return map[status] || status;
}

export default function ProposalsForTripPage() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get("tripId");

  const [trip, setTrip] = useState<TripRequestDetail | null>(null);
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!tripId) { setError("Trip not found."); setLoading(false); return; }
      try {
        const [{ data: authData }, tripDetail, proposalsList] = await Promise.all([
          supabase.auth.getUser(),
          getTripRequestDetail(tripId),
          getProposalsForTrip(tripId),
        ]);
        if (cancelled) return;
        setTrip(tripDetail);
        setProposals(proposalsList);
        setCurrentUserId(authData.user?.id ?? null);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load proposals.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tripId]);

  const isTraveler = trip && currentUserId && trip.user_id === currentUserId;
  const title = trip?.title || trip?.destination || "Trip";

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading proposals…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-[#0c4d47] underline">Go back</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-foreground">
      {/* Hero */}
      <section className="bg-[#FDF9F0] border-b border-[#E5DFC6]/60">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 md:pt-14 md:pb-10">
          <Link
            to={isTraveler ? "/my-trips" : "/marketplace/trip-requests"}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to trips
          </Link>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[#C7A962] font-medium">
              Proposals Received
            </p>
            <h1 className="font-secondary text-2xl md:text-[28px] leading-tight text-[#0a2225]">
              Options for "{title}"
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Compare proposals from creators and travel agents side by side. Open any proposal to see full details and move into Goldsainte's protected booking flow.
            </p>
          </div>
        </div>
      </section>

      {/* Trip brief */}
      {trip && (
        <section className="mx-auto max-w-5xl px-4 pt-8">
          <div className="bg-[#FDF9F0] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Destination</p>
              <p className="text-base font-semibold text-[#0a2225]">{trip.destination || "Flexible"}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {trip.start_date
                  ? `${formatDate(trip.start_date)}${trip.end_date ? ` – ${formatDate(trip.end_date)}` : ""}`
                  : "Dates flexible"}
              </p>
            </div>
            <div className="text-right">
              {(trip.budget_min || trip.budget_max) ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">Budget</p>
                  <p className="text-base font-semibold text-[#0a2225]">
                    {trip.budget_min && trip.budget_max
                      ? `${formatMoney(trip.budget_min)} – ${formatMoney(trip.budget_max)}`
                      : trip.budget_min
                      ? `From ${formatMoney(trip.budget_min)}`
                      : `Up to ${formatMoney(trip.budget_max!)}`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No budget set</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Proposals list */}
      <section className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        {proposals.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-secondary text-xl text-[#0a2225] mb-2">No proposals yet</p>
            <p className="text-sm text-muted-foreground">
              As creators and travel agents respond, you'll see them here and can compare them before deciding.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[#C7A962] font-medium">
              {proposals.length} Proposal{proposals.length !== 1 ? "s" : ""}
            </p>
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <TrustSafetyInline />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          All decisions and payments happen through Goldsainte so your booking, dates, and eligible refunds stay protected.
        </p>
      </section>
    </main>
  );
}

function ProposalCard({ proposal }: { proposal: ProposalListItem }) {
  const navigate = useNavigate();
  const who = proposal.proposer?.display_name || "Goldsainte Partner";
  const roleLabel = proposal.proposer_role === "creator" ? "TikTok Creator" : proposal.proposer_role === "agent" ? "Travel Agent" : "Partner";

  return (
    <button
      type="button"
      onClick={() => navigate(`/proposals/${proposal.id}`)}
      className="w-full text-left bg-white rounded-2xl shadow-[0_1px_12px_rgba(0,0,0,0.06)] border border-transparent hover:border-[#C7A962]/40 p-5 md:p-6 transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-base font-semibold text-[#0a2225] truncate">
            {proposal.headline || "Trip Proposal"}
          </p>
          <p className="text-sm text-muted-foreground">
            {roleLabel} · {who}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Sent {formatDate(proposal.created_at)}
            {proposal.valid_until && ` · Valid until ${formatDate(proposal.valid_until)}`}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5">
          <p className="font-secondary text-2xl font-semibold text-[#0a2225]">
            {formatMoney(proposal.price_from, proposal.currency || "USD")}
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm text-[#0c4d47] font-medium group-hover:gap-2 transition-all">
            {humanStatus(proposal.status)}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
