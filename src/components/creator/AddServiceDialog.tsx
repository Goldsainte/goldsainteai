import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PenLine, Star, CirclePlus, Plus, X, Check, Plane } from "lucide-react";

type ServiceTier = "custom_itinerary" | "full_trip_design" | "add_on" | "on_trip";

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
  { value: "on_trip", label: "On-Trip", desc: "Join the traveler on their trip, priced per day", icon: Plane, color: "text-[#0c4d47] bg-[#FDF9F0] border-[#E5DFC6]" },
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

// Matches the mockup's .field input styling exactly: cream bg, tan border, 10px radius
const FIELD_CLASS = "bg-[#FDF9F0] border-[#E5DFC6] rounded-[10px] focus-visible:ring-[#0c4d47]/30";

export function AddServiceDialog({ open, onOpenChange, creatorId, onCreated, editService, initialTier }: Props) {
  const isEdit = !!editService;
  const [tier, setTier] = useState<ServiceTier | null>(editService?.service_tier || initialTier || null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const STEPS = ["Overview", "Pricing", "Requirements", "Description"];

  useEffect(() => {
    if (open && !isEdit) {
      setTier(initialTier || null);
    }
  }, [open, initialTier, isEdit]);

  const [title, setTitle] = useState(editService?.title || "");
  const [description, setDescription] = useState(editService?.description || "");
  const [price, setPrice] = useState(editService ? String(editService.starting_price_cents / 100) : "");
  type ExpenseWho = "traveler" | "creator" | "split";
  const [expenseTravel, setExpenseTravel] = useState<ExpenseWho | null>((editService as any)?.expense_travel ?? null);
  const [expenseLodging, setExpenseLodging] = useState<ExpenseWho | null>((editService as any)?.expense_lodging ?? null);
  const [expenseMeals, setExpenseMeals] = useState<ExpenseWho | null>((editService as any)?.expense_meals ?? null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiVersions, setAiVersions] = useState<string[]>([]);

  // "Write it with AI" — rides the live ai-content-tools `rewrite` tool
  // (anti-fabrication spine, 30/hr limit). One helper serves every free-text
  // field in this wizard; suggestions render under whichever field asked.
  const [aiTarget, setAiTarget] = useState<string | null>(null);
  async function aiSuggest(target: string, seed: string, tone: string) {
    setAiBusy(true);
    setAiTarget(target);
    setAiVersions([]);
    const { data, error } = await supabase.functions.invoke("ai-content-tools", {
      body: { tool: "rewrite", description: seed, tone },
    });
    setAiBusy(false);
    if (error || (data as any)?.error) {
      toast.error("Couldn't write suggestions" + (error?.message ? ": " + error.message : ""));
      setAiTarget(null);
      return;
    }
    setAiVersions((((data as any).versions || []) as string[]).slice(0, 3));
  }
  const tierHint =
    tier === "on_trip"
      ? "I join travelers on their own trip as their host \u2014 guiding the days and creating content as we go."
      : tier === "add_on"
      ? "A focused add-on travelers can book alongside a trip."
      : "A personalized travel-planning service.";
  function suggestTitle() {
    aiSuggest("title", `A service title of three to six words, no punctuation, for: ${description.trim() || tierHint}`,
      "a short editorial service title, three to six words, title case, no quotes");
  }
  function suggestDescription() {
    aiSuggest("description", description.trim() || `${title.trim()}. ${tierHint}`,
      "editorial, warm, specific \u2014 a premium travel service, two sentences, no hype words");
  }
  function suggestFaqAnswer(i: number) {
    aiSuggest(`faq-${i}`,
      `Answer this traveler question in one to two plain sentences for the service "${title.trim()}": ${faq[i].question.trim()}`,
      "plain, direct, reassuring \u2014 one to two sentences, no hype");
  }
  function applySuggestion(v: string) {
    if (aiTarget === "title") setTitle(v.replace(/^["']|["']$/g, ""));
    else if (aiTarget === "description") setDescription(v);
    else if (aiTarget?.startsWith("faq-")) {
      const i = Number(aiTarget.split("-")[1]);
      updateFaqItem(i, "answer", v);
    }
    setAiVersions([]);
    setAiTarget(null);
  }
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
      expense_travel: tier === "on_trip" ? expenseTravel : null,
      expense_lodging: tier === "on_trip" ? expenseLodging : null,
      expense_meals: tier === "on_trip" ? expenseMeals : null,
      delivery_time_option: tier === "custom_itinerary" || tier === "full_trip_design" ? deliveryOption : null,
      delivery_days: tier === "custom_itinerary" || tier === "full_trip_design" ? parseInt(deliveryOption) || null : null,
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
      ({ error } = await supabase.from("creator_services").update(payload as any).eq("id", editService.id));
    } else {
      ({ error } = await supabase.from("creator_services").insert(payload as any));
    }

    setSaving(false);
    if (error) {
      toast.error("Failed to save service" + (error?.message ? ": " + error.message : ""));
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

  const aiPanel = (target: string) =>
    aiTarget === target && aiVersions.length > 0 ? (
      <div className="mt-2 space-y-1.5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#8D6B2F]">Tap one to use it</p>
        {aiVersions.map((v, i) => (
          <button key={i} type="button" onClick={() => applySuggestion(v)}
            className="block w-full rounded-lg border border-[#E5DFC6] bg-white px-3 py-2 text-left text-sm leading-snug text-[#0a2225] transition-colors hover:border-[#C7A962] !min-h-0">
            {v}
          </button>
        ))}
      </div>
    ) : null;
  const aiLink = (label: string, onClick: () => void, disabled: boolean) => (
    <button type="button" disabled={aiBusy || disabled} onClick={onClick}
      className="text-xs font-semibold text-[#0c4d47] disabled:opacity-40 hover:underline !min-h-0 !min-w-0">
      {aiBusy ? "Writing\u2026" : label}
    </button>
  );
  const isItineraryTier = tier === "custom_itinerary" || tier === "full_trip_design";

  function goNext() {
    if (step === 1 && tier === "on_trip" && (!expenseTravel || !expenseLodging || !expenseMeals)) {
      toast.error("Choose who covers flights, lodging, and meals");
      return;
    }
    if (step === 0 && (!title || !price)) {
      toast.error("Title and price are required");
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSave();
  }

  // Progress fraction for the connecting line overlay (0 at step 0, 1 at the last step)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:w-full sm:max-w-[560px] max-h-[90vh] overflow-y-auto border-[#E5DFC6] rounded-2xl">
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
            {selectedTier && (
              <div className="inline-flex h-9 w-fit items-center gap-1.5 rounded-lg border border-[#E5DFC6] bg-white pl-3 pr-1.5 text-[13px] font-medium text-[#0a2225]">
                {selectedTier.label}
                {!isEdit && (
                  <button type="button" onClick={() => setTier(null)} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-transparent text-[#9CA3AF] transition-colors hover:border-[#E5DFC6] hover:bg-[#f7f3ea] hover:text-[#0a2225] !min-h-0 !min-w-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Stepper — serif numerals over a hairline (brand: serif numerals for
                section markers; a wizard is a true sequence). Gold = done,
                green = current, sand = ahead. No circles. */}
            <div className="mt-5 border-b border-[#E5DFC6] pb-3">
              <div className="flex items-end justify-between gap-2">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex min-w-0 items-baseline gap-2">
                    <span
                      className={`font-secondary text-[22px] leading-none ${
                        i === step ? "text-[#0c4d47]" : i < step ? "text-[#8D6B2F]" : "text-[#D8D0BA]"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`hidden truncate text-[10px] font-semibold uppercase tracking-[0.15em] sm:block ${
                        i === step ? "text-[#0a2225]" : "text-[#9CA3AF]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-[#8D6B2F] sm:hidden">{STEPS[step]}</p>
            </div>

            <div className="space-y-4 pt-1">
              {/* STEP 0: Overview */}
              {step === 0 && (
                <>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium text-[#6B7280] block">Title *</label>
                      {aiLink("Write it with AI", suggestTitle, false)}
                    </div>
                    <Input className={FIELD_CLASS} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Custom Italy Itinerary" />
                    {aiPanel("title")}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium text-[#6B7280] block">Description</label>
                      {aiLink("Write it with AI", suggestDescription, !title.trim())}
                    </div>
                    <Textarea className={FIELD_CLASS} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this service" rows={3} />
                    {aiPanel("description")}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] mb-1 block">{tier === "on_trip" ? "Day Rate (USD) *" : "Price (USD) *"}</label>
                    <Input className={FIELD_CLASS} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={tier === "on_trip" ? "450" : "99"} />
                    {tier === "on_trip" && (
                      <p className="text-xs text-[#9CA3AF] mt-1">Your rate for each day you travel with the client. The final total (rate × days, plus who covers travel and lodging) is agreed in the proposal before anyone pays.</p>
                    )}
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
                            className={`w-full h-10 px-3 text-sm border ${FIELD_CLASS}`}
                          >
                            {DELIVERY_OPTIONS.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6B7280] mb-1 block">Trip Days</label>
                          <Input className={FIELD_CLASS} type="number" min="1" value={tripDays} onChange={(e) => setTripDays(e.target.value)} placeholder="7" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6B7280] mb-1 block">Revisions Included</label>
                        <Input className={FIELD_CLASS} type="number" min="0" value={revisions} onChange={(e) => setRevisions(e.target.value)} placeholder="2" />
                      </div>
                    </>
                  )}

                  {tier === "full_trip_design" && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPriority}
                        onChange={(e) => setHasPriority(e.target.checked)}
                        className="rounded border-[#E5DFC6] accent-[#0c4d47]"
                      />
                      <span className="text-[#0a2225]">Priority Support included</span>
                    </label>
                  )}

                  {tier === "add_on" && (
                    <div>
                      <label className="text-xs font-medium text-[#6B7280] mb-1 block">Duration (minutes)</label>
                      <Input className={FIELD_CLASS} type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="30" />
                    </div>
                  )}

                  {tier === "on_trip" && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-medium text-[#6B7280]">Who covers what *</p>
                      <p className="text-xs text-[#9CA3AF] -mt-1">Shown on your profile so travelers can compare rates fairly before they reach out.</p>
                      {([
                        ["Flights & transport", expenseTravel, setExpenseTravel],
                        ["Lodging", expenseLodging, setExpenseLodging],
                        ["Meals", expenseMeals, setExpenseMeals],
                      ] as [string, ExpenseWho | null, (v: ExpenseWho) => void][]).map(([label, value, set]) => (
                        <div key={label} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm text-[#0a2225]">{label}</span>
                          <div className="inline-flex rounded-lg border border-[#E5DFC6] bg-white p-0.5">
                            {([
                              ["traveler", "Traveler covers"],
                              ["creator", "In my rate"],
                              ["split", "Each our own"],
                            ] as [ExpenseWho, string][]).map(([v, l]) => (
                              <button key={v} type="button" onClick={() => set(v)}
                                className={`h-8 rounded-md px-3 text-[12px] font-medium transition-colors !min-h-0 !min-w-0 ${
                                  value === v ? "bg-[#0c4d47] text-[#f7f3ea]" : "text-[#0a2225]/70 hover:bg-[#f7f3ea]"
                                }`}>
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {tier === "on_trip" && (
                    <div className="rounded-xl border border-[#E5DFC6] bg-[#FDF9F0] p-4 space-y-2">
                      <p className="text-sm text-[#0a2225] font-medium">How On-Trip pricing works</p>
                      <p className="text-xs text-[#6B7280]">Travelers hire you at your listed day rate. When a hire request arrives, you reply in Messages and send a proposal with the final total — day rate × trip days, and whether the traveler covers your travel and lodging (say so in your description). Payment goes through Goldsainte escrow: deposit at booking, the rest released after the trip.</p>
                    </div>
                  )}
                  {!isItineraryTier && tier !== "add_on" && tier !== "on_trip" && (
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
                          className="rounded border-[#E5DFC6] accent-[#0c4d47]"
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
                            <button type="button" onClick={() => toggleRequirement(item)} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-transparent text-[#9CA3AF] transition-colors hover:border-[#E5DFC6] hover:bg-[#f7f3ea] hover:text-[#0a2225] !min-h-0 !min-w-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      className={`flex-1 ${FIELD_CLASS}`}
                      value={customRequirement}
                      onChange={(e) => setCustomRequirement(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomRequirement())}
                      placeholder="Add a custom question…"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addCustomRequirement} className="shrink-0 border-[#E5DFC6] rounded-[10px]">
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
                          <button type="button" onClick={() => setIncludes(includes.filter((_, j) => j !== i))} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-transparent text-[#9CA3AF] transition-colors hover:border-[#E5DFC6] hover:bg-[#f7f3ea] hover:text-[#0a2225] !min-h-0 !min-w-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        className={`flex-1 ${FIELD_CLASS}`}
                        value={newInclude}
                        onChange={(e) => setNewInclude(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())}
                        placeholder="e.g. Day-by-day itinerary"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addInclude} className="shrink-0 border-[#E5DFC6] rounded-[10px]">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#6B7280] mb-1 block">FAQ</label>
                    <p className="text-xs text-[#9CA3AF] mb-2">Answer common questions before they're asked.</p>
                    <div className="space-y-3 mb-2">
                      {faq.map((item, i) => (
                        <div key={i} className="rounded-[10px] border border-[#E5DFC6] bg-[#FDF9F0] p-3 space-y-2">
                          <Input
                            className="bg-white border-[#E5DFC6] rounded-[10px]"
                            value={item.question}
                            onChange={(e) => updateFaqItem(i, "question", e.target.value)}
                            placeholder="Question"
                          />
                          <div className="flex justify-end">
                            {aiLink("Answer with AI", () => suggestFaqAnswer(i), !item.question.trim() || !title.trim())}
                          </div>
                          <Textarea
                            className="bg-white border-[#E5DFC6] rounded-[10px]"
                            value={item.answer}
                            onChange={(e) => updateFaqItem(i, "answer", e.target.value)}
                            placeholder="Answer"
                            rows={2}
                          />
                          {aiPanel(`faq-${i}`)}
                          <button
                            onClick={() => removeFaqItem(i)}
                            className="inline-flex h-8 items-center rounded-md border border-transparent px-2.5 text-[12px] font-medium text-[#9CA3AF] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 !min-h-0 !min-w-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addFaqItem} className="w-full border-[#E5DFC6] rounded-[10px]">
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
