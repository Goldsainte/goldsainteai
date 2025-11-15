import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Users, Link2, Loader2 } from "lucide-react";

type TripForm = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  flexibleDates: boolean;
  adults: string;
  children: string;
  budgetMin: string;
  budgetMax: string;
  tripStyle: string;
  description: string;
  tiktokLink: string;
};

const EMPTY_FORM: TripForm = {
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  flexibleDates: false,
  adults: "2",
  children: "0",
  budgetMin: "",
  budgetMax: "",
  tripStyle: "",
  description: "",
  tiktokLink: "",
};

export default function RequestTrip() {
  const navigate = useNavigate();

  const [form, setForm] = useState<TripForm>(EMPTY_FORM);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Ensure user is logged in
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (error || !data.user) {
        navigate("/login?redirect=/marketplace/request-trip", { replace: true });
        return;
      }

      setLoadingUser(false);
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  function updateField<K extends keyof TripForm>(key: K, value: TripForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessId(null);
    setSubmitting(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("Please log in to post a trip.");
        setSubmitting(false);
        return;
      }

      // Clean up numeric values
      const adults = parseInt(form.adults || "0", 10) || 0;
      const children = parseInt(form.children || "0", 10) || 0;
      const minBudget = parseInt(form.budgetMin || "0", 10) || null;
      const maxBudget = parseInt(form.budgetMax || "0", 10) || null;

      const tripStyleArray = form.tripStyle
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // 1) Insert trip request
      const { data: inserted, error: insertError } = await supabase
        .from("trip_requests")
        .insert({
          user_id: userData.user.id,
          title: form.title || null,
          destination: form.destination || null,
          start_date: form.startDate || null,
          end_date: form.endDate || null,
          flexible_dates: form.flexibleDates,
          travelers_adults: adults,
          travelers_children: children,
          budget_min: minBudget,
          budget_max: maxBudget,
          trip_style: tripStyleArray,
          description: form.description || null,
          tiktok_link: form.tiktokLink || null,
          status: "open",
        })
        .select("id")
        .maybeSingle();

      if (insertError || !inserted) {
        console.error(insertError);
        setError(
          "Something went wrong while posting your trip. Please try again."
        );
        setSubmitting(false);
        return;
      }

      const tripRequestId = inserted.id as string;
      setSuccessId(tripRequestId);

      // 2) Optionally call AI matching function in the background
      try {
        await supabase.functions.invoke("match-trip-request", {
          body: { tripRequestId },
        });
      } catch (matchError) {
        console.error("Error invoking match-trip-request:", matchError);
      }

      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while posting your trip.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm">
          Checking your account…
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Post a Trip · Goldsainte</title>
        <meta
          name="description"
          content="Post your dream trip to the Goldsainte marketplace and let AI match you with the right creators and certified travel agents."
        />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6] text-[#0a2225]">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-12">
          <div className="rounded-3xl border border-[#BFAD72]/40 bg-[#f6f3ea]/95 p-5 shadow-xl md:p-7">
            {/* Header */}
            <header className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47]/10 px-3 py-1 text-[11px] font-medium text-[#0c4d47]">
                <Sparkles className="h-3 w-3 text-[#BFAD72]" />
                <span>Post a Trip · AI matching included</span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">
                Tell us about your dream trip—Goldsainte does the rest.
              </h1>
              <p className="text-xs text-[#4a4a4a] md:text-sm">
                Share your destination, dates, and budget. We'll match your
                request with TikTok travel creators and certified agents whose
                style fits your brief.
              </p>
            </header>

            {/* Example brief */}
            <aside className="mt-4 rounded-2xl bg-white/70 p-3 text-[11px] text-[#4a4a4a] ring-1 ring-[#E5DFC6]">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8D8D8D]">
                Example brief
              </p>
              <p className="mt-1 text-xs leading-relaxed">
                "We're a couple looking for a 6–7 night trip in late September,
                somewhere in Europe. We love design hotels, wine, and one or two
                'wow' experiences. Budget around $4,000 per person."
              </p>
            </aside>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              {/* Title + destination */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#0a2225]">
                    Trip name (optional)
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Summer in Santorini, Kyoto Slow Travel, etc."
                    className="rounded-xl border border-[#E5DFC6] bg-white text-xs text-[#0a2225] placeholder:text-[#8D8D8D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#0a2225]">
                    Destination
                  </label>
                  <Input
                    required
                    value={form.destination}
                    onChange={(e) => updateField("destination", e.target.value)}
                    placeholder="City, region, or country"
                    className="rounded-xl border border-[#E5DFC6] bg-white text-xs text-[#0a2225] placeholder:text-[#8D8D8D]"
                  />
                </div>
              </div>

              {/* Dates & flexibility */}
              <div className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#0a2225]">
                    Check-in
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-[#8D8D8D]" />
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => updateField("startDate", e.target.value)}
                      className="w-full rounded-xl border border-[#E5DFC6] bg-white pl-9 text-xs text-[#0a2225]"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#0a2225]">
                    Check-out
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-[#8D8D8D]" />
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateField("endDate", e.target.value)}
                      className="w-full rounded-xl border border-[#E5DFC6] bg-white pl-9 text-xs text-[#0a2225]"
                    />
                  </div>
                </div>
                <label className="mt-5 inline-flex items-center gap-2 text-[11px] text-[#4a4a4a]">
                  <input
                    type="checkbox"
                    checked={form.flexibleDates}
                    onChange={(e) =>
                      updateField("flexibleDates", e.target.checked)
                    }
                    className="h-3.5 w-3.5 rounded border border-[#8D8D8D]"
                  />
                  <span>My dates are flexible</span>
                </label>
              </div>

              {/* Travelers & budget */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-[#0a2225]">
                    Travelers
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#4a4a4a]">Adults</span>
                      <div className="relative flex items-center">
                        <Users className="pointer-events-none absolute left-3 h-4 w-4 text-[#8D8D8D]" />
                        <Input
                          type="number"
                          min={1}
                          value={form.adults}
                          onChange={(e) => updateField("adults", e.target.value)}
                          className="w-full rounded-xl border border-[#E5DFC6] bg-white pl-9 text-xs text-[#0a2225]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#4a4a4a]">
                        Children
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={form.children}
                        onChange={(e) => updateField("children", e.target.value)}
                        className="w-full rounded-xl border border-[#E5DFC6] bg-white text-xs text-[#0a2225]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-[#0a2225]">
                    Budget (per person)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#4a4a4a]">
                        Min (optional)
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={form.budgetMin}
                        onChange={(e) => updateField("budgetMin", e.target.value)}
                        placeholder="2500"
                        className="w-full rounded-xl border border-[#E5DFC6] bg-white text-xs text-[#0a2225] placeholder:text-[#8D8D8D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#4a4a4a]">Max</span>
                      <Input
                        type="number"
                        min={0}
                        required
                        value={form.budgetMax}
                        onChange={(e) => updateField("budgetMax", e.target.value)}
                        placeholder="4000"
                        className="w-full rounded-xl border border-[#E5DFC6] bg-white text-xs text-[#0a2225] placeholder:text-[#8D8D8D]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip style + TikTok link */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#0a2225]">
                  Trip style (comma separated)
                </label>
                <Input
                  value={form.tripStyle}
                  onChange={(e) => updateField("tripStyle", e.target.value)}
                  placeholder="Honeymoon, design hotels, wine, food, wellness…"
                  className="rounded-xl border border-[#E5DFC6] bg-white text-xs text-[#0a2225] placeholder:text-[#8D8D8D]"
                />
                <p className="text-[10px] text-[#8D8D8D]">
                  We use this along with your description to match you with the
                  right creators and agents.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#0a2225] flex items-center gap-1">
                  TikTok or social link (optional)
                  <Link2 className="h-3 w-3 text-[#8D8D8D]" />
                </label>
                <Input
                  value={form.tiktokLink}
                  onChange={(e) => updateField("tiktokLink", e.target.value)}
                  placeholder="Paste a TikTok or Reel that inspired this trip"
                  className="rounded-xl border border-[#E5DFC6] bg-white text-xs text-[#0a2225] placeholder:text-[#8D8D8D]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#0a2225]">
                  Tell us about your dream trip
                </label>
                <Textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="What does a perfect day look like on this trip? Any must-sees, non-negotiables, or things you want to avoid?"
                  className="rounded-xl border border-[#E5DFC6] bg-white text-xs text-[#0a2225] placeholder:text-[#8D8D8D]"
                />
              </div>

              {/* Status messages */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                  {error}
                </div>
              )}

              {successId && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                  Your trip has been posted to the marketplace. Goldsainte AI is
                  matching you with creators and agents now. You'll see their
                  proposals in your account as they respond.
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#0c4d47] px-4 py-2.5 text-sm font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#0b3e3a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {submitting
                    ? "Posting your trip…"
                    : "Post this trip to Goldsainte"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
