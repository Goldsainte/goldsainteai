import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Send, Plus, X, ImagePlus, Loader2, Shuffle, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrayFieldEditor } from "./ArrayFieldEditor";
import { TripImageUploader } from "./TripImageUploader";
import { Checkbox } from "@/components/ui/checkbox";
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
  "Wellness", "Culinary", "Romantic", "Family", "Solo", "Group"
];

const ACTIVITY_LEVELS = ["Easy", "Moderate", "Active", "Challenging"];

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD"];

const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German", "Italian", "Japanese", "Arabic", "Portuguese", "Mandarin", "Other"];
const ACCOMMODATION_TYPES = ["Boutique Hotel", "Luxury Resort", "Hostel", "Camping", "Mixed", "Villa", "Cruise"];
const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const DAY_MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner"];

export type ItineraryDay = {
  day_number: number;
  title: string;
  description: string;
  activities: string[];
  accommodation: string;
  meals_included: string[];
  is_featured_day: boolean;
};

// Luxury form styling classes
const labelClasses = "text-[11px] sm:text-xs uppercase tracking-wider text-[#6B7280] font-medium";
const inputClasses = "rounded-xl h-10 sm:h-12 text-sm sm:text-base border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all";
const textareaClasses = "rounded-xl border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all";
const selectTriggerClasses = "rounded-xl h-10 sm:h-12 text-sm sm:text-base border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20";

