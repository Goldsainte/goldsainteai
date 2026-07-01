import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PenLine, Star, CirclePlus, Plus, X, Check } from "lucide-react";

type ServiceTier = "custom_itinerary" | "full_trip_design" | "add_on";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  onCreated: () => void;
  editService?: any;
  initialTier?: ServiceTier | null;
}

const TIERS: { value: ServiceTier; label: string; desc: string; icon: any; color: string }[] = [
  { value: "custom_itinerary", label: "Custom Itinerary", desc: "Personalized day-by-day plans", icon: PenLine, color: "text-[#0c4d47] bg-[#FDF9F0] border-[#E5DFC6]" },
  { value: "full_trip_design", label: "Full Trip Design", desc: "Premium end-to-end trip planning", icon: Star, color: "text-[#0c4d47] bg-[#FDF9F0] border-[#E5DFC6]" },
  { value: "add_on", label: "Add-On", desc: "Optional extras like 1:1 calls", icon: CirclePlus, color: "text-[#0c4d47] bg-[#FDF9F0] border-[#E5DFC6]" },
];

const DELIVERY_OPTIONS = ["2 days", "3 days", "5 days", "7 days", "14 days"];

const PRESET_REQUIREMENTS = [
  "Travel dates",
  "Number of travelers",
  "Budget range",
  "Must-see destinations or activities",
  "Dietary restrictions",
  "Accommodation preferences",
];

