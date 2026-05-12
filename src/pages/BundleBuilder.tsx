import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface TripRow {
  id: string;
  title: string;
  price_per_person: number | null;
  currency: string | null;
}
interface GuideRow {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
}

export default function BundleBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");

  const [trips, setTrips] = useState<TripRow[]>([]);
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);
  const [guideIds, setGuideIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [t, g] = await Promise.all([
        supabase
          .from("packaged_trips")
          .select("id, title, price_per_person, currency")
          .eq("creator_id", user.id)
          .eq("status", "published"),
        supabase
          .from("itinerary_products")
          .select("id, title, price, currency")
          .eq("creator_id", user.id)
          .eq("status", "published"),
      ]);
      setTrips((t.data as any) || []);
      setGuides((g.data as any) || []);
      if (editId) {
        const { data: b } = await supabase
          .from("product_bundles")
          .select("*")
          .eq("id", editId)
          .maybeSingle();
        if (b) {
          setTitle(b.title || "");
          setDescription(b.description || "");
          setCoverUrl(b.cover_image_url || "");
          setPrice(String(b.price ?? ""));
          setCurrency(b.currency || "USD");
          setTripId(b.trip_id || null);
          setGuideIds(b.guide_ids || []);
        }
      }
      setLoading(false);
    })();
  }, [user, editId]);

  const includedSum = useMemo(() => {
    const tripPrice = trips.find((t) => t.id === tripId)?.price_per_person || 0;
    const guidesPrice = guides
      .filter((g) => guideIds.includes(g.id))
      .reduce((s, g) => s + (Number(g.price) || 0), 0);
    return Number(tripPrice) + guidesPrice;
  }, [trips, guides, tripId, guideIds]);

  const priceNum = Number(price);
  const priceValid = priceNum > 0 && (includedSum === 0 || priceNum < includedSum);
  const discountPct =
    includedSum > 0 && priceNum > 0 && priceNum < includedSum
      ? ((includedSum - priceNum) / includedSum) * 100
      : 0;
  const guidesValid = guideIds.length >= 1 && guideIds.length <= 3;
  const formValid =
    !!title.trim() && !!tripId && guidesValid && priceValid;

  const toggleGuide = (id: string) => {
    setGuideIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.error("Maximum 3 guides per bundle");
        return prev;
      }
      return [...prev, id];
    });
  };

  const save = async (publish: boolean) => {
    if (!user) return;
    if (publish && !formValid) {
      toast.error("Fix the form before publishing");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        creator_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        cover_image_url: coverUrl.trim() || null,
        price: priceNum,
        currency,
        trip_id: tripId,
        guide_ids: guideIds,
        status: publish ? "published" : "draft",
      };
      const q = editId
        ? supabase.from("product_bundles").update(payload).eq("id", editId).select("id").single()
        : supabase.from("product_bundles").insert(payload).select("id").single();
      const { data, error } = await q;
      if (error) throw error;
      toast.success(publish ? "Bundle published" : "Bundle saved");
      navigate(`/bundle/${data.id}`);
    } catch (e: any) {
      toast.error(e.message || "Could not save bundle");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-[#6B7280]">
        Please sign in to build a bundle.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#0c4d47]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EA] pb-24">
      <Helmet>
        <title>Bundle Builder — Goldsainte</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-secondary text-3xl text-[#0a2225]">
          {editId ? "Edit Bundle" : "Create a Bundle"}
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Combine one trip with 1–3 guides at a price below the sum of individual prices.
        </p>

        <div className="mt-8 space-y-6 rounded-2xl border border-[#E5DFC6] bg-white p-6">
          <div>
            <Label>Bundle title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Cover image URL</Label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Select 1 trip</Label>
            {trips.length === 0 ? (
              <p className="mt-2 text-xs text-[#6B7280]">No published trips yet.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {trips.map((t) => (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${
                      tripId === t.id ? "border-[#0c4d47] bg-[#0c4d47]/5" : "border-[#E5DFC6]"
                    }`}
                  >
                    <div>
                      <input
                        type="radio"
                        name="trip"
                        checked={tripId === t.id}
                        onChange={() => setTripId(t.id)}
                        className="mr-2"
                      />
                      <span className="text-sm text-[#0a2225]">{t.title}</span>
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      {t.currency || "USD"} {Number(t.price_per_person || 0).toFixed(0)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Select 1–3 guides</Label>
            {guides.length === 0 ? (
              <p className="mt-2 text-xs text-[#6B7280]">No published guides yet.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {guides.map((g) => (
                  <label
                    key={g.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${
                      guideIds.includes(g.id) ? "border-[#0c4d47] bg-[#0c4d47]/5" : "border-[#E5DFC6]"
                    }`}
                  >
                    <div>
                      <input
                        type="checkbox"
                        checked={guideIds.includes(g.id)}
                        onChange={() => toggleGuide(g.id)}
                        className="mr-2"
                      />
                      <span className="text-sm text-[#0a2225]">{g.title}</span>
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      {g.currency || "USD"} {Number(g.price || 0).toFixed(0)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-[#F7F3EA] p-4 text-sm">
            <p className="text-[#6B7280]">
              Sum of individual prices: <strong className="text-[#0a2225]">${includedSum.toFixed(0)}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>Bundle price</Label>
                {discountPct > 0 && (
                  <span className="rounded-full bg-[#0c4d47]/10 px-2 py-0.5 text-[11px] font-medium text-[#0c4d47]">
                    {discountPct.toFixed(0)}% bundle discount
                  </span>
                )}
              </div>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1"
              />
              {!priceValid && price && (
                <p className="mt-1 text-xs text-red-600">
                  Must be greater than 0 and less than ${includedSum.toFixed(0)}
                </p>
              )}
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" disabled={saving} onClick={() => save(false)}>
              Save draft
            </Button>
            <Button
              disabled={saving || !formValid}
              onClick={() => save(true)}
              className="bg-[#0c4d47] text-white hover:bg-[#0c4d47]/90"
            >
              {saving ? "Saving…" : "Publish bundle"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}