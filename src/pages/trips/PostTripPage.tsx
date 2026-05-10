// src/pages/trips/PostTripPage.tsx
import {
  DestinationVignette,
  TravelersVignette,
  StyleVignette,
  PricingVignette,
  ReviewVignette,
} from "@/components/trips/StepVignettes";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, X, Sparkles, ChevronDown, ChevronUp, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrustSafetyModal } from "@/components/trust/TrustSafetyModal";
import { toast } from "sonner";
import { StoryboardBuilder } from "@/components/storyboards/StoryboardBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { useItineraryPrefill } from "@/hooks/useItineraryPrefill";
import { cn } from "@/lib/utils";

type BudgetLevel = "accessible" | "elevated" | "ultra_luxury";
type Pace = "slow" | "balanced" | "packed";
type WantsRole = "creator" | "agent" | "both";

const TOTAL_STEPS = 6;

const stepMeta = [
  { title: "Where are you dreaming of?", subtitle: "Start with the destination and dates — we'll handle the rest." },
  { title: "Who's coming along?", subtitle: "A few details help us match you with the right planners." },
  { title: "Set the mood", subtitle: "What kind of experience are you after?" },
  { title: "Build your visual brief", subtitle: "This is what creators and agents see when they receive your trip — add photos, links, and inspiration." },
  { title: "Anything else?", subtitle: "The little things that make a trip yours." },
  { title: "Review & post", subtitle: "Take a final look before we share your brief." },
];

