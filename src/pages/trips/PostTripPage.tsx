// src/pages/trips/PostTripPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStoryboardForPrefill } from "@/services/storyboardsService";
import { TrustSafetyModal } from "@/components/trust/TrustSafetyModal";
import { toast } from "sonner";

type BudgetLevel = "accessible" | "elevated" | "ultra_luxury";
type Pace = "slow" | "balanced" | "packed";
type WantsRole = "creator" | "agent" | "both";

export default function PostTripPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromStoryboard = searchParams.get("fromStoryboard");

  const [destination, setDestination] = useState("");
  const [title, setTitle] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("elevated");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [occasion, setOccasion] = useState("");
  const [accommodationStyle, setAccommodationStyle] = useState("");
  const [pace, setPace] = useState<Pace>("balanced");
  const [interests, setInterests] = useState<string[]>([]);
  const [flexibility, setFlexibility] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [wantsRole, setWantsRole] = useState<WantsRole>("both");

  const [preFilledFrom, setPreFilledFrom] = useState<string | null>(null);
  const [preFillError, setPreFillError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const interestOptions = [
    "Food & wine",
    "Design hotels",
    "Adventure",
    "Wellness",
    "Nightlife",
    "Culture & museums",
    "Family-friendly",
    "Honeymoon / romance",
  ];

  // Prefill from storyboard if present
  useEffect(() => {
    let cancelled = false;

    async function prefillFromStoryboard(id: string) {
      try {
        const data = await getStoryboardForPrefill(id);
        if (cancelled || !data) return;

        setPreFilledFrom(data.title || "Storyboard");
        if (data.destination) setDestination((prev) => prev || data.destination!);
        if (data.title) setTitle((prev) => prev || data.title!);
        if (data.default_starts_on)
          setStartsOn((prev) => prev || data.default_starts_on!);
        if (data.default_ends_on)
          setEndsOn((prev) => prev || data.default_ends_on!);
        if (data.default_budget_min != null)
          setBudgetMin((prev) =>
            prev || String(Math.round(data.default_budget_min!))
          );
        if (data.default_budget_max != null)
          setBudgetMax((prev) =>
            prev || String(Math.round(data.default_budget_max!))
          );
        if (data.default_budget_level)
          setBudgetLevel(
            (data.default_budget_level as BudgetLevel) || "elevated"
          );
        if (data.default_pace)
          setPace((data.default_pace as Pace) || "balanced");
        if (data.default_interests && data.default_interests.length > 0)
          setInterests((prev) => (prev.length ? prev : data.default_interests!));
      } catch (err: any) {
        if (!cancelled)
          setPreFillError(
            err.message || "We couldn't prefill from this storyboard."
          );
      }
    }

    if (fromStoryboard) {
      prefillFromStoryboard(fromStoryboard);
    }

    return () => {
      cancelled = true;
    };
  }, [fromStoryboard]);

  function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault();
    
    // Basic validation before showing modal
    if (!destination || !startsOn || !endsOn) {
      setError("Please fill in destination and dates.");
      return;
    }
    
    setShowSafetyModal(true);
  }

  async function handleSubmitConfirmed() {
    setError(null);
    setSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Please sign in before posting a trip.");
      }

      const { error: insertError, data } = await supabase
        .from("trip_requests")
        .insert({
          user_id: user.id,
          title: title || null,
          destination,
          start_date: startsOn,
          end_date: endsOn,
          budget_min: budgetMin ? Number(budgetMin) : null,
          budget_max: budgetMax ? Number(budgetMax) : null,
          budget_level: budgetLevel,
          travelers_adults: adults ? Number(adults) : null,
          travelers_children: children ? Number(children) : null,
          occasion: occasion || null,
          accommodation_style: accommodationStyle || null,
          pace,
          interests: interests.length > 0 ? interests : null,
          flexibility: flexibility || null,
          special_notes: specialNotes || null,
          wants_role: wantsRole,
          status: "open",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      toast.success("Trip posted! Partners will start sending proposals.");
      navigate(`/my-trips`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong posting your trip.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
            Post a trip
          </p>
          <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
            Tell us about the trip you&apos;re dreaming of
          </h1>
          <p className="text-[11px] md:text-[12px] text-[#4a4a4a] max-w-lg">
            A few details now help Goldsainte AI and our partners send
            thoughtful proposals later. It&apos;s okay if not everything is
            decided — just share what you know.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 md:pb-20">
        {preFilledFrom && (
          <div className="mb-3 rounded-2xl bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-2 text-[10px] text-[#4a4a4a]">
            This form is pre-filled from the storyboard{" "}
            <span className="font-semibold">{preFilledFrom}</span>. You can
            adjust any detail before posting your trip.
          </div>
        )}
        {preFillError && (
          <p className="mb-2 text-[10px] text-red-600">
            {preFillError}
          </p>
        )}

        <form
          className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-5 text-[11px]"
          onSubmit={handleSubmitClick}
        >
          {/* Section 1: Where & when */}
          <div className="space-y-3">
            <h2 className="text-[12px] font-semibold">Where and when</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  Destination <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                  placeholder="Amalfi Coast, Paris & Provence, Bali..."
                />
              </div>
              <div>
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  Start date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={startsOn}
                  onChange={(e) => setStartsOn(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                />
              </div>
              <div>
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  End date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={endsOn}
                  onChange={(e) => setEndsOn(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                Trip nickname (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                placeholder="Example: Amalfi anniversary escape"
              />
            </div>
          </div>

          {/* Section 2: Who & budget */}
          <div className="space-y-3">
            <h2 className="text-[12px] font-semibold">Who is traveling & budget</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  Adults
                </label>
                <input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                />
              </div>
              <div>
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  Children
                </label>
                <input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                />
              </div>
              <div>
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  Occasion (optional)
                </label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                  placeholder="Honeymoon, birthday, reset..."
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  Budget from (total)
                </label>
                <input
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                  placeholder="e.g. 7000"
                />
              </div>
              <div>
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  Budget to (total)
                </label>
                <input
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                  placeholder="e.g. 12000"
                />
              </div>
              <div>
                <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                  Budget style
                </label>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["accessible", "Thoughtful"],
                      ["elevated", "Elevated"],
                      ["ultra_luxury", "Ultra-luxury"],
                    ] as [BudgetLevel, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBudgetLevel(value)}
                      className={`px-3 py-1 rounded-full border text-[10px] ${
                        budgetLevel === value
                          ? "bg-[#0c4d47] border-[#0c4d47] text-[#E5DFC6]"
                          : "bg-[#f7f3ea] border-[#E5DFC6] text-[#4a4a4a]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Style & interests */}
          <div className="space-y-3">
            <h2 className="text-[12px] font-semibold">Style & interests</h2>

            <div>
              <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                Accommodation style (optional)
              </label>
              <input
                type="text"
                value={accommodationStyle}
                onChange={(e) => setAccommodationStyle(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72]"
                placeholder="Design hotels, villas, all-inclusive, etc."
              />
            </div>

            <div>
              <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                Trip pace
              </label>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ["slow", "Slow: lots of downtime"],
                    ["balanced", "Balanced"],
                    ["packed", "Packed: see everything"],
                  ] as [Pace, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPace(value)}
                    className={`px-3 py-1 rounded-full border text-[10px] ${
                      pace === value
                        ? "bg-[#0c4d47] border-[#0c4d47] text-[#E5DFC6]"
                        : "bg-[#f7f3ea] border-[#E5DFC6] text-[#4a4a4a]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                What matters most on this trip?
              </label>
              <div className="flex flex-wrap gap-1">
                {interestOptions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleInterest(label)}
                    className={`px-3 py-1 rounded-full border text-[10px] ${
                      interests.includes(label)
                        ? "bg-[#0c4d47] border-[#0c4d47] text-[#E5DFC6]"
                        : "bg-[#f7f3ea] border-[#E5DFC6] text-[#4a4a4a]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Flexibility & notes */}
          <div className="space-y-3">
            <h2 className="text-[12px] font-semibold">Flexibility & notes</h2>

            <div>
              <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                How flexible are you? (optional)
              </label>
              <textarea
                value={flexibility}
                onChange={(e) => setFlexibility(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72] min-h-[70px]"
                placeholder="Example: Dates can move by a few days, happy to consider nearby towns if it improves value..."
              />
            </div>

            <div>
              <label className="block mb-1 text-[10px] text-[#4a4a4a]">
                Anything else you want your creator or agent to know? (optional)
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none focus:border-[#BFAD72] min-h-[90px]"
                placeholder="Allergies, accessibility needs, non-negotiables, things you absolutely don't want..."
              />
            </div>
          </div>

          {/* Section 5: Who should respond */}
          <div className="space-y-3">
            <h2 className="text-[12px] font-semibold">Who would you like to respond?</h2>
            <p className="text-[10px] text-[#4a4a4a]">
              Goldsainte works with TikTok creators who inspire trips and
              certified travel agents who price and manage them. You can choose
              who you&apos;d like to hear from.
            </p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["creator", "Creators only"],
                  ["agent", "Travel agents only"],
                  ["both", "Creators & agents"],
                ] as [WantsRole, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWantsRole(value)}
                  className={`px-3 py-1 rounded-full border text-[10px] ${
                    wantsRole === value
                      ? "bg-[#0c4d47] border-[#0c4d47] text-[#E5DFC6]"
                      : "bg-[#f7f3ea] border-[#E5DFC6] text-[#4a4a4a]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[10px] text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-[9px] text-[#8D8D8D] max-w-xs">
              After you post your trip, Goldsainte AI and our partners will use
              these details to send proposals. You&apos;ll see everything in
              your &quot;My Trips&quot; and notifications.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-5 py-2 text-[11px] font-semibold hover:bg-[#073331] disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post this trip"}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </form>
      </section>

      <TrustSafetyModal
        open={showSafetyModal}
        onOpenChange={setShowSafetyModal}
        context="trip_posting"
        onConfirm={handleSubmitConfirmed}
        onCancel={() => setShowSafetyModal(false)}
      />
    </main>
  );
}
