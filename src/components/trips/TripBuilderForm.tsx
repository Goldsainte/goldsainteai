import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Send, Plus, X, ImagePlus, Loader2 } from "lucide-react";
import { ArrayFieldEditor } from "./ArrayFieldEditor";
import { TripImageUploader } from "./TripImageUploader";

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

// Luxury form styling classes
const labelClasses = "text-[11px] sm:text-xs uppercase tracking-wider text-[#6B7280] font-medium";
const inputClasses = "rounded-xl h-12 border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all";
const textareaClasses = "rounded-xl border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all";
const selectTriggerClasses = "rounded-xl h-12 border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20";

export function TripBuilderForm({ initialData, onSave, saving, isEditing }: TripBuilderFormProps) {
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
      });
    }
  }, [initialData]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media" className="mt-8 space-y-8">
          <Card className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-0.5 bg-[#C7A962] mb-3" />
              <CardTitle className="font-secondary text-xl text-[#0a2225]">Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              <TripImageUploader
                currentUrl={formData.cover_image_url}
                onUpload={(url) => updateField("cover_image_url", url)}
                label="Upload a stunning cover image"
              />
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
                    />
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
          Publish Trip
        </Button>
      </div>
    </div>
  );
}