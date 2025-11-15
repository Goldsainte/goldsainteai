// src/pages/PostTripPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip } from "@/services/tripService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PostTripPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelersCount, setTravelersCount] = useState<number | undefined>();
  const [budgetRange, setBudgetRange] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="min-h-screen bg-background text-foreground flex justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-card rounded-3xl border border-border p-6 space-y-4">
        <h1 className="text-lg font-semibold">Post a Trip</h1>
        <p className="text-xs text-muted-foreground">
          Tell Goldsainte and our TikTok travel partners what kind of experience you're dreaming of.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block mb-1">Trip title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Long weekend in Paris"
              className="bg-background/60 border-border"
            />
          </div>

          <div>
            <label className="block mb-1">Destination</label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Paris, France"
              className="bg-background/60 border-border"
            />
          </div>

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

          <div>
            <label className="block mb-1">Tell us about your dream trip</label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="TikTok inspo, vibes, hotel preferences, must-have experiences..."
              className="bg-background/60 border-border"
            />
          </div>

          {error && (
            <p className="text-[11px] text-destructive-foreground bg-destructive/10 border border-destructive/40 rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full"
          >
            {loading ? "Posting your trip..." : "Post trip to Goldsainte"}
          </Button>
        </form>
      </div>
    </main>
  );
}
