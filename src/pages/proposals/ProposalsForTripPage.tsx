// src/pages/proposals/ProposalsForTripPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Shield,
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

function humanStatus(status: string) {
  switch (status) {
    case "pending":
      return "Awaiting decision";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "withdrawn":
      return "Withdrawn";
    case "expired":
      return "Expired";
    default:
      return status;
  }
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
      if (!tripId) {
        setError("We couldn't find that trip.");
        setLoading(false);
        return;
      }

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
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const isTraveler =
    trip && currentUserId && trip.user_id === currentUserId;

  const title =
    trip?.title || trip?.destination || "Trip proposals";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to={isTraveler ? "/my-trips" : "/tiktok-lab/trips"}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to trips
          </Link>
        </div>

        {loading && (
          <p className="text-[11px] text-muted-foreground">Loading proposals…</p>
        )}
        {error && (
          <p className="text-[11px] text-destructive">
            {error}
          </p>
        )}

        {trip && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Trip proposals
            </p>
            <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
              Options for "{title}"
            </h1>
            <p className="text-[11px] md:text-[12px] text-muted-foreground max-w-lg">
              Compare proposals from creators and travel agents side by side.
              When you&apos;re ready, you can open one to see details and move
              into Goldsainte&apos;s protected booking flow.
            </p>
          </div>
        )}
      </section>

      {trip && (
        <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
          <div className="rounded-3xl bg-card border border-border p-4 md:p-5 text-[11px] mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground">
                  Trip overview
                </p>
                <p className="text-[11px] font-semibold">
                  {trip.destination || "Trip"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {trip.start_date
                    ? `${formatDate(trip.start_date)}${
                        trip.end_date
                          ? ` – ${formatDate(trip.end_date)}`
                          : ""
                      }`
                    : "Dates flexible"}
                </p>
              </div>
              <div className="text-right">
                {trip.budget_min || trip.budget_max ? (
                  <>
                    <p className="text-[10px] text-muted-foreground">Budget guide</p>
                    <p className="text-[11px] font-semibold">
                      {trip.budget_min && trip.budget_max
                        ? `${formatMoney(trip.budget_min)} – ${formatMoney(
                            trip.budget_max
                          )}`
                        : trip.budget_min
                        ? `From ${formatMoney(trip.budget_min)}`
                        : `Up to ${formatMoney(trip.budget_max!)}`}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    No budget range set. Proposals may vary.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-border p-4 md:p-5 text-[11px] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Users className="h-3 w-3 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Proposals
                  </p>
                  <p className="text-[12px] font-semibold">
                    Your options so far
                  </p>
                </div>
              </div>
              <Shield className="h-4 w-4 text-primary" />
            </div>

            {proposals.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">
                No proposals yet. As creators and travel agents respond, you&apos;ll
                see them here and can compare them calmly before deciding.
              </p>
            ) : (
              <div className="space-y-2">
                {proposals.map((p) => (
                  <ProposalRow key={p.id} proposal={p} />
                ))}
              </div>
            )}

            <p className="text-[9px] text-muted-foreground pt-1">
              All decisions and payments happen through Goldsainte so that your
              booking, dates and any eligible refunds stay protected.
            </p>
          </div>

          <div className="mt-4">
            <TrustSafetyInline />
          </div>
        </section>
      )}
    </main>
  );
}

type RowProps = {
  proposal: ProposalListItem;
};

function ProposalRow({ proposal }: RowProps) {
  const navigate = useNavigate();

  const who = proposal.proposer?.display_name || "Goldsainte partner";

  const roleLabel =
    proposal.proposer_role === "creator"
      ? "Creator"
      : proposal.proposer_role === "agent"
      ? "Travel agent"
      : "Partner";

  return (
    <button
      type="button"
      onClick={() => navigate(`/proposals/${proposal.id}`)}
      className="w-full text-left flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-2xl bg-muted border border-border px-3 py-2 hover:border-primary/50"
    >
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold">
          {proposal.headline || "Trip proposal"}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {roleLabel} • {who}
        </p>
        <p className="text-[9px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Sent {formatDate(proposal.created_at)}
          {proposal.valid_until
            ? ` • Valid until ${formatDate(proposal.valid_until)}`
            : ""}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="text-[11px] font-semibold">
          {formatMoney(proposal.price_from, proposal.currency || "USD")}
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] text-primary">
          {humanStatus(proposal.status)}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}