export function AddServiceDialog({ open, onOpenChange, creatorId, onCreated, editService, initialTier }: Props) {
  const isEdit = !!editService;
  const [tier, setTier] = useState<ServiceTier | null>(editService?.service_tier || initialTier || null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const STEPS = ["Overview", "Pricing", "Requirements", "Description"];

  // Sync tier when dialog opens with a new initialTier (e.g. from empty-state cards)
  useEffect(() => {
    if (open && !isEdit) {
      setTier(initialTier || null);
    }
  }, [open, initialTier, isEdit]);

  // Form fields
  const [title, setTitle] = useState(editService?.title || "");
  const [description, setDescription] = useState(editService?.description || "");
  const [price, setPrice] = useState(editService ? String(editService.starting_price_cents / 100) : "");
  const [deliveryOption, setDeliveryOption] = useState(editService?.delivery_time_option || "5 days");
  const [tripDays, setTripDays] = useState(editService?.trip_days ? String(editService.trip_days) : "");
  const [revisions, setRevisions] = useState(editService?.revisions ? String(editService.revisions) : "2");
  const [hasPriority, setHasPriority] = useState(editService?.has_priority_support || false);
  const [durationMinutes, setDurationMinutes] = useState(editService?.duration_minutes ? String(editService.duration_minutes) : "30");
  const [fileUrl, setFileUrl] = useState(editService?.file_url || "");
  const [includes, setIncludes] = useState<string[]>(editService?.includes || []);
  const [newInclude, setNewInclude] = useState("");
  const [requirements, setRequirements] = useState<string[]>(editService?.requirements || []);
  const [customRequirement, setCustomRequirement] = useState("");
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>(editService?.faq || []);

  function reset() {
    setTier(null);
    setStep(0);
    setTitle("");
    setDescription("");
    setPrice("");
    setDeliveryOption("5 days");
    setTripDays("");
    setRevisions("2");
    setHasPriority(false);
    setDurationMinutes("30");
    setFileUrl("");
    setIncludes([]);
    setNewInclude("");
    setRequirements([]);
    setCustomRequirement("");
    setFaq([]);
  }

  async function handleSave() {
    if (!tier || !title || !price) {
      toast.error("Please fill in the required fields");
      return;
    }
    setSaving(true);
    const payload: any = {
      creator_id: creatorId,
      service_tier: tier,
      title,
      description: description || null,
      starting_price_cents: Math.round(Number(price) * 100),
      currency: "USD",
      includes: includes.length > 0 ? includes : [],
      is_active: true,
      delivery_time_option: tier !== "add_on" ? deliveryOption : null,
      delivery_days: tier !== "add_on" ? parseInt(deliveryOption) || null : null,
      trip_days: ["custom_itinerary", "full_trip_design"].includes(tier) ? (parseInt(tripDays) || null) : null,
      revisions: ["custom_itinerary", "full_trip_design"].includes(tier) ? (parseInt(revisions) || 0) : null,
      has_priority_support: tier === "full_trip_design" ? hasPriority : false,
      duration_minutes: tier === "add_on" ? (parseInt(durationMinutes) || null) : null,
      file_url: null,
      requirements: requirements.length > 0 ? requirements : [],
      faq: faq.filter((f) => f.question.trim() && f.answer.trim()),
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("creator_services").update(payload).eq("id", editService.id));
    } else {
      ({ error } = await supabase.from("creator_services").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error("Failed to save service");
      console.error(error);
      return;
    }
    toast.success(isEdit ? "Service updated" : "Service created");
    reset();
    onOpenChange(false);
    onCreated();
  }

  function addInclude() {
    if (newInclude.trim()) {
      setIncludes([...includes, newInclude.trim()]);
      setNewInclude("");
    }
  }

  function toggleRequirement(label: string) {
    setRequirements((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label]
    );
  }

  function addCustomRequirement() {
    if (customRequirement.trim() && !requirements.includes(customRequirement.trim())) {
      setRequirements([...requirements, customRequirement.trim()]);
      setCustomRequirement("");
    }
  }

  function addFaqItem() {
    setFaq([...faq, { question: "", answer: "" }]);
  }

  function updateFaqItem(index: number, field: "question" | "answer", value: string) {
    setFaq(faq.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function removeFaqItem(index: number) {
    setFaq(faq.filter((_, i) => i !== index));
  }

  const selectedTier = TIERS.find((t) => t.value === tier);
  const isItineraryTier = tier === "custom_itinerary" || tier === "full_trip_design";

  function goNext() {
    if (step === 0 && (!title || !price)) {
      toast.error("Title and price are required");
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSave();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-secondary text-xl text-[#0a2225]">
            {isEdit ? "Edit Service" : "Add a Service"}
          </DialogTitle>
        </DialogHeader>

        {/* Tier selection gates entry into the wizard */}
        {!tier && !isEdit && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {TIERS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTier(t.value)}
                className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${t.color}`}
              >
                <t.icon className="h-5 w-5" />
                <span className="font-semibold text-sm">{t.label}</span>
                <span className="text-xs opacity-70">{t.desc}</span>
              </button>
            ))}
          </div>
        )}

        {tier && (
          <>
            {/* Stepper */}
            <div className="pb-2">
              {selectedTier && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${selectedTier.color}`}>
                  <selectedTier.icon className="h-3.5 w-3.5" />
                  {selectedTier.label}
                  {!isEdit && (
                    <button onClick={() => setTier(null)} className="ml-1 opacity-60 hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                          i === step
                            ? "bg-[#0c4d47] text-white"
                            : i < step
                            ? "bg-[#C7A962] text-[#0a2225]"
                            : "bg-[#E5DFC6] text-[#9CA3AF]"
                        }`}
                      >
                        {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className={`text-[9px] font-semibold uppercase tracking-wide mt-1 ${i === step ? "text-[#0c4d47]" : "text-[#9CA3AF]"}`}>
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < step ? "bg-[#C7A962]" : "bg-[#E5DFC6]"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* STEP 0: Overview */}
              {step === 0 && (
                <>
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] mb-1 block">Title *</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Custom Italy Itinerary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] mb-1 block">Description</label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this service" rows={3} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] mb-1 block">Price (USD) *</label>
                    <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="99" />
                  </div>
                </>
              )}

              {/* STEP 1: Pricing & Delivery */}
              {step === 1 && (
                <>
                  {isItineraryTier && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#6B7280] mb-1 block">Delivery Time</label>
                          <select
                            value={deliveryOption}
                            onChange={(e) => setDeliveryOption(e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            {DELIVERY_OPTIONS.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6B7280] mb-1 block">Trip Days</label>
                          <Input type="number" min="1" value={tripDays} onChange={(e) => setTripDays(e.target.value)} placeholder="7" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6B7280] mb-1 block">Revisions Included</label>
                        <Input type="number" min="0" value={revisions} onChange={(e) => setRevisions(e.target.value)} placeholder="2" />
                      </div>
                    </>
                  )}

                  {tier === "full_trip_design" && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPriority}
                        onChange={(e) => setHasPriority(e.target.checked)}
                        className="rounded border-[#E5DFC6]"
                      />
                      <span className="text-[#0a2225]">Priority Support included</span>
                    </label>
                  )}

                  {tier === "add_on" && (
                    <div>
                      <label className="text-xs font-medium text-[#6B7280] mb-1 block">Duration (minutes)</label>
                      <Input type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="30" />
                    </div>
                  )}

                  {!isItineraryTier && tier !== "add_on" && (
                    <p className="text-sm text-[#9CA3AF]">No additional pricing details needed for this tier.</p>
                  )}
                </>
              )}

              {/* STEP 2: Requirements */}
              {step === 2 && (
                <div>
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">
                    What You'll Need From the Traveler
                  </label>
                  <p className="text-xs text-[#9CA3AF] mb-2">
                    Collected automatically when they book, before you start work.
                  </p>
                  <div className="space-y-1.5 mb-2">
                    {PRESET_REQUIREMENTS.map((label) => (
                      <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requirements.includes(label)}
                          onChange={() => toggleRequirement(label)}
                          className="rounded border-[#E5DFC6]"
                        />
                        <span className="text-[#0a2225]">{label}</span>
                      </label>
                    ))}
                  </div>
                  {requirements.filter((r) => !PRESET_REQUIREMENTS.includes(r)).length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {requirements
                        .filter((r) => !PRESET_REQUIREMENTS.includes(r))
                        .map((item) => (
                          <div key={item} className="flex items-center gap-2 text-sm text-[#0a2225]">
                            <Check className="h-3.5 w-3.5 text-[#C7A962] shrink-0" />
                            <span className="flex-1">{item}</span>
                            <button onClick={() => toggleRequirement(item)} className="text-[#9CA3AF] hover:text-red-500">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={customRequirement}
                      onChange={(e) => setCustomRequirement(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomRequirement())}
                      placeholder="Add a custom question…"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addCustomRequirement} className="shrink-0 border-[#E5DFC6]">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: What's Included & FAQ */}
              {step === 3 && (
                <>
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] mb-1 block">What's Included</label>
                    <div className="space-y-1.5 mb-2">
                      {includes.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-[#0a2225]">
                          <Check className="h-3.5 w-3.5 text-[#C7A962] shrink-0" />
                          <span className="flex-1">{item}</span>
                          <button onClick={() => setIncludes(includes.filter((_, j) => j !== i))} className="text-[#9CA3AF] hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newInclude}
                        onChange={(e) => setNewInclude(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())}
                        placeholder="e.g. Day-by-day itinerary"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addInclude} className="shrink-0 border-[#E5DFC6]">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#6B7280] mb-1 block">FAQ</label>
                    <p className="text-xs text-[#9CA3AF] mb-2">Answer common questions before they're asked.</p>
                    <div className="space-y-3 mb-2">
                      {faq.map((item, i) => (
                        <div key={i} className="rounded-lg border border-[#E5DFC6] bg-[#FDF9F0] p-3 space-y-2">
                          <Input
                            value={item.question}
                            onChange={(e) => updateFaqItem(i, "question", e.target.value)}
                            placeholder="Question"
                          />
                          <Textarea
                            value={item.answer}
                            onChange={(e) => updateFaqItem(i, "answer", e.target.value)}
                            placeholder="Answer"
                            rows={2}
                          />
                          <button
                            onClick={() => removeFaqItem(i)}
                            className="text-xs font-medium text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addFaqItem} className="w-full border-[#E5DFC6]">
                      <Plus className="h-4 w-4 mr-1" /> Add FAQ item
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between -mx-6 px-6 pt-4 pb-1 mt-2 border-t border-[#E5DFC6]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="border-[#E5DFC6] rounded-full"
              >
                Back
              </Button>
              <span className="text-xs font-semibold text-[#9CA3AF]">
                Step {step + 1} of {STEPS.length}
              </span>
              <Button
                onClick={goNext}
                disabled={saving || (step === 0 && (!title || !price))}
                className={
                  step === STEPS.length - 1
                    ? "bg-[#C7A962] hover:bg-[#b6975a] text-[#0a2225] rounded-full font-semibold"
                    : "bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full"
                }
              >
                {step === STEPS.length - 1
                  ? saving
                    ? "Saving…"
                    : isEdit
                    ? "Update Service"
                    : "Add Service"
                  : "Next"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