export default function PostTripPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // Determine if we should skip the intro (prefill flows)
  const hasPrefillParams = !!(
    searchParams.get("fromStoryboard") ||
    searchParams.get("fromCreator") ||
    searchParams.get("agentId") ||
    searchParams.get("from")
  );
  const [showIntro, setShowIntro] = useState(!hasPrefillParams);

  const storyboardIdFromQuery =
    searchParams.get("fromStoryboard") ||
    (searchParams.get("from") === "storyboard" ? searchParams.get("storyboardId") : null);

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
  const [departureCity, setDepartureCity] = useState("");
  const [wantsRole, setWantsRole] = useState<WantsRole>("both");
  const [showItineraryPreview, setShowItineraryPreview] = useState(false);
  // showStoryboardBuilder removed — storyboard is now a dedicated step

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [storyboardId, setStoryboardId] = useState<string | null>(null);
  const storyboardSaveRef = useRef<(() => Promise<void>) | null>(null);

  // Direct-request: read fromCreator / agentId from URL or sessionStorage
  const [preferredCreatorId, setPreferredCreatorId] = useState<string | null>(null);
  const [preferredAgentId, setPreferredAgentId] = useState<string | null>(null);
  const [preferredName, setPreferredName] = useState<string | null>(null);

  useEffect(() => {
    const fromCreator = searchParams.get("fromCreator") || sessionStorage.getItem("goldsainte:fromCreator");
    const agentId = searchParams.get("agentId") || sessionStorage.getItem("goldsainte:agentId");
    if (fromCreator) {
      setPreferredCreatorId(fromCreator);
      setWantsRole("creator");
      sessionStorage.setItem("goldsainte:fromCreator", fromCreator);
      supabase.from("profiles").select("display_name").eq("id", fromCreator).maybeSingle().then(({ data }) => {
        if (data?.display_name) setPreferredName(data.display_name);
      });
    } else if (agentId) {
      setPreferredAgentId(agentId);
      setWantsRole("agent");
      sessionStorage.setItem("goldsainte:agentId", agentId);
      supabase.from("profiles").select("display_name").eq("id", agentId).maybeSingle().then(({ data }) => {
        if (data?.display_name) setPreferredName(data.display_name);
      });
    }
  }, [searchParams]);
  const storyboardAddItemRef = useRef<((item: any) => void) | null>(null);
  const interestOptions = [
    "Food & wine", "Design hotels", "Adventure", "Wellness",
    "Nightlife", "Culture & museums", "Family-friendly", "Honeymoon / romance",
  ];

  // Restore form state from sessionStorage after auth redirect
  useEffect(() => {
    const saved = sessionStorage.getItem('goldsainte:pendingTrip');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.destination) setDestination(data.destination);
        if (data.title) setTitle(data.title);
        if (data.startsOn) setStartsOn(data.startsOn);
        if (data.endsOn) setEndsOn(data.endsOn);
        if (data.budgetMin) setBudgetMin(data.budgetMin);
        if (data.budgetMax) setBudgetMax(data.budgetMax);
        if (data.budgetLevel) setBudgetLevel(data.budgetLevel);
        if (data.adults) setAdults(data.adults);
        if (data.children) setChildren(data.children);
        if (data.occasion) setOccasion(data.occasion);
        if (data.accommodationStyle) setAccommodationStyle(data.accommodationStyle);
        if (data.pace) setPace(data.pace);
        if (data.interests) setInterests(data.interests);
        if (data.aestheticTags) setAestheticTags(data.aestheticTags);
        if (data.flexibility) setFlexibility(data.flexibility);
        if (data.specialNotes) setSpecialNotes(data.specialNotes);
        if (data.departureCity) setDepartureCity(data.departureCity);
        if (data.wantsRole) setWantsRole(data.wantsRole);
        if (data.storyboardId) setStoryboardId(data.storyboardId);
        if (data.currentStep != null) setCurrentStep(data.currentStep);
      } catch (e) {
        console.error('Failed to restore pending trip data', e);
      }
      sessionStorage.removeItem('goldsainte:pendingTrip');
    }
  }, []);

  // After auth redirect, restore pending storyboard from sessionStorage into the database
  useEffect(() => {
    if (!user || storyboardId !== "pending-auth") return;

    const pendingRaw = sessionStorage.getItem('goldsainte:pendingStoryboard');
    if (!pendingRaw) return;

    (async () => {
      try {
        const pending = JSON.parse(pendingRaw);
        const sbTitle = pending.title || destination || "My storyboard";
        const sbMode = pending.mode || "traveler";
        const sbItems: any[] = pending.items || [];

        // Create storyboard record
        const { data: sb, error: sbError } = await supabase
          .from("storyboards")
          .insert({
            owner_id: user.id,
            role: sbMode,
            title: sbTitle,
          })
          .select("id")
          .single();

        if (sbError) throw sbError;

        // Insert all items
        if (sbItems.length > 0) {
          const rows = sbItems.map((item: any, index: number) => ({
            storyboard_id: sb.id,
            item_type: item.kind === "photo" ? "image" : item.kind,
            source_type: item.source,
            position: item.position ?? index,
            image_url: item.kind === "photo" ? (item.data?.full_url || item.data?.thumb_url) : null,
            title: item.data?.title || item.data?.alt || null,
            metadata: item.data,
          }));

          const { error: itemsError } = await supabase
            .from("storyboard_items")
            .insert(rows);

          if (itemsError) throw itemsError;
        }

        // Update state with real ID
        setStoryboardId(sb.id);
        sessionStorage.removeItem('goldsainte:pendingStoryboard');
      } catch (err) {
        console.error('[PostTripPage] Failed to restore pending storyboard:', err);
      }
    })();
  }, [user, storyboardId]);

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

  // Set storyboardId from query param so StoryboardBuilder loads existing items
  useEffect(() => {
    if (storyboardIdFromQuery && !storyboardId) {
      setStoryboardId(storyboardIdFromQuery);
    }
  }, [storyboardIdFromQuery]);

  function removeAestheticTag(tag: string) {
    setAestheticTags(prev => prev.filter(t => t !== tag));
  }

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }

  async function goNext() {
    if (currentStep === 0) {
      if (!destination || !departureCity || !startsOn || !endsOn || !title) {
        setError("Please fill in all fields.");
        return;
      }
    }
    if (currentStep === 1) {
      if (!adults || !occasion || !budgetMin || !budgetMax) {
        setError("Please fill in all fields.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!accommodationStyle || interests.length === 0) {
        setError("Please fill in all fields and select at least one interest.");
        return;
      }
    }
    if (currentStep === 4) {
      if (!flexibility || !specialNotes) {
        setError("Please fill in all fields.");
        return;
      }
    }
    setError(null);

    // Auto-save storyboard when leaving step 4 (index 3) if user hasn't saved yet
    if (currentStep === 3 && !storyboardId && storyboardSaveRef.current) {
      try {
        await storyboardSaveRef.current();
      } catch (err) {
        console.error('[PostTripPage] Auto-save storyboard failed:', err);
      }
    }

    if (currentStep < TOTAL_STEPS - 1) setCurrentStep(s => s + 1);
  }

  function goBack() {
    setError(null);
    if (currentStep > 0) setCurrentStep(s => s - 1);
    else navigate(-1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination || !departureCity || !startsOn || !endsOn || !title || !occasion || !budgetMin || !budgetMax || !accommodationStyle || interests.length === 0 || !flexibility || !specialNotes) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (!user) {
        // Save all form state so it survives the auth redirect
        sessionStorage.setItem('goldsainte:pendingTrip', JSON.stringify({
          destination, title, startsOn, endsOn, budgetMin, budgetMax,
          budgetLevel, adults, children, occasion, accommodationStyle,
          pace, interests, aestheticTags, flexibility, specialNotes,
          departureCity, wantsRole, storyboardId, currentStep,
        }));
        navigate(`/auth?returnTo=${encodeURIComponent('/post-trip')}`);
        return;
      }
      const sourceMetadata: Record<string, any> = hasItineraryPrefill && itineraryPrefill ? {
        source_type: "ai_collection",
        collection_title: itineraryPrefill.title,
        collection_vibes: itineraryPrefill.vibes,
        ai_itinerary: itineraryPrefill.itinerary,
      } : {};

      // Include storyboard reference in metadata
      if (storyboardId) {
        sourceMetadata.source_storyboard_id = storyboardId;
      }

      const insertPayload: any = {
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
          departure_city: departureCity || null,
          wants_role: wantsRole,
          status: "open",
          source_metadata: Object.keys(sourceMetadata).length > 0 ? sourceMetadata : null,
      };

      if (preferredCreatorId) insertPayload.preferred_creator_id = preferredCreatorId;
      if (preferredAgentId) insertPayload.preferred_agent_id = preferredAgentId;

      const { data: insertedTrip, error: insertError } = await supabase
        .from("trip_requests")
        .insert(insertPayload)
        .select("id")
        .single();
      if (insertError) throw insertError;

      // Link storyboard to the new trip request
      if (storyboardId && insertedTrip?.id) {
        await supabase
          .from("storyboards")
          .update({ trip_request_id: insertedTrip.id } as any)
          .eq("id", storyboardId);
      }

      // Send notification to preferred creator/agent
      const notifyUserId = preferredCreatorId || preferredAgentId;
      if (notifyUserId && insertedTrip?.id) {
        await supabase.from("notifications").insert({
          user_id: notifyUserId,
          type: "direct_trip_request",
          title: "New Direct Trip Request",
          message: `You received a direct trip request for ${destination}`,
          action_url: `/marketplace/request/${insertedTrip.id}`,
          entity_type: "trip_request",
          entity_id: insertedTrip.id,
          is_read: false,
        });
      }

      // Clean up sessionStorage for direct-request params
      sessionStorage.removeItem("goldsainte:fromCreator");
      sessionStorage.removeItem("goldsainte:agentId");

      toast.success(notifyUserId
        ? `Your trip has been sent directly to ${preferredName || "the selected planner"}.`
        : "Your trip has been posted. Creators and agents will respond here.");
      navigate("/my-trip-requests");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong posting your trip.");
    } finally {
      setSubmitting(false);
    }
  }

  // Pill button helper
  const Pill = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full border text-xs font-medium transition-colors",
        selected
          ? "bg-[#0c4d47] border-[#0c4d47] text-[#E5DFC6]"
          : "bg-[#f7f3ea] border-[#E5DFC6] text-[#4a4a4a] hover:border-[#BFAD72]"
      )}
    >
      {children}
    </button>
  );

  // Input helper
  const inputCls = "w-full rounded-xl border border-[#0c4d47] bg-[#f7f3ea] px-4 py-3 text-sm outline-none focus:border-[#BFAD72] transition-colors";

  // Budget & pace labels
  const budgetLabels: [BudgetLevel, string][] = [["accessible", "Thoughtful"], ["elevated", "Elevated"], ["ultra_luxury", "Ultra-luxury"]];
  const paceLabels: [Pace, string][] = [["slow", "Slow & leisurely"], ["balanced", "Balanced"], ["packed", "See everything"]];
  const roleLabels: [WantsRole, string][] = [["creator", "Creators only"], ["agent", "Travel agents only"], ["both", "Creators & agents"]];

  const introSteps = [
    { num: 1, title: "Choose your destination" },
    { num: 2, title: "Add traveler details" },
    { num: 3, title: "Set the style & pace" },
    { num: 4, title: "Create your storyboard" },
    { num: 5, title: "Set pricing & dates" },
    { num: 6, title: "Review & post" },
  ];

  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const stepVignettes: Record<number, React.ReactNode> = {
    1: <DestinationVignette />,
    2: <TravelersVignette />,
    3: <StyleVignette />,
    4: null,
    5: <PricingVignette />,
    6: <ReviewVignette />,
  };

  if (showIntro) {
    const fadeUp = (delayMs: number) => ({
      opacity: 0 as number,
      animation: `fade-up 0.6s ease-out ${delayMs}ms forwards`,
    });

    return (
      <div className="flex-1 bg-[#f7f3ea] text-[#0a2225] min-h-screen relative overflow-hidden">
        {/* Soft background shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(199,169,98,0.06) 0%, transparent 70%)',
            animation: 'shimmer-bg 8s ease-in-out infinite alternate',
          }}
        />
        <style>{`
          @keyframes shimmer-bg {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(5%, 3%) scale(1.05); }
          }
          @keyframes glow-cta {
            0%, 100% { box-shadow: 0 0 12px rgba(199,169,98,0.25); }
            50% { box-shadow: 0 0 24px rgba(199,169,98,0.45); }
          }
        `}</style>

        {/* Back button */}
        <div className="relative mx-auto max-w-4xl px-6 pt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0a2225] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Two-column layout */}
        <div className="relative mx-auto max-w-4xl px-6 pt-12 pb-20 flex flex-col md:flex-row gap-12 md:gap-20 items-center">
          {/* Left: Heading */}
          <div className="flex-1 md:sticky md:top-24">
            <h1
              className="font-secondary text-4xl md:text-5xl leading-tight text-[#0a2225]"
              style={fadeUp(0)}
            >
              Tell us about your dream trip.
            </h1>
            <p
              className="mt-4 text-base text-[#6B7280] leading-relaxed"
              style={fadeUp(200)}
            >
              Submit your idea to our marketplace and receive proposals from verified creators and travel agents.
            </p>
          </div>

          {/* Right: Steps list */}
          <div className="flex-1 w-full">
            <div className="space-y-0">
              {introSteps.map((step, idx) => (
                <div
                  key={step.num}
                  style={fadeUp(300 + idx * 100)}
                  onMouseEnter={() => setHoveredStep(step.num)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="group cursor-default"
                >
                  <div className="flex items-center gap-5 py-6">
                    <span className="font-secondary text-2xl text-[#0c4d47] w-8 shrink-0">
                      {step.num}
                    </span>
                    <p className="font-secondary text-lg font-semibold text-[#0a2225] flex-1">
                      {step.title}
                    </p>
                    {/* Vignette slot */}
                    <div
                      className="hidden md:flex w-20 justify-center transition-all duration-200"
                      style={{
                        opacity: hoveredStep === step.num ? 1 : 0,
                        transform: hoveredStep === step.num ? 'scale(1)' : 'scale(0.8)',
                      }}
                    >
                      {hoveredStep === step.num && stepVignettes[step.num]}
                    </div>
                  </div>
                  {idx < introSteps.length - 1 && (
                    <div className="border-b border-[#E5DFC6]" />
                  )}
                </div>
              ))}
            </div>

            {/* Reassurance */}
            <p
              className="mt-6 text-sm text-[#6B7280] italic"
              style={fadeUp(1000)}
            >
              You can edit everything later — nothing is final until you say so.
            </p>

            {/* CTA */}
            <button
              onClick={() => setShowIntro(false)}
              className="mt-8 w-full md:w-auto px-10 py-3.5 rounded-full bg-[#C7A962] text-white font-semibold text-base hover:bg-[#BFAD72] transition-colors flex items-center justify-center gap-2"
              style={{
                opacity: 0,
                animation: 'fade-up 0.6s ease-out 1100ms forwards, glow-cta 2.5s ease-in-out 1700ms infinite',
              }}
            >
              Create my trip
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-[#6B7280] mt-3 text-center md:text-left" style={fadeUp(1200)}>
              Free to submit. No commitment until you choose a proposal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f7f3ea] text-[#0a2225]">
      {/* Progress dots */}
      <div className="mx-auto max-w-2xl px-6 pt-10 pb-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => i <= currentStep && setCurrentStep(i)}
              disabled={i > currentStep}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                i < currentStep && "bg-[#C7B892] cursor-pointer",
                i === currentStep && "bg-[#0c4d47] w-3 h-3",
                i > currentStep && "bg-[#E5DFC6] cursor-default"
              )}
            />
          ))}
        </div>
        <p className="text-center text-[11px] text-[#9A9079]">Step {currentStep + 1} of {TOTAL_STEPS}</p>
      </div>

      {/* Prefill banners (only on step 0) */}
      {currentStep === 0 && (
        <div className="mx-auto max-w-2xl px-6">
          {/* Direct request banner */}
          {preferredName && (
            <div className="mb-4 rounded-2xl bg-gradient-to-r from-[#FDFBF5] to-[#F6F0E4] border border-[#C7A962]/30 px-4 py-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[#C7A962] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#0a2225]">Direct Request</p>
                  <p className="text-xs text-[#4a4a4a] mt-0.5">
                    This trip will be sent directly to <span className="font-semibold">{preferredName}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          {hasItineraryPrefill && itineraryPrefill && (
            <div className="mb-4 rounded-2xl bg-gradient-to-r from-[#FDFBF5] to-[#F6F0E4] border border-[#C7A962]/30 px-4 py-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[#C7A962] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#0a2225]">Pre-filled from AI Collection</p>
                  <p className="text-xs text-[#4a4a4a] mt-0.5">
                    <span className="font-semibold">{itineraryPrefill.title}</span> — {itineraryPrefill.nights} nights in {itineraryPrefill.destination}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-6 py-8 md:py-12">
        {/* Step header */}
        <div className="mb-8 md:mb-12">
          <h1 className="font-secondary text-2xl md:text-3xl text-[#0a2225] leading-tight">
            {stepMeta[currentStep].title}
          </h1>
          <p className="text-sm text-[#6B7280] mt-2">{stepMeta[currentStep].subtitle}</p>
        </div>

        {/* Step content with fade */}
        <div key={currentStep} className="animate-in fade-in duration-300 space-y-6">
          {/* ─── STEP 1: Where & when ─── */}
          {currentStep === 0 && (
            <>
              <div>
                <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">
                  Destination <span className="text-red-500">*</span>
                </label>
                <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                  className={inputCls} placeholder="Amalfi Coast, Paris & Provence, Bali..." />
              </div>
              <div>
                <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">
                  Departing from <span className="text-red-500">*</span>
                </label>
                <input type="text" value={departureCity} onChange={e => setDepartureCity(e.target.value)}
                  className={inputCls} placeholder="New York, London, Los Angeles..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">
                    Start date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={startsOn} onChange={e => setStartsOn(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">
                    End date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={endsOn} onChange={e => setEndsOn(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">Trip nickname <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className={inputCls} placeholder="Example: Amalfi anniversary escape" />
              </div>
            </>
          )}

          {/* ─── STEP 2: Who & budget ─── */}
          {currentStep === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">Adults</label>
                  <input type="number" min={1} value={adults} onChange={e => setAdults(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">Children</label>
                  <input type="number" min={0} value={children} onChange={e => setChildren(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">Occasion <span className="text-red-500">*</span></label>
                  <input type="text" value={occasion} onChange={e => setOccasion(e.target.value)}
                    className={inputCls} placeholder="Honeymoon, birthday..." />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">Budget from (total) <span className="text-red-500">*</span></label>
                  <input type="number" min={0} value={budgetMin} onChange={e => setBudgetMin(e.target.value)}
                    className={inputCls} placeholder="e.g. 7000" />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">Budget to (total) <span className="text-red-500">*</span></label>
                  <input type="number" min={0} value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
                    className={inputCls} placeholder="e.g. 12000" />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-xs text-[#4a4a4a] font-medium">Budget style</label>
                <div className="flex flex-wrap gap-2">
                  {budgetLabels.map(([value, label]) => (
                    <Pill key={value} selected={budgetLevel === value} onClick={() => setBudgetLevel(value)}>{label}</Pill>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── STEP 3: Style & interests ─── */}
          {currentStep === 2 && (
            <>
              <div>
                <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">Accommodation style <span className="text-red-500">*</span></label>
                <input type="text" value={accommodationStyle} onChange={e => setAccommodationStyle(e.target.value)}
                  className={inputCls} placeholder="Design hotels, villas, all-inclusive..." />
              </div>
              <div>
                <label className="block mb-2 text-xs text-[#4a4a4a] font-medium">Trip pace</label>
                <div className="flex flex-wrap gap-2">
                  {paceLabels.map(([value, label]) => (
                    <Pill key={value} selected={pace === value} onClick={() => setPace(value)}>{label}</Pill>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-2 text-xs text-[#4a4a4a] font-medium">What matters most? <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map(label => (
                    <Pill key={label} selected={interests.includes(label)} onClick={() => toggleInterest(label)}>{label}</Pill>
                  ))}
                </div>
              </div>
              {aestheticTags.length > 0 && (
                <div>
                  <label className="block mb-2 text-xs text-[#4a4a4a] font-medium">Aesthetic tags</label>
                  <div className="flex flex-wrap gap-2">
                    {aestheticTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#BFAD72] bg-[#FDFBF5] text-xs text-[#0a2225]">
                        {tag}
                        <button type="button" onClick={() => removeAestheticTag(tag)} className="hover:text-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#9A9079]">Extracted from your storyboard</p>
                </div>
              )}
            </>
          )}

          {/* ─── STEP 4: Visual Storyboard ─── */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#FDFBF5] border border-[#C7A962]/30 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#C7A962] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#0a2225]">Your visual mood board</p>
                    <p className="text-xs text-[#4a4a4a] mt-0.5">
                      Add photos, hotel links, and inspiration images. This is the first thing creators and agents see.
                    </p>
                  </div>
                </div>
              </div>
              <StoryboardBuilder
                storyboardId={storyboardId || undefined}
                mode="traveler"
                initialTitle={title || destination}
                destination={destination}
                onSaved={(id) => setStoryboardId(id)}
                saveRef={storyboardSaveRef}
                addItemRef={storyboardAddItemRef}
              />
              {storyboardId && (
                <p className="text-xs text-[#0c4d47] flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Storyboard saved
                </p>
              )}

            </div>
          )}

          {/* ─── STEP 5: Notes & role ─── */}
          {currentStep === 4 && (
            <>
              <div>
                <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">How flexible are you? <span className="text-red-500">*</span></label>
                <textarea value={flexibility} onChange={e => setFlexibility(e.target.value)}
                  className={cn(inputCls, "min-h-[100px] resize-none")}
                  placeholder="Dates can move, happy to consider nearby towns..." />
              </div>
              <div>
                <label className="block mb-1.5 text-xs text-[#4a4a4a] font-medium">Special notes <span className="text-red-500">*</span></label>
                <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)}
                  className={cn(inputCls, "min-h-[120px] resize-none")}
                  placeholder="Allergies, accessibility needs, non-negotiables..." />
              </div>
              <div>
                <label className="block mb-2 text-xs text-[#4a4a4a] font-medium">Who should respond?</label>
                <div className="flex flex-wrap gap-2">
                  {roleLabels.map(([value, label]) => (
                    <Pill key={value} selected={wantsRole === value} onClick={() => setWantsRole(value)}>{label}</Pill>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── STEP 6: Review ─── */}
          {currentStep === 5 && (
            <>
              <div className="rounded-2xl bg-white border border-[#E5DFC6] divide-y divide-[#E5DFC6]">
                <SummaryRow label="Destination" value={destination} />
                <SummaryRow label="Departing from" value={departureCity} />
                <SummaryRow label="Dates" value={`${startsOn} → ${endsOn}`} />
                <SummaryRow label="Trip name" value={title} />
                <SummaryRow label="Travelers" value={`${adults} adult${Number(adults) !== 1 ? "s" : ""}${Number(children) > 0 ? `, ${children} child${Number(children) !== 1 ? "ren" : ""}` : ""}`} />
                <SummaryRow label="Occasion" value={occasion} />
                <SummaryRow label="Budget" value={`$${Number(budgetMin).toLocaleString()} – $${Number(budgetMax).toLocaleString()} (${budgetLabels.find(b => b[0] === budgetLevel)?.[1]})`} />
                <SummaryRow label="Accommodation" value={accommodationStyle} />
                <SummaryRow label="Pace" value={paceLabels.find(p => p[0] === pace)?.[1] || pace} />
                <SummaryRow label="Interests" value={interests.join(", ")} />
                {aestheticTags.length > 0 && <SummaryRow label="Aesthetic" value={aestheticTags.join(", ")} />}
                <SummaryRow label="Flexibility" value={flexibility} />
                <SummaryRow label="Notes" value={specialNotes} />
                <SummaryRow label="Respond" value={roleLabels.find(r => r[0] === wantsRole)?.[1] || wantsRole} />
              </div>

              {/* AI Itinerary collapsible */}
              {hasItineraryPrefill && itineraryPrefill && itineraryPrefill.itinerary.length > 0 && (
                <div>
                  <button type="button" onClick={() => setShowItineraryPreview(!showItineraryPreview)}
                    className="flex items-center gap-2 text-xs font-medium text-[#0c4d47] hover:underline underline-offset-4">
                    <Sparkles className="h-3.5 w-3.5 text-[#C7A962]" />
                    {showItineraryPreview ? "Hide" : "View"} AI itinerary preview
                    {showItineraryPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showItineraryPreview && (
                    <div className="mt-3 space-y-2 rounded-2xl border border-[#E5DFC6] bg-[#FDFBF5] p-4">
                      {itineraryPrefill.itinerary.map(day => (
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

              {/* Storyboard status on review */}
              {storyboardId && (
                <div className="flex items-center gap-2 text-xs text-[#0c4d47]">
                  <Check className="h-3.5 w-3.5" />
                  <span className="font-medium">Visual storyboard attached</span>
                </div>
              )}

              {/* Condensed trust & safety */}
              <p className="text-[11px] text-[#9A9079]">
                Your brief is shared only with vetted professionals. Keep payments on-platform.{" "}
                <button type="button" onClick={() => setShowSafetyModal(true)}
                  className="text-[#0c4d47] font-medium hover:underline underline-offset-2">
                  View safety guidelines
                </button>
              </p>
            </>
          )}
        </div>

        {/* Error */}
        {error && <p className="mt-4 text-xs text-red-600">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 md:mt-14">
          <button type="button" onClick={goBack}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm text-[#4a4a4a] hover:text-[#0a2225] hover:bg-[#E5DFC6]/40 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {currentStep < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={goNext}
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-6 py-2.5 text-sm font-semibold hover:bg-[#073331] transition-colors">
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-6 py-2.5 text-sm font-semibold hover:bg-[#073331] disabled:opacity-60 transition-colors">
              {submitting ? "Posting..." : "Post this trip"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Disclaimer on review step */}
        {currentStep === 5 && (
          <p className="text-center text-[10px] text-[#9A9079] mt-4">
            By posting, you agree to keep all booking communication inside Goldsainte.
          </p>
        )}
      </form>

      <TrustSafetyModal open={showSafetyModal} onClose={() => setShowSafetyModal(false)} context="trip" />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-5 py-3">
      <span className="text-xs text-[#9A9079] w-24 flex-shrink-0 font-medium">{label}</span>
      <span className="text-sm text-[#0a2225] flex-1">{value}</span>
    </div>
  );
}
