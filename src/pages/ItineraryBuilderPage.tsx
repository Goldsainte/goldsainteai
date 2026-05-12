import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackButton } from "@/components/ui/BackButton";
import { TripImageUploader } from "@/components/trips/TripImageUploader";
import { ArrayFieldEditor } from "@/components/trips/ArrayFieldEditor";
import { Loader2, Plus, X, Save, Send, BookOpen } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD"];

type Day = {
  day_number: number;
  title: string;
  description: string;
  activities: string[];
  accommodation: string;
};

const labelClasses = "text-sm font-medium text-[#0a2225]";
const inputClasses = "rounded-xl h-11 sm:h-12 text-sm sm:text-base border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962]";
const textareaClasses = "rounded-xl border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962]";
const helperClasses = "text-xs text-[#9A9384] mt-1";

export default function ItineraryBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [creatorStatus, setCreatorStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    destination: "",
    duration_days: "5",
    price: "",
    currency: "USD",
    cover_image_url: "",
    description: "",
  });
  const [days, setDays] = useState<Day[]>([
    { day_number: 1, title: "", description: "", activities: [], accommodation: "" },
  ]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("creator_status")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setCreatorStatus((data as any)?.creator_status ?? null));
  }, [user]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data, error } = await supabase
        .from("itinerary_products")
        .select("*")
        .eq("id", editId)
        .maybeSingle();
      if (error || !data) {
        toast.error("Could not load guide");
        setLoading(false);
        return;
      }
      setForm({
        title: data.title ?? "",
        destination: data.destination ?? "",
        duration_days: String(data.duration_days ?? 5),
        price: String(data.price ?? ""),
        currency: data.currency ?? "USD",
        cover_image_url: data.cover_image_url ?? "",
        description: data.description ?? "",
      });
      const loaded = Array.isArray(data.days) ? (data.days as any as Day[]) : [];
      if (loaded.length) setDays(loaded);
      setLoading(false);
    })();
  }, [editId]);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const setDuration = (val: string) => {
    update("duration_days", val);
    const n = Math.max(1, Math.min(60, parseInt(val) || 1));
    setDays((prev) => {
      const next = [...prev];
      while (next.length < n) {
        next.push({ day_number: next.length + 1, title: "", description: "", activities: [], accommodation: "" });
      }
      return next.slice(0, n).map((d, i) => ({ ...d, day_number: i + 1 }));
    });
  };

  const patchDay = (idx: number, patch: Partial<Day>) =>
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));

  const handleSave = async (status: "draft" | "published") => {
    if (!user) return;
    if (status === "published" && creatorStatus !== "approved") {
      toast.error("Your creator profile is still under review. You can save drafts but cannot publish until approved.");
      return;
    }
    if (!form.title.trim() || !form.destination.trim() || !form.price) {
      toast.error("Title, destination and price are required.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        creator_id: user.id,
        title: form.title.trim(),
        destination: form.destination.trim(),
        duration_days: parseInt(form.duration_days) || 1,
        price: parseFloat(form.price),
        currency: form.currency,
        cover_image_url: form.cover_image_url || null,
        description: form.description || null,
        days: days as any,
        status,
      };
      if (editId) {
        const { error } = await supabase
          .from("itinerary_products")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("itinerary_products").insert(payload);
        if (error) throw error;
      }
      toast.success(status === "published" ? "Guide published" : "Draft saved");
      navigate("/creator-dashboard");
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        <div className="mb-6">
          <BackButton to="/creator-dashboard" />
        </div>
        <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#E5DFC6] mb-4">
          <BookOpen className="h-4 w-4 text-[#C7A962]" />
          <span className="text-sm font-medium text-[#6B7280] tracking-wide">Itinerary Guide</span>
        </div>
        <h1 className="font-secondary text-2xl sm:text-3xl md:text-4xl text-[#0a2225] tracking-tight">
          {editId ? <>Edit <em>Guide</em></> : <>Sell an <em>Itinerary Guide</em></>}
        </h1>
        <p className="mt-3 text-[#6B7280] text-base max-w-xl leading-relaxed">
          Package your travel knowledge as a digital product travelers can buy and download instantly.
        </p>

        {creatorStatus && creatorStatus !== "approved" && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {creatorStatus === "pending"
              ? "Your creator profile is under review. You can save drafts but cannot publish until approved."
              : "Your creator profile was not approved. Contact support to learn more."}
          </div>
        )}

        <div className="mt-12 space-y-12">
          {/* Basics */}
          <div className="space-y-8">
            <div>
              <h2 className="font-secondary text-2xl sm:text-3xl text-[#0a2225] tracking-tight">About the guide</h2>
              <p className="text-sm text-[#9A9384] mt-1">The essentials travelers see before buying.</p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Title</Label>
                  <Input className={inputClasses} value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="7 Days in Lisbon — A local's guide" />
                  <p className={helperClasses}>Be specific. "7 Days in Lisbon — Local's Guide" outperforms "Lisbon Guide".</p>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Destination</Label>
                  <Input className={inputClasses} value={form.destination}
                    onChange={(e) => update("destination", e.target.value)} placeholder="Lisbon, Portugal" />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Duration (days)</Label>
                  <Input type="number" min={1} max={60} className={inputClasses}
                    value={form.duration_days} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Price</Label>
                    <Input type="number" min={0} step="0.01" className={inputClasses}
                      value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="29" />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>Currency</Label>
                    <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                      <SelectTrigger className={inputClasses}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Cover image</Label>
                <TripImageUploader currentUrl={form.cover_image_url}
                  onUpload={(url) => update("cover_image_url", url)} />
              </div>

              <div className="space-y-2">
                <Label className={labelClasses}>Description</Label>
                <Textarea className={textareaClasses} rows={5} value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="What travelers will get inside this guide..." />
                <p className={helperClasses}>Aim for 100–200 words. Highlight what makes your local knowledge unique.</p>
              </div>
            </div>
          </div>

          {/* Day by day */}
          <div className="space-y-8 border-t border-[#E5DFC6] pt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-secondary text-2xl sm:text-3xl text-[#0a2225] tracking-tight">Day by day</h2>
                <p className="text-sm text-[#9A9384] mt-1">Walk travelers through the journey, day by day.</p>
              </div>
              <Button type="button" variant="outline" size="sm"
                onClick={() => setDays((p) => [...p, { day_number: p.length + 1, title: "", description: "", activities: [], accommodation: "" }])}
                className="rounded-full border-[#E5DFC6]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add day
              </Button>
            </div>

            <div>
              {days.map((d, idx) => (
                <div key={idx} className={idx > 0 ? "border-t border-[#E5DFC6] pt-6 mt-6" : ""}>
                  <div className="flex items-start gap-5">
                    <span className="font-secondary text-4xl text-[#E5DFC6] leading-none flex-shrink-0 mt-1">
                      {String(d.day_number).padStart(2, "0")}
                    </span>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Input className={inputClasses} value={d.title}
                          onChange={(e) => patchDay(idx, { title: e.target.value })}
                          placeholder="Day title" />
                        {days.length > 1 && (
                          <button type="button"
                            onClick={() => setDays((p) => p.filter((_, i) => i !== idx).map((x, i) => ({ ...x, day_number: i + 1 })))}
                            className="text-[#9A9384] hover:text-[#0a2225] mt-3 flex-shrink-0"
                            aria-label="Remove day">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <Textarea className={textareaClasses} rows={3} value={d.description}
                        onChange={(e) => patchDay(idx, { description: e.target.value })}
                        placeholder="What happens this day" />
                      <div className="space-y-2">
                        <Label className={labelClasses}>Activities</Label>
                        <ArrayFieldEditor items={d.activities}
                          onChange={(items) => patchDay(idx, { activities: items })}
                          placeholder="Add an activity" />
                      </div>
                      <div className="space-y-2">
                        <Label className={labelClasses}>Accommodation (optional)</Label>
                        <Input className={inputClasses} value={d.accommodation}
                          onChange={(e) => patchDay(idx, { accommodation: e.target.value })}
                          placeholder="Where to stay" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-[#E5DFC6] pt-8">
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}
              className="rounded-full px-6 border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225]">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save draft
            </Button>
            <Button onClick={() => handleSave("published")} disabled={saving}
              className="rounded-full px-6 bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Publish guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