export function TripBuilderForm({ initialData, onSave, saving, isEditing }: TripBuilderFormProps) {
  const [suggestingCover, setSuggestingCover] = useState(false);
  const [coverSuggested, setCoverSuggested] = useState(false);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [departureMode, setDepartureMode] = useState<"flexible" | "fixed">("flexible");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    destination: "",
    price_per_person: "",
    original_price: "",
    currency: "USD",
    duration_days: "",
    duration_nights: "",
    cover_image_url: "",
    image_gallery: [] as string[],
    video_url: "",
    max_participants: "",
    min_participants: "1",
    trip_type: "",
    activity_level: "",
    tags: [] as string[],
    highlights: [] as string[],
    included: [] as string[],
    not_included: [] as string[],
    available_from: "",
    available_until: "",
    deposit_percentage: "30",
    passport_required: true,
    visa_required: false,
    vaccination_required: false,
    fitness_level_required: "",
    cancellation_policy: "",
    refund_policy: "",
    terms_conditions: "",
    host_tagline: "",
    group_size_note: "",
    recommended_arrival_airport: "",
    recommended_departure_airport: "",
    faqs: [] as { question: string; answer: string }[],
    languages: [] as string[],
    minimum_age: "",
    accommodation_type: "",
    meals_included: [] as string[],
    departure_dates: [] as string[],
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
      });
      const incomingDeparture = Array.isArray(initialData.departure_dates) ? initialData.departure_dates : [];
      setDepartureMode(incomingDeparture.length > 0 ? "fixed" : "flexible");
      if (Array.isArray(initialData.itinerary_days)) {
        setItineraryDays(initialData.itinerary_days);
      }
    }
  }, [initialData]);

  // Auto-resize itinerary days array based on duration_days
  useEffect(() => {
    const days = parseInt(formData.duration_days) || 0;
    if (days <= 0) return;
    setItineraryDays((prev) => {
      if (prev.length === days) return prev;
      if (prev.length < days) {
        const additions: ItineraryDay[] = [];
        for (let i = prev.length; i < days; i++) {
          additions.push({
            day_number: i + 1,
            title: "",
            description: "",
            activities: [],
            accommodation: "",
            meals_included: [],
            is_featured_day: false,
          });
        }
        return [...prev, ...additions];
      }
      return prev.slice(0, days);
    });
  }, [formData.duration_days]);

  const updateDay = (idx: number, patch: Partial<ItineraryDay>) => {
    setItineraryDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const toggleArrayValue = (field: "languages" | "meals_included", value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const toggleDayMeal = (idx: number, meal: string) => {
    setItineraryDays((prev) => prev.map((d, i) => {
      if (i !== idx) return d;
      const has = d.meals_included.includes(meal);
      return { ...d, meals_included: has ? d.meals_included.filter((m) => m !== meal) : [...d.meals_included, meal] };
    }));
  };

  const addDepartureDate = (date: Date | undefined) => {
    if (!date) return;
    const iso = format(date, "yyyy-MM-dd");
    setFormData((prev) => prev.departure_dates.includes(iso)
      ? prev
      : { ...prev, departure_dates: [...prev.departure_dates, iso].sort() });
  };

  const removeDepartureDate = (iso: string) => {
    setFormData((prev) => ({ ...prev, departure_dates: prev.departure_dates.filter((d) => d !== iso) }));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const suggestCoverImage = async (dest?: string) => {
    const destination = dest || formData.destination;
    if (!destination?.trim()) return;
    
    setSuggestingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke("select-trip-cover", {
        body: { destination },
      });
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

  // Auto-suggest cover when destination changes and no cover is set
  useEffect(() => {
    if (formData.destination?.trim() && !formData.cover_image_url && !coverSuggested && !initialData?.cover_image_url) {
      const timer = setTimeout(() => suggestCoverImage(formData.destination), 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.destination]);

  const preparePayload = () => {
    return {
      title: formData.title,
      description: formData.description,
      destination: formData.destination,
      price_per_person: parseFloat(formData.price_per_person) || 0,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      currency: formData.currency,
      duration_days: parseInt(formData.duration_days) || 1,
      duration_nights: formData.duration_nights ? parseInt(formData.duration_nights) : null,
      cover_image_url: formData.cover_image_url,
      image_gallery: formData.image_gallery,
      video_url: formData.video_url || null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      min_participants: parseInt(formData.min_participants) || 1,
      trip_type: formData.trip_type || null,
      activity_level: formData.activity_level || null,
      tags: formData.tags,
      highlights: formData.highlights,
      included: formData.included,
      not_included: formData.not_included,
      available_from: formData.available_from || null,
      available_until: formData.available_until || null,
      deposit_percentage: parseInt(formData.deposit_percentage) || 30,
      passport_required: formData.passport_required,
      visa_required: formData.visa_required,
      vaccination_required: formData.vaccination_required,
      fitness_level_required: formData.fitness_level_required || null,
      cancellation_policy: formData.cancellation_policy || null,
      refund_policy: formData.refund_policy || null,
      terms_conditions: formData.terms_conditions || null,
      host_tagline: formData.host_tagline || null,
      group_size_note: formData.group_size_note || null,
      recommended_arrival_airport: formData.recommended_arrival_airport || null,
      recommended_departure_airport: formData.recommended_departure_airport || null,
      faqs: formData.faqs,
      languages: formData.languages,
      minimum_age: formData.minimum_age ? parseInt(formData.minimum_age) : null,
      accommodation_type: formData.accommodation_type || null,
      meals_included: formData.meals_included,
      departure_dates: departureMode === "fixed" ? formData.departure_dates : [],
      itinerary_days: itineraryDays,
    };
  };

  const isValid = formData.title && formData.destination && formData.price_per_person && formData.duration_days;

  return (
    <div className="space-y-8">
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="w-full bg-[#FDF9F0] border-none rounded-xl sm:rounded-full p-1 sm:p-1.5 h-auto flex overflow-x-auto gap-1 scrollbar-hide">
          <TabsTrigger 
            value="basics" 
            className="rounded-full px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0a2225] data-[state=inactive]:text-[#6B7280] transition-all"
          >
            Basics
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="rounded-full px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0a2225] data-[state=inactive]:text-[#6B7280] transition-all"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="itinerary"
            className="rounded-full px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0a2225] data-[state=inactive]:text-[#6B7280] transition-all"
          >
            Itinerary
          </TabsTrigger>
          <TabsTrigger 
            value="media" 
            className="rounded-full px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0a2225] data-[state=inactive]:text-[#6B7280] transition-all"
          >
            Media
          </TabsTrigger>
          <TabsTrigger 
            value="requirements" 
            className="rounded-full px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0a2225] data-[state=inactive]:text-[#6B7280] transition-all"
          >
            Requirements
          </TabsTrigger>
          <TabsTrigger 
            value="policies" 
            className="rounded-full px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0a2225] data-[state=inactive]:text-[#6B7280] transition-all"
          >
            Policies
          </TabsTrigger>
        </TabsList>

        {/* BASICS TAB */}
        <TabsContent value="basics" className="mt-8 space-y-8">
          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className={labelClasses}>Trip Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g., Amalfi Coast Long Weekend"
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Host Tagline</Label>
                <Input
                  value={formData.host_tagline}
                  onChange={(e) => updateField("host_tagline", e.target.value)}
                  placeholder="e.g., Curated by a local Italy expert"
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Destination *</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) => updateField("destination", e.target.value)}
                  placeholder="e.g., Amalfi Coast, Italy"
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe this trip experience..."
                  rows={4}
                  className={textareaClasses}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Trip Type</Label>
                  <Select value={formData.trip_type} onValueChange={(v) => updateField("trip_type", v)}>
                    <SelectTrigger className={selectTriggerClasses}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                      {TRIP_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="focus:bg-[#FDF9F0]">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Activity Level</Label>
                  <Select value={formData.activity_level} onValueChange={(v) => updateField("activity_level", v)}>
                    <SelectTrigger className={selectTriggerClasses}>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                      {ACTIVITY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level} className="focus:bg-[#FDF9F0]">{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Pricing & Duration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Price per Person *</Label>
                  <Input
                    type="number"
                    value={formData.price_per_person}
                    onChange={(e) => updateField("price_per_person", e.target.value)}
                    placeholder="2500"
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Original Price</Label>
                  <Input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => updateField("original_price", e.target.value)}
                    placeholder="For showing discounts"
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => updateField("currency", v)}>
                    <SelectTrigger className={selectTriggerClasses}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c} className="focus:bg-[#FDF9F0]">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Duration (Days) *</Label>
                  <Input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => updateField("duration_days", e.target.value)}
                    placeholder="5"
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Duration (Nights)</Label>
                  <Input
                    type="number"
                    value={formData.duration_nights}
                    onChange={(e) => updateField("duration_nights", e.target.value)}
                    placeholder="4"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Min Participants</Label>
                  <Input
                    type="number"
                    value={formData.min_participants}
                    onChange={(e) => updateField("min_participants", e.target.value)}
                    placeholder="1"
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Max Participants</Label>
                  <Input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => updateField("max_participants", e.target.value)}
                    placeholder="12"
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Deposit %</Label>
                  <Input
                    type="number"
                    value={formData.deposit_percentage}
                    onChange={(e) => updateField("deposit_percentage", e.target.value)}
                    placeholder="30"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Group Size Note</Label>
                <Input
                  value={formData.group_size_note}
                  onChange={(e) => updateField("group_size_note", e.target.value)}
                  placeholder="e.g., Small intimate group of 6-12 travelers"
                  className={inputClasses}
                />
              </div>
            </CardContent>
          </Card>

          {/* Languages, minimum age, accommodation type */}
          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Languages & Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className={labelClasses}>Language of Tour</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const active = formData.languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleArrayValue("languages", lang)}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-xs border transition-colors",
                          active
                            ? "bg-[#0c4d47] text-white border-[#0c4d47]"
                            : "bg-white text-[#0a2225] border-[#E5DFC6] hover:border-[#C7A962]"
                        )}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Minimum age requirement (leave blank if none)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.minimum_age}
                    onChange={(e) => updateField("minimum_age", e.target.value)}
                    placeholder="e.g., 18"
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Accommodation Type</Label>
                  <Select value={formData.accommodation_type} onValueChange={(v) => updateField("accommodation_type", v)}>
                    <SelectTrigger className={selectTriggerClasses}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                      {ACCOMMODATION_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="focus:bg-[#FDF9F0]">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="mt-8 space-y-8">
          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">Trip Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <ArrayFieldEditor
                items={formData.highlights}
                onChange={(items) => updateField("highlights", items)}
                placeholder="Add a highlight (e.g., Private boat tour of the coastline)"
              />
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ArrayFieldEditor
                items={formData.included}
                onChange={(items) => updateField("included", items)}
                placeholder="Add an inclusion (e.g., 4 nights accommodation)"
              />
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">What's Not Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ArrayFieldEditor
                items={formData.not_included}
                onChange={(items) => updateField("not_included", items)}
                placeholder="Add an exclusion (e.g., Flights to/from destination)"
              />
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <ArrayFieldEditor
                items={formData.tags}
                onChange={(items) => updateField("tags", items)}
                placeholder="Add a tag (e.g., foodie, couples, photography)"
              />
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">Meals Included</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MEAL_OPTIONS.map((meal) => {
                  const active = formData.meals_included.includes(meal);
                  return (
                    <label
                      key={meal}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
                        active ? "bg-[#FDF9F0] border-[#C7A962]" : "bg-white border-[#E5DFC6] hover:border-[#C7A962]/50"
                      )}
                    >
                      <Checkbox checked={active} onCheckedChange={() => toggleArrayValue("meals_included", meal)} />
                      <span className="text-sm text-[#0a2225]">{meal}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ITINERARY TAB */}
        <TabsContent value="itinerary" className="mt-8 space-y-6">
          {itineraryDays.length === 0 ? (
            <Card className="border-none bg-white rounded-2xl shadow-sm">
              <CardContent className="py-12 text-center text-sm text-[#6B7280]">
                Set the trip duration in the Basics tab to start building your day-by-day itinerary.
              </CardContent>
            </Card>
          ) : (
            itineraryDays.map((day, idx) => (
              <Card key={idx} className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="w-10 h-0.5 bg-[#C7A962] mb-2" />
                      <CardTitle className="font-secondary text-xl text-[#0a2225]">Day {day.day_number}</CardTitle>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <span>Featured day</span>
                      <Switch
                        checked={day.is_featured_day}
                        onCheckedChange={(v) => updateDay(idx, { is_featured_day: v })}
                      />
                    </label>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Title</Label>
                    <Input
                      value={day.title}
                      onChange={(e) => updateDay(idx, { title: e.target.value })}
                      placeholder={`e.g., Arrival in ${formData.destination || "destination"}`}
                      className={inputClasses}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Description</Label>
                    <Textarea
                      value={day.description}
                      onChange={(e) => updateDay(idx, { description: e.target.value })}
                      placeholder="Describe the day's experience..."
                      rows={3}
                      className={textareaClasses}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Activities</Label>
                    <ArrayFieldEditor
                      items={day.activities}
                      onChange={(items) => updateDay(idx, { activities: items })}
                      placeholder="Add an activity (e.g., Morning game drive)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={labelClasses}>Accommodation</Label>
                      <Input
                        value={day.accommodation}
                        onChange={(e) => updateDay(idx, { accommodation: e.target.value })}
                        placeholder="e.g., Angama Mara Lodge"
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClasses}>Meals Included</Label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {DAY_MEAL_OPTIONS.map((meal) => {
                          const active = day.meals_included.includes(meal);
                          return (
                            <button
                              key={meal}
                              type="button"
                              onClick={() => toggleDayMeal(idx, meal)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs border transition-colors",
                                active
                                  ? "bg-[#0c4d47] text-white border-[#0c4d47]"
                                  : "bg-white text-[#0a2225] border-[#E5DFC6] hover:border-[#C7A962]"
                              )}
                            >
                              {meal}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media" className="mt-8 space-y-8">
          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TripImageUploader
                currentUrl={formData.cover_image_url}
                onUpload={(url) => { updateField("cover_image_url", url); setCoverSuggested(false); }}
                label="Upload a stunning cover image"
              />
              {formData.destination?.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => suggestCoverImage()}
                  disabled={suggestingCover}
                  className="rounded-full border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#6B7280]"
                >
                  {suggestingCover ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shuffle className="h-4 w-4 mr-2" />
                  )}
                  {formData.cover_image_url ? "Shuffle Cover" : "Auto-suggest Cover"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">Image Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.image_gallery.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-[#E5DFC6]"
                    loading="lazy"/>
                    <button
                      onClick={() => {
                        const newGallery = [...formData.image_gallery];
                        newGallery.splice(idx, 1);
                        updateField("image_gallery", newGallery);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <TripImageUploader
                  onUpload={(url) => updateField("image_gallery", [...formData.image_gallery, url])}
                  compact
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className={labelClasses}>Video URL (YouTube or Vimeo)</Label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => updateField("video_url", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className={inputClasses}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REQUIREMENTS TAB */}
        <TabsContent value="requirements" className="mt-8 space-y-8">
          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">Travel Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 bg-[#FDF9F0] rounded-xl">
                  <Label className={labelClasses}>Passport Required</Label>
                  <Switch
                    checked={formData.passport_required}
                    onCheckedChange={(v) => updateField("passport_required", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-[#FDF9F0] rounded-xl">
                  <Label className={labelClasses}>Visa Required</Label>
                  <Switch
                    checked={formData.visa_required}
                    onCheckedChange={(v) => updateField("visa_required", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-[#FDF9F0] rounded-xl">
                  <Label className={labelClasses}>Vaccination Required</Label>
                  <Switch
                    checked={formData.vaccination_required}
                    onCheckedChange={(v) => updateField("vaccination_required", v)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Fitness Level Required</Label>
                <Input
                  value={formData.fitness_level_required}
                  onChange={(e) => updateField("fitness_level_required", e.target.value)}
                  placeholder="e.g., Moderate fitness for walking tours"
                  className={inputClasses}
                />
              </div>
            </CardContent>
          </Card>

          {/* Departure Dates */}
          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Departure Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <RadioGroup
                value={departureMode}
                onValueChange={(v) => setDepartureMode(v as "flexible" | "fixed")}
                className="space-y-3"
              >
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
                      <Button
                        variant="outline"
                        className="rounded-full border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225]"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Add a departure date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        mode="single"
                        onSelect={addDepartureDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  {formData.departure_dates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.departure_dates.map((iso) => (
                        <span
                          key={iso}
                          className="inline-flex items-center gap-2 rounded-full bg-[#FDF9F0] border border-[#E5DFC6] px-3 py-1.5 text-xs text-[#0a2225]"
                        >
                          {format(new Date(iso), "MMM d, yyyy")}
                          <button
                            type="button"
                            onClick={() => removeDepartureDate(iso)}
                            className="text-[#6B7280] hover:text-red-500"
                          >
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
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Airport Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Recommended Arrival Airport</Label>
                  <Input
                    value={formData.recommended_arrival_airport}
                    onChange={(e) => updateField("recommended_arrival_airport", e.target.value)}
                    placeholder="e.g., Naples (NAP)"
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Recommended Departure Airport</Label>
                  <Input
                    value={formData.recommended_departure_airport}
                    onChange={(e) => updateField("recommended_departure_airport", e.target.value)}
                    placeholder="e.g., Rome Fiumicino (FCO)"
                    className={inputClasses}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Available From</Label>
                  <Input
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => updateField("available_from", e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Available Until</Label>
                  <Input
                    type="date"
                    value={formData.available_until}
                    onChange={(e) => updateField("available_until", e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POLICIES TAB */}
        <TabsContent value="policies" className="mt-8 space-y-8">
          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.cancellation_policy}
                onChange={(e) => updateField("cancellation_policy", e.target.value)}
                placeholder="Describe your cancellation policy..."
                rows={4}
                className={textareaClasses}
              />
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Refund Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.refund_policy}
                onChange={(e) => updateField("refund_policy", e.target.value)}
                placeholder="Describe your refund policy..."
                rows={4}
                className={textareaClasses}
              />
            </CardContent>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-lg sm:text-xl text-[#0a2225]">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.terms_conditions}
                onChange={(e) => updateField("terms_conditions", e.target.value)}
                placeholder="Additional terms and conditions..."
                rows={4}
                className={textareaClasses}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-6 border-t border-[#E5DFC6]">
        <Button
          variant="outline"
          onClick={() => onSave(preparePayload(), "draft")}
          disabled={saving || !isValid}
          className="rounded-full px-6 sm:px-8 py-2.5 w-full sm:w-auto border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225] transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button
          onClick={() => onSave(preparePayload(), "published")}
          disabled={saving || !isValid}
          className="rounded-full px-6 sm:px-8 py-2.5 w-full sm:w-auto bg-[#0a2225] hover:bg-[#0a2225]/90 text-white transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Submit for Review
        </Button>
      </div>
    </div>
  );
}