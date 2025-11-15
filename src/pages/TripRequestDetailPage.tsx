// src/pages/TripRequestDetailPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  MapPin,
  Users,
  Link2,
  Loader2,
  Sparkles,
  HandCoins,
  User,
} from "lucide-react";

type TripRequest = {
  id: string;
  user_id: string | null;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  flexible_dates: boolean | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  budget_min: number | null;
  budget_max: number | null;
  trip_style: string[] | null;
  description: string | null;
  tiktok_link: string | null;
  status: string;
  created_at: string;
};

type ProposalForm = {
  proposerRole: "agent" | "creator";
  headline: string;
  message: string;
  priceFrom: string;
};

type TripProposal = {
  id: string;
  proposer_id: string;
  proposer_role: "agent" | "creator";
  headline: string | null;
  message: string | null;
  price_from: number | null;
  status: string;
  created_at: string;
};

const EMPTY_PROPOSAL: ProposalForm = {
  proposerRole: "agent",
  headline: "",
  message: "",
  priceFrom: "",
};

export default function TripRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<TripRequest | null>(null);
  const [proposals, setProposals] = useState<TripProposal[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [proposal, setProposal] = useState<ProposalForm>(EMPTY_PROPOSAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOwner = trip && currentUserId && trip.user_id === currentUserId;

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      setLoading(true);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (!userData?.user || userError) {
        navigate(`/login?redirect=/trip-request/${id}`, { replace: true });
        return;
      }

      if (isMounted) {
        setCurrentUserId(userData.user.id);
      }

      const { data: tripData, error: tripError } = await supabase
        .from("trip_requests")
        .select(
          "id, user_id, title, destination, start_date, end_date, flexible_dates, travelers_adults, travelers_children, budget_min, budget_max, trip_style, description, tiktok_link, status, created_at"
        )
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (tripError || !tripData) {
        console.error("Error loading trip_request:", tripError);
        setTrip(null);
        setProposals([]);
        setLoading(false);
        return;
      }

      setTrip(tripData as TripRequest);

      // Load proposals
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("trip_proposals")
        .select(
          "id, proposer_id, proposer_role, headline, message, price_from, status, created_at"
        )
        .eq("trip_request_id", id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (proposalsError) {
        console.error("Error loading trip_proposals:", proposalsError);
        setProposals([]);
      } else {
        setProposals((proposalsData ?? []) as TripProposal[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  function updateProposal<K extends keyof ProposalForm>(
    key: K,
    value: ProposalForm[K]
  ) {
    setProposal((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmitProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !id) return;

    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("Please log in to send a proposal.");
        setSubmitting(false);
        return;
      }

      // Prevent traveler from sending a proposal to themselves
      if (trip.user_id === userData.user.id) {
        setError(
          "You're the traveler on this trip. You'll receive proposals from creators and agents here."
        );
        setSubmitting(false);
        return;
      }

      const priceFrom = parseInt(proposal.priceFrom || "0", 10) || null;

      const { error: insertError } = await supabase
        .from("trip_proposals")
        .insert({
          trip_request_id: id,
          proposer_id: userData.user.id,
          proposer_role: proposal.proposerRole,
          headline: proposal.headline || null,
          message: proposal.message || null,
          price_from: priceFrom,
          status: "sent",
        });

      if (insertError) {
        console.error("Error inserting trip_proposals:", insertError);
        setError(
          "Something went wrong while sending your proposal. Please try again."
        );
      } else {
        setSuccess(true);
        setProposal(EMPTY_PROPOSAL);

        // Optimistically reload proposals list
        const { data: proposalsData, error: proposalsError } = await supabase
          .from("trip_proposals")
          .select(
            "id, proposer_id, proposer_role, headline, message, price_from, status, created_at"
          )
          .eq("trip_request_id", id)
          .order("created_at", { ascending: false });

        if (!proposalsError && proposalsData) {
          setProposals((proposalsData ?? []) as TripProposal[]);
        }

        // Optional: notify traveler
        try {
          await supabase.functions.invoke("notify-trip-proposal", {
            body: { tripRequestId: id },
          });
        } catch (notifyError) {
          console.error("Error invoking notify-trip-proposal:", notifyError);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error while sending your proposal.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm">
          Loading trip request…
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm">
          Trip request not found or no longer available.
        </div>
      </main>
    );
  }

  const travelers =
    (trip.travelers_adults || 0) + (trip.travelers_children || 0);
  const budget =
    trip.budget_max || trip.budget_min
      ? `$${trip.budget_min || ""}–$${trip.budget_max || ""} pp`
      : "Budget not specified";

  return (
    <>
      <Helmet>
        <title>Trip Request · Goldsainte</title>
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6]">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-12">
          <div className="grid gap-6 md:grid-cols-[1.5fr,1.1fr] md:items-start">
            {/* LEFT: Trip brief (same for traveler & responders) */}
            <section className="rounded-3xl border border-[#BFAD72]/40 bg-[#f6f3ea]/95 p-5 shadow-xl md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47]/10 px-3 py-1 text-[11px] font-medium text-[#0c4d47]">
                  <Sparkles className="h-3 w-3 text-[#BFAD72]" />
                  <span>Trip request from Goldsainte traveler</span>
                </div>
                <span className="text-[10px] text-[#8D8D8D]">
                  Posted {new Date(trip.created_at).toLocaleDateString()}
                </span>
              </div>

              <h1 className="mt-3 text-lg font-semibold tracking-tight text-[#0a2225] md:text-xl">
                {trip.title ||
                  `Trip to ${trip.destination || "somewhere special"}`}
              </h1>

              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#4a4a4a]">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[#E5DFC6]">
                  <MapPin className="h-3 w-3 text-[#8D8D8D]" />
                  {trip.destination || "Destination TBD"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[#E5DFC6]">
                  <Users className="h-3 w-3 text-[#8D8D8D]" />
                  {travelers || "Unknown"} travelers
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[#E5DFC6]">
                  <Calendar className="h-3 w-3 text-[#8D8D8D]" />
                  {trip.start_date && trip.end_date
                    ? `${trip.start_date} → ${trip.end_date}`
                    : "Dates flexible / not set"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[#E5DFC6]">
                  <HandCoins className="h-3 w-3 text-[#8D8D8D]" />
                  {budget}
                </span>
              </div>

              {trip.trip_style && trip.trip_style.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-[#4a4a4a]">
                  {trip.trip_style.map((style) => (
                    <span
                      key={style}
                      className="rounded-full bg-[#E5DFC6] px-2 py-0.5"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              )}

              {trip.tiktok_link && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] text-[#0c4d47] ring-1 ring-[#BFAD72]/60">
                  <Link2 className="h-3 w-3 text-[#BFAD72]" />
                  <a
                    href={trip.tiktok_link}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-[#BFAD72]"
                  >
                    View the TikTok / Reel that inspired this trip
                  </a>
                </div>
              )}

              <div className="mt-4 rounded-2xl bg-white/80 p-3 text-xs text-[#4a4a4a]">
                <p className="text-[11px] font-medium text-[#0a2225]">
                  Traveler's brief
                </p>
                <p className="mt-1 whitespace-pre-line">
                  {trip.description ||
                    "No detailed description provided for this trip."}
                </p>
              </div>
            </section>

            {/* RIGHT: either proposals list (traveler) or proposal form (creator/agent) */}
            {isOwner ? (
              <OwnerProposalsPanel proposals={proposals} />
            ) : (
              <ResponderProposalForm
                submitting={submitting}
                error={error}
                success={success}
                proposal={proposal}
                onChange={updateProposal}
                onSubmit={handleSubmitProposal}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function OwnerProposalsPanel({ proposals }: { proposals: TripProposal[] }) {
  return (
    <section className="rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225]/95 p-5 text-xs text-[#E5DFC6] shadow-xl md:p-6">
      <h2 className="text-sm font-semibold tracking-tight text-[#E5DFC6]">
        Proposals received
      </h2>
      <p className="mt-1 text-[11px] text-[#E5DFC6]/80">
        These are proposals from creators and agents who'd like to design and
        book this trip for you. Compare them, then follow up with your
        favorites.
      </p>

      {proposals.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-black/30 px-3 py-4 text-[11px] text-[#E5DFC6]/80">
          No proposals yet. We'll notify you as soon as someone responds to
          this trip.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {proposals.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl bg-black/30 px-3 py-3 text-[11px] text-[#E5DFC6] ring-1 ring-[#BFAD72]/30"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-[10px]">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#BFAD72]/90 text-[#0a2225]">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {p.proposer_role === "creator"
                        ? "TikTok creator"
                        : "Travel agent"}
                    </p>
                    <p className="text-[#E5DFC6]/70">
                      Sent{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>

              {p.headline && (
                <p className="mt-2 text-[11px] font-medium">
                  {p.headline}
                </p>
              )}

              {p.message && (
                <p className="mt-1 whitespace-pre-line text-[11px] text-[#E5DFC6]/85">
                  {p.message}
                </p>
              )}

              {p.price_from !== null && (
                <p className="mt-2 text-[10px] text-[#E5DFC6]/80">
                  Estimated starting price:{" "}
                  <span className="font-semibold">
                    ${p.price_from} per person
                  </span>
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="mt-3 text-[10px] text-[#E5DFC6]/70">
        When you've found the right partner, you can continue the conversation
        and finalize dates, budget, and exact itinerary together.
      </p>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium";

  if (status === "accepted") {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-800`}>
        Accepted
      </span>
    );
  }
  if (status === "declined") {
    return (
      <span className={`${base} bg-red-50 text-red-700`}>
        Declined
      </span>
    );
  }
  if (status === "withdrawn") {
    return (
      <span className={`${base} bg-[#8D8D8D]/10 text-[#8D8D8D]`}>
        Withdrawn
      </span>
    );
  }
  return (
    <span className={`${base} bg-[#BFAD72]/15 text-[#BFAD72]`}>
      Sent
    </span>
  );
}

type ResponderFormProps = {
  submitting: boolean;
  error: string | null;
  success: boolean;
  proposal: ProposalForm;
  onChange: <K extends keyof ProposalForm>(
    key: K,
    value: ProposalForm[K]
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
};

function ResponderProposalForm({
  submitting,
  error,
  success,
  proposal,
  onChange,
  onSubmit,
}: ResponderFormProps) {
  return (
    <section className="rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225]/95 p-5 text-xs text-[#E5DFC6] shadow-xl md:p-6">
      <h2 className="text-sm font-semibold tracking-tight text-[#E5DFC6]">
        Send your proposal
      </h2>
      <p className="mt-1 text-[11px] text-[#E5DFC6]/80">
        Introduce yourself, outline your concept, and give a baseline price.
        The traveler will see this alongside proposals from other creators
        and agents.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        {/* Role */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#E5DFC6]">
            I'm responding as a…
          </label>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => onChange("proposerRole", "creator")}
              className={`rounded-full px-3 py-1.5 ${
                proposal.proposerRole === "creator"
                  ? "bg-[#BFAD72] text-[#0a2225]"
                  : "bg-black/30 text-[#E5DFC6]"
              }`}
            >
              TikTok creator
            </button>
            <button
              type="button"
              onClick={() => onChange("proposerRole", "agent")}
              className={`rounded-full px-3 py-1.5 ${
                proposal.proposerRole === "agent"
                  ? "bg-[#BFAD72] text-[#0a2225]"
                  : "bg-black/30 text-[#E5DFC6]"
              }`}
            >
              Travel agent
            </button>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#E5DFC6]">
            Proposal headline
          </label>
          <Input
            value={proposal.headline}
            onChange={(e) => onChange("headline", e.target.value)}
            placeholder="'Design-forward Santorini escape with two signature experiences'"
            className="rounded-xl border border-[#BFAD72]/40 bg-[#0a2225] text-xs text-[#E5DFC6] placeholder:text-[#E5DFC6]/60"
          />
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#E5DFC6]">
            Message to traveler
          </label>
          <Textarea
            required
            rows={5}
            value={proposal.message}
            onChange={(e) => onChange("message", e.target.value)}
            placeholder="Share who you are, why you're a great fit for this trip, and a high-level sketch of the itinerary you'd design."
            className="rounded-xl border border-[#BFAD72]/40 bg-[#0a2225] text-xs text-[#E5DFC6] placeholder:text-[#E5DFC6]/60"
          />
        </div>

        {/* Baseline price */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#E5DFC6]">
            Estimated starting price (per person)
          </label>
          <Input
            type="number"
            min={0}
            value={proposal.priceFrom}
            onChange={(e) => onChange("priceFrom", e.target.value)}
            placeholder="e.g., 3800"
            className="rounded-xl border border-[#BFAD72]/40 bg-[#0a2225] text-xs text-[#E5DFC6] placeholder:text-[#E5DFC6]/60"
          />
          <p className="text-[10px] text-[#E5DFC6]/70">
            This doesn't lock you in—it just helps the traveler compare options.
            You can refine pricing together later.
          </p>
        </div>

        {/* Errors & success */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            Proposal sent. The traveler will see your pitch in their Goldsainte
            account. We'll notify them as responses arrive.
          </div>
        )}

        <div className="pt-1">
          <Button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#BFAD72] px-4 py-2.5 text-sm font-semibold text-[#0a2225] shadow-sm hover:bg-[#d4c58d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {submitting
              ? "Sending proposal…"
              : "Send proposal to this traveler"}
          </Button>
        </div>
      </form>
    </section>
  );
}
