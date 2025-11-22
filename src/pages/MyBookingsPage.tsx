// src/pages/MyBookingsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, HandCoins, Users, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type BookingRow = {
  id: string;
  status: string;
  total_price_cents: number | null;
  currency: string | null;
  commission_mode: string | null;
  created_at: string;
  agent_id: string | null;
  creator_id: string | null;
  trips: {
    id: string;
    title: string | null;
    destination: string | null;
    travelers_count: number | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate("/auth?returnTo=/my-bookings", { replace: true });
        return;
      }

      setViewerId(user.id);

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          total_price_cents,
          currency,
          commission_mode,
          created_at,
          agent_id,
          creator_id,
          trips:trip_id (
            id,
            title,
            destination,
            travelers_count,
            start_date,
            end_date
          )
        `
        )
        .eq("traveler_id", user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading bookings:", error);
        setBookings([]);
      } else {
        setBookings((data ?? []).map((b: any) => ({
          ...b,
          total_price_cents: b.total_amount ? b.total_amount * 100 : 0
        })) as BookingRow[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>My Booked Trips · Goldsainte</title>
      </Helmet>

      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <header className="space-y-2">
            <h1 className="text-lg font-semibold tracking-tight text-[#0a2225] md:text-xl">
              My Booked Trips
            </h1>
            <p className="text-xs text-[#4a4a4a] md:text-sm max-w-2xl">
              These are trips you've confirmed through Goldsainte with creators and travel agents.
            </p>
          </header>

          <section className="mt-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-24 rounded-3xl bg-[#0a2225]/60 animate-pulse"
                  />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5DFC6] bg-white/70 px-4 py-8 text-center text-xs text-[#4a4a4a]">
                You don't have any booked trips yet.
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <BookingRowCard key={b.id} booking={b} viewerId={viewerId} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

const formatCurrency = (value?: number | null, currency?: string | null) => {
  if (value == null) return "—";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
  });
  return formatter.format(value / 100);
};

function BookingRowCard({
  booking,
  viewerId,
}: {
  booking: BookingRow;
  viewerId: string | null;
}) {
  const trip = booking.trips;
  const travelers = trip?.travelers_count || 0;
  const amount = formatCurrency(booking.total_price_cents, booking.currency);
  const { toast } = useToast();
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<"agent" | "creator">(
    booking.agent_id ? "agent" : "creator"
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const canReview =
    booking.status === "completed" && (!!booking.agent_id || !!booking.creator_id);

  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white/95 p-4 text-xs text-[#0a2225] shadow-sm ring-1 ring-[#E5DFC6]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-[#8D8D8D]">
            Booked {new Date(booking.created_at).toLocaleDateString()}
          </p>
          <h2 className="mt-1 text-sm font-semibold">
            {trip?.title || trip?.destination || "Goldsainte trip"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {booking.commission_mode && (
            <span className="rounded-full bg-[#BFAD72]/15 px-3 py-1 text-[10px] font-medium text-[#8D6B2F]">
              {booking.commission_mode.replace("_", " ")}
            </span>
          )}
          <span className="rounded-full bg-[#0c4d47]/8 px-3 py-1 text-[10px] font-medium text-[#0c4d47]">
            {booking.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4a4a4a]">
        <div className="flex items-center gap-3">
          {trip?.destination && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#8D8D8D]" />
              {trip.destination}
            </span>
          )}
          {travelers > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3 text-[#8D8D8D]" />
              {travelers} travelers
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1">
          <HandCoins className="h-3 w-3 text-[#8D8D8D]" />
          {amount}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#0c4d47]">
        <Link
          to={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47]/10 px-3 py-1"
        >
          View booking record
        </Link>
        {canReview && (
          <button
            type="button"
            onClick={() => setShowReview((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full bg-[#BFAD72]/20 px-3 py-1 text-[#8D6B2F]"
          >
            <Star className="h-3 w-3" />
            {showReview ? "Close review" : "Review partners"}
          </button>
        )}
      </div>

      {showReview && viewerId && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!viewerId) return;
            if (reviewTarget === "agent" && !booking.agent_id) {
              toast({
                title: "No agent on this booking",
                description: "Switch the reviewer to the creator to continue.",
                variant: "destructive",
              });
              return;
            }
            if (reviewTarget === "creator" && !booking.creator_id) {
              toast({
                title: "No creator on this booking",
                description: "Switch the reviewer to the agent to continue.",
                variant: "destructive",
              });
              return;
            }

            setSubmittingReview(true);
            try {
              const payload: Record<string, any> = {
                booking_id: booking.id,
                reviewer_id: viewerId,
                rating,
                comment: comment.trim() || null,
                agent_id: reviewTarget === "agent" ? booking.agent_id : null,
                creator_id: reviewTarget === "creator" ? booking.creator_id : null,
              };

              const { data: { user: currentUser } } = await supabase.auth.getUser();
              if (!currentUser) throw new Error("Not authenticated");

              const { error } = await supabase.from("agent_reviews").insert({
                job_id: booking.id,
                agent_id: booking.id,
                rating: rating,
                review_text: comment || "",
                user_id: currentUser.id,
              });
              if (error) throw error;

              toast({
                title: "Review submitted",
                description: "Thanks for keeping Goldsainte partners accountable.",
              });
              setShowReview(false);
              setComment("");
              setRating(5);
            } catch (err) {
              console.error(err);
              toast({
                title: "Could not save review",
                description: "Please try again in a moment.",
                variant: "destructive",
              });
            } finally {
              setSubmittingReview(false);
            }
          }}
          className="space-y-2 rounded-2xl border border-dashed border-[#BFAD72]/40 bg-white/70 p-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[#0a2225]">
              Who are you reviewing?
            </label>
            <select
              value={reviewTarget}
              onChange={(e) => setReviewTarget(e.target.value as "agent" | "creator")}
              className="rounded-xl border border-[#BFAD72]/50 bg-white px-3 py-2 text-[11px]"
            >
              <option value="agent" disabled={!booking.agent_id}>
                Travel agent
              </option>
              <option value="creator" disabled={!booking.creator_id}>
                Creator / storyteller
              </option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-medium text-[#0a2225]">
              Rating
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-16 rounded-xl border border-[#BFAD72]/50 bg-white px-2 py-1 text-[11px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#0a2225]">
              Feedback (optional)
            </label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="rounded-xl border border-[#BFAD72]/50 bg-white text-[11px]"
              placeholder="Highlight what worked well and where the experience could improve."
            />
          </div>
          <button
            type="submit"
            disabled={submittingReview}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
          >
            {submittingReview ? "Sending review…" : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
}
