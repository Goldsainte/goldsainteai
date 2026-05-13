import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Save, Send, X, Loader2, Shuffle, CalendarIcon, Sparkles,
  Check, ChevronLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrayFieldEditor } from "./ArrayFieldEditor";
import { TripImageUploader } from "./TripImageUploader";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TripBuilderFormProps {
  initialData?: any;
  onSave: (data: any, status: "draft" | "published") => void;
  saving: boolean;
  isEditing: boolean;
}

const TRIP_TYPES = [
  "Adventure", "Luxury", "Cultural", "Beach", "Safari", "City Break",
  "Wellness", "Culinary", "Romantic", "Family", "Solo", "Group",
];
const ACTIVITY_LEVELS = ["Easy", "Moderate", "Active", "Challenging"];
const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD"];
const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German", "Italian", "Japanese", "Arabic", "Portuguese", "Mandarin", "Other"];
const ACCOMMODATION_TYPES = ["Boutique Hotel", "Luxury Resort", "Hostel", "Camping", "Mixed", "Villa", "Cruise"];
const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const DAY_MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner"];

const CANCELLATION_TEMPLATE = `- Deposit ({deposit_percentage}%) is non-refundable after booking confirmation.
- Cancellations 60+ days before departure: full refund of balance paid beyond deposit.
- Cancellations 30–60 days before departure: 50% refund of balance.
- Cancellations under 30 days before departure: no refund.
- Trip insurance is strongly recommended.`;

const REFUND_TEMPLATE = `- Refunds are processed within 7–10 business days to the original payment method.
- In the event of a trip cancellation by the operator, 100% refund will be issued including the deposit.
- Force majeure events are handled case by case with travel credit offered where possible.`;

export type ItineraryDay = {
  day_number: number;
  title: string;
  description: string;
  activities: string[];
  accommodation: string;
  meals_included: string[];
  is_featured_day: boolean;
};

// Editorial input styles
const labelClasses = "text-sm font-medium text-[#0a2225]";
const inputClasses = "rounded-xl h-11 sm:h-12 text-sm sm:text-base border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all";
const textareaClasses = "rounded-xl border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all";
const selectTriggerClasses = "rounded-xl h-11 sm:h-12 text-sm sm:text-base border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20";
const helperClasses = "text-xs text-[#9A9384] mt-1";

const steps = [
  { id: "basics", label: "About the trip", subtitle: "Title, destination, type", heading: "Tell us about your trip", subheading: "This is the first thing travelers will see." },
  { id: "details", label: "What's included", subtitle: "Highlights & inclusions", heading: "What makes this trip special?", subheading: "Highlights and inclusions help travelers decide." },
  { id: "itinerary", label: "Day by day", subtitle: "Build your itinerary", heading: "Build the journey day by day", subheading: "Detailed itineraries convert more bookings." },
  { id: "media", label: "Photos & video", subtitle: "Cover image, gallery", heading: "Show it off", subheading: "Strong visuals are the single biggest driver of bookings." },
  { id: "requirements", label: "Requirements", subtitle: "Dates, travel docs", heading: "Practicalities", subheading: "Be upfront so travelers come prepared." },
  { id: "policies", label: "Terms & pricing", subtitle: "Deposit, cancellation", heading: "Terms & payment", subheading: "Clear terms protect you and build traveler trust." },
] as const;

export type TripBuilderFormHandle = {
  getCurrentData: () => any;
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="font-secondary text-lg text-[#0a2225]">{title}</h3>
      {subtitle && <p className="text-sm text-[#9A9384] mt-1">{subtitle}</p>}
    </div>
  );
}

