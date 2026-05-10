import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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

const labelClasses = "text-[11px] sm:text-xs uppercase tracking-wider text-[#6B7280] font-medium";
const inputClasses = "rounded-xl h-12 text-sm sm:text-base border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962]";

export default function ItineraryBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
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

  const patchDay = (idx: number, patch: Partial<Day>) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!user) return;
    if (!form.title.trim() || !form.destination.trim() || !form.price) {
      toast.error("Title, destination and price are required.");
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.from("itinerary_products").insert({
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
      });
      if (error) throw error;
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
          Sell an <em>Itinerary Guide</em>
        </h1>
        <p className="mt-3 text-[#6B7280] text-base max-w-xl leading-relaxed">
          Package your travel knowledge as a digital product travelers can buy and download instantly.
        </p>

        <div className="mt-10 space-y-6">
          <Card className="border-none bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-secondary text-lg text-[#0a2225]">Basics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClasses}>Title</Label>
                <Input className={inputClasses} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="7 Days in Lisbon — A local's guide" />
              </div>
              <div>
                <Label className={labelClasses}>Destination</Label>
                <Input className={inputClasses} value={form.destination} onChange={(e) => update("destination", e.target.value)} placeholder="Lisbon, Portugal" />
              </div>
              <div>
                <Label className={labelClasses}>Duration (days)</Label>
                <Input type="number" min={1} max={60} className={inputClasses} value={form.duration_days} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={labelClasses}>Price</Label>
                  <Input type="number" min={0} step="0.01" className={inputClasses} value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="29" />
                </div>
                <div>
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

            <div>
              <Label className={labelClasses}>Cover image</Label>
              <div className="mt-2">
                <TripImageUploader
                  currentUrl={form.cover_image_url}
                  onUpload={(url) => update("cover_image_url", url)}
                />
              </div>
            </div>

            <div>
              <Label className={labelClasses}>Description</Label>
              <Textarea
                className="rounded-xl border-[#E5DFC6] bg-white"
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="What travelers will get inside this guide..."
              />
            </div>
          </Card>

          <Card className="border-none bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-secondary text-lg text-[#0a2225]">Day by day</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDays((p) => [...p, { day_number: p.length + 1, title: "", description: "", activities: [], accommodation: "" }])}
                className="rounded-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add day
              </Button>
            </div>

            <div className="space-y-4">
              {days.map((d, idx) => (
                <div key={idx} className="rounded-xl border border-[#E5DFC6] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-[#C7A962] font-medium">Day {d.day_number}</p>
                    {days.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDays((p) => p.filter((_, i) => i !== idx).map((x, i) => ({ ...x, day_number: i + 1 })))}
                        className="text-[#9A9384] hover:text-[#0a2225]"
                        aria-label="Remove day"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Input className={inputClasses} value={d.title} onChange={(e) => patchDay(idx, { title: e.target.value })} placeholder="Day title" />
                  <Textarea className="rounded-xl border-[#E5DFC6] bg-white" rows={3} value={d.description} onChange={(e) => patchDay(idx, { description: e.target.value })} placeholder="What happens this day" />
                  <div>
                    <Label className={labelClasses}>Activities</Label>
                    <div className="mt-2">
                      <ArrayFieldEditor
                        items={d.activities}
                        onChange={(items) => patchDay(idx, { activities: items })}
                        placeholder="Add an activity"
                      />
                    </div>
                  </div>
                  <Input className={inputClasses} value={d.accommodation} onChange={(e) => patchDay(idx, { accommodation: e.target.value })} placeholder="Accommodation (optional)" />
                </div>
              ))}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving} className="rounded-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save draft
            </Button>
            <Button onClick={() => handleSave("published")} disabled={saving} className="rounded-full bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Publish guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}