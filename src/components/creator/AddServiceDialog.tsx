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

export function AddServiceDialog({ open, onOpenChange, creatorId, onCreated, editService, initialTier }: Props) {
  const isEdit = !!editService;
  const [tier, setTier] = useState<ServiceTier | null>(editService?.service_tier || initialTier || null);
  const [saving, setSaving] = useState(false);

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

  function reset() {
    setTier(null);
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

  const selectedTier = TIERS.find((t) => t.value === tier);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-secondary text-xl text-[#0a2225]">
            {isEdit ? "Edit Service" : "Add a Service"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Tier selection (if not editing) */}
        {!tier && !isEdit && (
          <div className="grid grid-cols-2 gap-3 mt-2">
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

        {/* Step 2: Tier-specific form */}
        {tier && (
          <div className="space-y-4 mt-2">
            {/* Tier badge */}
            {selectedTier && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${selectedTier.color}`}>
                <selectedTier.icon className="h-3.5 w-3.5" />
                {selectedTier.label}
                {!isEdit && (
                  <button onClick={() => setTier(null)} className="ml-1 opacity-60 hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Common fields */}
            <div>
              <label className="text-xs font-medium text-[#6B7280] mb-1 block">Title *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Custom Italy Itinerary" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7280] mb-1 block">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this service" rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7280] mb-1 block">Price (USD) *</label>
              <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="99" />
            </div>

            {(tier === "custom_itinerary" || tier === "full_trip_design") && (
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

            {/* Includes list */}
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

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={saving || !title || !price}
              className="w-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full"
            >
              {saving ? "Saving…" : isEdit ? "Update Service" : "Add Service"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
