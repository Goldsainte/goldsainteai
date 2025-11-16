// src/pages/PostTripPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { createTrip } from "@/services/tripService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStoryboardPrefill } from "@/hooks/useStoryboardPrefill";

export default function PostTripPage() {
  const navigate = useNavigate();
  const { storyboardId, loading: prefillLoading, prefill, sourceStoryboard, error: prefillError } =
    useStoryboardPrefill();

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelersCount, setTravelersCount] = useState<number | undefined>();
  const [budgetRange, setBudgetRange] = useState("");
  const [occasion, setOccasion] = useState("");
  const [travelerType, setTravelerType] = useState("");
  const [travelStyle, setTravelStyle] = useState<string[]>([]);
  const [pace, setPace] = useState("");
  const [mustHaves, setMustHaves] = useState("");
  const [hardNos, setHardNos] = useState("");
  const [tiktokLinks, setTiktokLinks] = useState("");
  const [contentGoals, setContentGoals] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply prefill when it first arrives (only if fields are empty)
  useEffect(() => {
    if (!prefill) return;

    setTitle((prev) => (prev ? prev : prefill.title));
    setDestination((prev) => (prev ? prev : prefill.destination));
    setDescription((prev) =>
      prev ? prev : [prefill.summary, prefill.notesForPartners].filter(Boolean).join("\n\n")
    );
  }, [prefill]);

  const isFromStoryboard = Boolean(storyboardId && prefill);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in before posting a trip.");
        setLoading(false);
        return;
      }

      const trip = await createTrip({
        title: title || "Untitled trip",
        destination,
        description,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        travelers_count: travelersCount,
        budget_range: budgetRange,
      });

      // Redirect to My Trips or the trip detail page
      navigate("/my-trips");
    } catch (err: any) {
      setError(err.message || "Something went wrong while posting the trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-4xl px-4 pt-10 pb-4 md:pt-14 md:pb-6">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] border border-[#BFAD72]/40">
            <Sparkles className="h-3 w-3 text-[#BFAD72]" />
            <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
              Post a trip
            </span>
          </div>
          <h1 className="font-display text-[22px] md:text-[24px] leading-snug">
            Share the trip you want — we'll match you with a creative team.
          </h1>
          <p className="text-[11px] text-[#4a4a4a] max-w-xl">
            Tell us as much or as little as you know. Goldsainte uses this brief
            to match you with creators and travel agents who actually fit your
            style.
          </p>
        </header>

        {/* Storyboard prefill banner */}
        {prefillLoading && (
          <p className="mt-3 text-[11px] text-[#8D8D8D]">
            Loading storyboard details…
          </p>
        )}
        {prefillError && (
          <p className="mt-3 text-[11px] text-red-600">{prefillError}</p>
        )}
        {isFromStoryboard && sourceStoryboard && (
          <div className="mt-3 rounded-2xl bg-white/90 border border-[#E5DFC6] p-3 text-[11px] flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                Request this storyboard
              </p>
              <p className="text-[11px] text-[#0a2225]">
                We've pre-filled your brief from{" "}
                <span className="font-semibold">
                  {sourceStoryboard.title || sourceStoryboard.destination || "a Goldsainte storyboard"}
                </span>
                . You can edit anything before sending.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/storyboards/${sourceStoryboard.id}`)}
              className="inline-flex items-center gap-1 text-[10px] text-[#0c4d47] underline whitespace-nowrap"
            >
              View storyboard
            </button>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-14 md:pb-20">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-6 space-y-4 text-[11px]"
        >

          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="font-semibold">Trip title</span>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none"
                placeholder="4 nights in Positano – like this storyboard but with our dates"
              />
            </label>

            <label className="block space-y-1">
              <span>Destination</span>
              <Input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none"
                placeholder="Positano, Amalfi Coast"
              />
            </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1">Start date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background/60 border-border"
              />
            </div>
            <div>
              <label className="block mb-1">End date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background/60 border-border"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Number of travelers</label>
            <Input
              type="number"
              min={1}
              value={travelersCount ?? ""}
              onChange={(e) =>
                setTravelersCount(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="2"
              className="bg-background/60 border-border"
            />
          </div>

          <div>
            <label className="block mb-1">Budget range</label>
            <Input
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              placeholder="$5,000 - $7,500"
              className="bg-background/60 border-border"
            />
          </div>

            <label className="block space-y-1">
              <span>Trip details & non-negotiables</span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none"
                placeholder={`Tell us about the dates, budget, and what matters most.\n\nYou can paste links to TikToks or Pins for inspiration.`}
              />
              {isFromStoryboard && (
                <p className="text-[10px] text-[#8D8D8D]">
                  We've added details from the storyboard — feel free to edit
                  anything that doesn't fit your trip.
                </p>
              )}
            </label>
          </div>

          {error && (
            <p className="text-[11px] text-destructive-foreground bg-destructive/10 border border-destructive/40 rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="pt-2 border-t border-[#E5DFC6] flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-2 text-[11px] font-semibold hover:bg-[#073331] disabled:opacity-50"
            >
              {loading ? "Posting your trip..." : "Submit trip brief"}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