export const TripBuilderForm = forwardRef<TripBuilderFormHandle, TripBuilderFormProps>(function TripBuilderForm(
  { initialData, onSave, saving, isEditing },
  ref
) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [suggestingCover, setSuggestingCover] = useState(false);
  const [coverSuggested, setCoverSuggested] = useState(false);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [departureMode, setDepartureMode] = useState<"flexible" | "fixed">("flexible");
  const [aiLoading, setAiLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    title: "", description: "", destination: "", price_per_person: "", original_price: "",
    currency: "USD", duration_days: "", duration_nights: "", cover_image_url: "",
    image_gallery: [] as string[], video_url: "", max_participants: "", min_participants: "1",
    trip_type: "", activity_level: "", tags: [] as string[], highlights: [] as string[],
    included: [] as string[], not_included: [] as string[], available_from: "", available_until: "",
    deposit_percentage: "30", balance_due_days: "", passport_required: true, visa_required: false,
    vaccination_required: false, fitness_level_required: "", cancellation_policy: "",
    refund_policy: "", terms_conditions: "", host_tagline: "", group_size_note: "",
    recommended_arrival_airport: "", recommended_departure_airport: "",
    faqs: [] as { question: string; answer: string }[], languages: [] as string[],
    minimum_age: "", accommodation_type: "", meals_included: [] as string[],
    departure_dates: [] as string[], instant_booking: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        destination: initialData.destination || "",
        price_per_person: initialData.price_per_person?.toString() || "",
        original_price: initialData.original_price?.toString() || "",
        currency: initialData.currency || "USD",
        duration_days: initialData.duration_days?.toString() || "",
        duration_nights: initialData.duration_nights?.toString() || "",
        cover_image_url: initialData.cover_image_url || "",
        image_gallery: initialData.image_gallery || [],
        video_url: initialData.video_url || "",
        max_participants: initialData.max_participants?.toString() || "",
        min_participants: initialData.min_participants?.toString() || "1",
        trip_type: initialData.trip_type || "",
        activity_level: initialData.activity_level || "",
        tags: initialData.tags || [],
        highlights: initialData.highlights || [],
        included: initialData.included || [],
        not_included: initialData.not_included || [],
        available_from: initialData.available_from || "",
        available_until: initialData.available_until || "",
        deposit_percentage: initialData.deposit_percentage?.toString() || "30",
        balance_due_days: initialData.balance_due_days?.toString() || "",
        passport_required: initialData.passport_required ?? true,
        visa_required: initialData.visa_required ?? false,
        vaccination_required: initialData.vaccination_required ?? false,
        fitness_level_required: initialData.fitness_level_required || "",
        cancellation_policy: initialData.cancellation_policy || "",
        refund_policy: initialData.refund_policy || "",
        terms_conditions: initialData.terms_conditions || "",
        host_tagline: initialData.host_tagline || "",
        group_size_note: initialData.group_size_note || "",
        recommended_arrival_airport: initialData.recommended_arrival_airport || "",
        recommended_departure_airport: initialData.recommended_departure_airport || "",
        faqs: initialData.faqs || [],
        languages: initialData.languages || [],
        minimum_age: initialData.minimum_age?.toString() || "",
        accommodation_type: initialData.accommodation_type || "",
        meals_included: initialData.meals_included || [],
        departure_dates: Array.isArray(initialData.departure_dates) ? initialData.departure_dates : [],
        instant_booking: initialData.instant_booking ?? false,
      });
      const incomingDeparture = Array.isArray(initialData.departure_dates) ? initialData.departure_dates : [];
      setDepartureMode(incomingDeparture.length > 0 ? "fixed" : "flexible");
      if (Array.isArray(initialData.itinerary_days)) {
        setItineraryDays(initialData.itinerary_days);
      }
    }
  }, [initialData]);

  useEffect(() => {
    const days = parseInt(formData.duration_days) || 0;
    if (days <= 0) return;
    setItineraryDays((prev) => {
      if (prev.length === days) return prev;
      if (prev.length < days) {
        const additions: ItineraryDay[] = [];
        for (let i = prev.length; i < days; i++) {
          additions.push({
            day_number: i + 1, title: "", description: "", activities: [],
            accommodation: "", meals_included: [], is_featured_day: false,
          });
        }
        return [...prev, ...additions];
      }
      return prev.slice(0, days);
    });
  }, [formData.duration_days]);

  const updateDay = (idx: number, patch: Partial<ItineraryDay>) =>
    setItineraryDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));

  const toggleArrayValue = (field: "languages" | "meals_included", value: string) =>
    setFormData((prev) => {
      const current = prev[field] as string[];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [field]: next };
    });

  const toggleDayMeal = (idx: number, meal: string) =>
    setItineraryDays((prev) => prev.map((d, i) => {
      if (i !== idx) return d;
      const has = d.meals_included.includes(meal);
      return { ...d, meals_included: has ? d.meals_included.filter((m) => m !== meal) : [...d.meals_included, meal] };
    }));

  const addDepartureDate = (date: Date | undefined) => {
    if (!date) return;
    const iso = format(date, "yyyy-MM-dd");
    setFormData((prev) => prev.departure_dates.includes(iso)
      ? prev
      : { ...prev, departure_dates: [...prev.departure_dates, iso].sort() });
  };
  const removeDepartureDate = (iso: string) =>
    setFormData((prev) => ({ ...prev, departure_dates: prev.departure_dates.filter((d) => d !== iso) }));

  const updateField = (field: string, value: any) => setFormData((prev) => ({ ...prev, [field]: value }));

  const suggestCoverImage = async (dest?: string) => {
    const destination = dest || formData.destination;
    if (!destination?.trim()) return;
    setSuggestingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke("select-trip-cover", { body: { destination } });
      if (error) throw error;
      if (data?.url) {
        updateField("cover_image_url", data.url);
        setCoverSuggested(true);
        toast.success("Cover image suggested — click Shuffle for alternatives");
      }
    } catch (err: any) {
      console.error("[suggestCover]", err);
    } finally {
      setSuggestingCover(false);
    }
  };

  useEffect(() => {
    if (formData.destination?.trim() && !formData.cover_image_url && !coverSuggested && !initialData?.cover_image_url) {
      const timer = setTimeout(() => suggestCoverImage(formData.destination), 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.destination]);

  const preparePayload = () => ({
    title: formData.title, description: formData.description, destination: formData.destination,
    price_per_person: parseFloat(formData.price_per_person) || 0,
    original_price: formData.original_price ? parseFloat(formData.original_price) : null,
    currency: formData.currency, duration_days: parseInt(formData.duration_days) || 1,
    duration_nights: formData.duration_nights ? parseInt(formData.duration_nights) : null,
    cover_image_url: formData.cover_image_url, image_gallery: formData.image_gallery,
    video_url: formData.video_url || null,
    max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
    min_participants: parseInt(formData.min_participants) || 1,
    trip_type: formData.trip_type || null, activity_level: formData.activity_level || null,
    tags: formData.tags, highlights: formData.highlights, included: formData.included,
    not_included: formData.not_included,
    available_from: formData.available_from || null, available_until: formData.available_until || null,
    deposit_percentage: parseInt(formData.deposit_percentage) || 30,
    balance_due_days: formData.balance_due_days ? parseInt(formData.balance_due_days) : null,
    passport_required: formData.passport_required, visa_required: formData.visa_required,
    vaccination_required: formData.vaccination_required,
    fitness_level_required: formData.fitness_level_required || null,
    cancellation_policy: formData.cancellation_policy || null,
    refund_policy: formData.refund_policy || null, terms_conditions: formData.terms_conditions || null,
    host_tagline: formData.host_tagline || null, group_size_note: formData.group_size_note || null,
    recommended_arrival_airport: formData.recommended_arrival_airport || null,
    recommended_departure_airport: formData.recommended_departure_airport || null,
    faqs: formData.faqs, languages: formData.languages,
    minimum_age: formData.minimum_age ? parseInt(formData.minimum_age) : null,
    accommodation_type: formData.accommodation_type || null,
    meals_included: formData.meals_included,
    departure_dates: departureMode === "fixed" ? formData.departure_dates : [],
    instant_booking: formData.instant_booking,
    itinerary_days: itineraryDays,
  });

  useImperativeHandle(ref, () => ({ getCurrentData: () => preparePayload() }));

  const handleAIItinerary = async () => {
    if (!formData.title || !formData.destination) {
      toast.info("Add a title and destination first.");
      return;
    }
    const days = parseInt(formData.duration_days) || itineraryDays.length;
    if (days <= 0) {
      toast.info("Set the trip duration first.");
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-trip-itinerary-suggest", {
        body: {
          title: formData.title, destination: formData.destination,
          duration_days: days, trip_type: formData.trip_type || null,
        },
      });
      if (error) throw error;
      const suggested = (data?.days || []) as Array<any>;
      if (suggested.length === 0) {
        toast.error("No itinerary returned. Try again.");
        return;
      }
      setItineraryDays((prev) => prev.map((d, idx) => {
        const s = suggested[idx];
        if (!s) return d;
        return {
          ...d,
          title: s.title || d.title,
          description: s.description || d.description,
          activities: Array.isArray(s.activities) ? s.activities : d.activities,
          accommodation: s.accommodation || d.accommodation,
        };
      }));
      toast.success("Itinerary draft generated. Review and edit each day.");
    } catch (err: any) {
      console.error("AI itinerary error:", err);
      toast.error("Failed to generate itinerary. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const isValid = formData.title && formData.destination && formData.price_per_person && formData.duration_days;

  const getError = (field: string): string | null => {
    if (!touched[field]) return null;
    if (field === "title" && !formData.title?.trim()) return "Trip title is required";
    if (field === "destination" && !formData.destination?.trim()) return "Destination is required";
    if (field === "price_per_person" && !formData.price_per_person) return "Price per person is required";
    if (field === "duration_days" && !formData.duration_days) return "Duration is required";
    return null;
  };

  const markStepComplete = (idx: number) =>
    setCompletedSteps((prev) => {
      const n = new Set(prev);
      n.add(idx);
      return n;
    });

  const goNext = () => {
    if (currentStep === 0) {
      if (!formData.title?.trim()) {
        toast.error("Please add a trip title before continuing.");
        return;
      }
      if (!formData.destination?.trim()) {
        toast.error("Please add a destination before continuing.");
        return;
      }
      if (!formData.price_per_person) {
        toast.error("Please add a price per person before continuing.");
        return;
      }
    }
    if (currentStep === 2) {
      const hasContent = itineraryDays.some((d) => d.title?.trim());
      if (!hasContent) {
        toast.error("Please add at least one day to your itinerary, or use the AI suggestion button.");
        return;
      }
    }
    markStepComplete(currentStep);
    setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goPrev = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderStep = () => {
    const step = steps[currentStep];
    return (
      <div className="space-y-10">
        <div>
          <h2 className="font-secondary text-3xl sm:text-4xl text-[#0a2225] tracking-tight">{step.heading}</h2>
          <p className="mt-2 text-sm sm:text-base text-[#9A9384]">{step.subheading}</p>
        </div>

        {step.id === "basics" && (
          <div className="space-y-10">
            <div className="space-y-6">
              <SectionHeader title="Basic information" subtitle="The essentials travelers see first when browsing the marketplace." />
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className={labelClasses}>Trip title *</Label>
                  <Input value={formData.title} onChange={(e) => updateField("title", e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                    placeholder="e.g., 7-Day Jordan Desert & Petra"
                    className={`${inputClasses} ${getError("title") ? "border-red-400 focus:border-red-400" : ""}`} />
                  {getError("title") && <p className="text-xs text-red-500 mt-1">{getError("title")}</p>}
                  <p className={helperClasses}>Keep it specific. "7-Day Jordan Desert & Petra" outperforms "Jordan Trip".</p>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Host tagline</Label>
                  <Input value={formData.host_tagline} onChange={(e) => updateField("host_tagline", e.target.value)}
                    placeholder="e.g., Curated by a local Italy expert" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Destination *</Label>
                  <Input value={formData.destination} onChange={(e) => updateField("destination", e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, destination: true }))}
                    placeholder="e.g., Amalfi Coast, Italy"
                    className={`${inputClasses} ${getError("destination") ? "border-red-400 focus:border-red-400" : ""}`} />
                  {getError("destination") && <p className="text-xs text-red-500 mt-1">{getError("destination")}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe this trip experience..." rows={5} className={textareaClasses} />
                  <p className={helperClasses}>Aim for 150–300 words. Include what makes this trip different from booking it alone.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Trip type</Label>
                    <Select value={formData.trip_type} onValueChange={(v) => updateField("trip_type", v)}>
                      <SelectTrigger className={selectTriggerClasses}><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                        {TRIP_TYPES.map((t) => <SelectItem key={t} value={t} className="focus:bg-[#FDF9F0]">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>Activity level</Label>
                    <Select value={formData.activity_level} onValueChange={(v) => updateField("activity_level", v)}>
                      <SelectTrigger className={selectTriggerClasses}><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                        {ACTIVITY_LEVELS.map((l) => <SelectItem key={l} value={l} className="focus:bg-[#FDF9F0]">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Pricing & duration" subtitle="What travelers pay, and how long they're with you." />
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Price per person *</Label>
                    <Input type="number" value={formData.price_per_person}
                      onChange={(e) => updateField("price_per_person", e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, price_per_person: true }))}
                      placeholder="2500"
                      className={`${inputClasses} ${getError("price_per_person") ? "border-red-400 focus:border-red-400" : ""}`} />
                    {getError("price_per_person") && <p className="text-xs text-red-500 mt-1">{getError("price_per_person")}</p>}
                    <p className={helperClasses}>This is what travelers pay. Your deposit percentage and commission are calculated from this.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>Original price</Label>
                    <Input type="number" value={formData.original_price}
                      onChange={(e) => updateField("original_price", e.target.value)}
                      placeholder="For showing discounts" className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>Currency</Label>
                    <Select value={formData.currency} onValueChange={(v) => updateField("currency", v)}>
                      <SelectTrigger className={selectTriggerClasses}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c} className="focus:bg-[#FDF9F0]">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Duration (days) *</Label>
                    <Input type="number" value={formData.duration_days}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        updateField("duration_days", e.target.value);
                        if (days > 0) updateField("duration_nights", String(days - 1));
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, duration_days: true }))}
                      placeholder="5"
                      className={`${inputClasses} ${getError("duration_days") ? "border-red-400 focus:border-red-400" : ""}`} />
                    {getError("duration_days") && <p className="text-xs text-red-500 mt-1">{getError("duration_days")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>Duration (nights)</Label>
                    <Input type="number" value={formData.duration_nights}
                      onChange={(e) => updateField("duration_nights", e.target.value)} placeholder="4" className={inputClasses} />
                    <p className="text-[11px] text-[#6B7280]">Auto-calculated from days (you can adjust if needed)</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Min participants</Label>
                    <Input type="number" value={formData.min_participants}
                      onChange={(e) => updateField("min_participants", e.target.value)} placeholder="1" className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>Max participants</Label>
                    <Input type="number" value={formData.max_participants}
                      onChange={(e) => updateField("max_participants", e.target.value)} placeholder="12" className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Group size note</Label>
                  <Input value={formData.group_size_note} onChange={(e) => updateField("group_size_note", e.target.value)}
                    placeholder="e.g., Small intimate group of 6-12 travelers" className={inputClasses} />
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Languages & audience" subtitle="Who this trip is designed for." />
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className={labelClasses}>Language of tour</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const active = formData.languages.includes(lang);
                      return (
                        <button key={lang} type="button" onClick={() => toggleArrayValue("languages", lang)}
                          className={cn("rounded-full px-4 py-1.5 text-xs border transition-colors",
                            active ? "bg-[#0c4d47] text-white border-[#0c4d47]"
                                   : "bg-white text-[#0a2225] border-[#E5DFC6] hover:border-[#C7A962]")}>
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Minimum age (leave blank if none)</Label>
                    <Input type="number" min={0} value={formData.minimum_age}
                      onChange={(e) => updateField("minimum_age", e.target.value)} placeholder="e.g., 18" className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>Accommodation type</Label>
                    <Select value={formData.accommodation_type} onValueChange={(v) => updateField("accommodation_type", v)}>
                      <SelectTrigger className={selectTriggerClasses}><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                        {ACCOMMODATION_TYPES.map((t) => <SelectItem key={t} value={t} className="focus:bg-[#FDF9F0]">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step.id === "details" && (
          <div className="space-y-10">
            <div className="space-y-6">
              <SectionHeader title="Trip highlights" subtitle="The 4–6 moments travelers will remember." />
              <ArrayFieldEditor items={formData.highlights} onChange={(items) => updateField("highlights", items)}
                placeholder="Add a highlight (e.g., Private boat tour of the coastline)" />
            </div>
            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="What's included" />
              <ArrayFieldEditor items={formData.included} onChange={(items) => updateField("included", items)}
                placeholder="Add an inclusion (e.g., 4 nights accommodation)" />
            </div>
            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="What's not included" />
              <ArrayFieldEditor items={formData.not_included} onChange={(items) => updateField("not_included", items)}
                placeholder="Add an exclusion (e.g., Flights to/from destination)" />
            </div>
            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Tags" subtitle="Help the right travelers find this trip." />
              <ArrayFieldEditor items={formData.tags} onChange={(items) => updateField("tags", items)}
                placeholder="Add a tag (e.g., foodie, couples, photography)" />
            </div>
            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Meals included" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MEAL_OPTIONS.map((meal) => {
                  const active = formData.meals_included.includes(meal);
                  return (
                    <label key={meal}
                      className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
                        active ? "bg-[#FDF9F0] border-[#C7A962]" : "bg-white border-[#E5DFC6] hover:border-[#C7A962]/50")}>
                      <Checkbox checked={active} onCheckedChange={() => toggleArrayValue("meals_included", meal)} />
                      <span className="text-sm text-[#0a2225]">{meal}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step.id === "itinerary" && (
          <div className="space-y-6">
            {formData.title && formData.destination && itineraryDays.length > 0 && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleAIItinerary} disabled={aiLoading}
                  className="rounded-full border-[#C7A962]/40 text-[#0c4d47] hover:bg-[#FDF9F0]">
                  {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {aiLoading ? "Generating..." : "Suggest with AI"}
                </Button>
              </div>
            )}
            {itineraryDays.length === 0 ? (
              <p className="text-sm text-[#6B7280] py-6">
                Set the trip duration in the previous step to start building your day-by-day itinerary.
              </p>
            ) : (
              itineraryDays.map((day, idx) => (
                <div key={idx} className={cn(
                  "py-6",
                  idx > 0 && "border-t border-[#E5DFC6]"
                )}>
                  <div className="flex items-start gap-5">
                    <span className="font-secondary text-4xl text-[#E5DFC6] leading-none mt-1 flex-shrink-0">
                      {String(day.day_number).padStart(2, "0")}
                    </span>
                    <div className="flex-1 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <Label className={labelClasses}>Day title</Label>
                          <Input value={day.title} onChange={(e) => updateDay(idx, { title: e.target.value })}
                            placeholder={`e.g., Arrival in ${formData.destination || "destination"}`} className={inputClasses} />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-[#6B7280] mt-8 flex-shrink-0">
                          <span>Featured day</span>
                          <Checkbox checked={day.is_featured_day} onCheckedChange={(v) => updateDay(idx, { is_featured_day: v})} />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <Label className={labelClasses}>Description</Label>
                        <Textarea value={day.description} onChange={(e) => updateDay(idx, { description: e.target.value })}
                          placeholder="Describe the day's experience..." rows={3} className={textareaClasses} />
                      </div>
                      <div className="space-y-2">
                        <Label className={labelClasses}>Activities</Label>
                        <ArrayFieldEditor items={day.activities}
                          onChange={(items) => updateDay(idx, { activities: items })}
                          placeholder="Add an activity (e.g., Morning game drive)" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className={labelClasses}>Accommodation</Label>
                          <Input value={day.accommodation} onChange={(e) => updateDay(idx, { accommodation: e.target.value })}
                            placeholder="e.g., Angama Mara Lodge" className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClasses}>Meals included</Label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {DAY_MEAL_OPTIONS.map((meal) => {
                              const active = day.meals_included.includes(meal);
                              return (
                                <button key={meal} type="button" onClick={() => toggleDayMeal(idx, meal)}
                                  className={cn("rounded-full px-3 py-1.5 text-xs border transition-colors",
                                    active ? "bg-[#0c4d47] text-white border-[#0c4d47]"
                                           : "bg-white text-[#0a2225] border-[#E5DFC6] hover:border-[#C7A962]")}>
                                  {meal}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {step.id === "media" && (
          <div className="space-y-10">
            <div className="space-y-4">
              <SectionHeader title="Cover image" subtitle="The single image that earns the click." />
              <TripImageUploader currentUrl={formData.cover_image_url}
                onUpload={(url) => { updateField("cover_image_url", url); setCoverSuggested(false); }}
                label="Upload a stunning cover image" />
              {formData.destination?.trim() && (
                <Button type="button" variant="outline" size="sm"
                  onClick={() => suggestCoverImage()} disabled={suggestingCover}
                  className="rounded-full border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#6B7280]">
                  {suggestingCover ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shuffle className="h-4 w-4 mr-2" />}
                  {formData.cover_image_url ? "Shuffle cover" : "Auto-suggest cover"}
                </Button>
              )}
            </div>
            <div className="space-y-4 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Image gallery" subtitle="6–12 photos showcase the trip best." />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.image_gallery.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`Gallery ${idx + 1}`}
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-[#E5DFC6]" loading="lazy" />
                    <button onClick={() => {
                      const ng = [...formData.image_gallery];
                      ng.splice(idx, 1);
                      updateField("image_gallery", ng);
                    }} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <TripImageUploader onUpload={(url) => updateField("image_gallery", [...formData.image_gallery, url])} compact />
              </div>
            </div>
            <div className="space-y-4 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Video" subtitle="Optional — but a 30-second video can double conversion." />
              <div className="space-y-2">
                <Label className={labelClasses}>Video URL (YouTube or Vimeo)</Label>
                <Input value={formData.video_url} onChange={(e) => updateField("video_url", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." className={inputClasses} />
              </div>
            </div>
          </div>
        )}

        {step.id === "requirements" && (
          <div className="space-y-10">
            <div className="space-y-6">
              <SectionHeader title="Travel requirements" subtitle="What travelers need to enter the country." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { field: "passport_required" as const, label: "Passport required", description: "Travelers must hold a valid passport" },
                  { field: "visa_required" as const, label: "Visa required", description: "A visa may be needed for this destination" },
                  { field: "vaccination_required" as const, label: "Vaccination required", description: "Proof of vaccination may be required" },
                ]).map(({ field, label, description }) => (
                  <button type="button" key={field} onClick={() => updateField(field, !formData[field])}
                    className="flex items-start gap-3 p-4 bg-[#FDF9F0] rounded-xl text-left hover:bg-[#F6F0E4] transition-colors">
                    <span role="checkbox" aria-checked={!!formData[field]}
                      className={cn("mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors",
                        formData[field] ? "bg-[#0c4d47] border-[#0c4d47]" : "bg-white border-[#C7B892]")}>
                      {formData[field] && (
                        <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 text-white">
                          <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-[#0a2225]">{label}</span>
                      <span className="text-xs text-[#6B7280] mt-0.5">{description}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label className={labelClasses}>Fitness level required</Label>
                <Input value={formData.fitness_level_required}
                  onChange={(e) => updateField("fitness_level_required", e.target.value)}
                  placeholder="e.g., Moderate fitness for walking tours" className={inputClasses} />
              </div>
            </div>

            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Departure dates" />
              <RadioGroup value={departureMode} onValueChange={(v) => setDepartureMode(v as "flexible" | "fixed")} className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E5DFC6] p-4 hover:border-[#C7A962]/50">
                  <RadioGroupItem value="flexible" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium text-[#0a2225]">Flexible — travelers contact me for dates</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Best for bespoke and on-demand trips.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E5DFC6] p-4 hover:border-[#C7A962]/50">
                  <RadioGroupItem value="fixed" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium text-[#0a2225]">Fixed departure dates</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Add specific departure dates travelers can book.</p>
                  </div>
                </label>
              </RadioGroup>
              {departureMode === "fixed" && (
                <div className="space-y-3 pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="rounded-full border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225]">
                        <CalendarIcon className="h-4 w-4 mr-2" /> Add a departure date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar mode="single" onSelect={addDepartureDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  {formData.departure_dates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.departure_dates.map((iso) => (
                        <span key={iso} className="inline-flex items-center gap-2 rounded-full bg-[#FDF9F0] border border-[#E5DFC6] px-3 py-1.5 text-xs text-[#0a2225]">
                          {format(new Date(iso), "MMM d, yyyy")}
                          <button type="button" onClick={() => removeDepartureDate(iso)} className="text-[#6B7280] hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280]">No departure dates added yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Airport information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Recommended arrival airport</Label>
                  <Input value={formData.recommended_arrival_airport}
                    onChange={(e) => updateField("recommended_arrival_airport", e.target.value)}
                    placeholder="e.g., Naples (NAP)" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Recommended departure airport</Label>
                  <Input value={formData.recommended_departure_airport}
                    onChange={(e) => updateField("recommended_departure_airport", e.target.value)}
                    placeholder="e.g., Rome Fiumicino (FCO)" className={inputClasses} />
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Availability window" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Available from</Label>
                  <Input type="date" value={formData.available_from}
                    onChange={(e) => updateField("available_from", e.target.value)} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Available until</Label>
                  <Input type="date" value={formData.available_until}
                    onChange={(e) => updateField("available_until", e.target.value)} className={inputClasses} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step.id === "policies" && (
          <div className="space-y-10">
            <div className="space-y-6">
              <SectionHeader title="Payment terms" subtitle="Set your deposit and payment schedule. These appear on your trip listing." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Deposit required (%)</Label>
                  <Input type="number" value={formData.deposit_percentage}
                    onChange={(e) => updateField("deposit_percentage", e.target.value)}
                    placeholder="25" className={inputClasses} />
                  <p className={helperClasses}>Charged at booking. Remaining balance collected before departure.</p>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Balance due (days before trip)</Label>
                  <Input type="number" value={formData.balance_due_days}
                    onChange={(e) => updateField("balance_due_days", e.target.value)}
                    placeholder="60" className={inputClasses} />
                  <p className={helperClasses}>When the remaining balance is collected.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateField('instant_booking', !formData.instant_booking)}
                className="flex items-start gap-3 w-full text-left mt-4 rounded-xl border border-[#E5DFC6] bg-white p-4 hover:border-[#C7A962]/40 transition"
              >
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.instant_booking ? 'bg-[#0c4d47] border-[#0c4d47]' : 'border-[#E5DFC6] bg-white'}`}>
                  {formData.instant_booking && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0a2225]">Enable Instant Booking</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Travelers can book immediately without waiting for your approval.</p>
                </div>
              </button>
            </div>

            <div className="space-y-3 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Cancellation policy" />
              <button type="button"
                onClick={() => updateField("cancellation_policy",
                  CANCELLATION_TEMPLATE.replace(/\{deposit_percentage\}/g, formData.deposit_percentage || "25"))}
                className="text-xs text-[#0c4d47] underline">Use template</button>
              <Textarea value={formData.cancellation_policy}
                onChange={(e) => updateField("cancellation_policy", e.target.value)}
                placeholder="Describe your cancellation policy..." rows={5} className={textareaClasses} />
            </div>

            <div className="space-y-3 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Refund policy" />
              <button type="button" onClick={() => updateField("refund_policy", REFUND_TEMPLATE)}
                className="text-xs text-[#0c4d47] underline">Use template</button>
              <Textarea value={formData.refund_policy}
                onChange={(e) => updateField("refund_policy", e.target.value)}
                placeholder="Describe your refund policy..." rows={5} className={textareaClasses} />
            </div>

            <div className="space-y-3 border-t border-[#E5DFC6] pt-10">
              <SectionHeader title="Terms & conditions" />
              <Textarea value={formData.terms_conditions}
                onChange={(e) => updateField("terms_conditions", e.target.value)}
                placeholder="Additional terms and conditions..." rows={5} className={textareaClasses} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-52 flex-shrink-0">
        <div className="sticky top-8 space-y-1">
          {steps.map((step, idx) => {
            const isActive = currentStep === idx;
            const isDone = completedSteps.has(idx);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                  isActive ? "bg-[#0c4d47] text-white"
                    : isDone ? "bg-[#F0F7F6] text-[#0c4d47]"
                    : "text-[#9A9384] hover:text-[#0a2225]"
                )}
              >
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                  isActive ? "bg-white/20 text-white"
                    : isDone ? "bg-[#0c4d47] text-white"
                    : "bg-[#E5DFC6] text-[#9A9384]"
                )}>
                  {isDone && !isActive ? <Check className="h-3 w-3" /> : idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{step.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{step.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile progress */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#9A9384]">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-xs font-medium text-[#0a2225]">{steps[currentStep].label}</span>
          </div>
          <div className="h-1 bg-[#E5DFC6] rounded-full overflow-hidden">
            <div className="h-full bg-[#0c4d47] rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 mt-10 border-t border-[#E5DFC6]">
          <Button variant="ghost" onClick={goPrev} disabled={currentStep === 0} className="text-[#6B7280]">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {!isLastStep ? (
            <Button onClick={goNext} className="bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white rounded-full px-8">
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button variant="outline" onClick={() => onSave(preparePayload(), "draft")}
                disabled={saving || !isValid}
                className="rounded-full px-6 sm:px-8 border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225]">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save draft
              </Button>
              <Button onClick={() => onSave(preparePayload(), "published")}
                disabled={saving || !isValid}
                className="rounded-full px-6 sm:px-8 bg-[#0a2225] hover:bg-[#0a2225]/90 text-white">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submit for review
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
