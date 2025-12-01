// src/pages/trips/PostTripPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrustSafetyModal } from "@/components/trust/TrustSafetyModal";
import { toast } from "sonner";
import { StoryboardBuilder } from "@/components/storyboards/StoryboardBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { useStoryboardPrefill } from "@/hooks/useStoryboardPrefill";
import { useItineraryPrefill } from "@/hooks/useItineraryPrefill";
import { Badge } from "@/components/ui/badge";

type BudgetLevel = "accessible" | "elevated" | "ultra_luxury";
type Pace = "slow" | "balanced" | "packed";
type WantsRole = "creator" | "agent" | "both";


export default function PostTripPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Support both ?fromStoryboard=X and ?from=storyboard&storyboardId=X patterns
  const storyboardIdFromQuery = 
    searchParams.get("fromStoryboard") || 
    (searchParams.get("from") === "storyboard" ? searchParams.get("storyboardId") : null);

  // Use storyboard prefill hook
  const { loading: loadingPrefill, prefill, sourceStoryboard, error: prefillError } = 
    useStoryboardPrefill();
  
  // Use itinerary prefill hook for AI collections
  const { hasItineraryPrefill, prefillData: itineraryPrefill } = useItineraryPrefill();

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
  const [aestheticTags, setAestheticTags] = useState<string[]>([]);
  const [flexibility, setFlexibility] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [wantsRole, setWantsRole] = useState<WantsRole>("both");

  const [showItineraryPreview, setShowItineraryPreview] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [storyboardId, setStoryboardId] = useState<string | null>(null);

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

  // Auto-populate from AI Collection prefill
  useEffect(() => {
    if (hasItineraryPrefill && itineraryPrefill) {
      setDestination(itineraryPrefill.destination);
      setTitle(itineraryPrefill.title);
      setStartsOn(itineraryPrefill.startsOn);
      setEndsOn(itineraryPrefill.endsOn);
      if (itineraryPrefill.budgetMin) setBudgetMin(String(itineraryPrefill.budgetMin));
      if (itineraryPrefill.budgetMax) setBudgetMax(String(itineraryPrefill.budgetMax));
      setBudgetLevel(itineraryPrefill.budgetLevel);
      if (itineraryPrefill.interests.length > 0) setInterests(itineraryPrefill.interests);
      if (itineraryPrefill.specialNotes) setSpecialNotes(itineraryPrefill.specialNotes);
      if (itineraryPrefill.vibes.length > 0) setAestheticTags(itineraryPrefill.vibes);
    }
  }, [hasItineraryPrefill, itineraryPrefill]);

  // Auto-populate form when storyboard prefill data loads
  useEffect(() => {
    if (prefill && !hasItineraryPrefill) {
      // Populate title from storyboard
      if (prefill.title && !title) {
        setTitle(prefill.title);
      }
      
      // Populate special notes with storyboard description
      if (prefill.description && !specialNotes) {
        setSpecialNotes(prefill.description);
      }
      
      // Extract aesthetic tags from storyboard description
      if (sourceStoryboard) {
        const tags = extractAestheticTags(
          [prefill.description, sourceStoryboard.description].filter(Boolean).join(" ")
        );
        if (tags.length > 0) {
          setAestheticTags(tags);
        }
      }
    }
  }, [prefill, sourceStoryboard, hasItineraryPrefill]);

  // Extract aesthetic keywords from text
  function extractAestheticTags(text: string): string[] {
    if (!text) return [];
    
    const aestheticKeywords = [
      "luxury", "boutique", "design", "romantic", "minimalist", "rustic",
      "modern", "vintage", "coastal", "urban", "bohemian", "elegant",
      "contemporary", "traditional", "chic", "intimate", "vibrant",
      "serene", "artistic", "authentic", "curated", "exclusive"
    ];
    
    const lowercaseText = text.toLowerCase();
    const found = aestheticKeywords.filter(keyword => 
      lowercaseText.includes(keyword)
    );
    
    return [...new Set(found)].slice(0, 5); // Max 5 unique tags
  }

  function removeAestheticTag(tag: string) {
    setAestheticTags(prev => prev.filter(t => t !== tag));
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!destination || !startsOn || !endsOn) {
      setError("Please fill in destination and dates.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (!user) {
        throw new Error("Please sign in before posting a trip.");
      }

      // Build source metadata if from AI collection
      const sourceMetadata = hasItineraryPrefill && itineraryPrefill ? {
        source_type: "ai_collection",
        collection_title: itineraryPrefill.title,
        collection_vibes: itineraryPrefill.vibes,
        ai_itinerary: itineraryPrefill.itinerary,
      } : undefined;

      const { error: insertError } = await supabase
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
          source_metadata: sourceMetadata,
        } as any)
        .select("id")
        .single();

      if (insertError) throw insertError;

      toast.success("Your trip has been posted. Creators and agents will respond here.");
      navigate("/my-trip-requests");
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
    <main className="flex-1 bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-6xl px-4 md:px-6 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#0a2225] transition"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
        </div>

        <div className="space-y-2 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-[#C7A962]">
            Post a trip
          </p>
          <h1 className="font-secondary text-2xl md:text-3xl text-[#0a2225] leading-tight">
            Tell us about the trip you&apos;re dreaming of
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            A few details now help Goldsainte AI and our partners send thoughtful proposals later. It&apos;s okay if not everything is decided — just share what you know.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 pb-16 md:pb-20">
        {/* AI Collection Prefill Banner */}
        {hasItineraryPrefill && itineraryPrefill && (
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-[#FDFBF5] to-[#F6F0E4] border border-[#C7A962]/30 px-4 py-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#C7A962] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0a2225]">
                  Pre-filled from AI Collection
                </p>
                <p className="text-xs text-[#4a4a4a] mt-0.5">
                  <span className="font-semibold">{itineraryPrefill.title}</span> — {itineraryPrefill.nights} nights in {itineraryPrefill.destination}
                </p>
                <p className="text-xs text-[#8C8470] mt-1">
                  Review and adjust any details before posting to the marketplace.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {storyboardIdFromQuery && loadingPrefill && (
          <div className="mb-3 rounded-2xl bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-2 text-xs text-[#4a4a4a]">
            Loading storyboard details...
          </div>
        )}
        {prefill && sourceStoryboard && !hasItineraryPrefill && (
          <div className="mb-3 rounded-2xl bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-2 text-xs text-[#4a4a4a]">
            Pre-filled from storyboard{" "}
            <span className="font-semibold">{sourceStoryboard.title || "Untitled"}</span>. 
            You can adjust any details before posting.
          </div>
        )}
        {prefillError && (
          <p className="mb-3 rounded-2xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {prefillError}
          </p>
        )}

        <form
          className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-6 space-y-5 text-sm"
          onSubmit={handleSubmit}
        >
          {/* Section 1: Where & when */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Where and when</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  Destination <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                  placeholder="Amalfi Coast, Paris & Provence, Bali..."
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  Start date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={startsOn}
                  onChange={(e) => setStartsOn(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  End date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={endsOn}
                  onChange={(e) => setEndsOn(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-xs text-[#4a4a4a]">
                Trip nickname (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                placeholder="Example: Amalfi anniversary escape"
              />
            </div>
          </div>

          {/* Section 2: Who & budget */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Who is traveling & budget</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  Adults
                </label>
                <input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  Children
                </label>
                <input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  Occasion (optional)
                </label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                  placeholder="Honeymoon, birthday, reset..."
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  Budget from (total)
                </label>
                <input
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                  placeholder="e.g. 7000"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  Budget to (total)
                </label>
                <input
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                  placeholder="e.g. 12000"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
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
                      className={`px-3 py-1 rounded-full border text-xs ${
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
            <h2 className="text-base font-semibold">Style & interests</h2>

            <div>
              <label className="block mb-1 text-xs text-[#4a4a4a]">
                Accommodation style (optional)
              </label>
              <input
                type="text"
                value={accommodationStyle}
                onChange={(e) => setAccommodationStyle(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72]"
                placeholder="Design hotels, villas, all-inclusive, etc."
              />
            </div>

            <div>
              <label className="block mb-1 text-xs text-[#4a4a4a]">
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
                    className={`px-3 py-1 rounded-full border text-xs ${
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
              <label className="block mb-1 text-xs text-[#4a4a4a]">
                What matters most on this trip?
              </label>
              <div className="flex flex-wrap gap-1">
                {interestOptions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleInterest(label)}
                    className={`px-3 py-1 rounded-full border text-xs ${
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

            {aestheticTags.length > 0 && (
              <div>
                <label className="block mb-1 text-xs text-[#4a4a4a]">
                  Aesthetic tags (from storyboard)
                </label>
                <div className="flex flex-wrap gap-1">
                  {aestheticTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#BFAD72] bg-[#FDFBF5] text-xs text-[#0a2225]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeAestheticTag(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-[#8C8470]">
                  These keywords were extracted from your storyboard
                </p>
              </div>
            )}
          </div>

          {/* Section 4: Flexibility & notes */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Flexibility & notes</h2>

            <div>
              <label className="block mb-1 text-xs text-[#4a4a4a]">
                How flexible are you? (optional)
              </label>
              <textarea
                value={flexibility}
                onChange={(e) => setFlexibility(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72] min-h-[70px]"
                placeholder="Example: Dates can move by a few days, happy to consider nearby towns if it improves value..."
              />
            </div>

            <div>
              <label className="block mb-1 text-xs text-[#4a4a4a]">
                Anything else you want your creator or agent to know? (optional)
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#BFAD72] min-h-[90px]"
                placeholder="Allergies, accessibility needs, non-negotiables, things you absolutely don't want..."
              />
            </div>
          </div>

          {/* AI Itinerary Preview (if from collection) */}
          {hasItineraryPrefill && itineraryPrefill && itineraryPrefill.itinerary.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowItineraryPreview(!showItineraryPreview)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C7A962]" />
                  AI-Generated Itinerary Preview
                </h2>
                {showItineraryPreview ? (
                  <ChevronUp className="h-4 w-4 text-[#8D8D8D]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#8D8D8D]" />
                )}
              </button>
              {showItineraryPreview && (
                <div className="space-y-2 rounded-2xl border border-[#E5DFC6] bg-[#FDFBF5] p-3">
                  <p className="text-[10px] text-[#8C8470] mb-2">
                    This itinerary will be shared with agents as a reference for your trip
                  </p>
                  {itineraryPrefill.itinerary.map((day) => (
                    <div key={day.dayNumber} className="flex gap-3 py-2 border-b border-[#E5DFC6] last:border-b-0">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0a2225] text-white text-[10px] font-medium flex-shrink-0">
                        {day.dayNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0a2225]">{day.title}</p>
                        <p className="text-[10px] text-[#4a4a4a] line-clamp-2">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 4.6: Visual Storyboard */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Build your visual storyboard</h2>
            <p className="text-xs text-[#4a4a4a]">
              Add photos, experiences, and links that capture what you're envisioning.
              This becomes the creative brief your agent or creator works from.
            </p>
            <StoryboardBuilder
              mode="traveler"
              initialTitle={title || destination}
              onSaved={(id) => setStoryboardId(id)}
            />
          </div>

          {/* Section 5: Who should respond */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Who would you like to respond?</h2>
            <p className="text-xs text-[#4a4a4a]">
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
                  className={`px-3 py-1 rounded-full border text-xs ${
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

          {/* Trust & Safety */}
          <div className="rounded-2xl border border-[#E5DFC6] bg-[#FDFBF5] p-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-[#8D8D8D]">Trust &amp; safety</p>
            <h3 className="text-sm font-semibold text-[#0a2225]">How Goldsainte keeps this safe</h3>
            <p className="text-xs text-[#4a4a4a]">
              Your trip brief is shared only with vetted creators and verified travel professionals. We keep all proposals, messages,
              and payments on-platform so there's a clear record of what was agreed and what was delivered.
            </p>
            <button
              type="button"
              onClick={() => setShowSafetyModal(true)}
              className="text-xs font-semibold text-[#0c4d47] underline-offset-4 hover:underline"
            >
              View safety guidelines
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs text-[#8D8D8D] max-w-2xl">
                After you post your trip, Goldsainte AI and our partners will use
                these details to send proposals. You&apos;ll see everything in
                your &quot;My Trips&quot; and notifications.
              </p>
              <p className="text-[10px] text-[#8D8D8D] mt-1">
                By posting, you agree to keep all booking and payment communication inside Goldsainte.
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-6 py-2.5 text-sm font-semibold hover:bg-[#073331] disabled:opacity-60 whitespace-nowrap flex-shrink-0"
            >
              {submitting ? "Posting..." : "Post this trip"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>

      <TrustSafetyModal
        open={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        context="trip"
      />
    </main>
  );
}
