import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MODIFIERS = [
  { id: "slower-pace", label: "Slower Pace" },
  { id: "wellness", label: "Wellness Focus" },
  { id: "luxury-upgrade", label: "Luxury Upgrade" },
  { id: "food-wine", label: "Food & Wine" },
  { id: "adventure", label: "Adventure" },
] as const;

interface PersonalizedDay {
  day_number: number;
  title: string;
  description: string;
  accommodation: string;
  hero_activity: string;
  dining: string;
}

interface Variant {
  headline: string;
  price_impact: string;
  days: PersonalizedDay[];
}

interface MakeItMinePanelProps {
  trip: {
    id: string;
    title: string;
    destination: string;
    duration_days: number;
    description?: string | null;
  };
  baseItinerary: Array<{
    day_number: number;
    title: string;
    description: string | null;
    accommodation: string | null;
  }>;
}

export function MakeItMinePanel({ trip, baseItinerary }: MakeItMinePanelProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const generate = async () => {
    if (selected.length === 0) {
      toast.info("Pick a vibe to begin");
      return;
    }
    setLoading(true);
    try {
      const labels = selected.map((id) => MODIFIERS.find((m) => m.id === id)?.label || id);
      const { data, error } = await supabase.functions.invoke("personalize-trip", {
        body: { trip, baseItinerary, modifiers: labels },
      });
      if (error) throw error;
      setVariant(data?.variant ?? null);
    } catch (e: any) {
      toast.error(e?.message || "Could not personalize this trip");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!user) {
      toast.info("Sign in to save your version");
      return;
    }
    if (!variant) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("trip_variants").insert({
        user_id: user.id,
        trip_id: trip.id,
        modifiers: selected,
        generated_itinerary: variant as any,
      });
      if (error) throw error;
      toast.success("Your version saved");
    } catch (e: any) {
      toast.error(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-gradient-to-br from-white to-[#FDF9F0] p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#C7B892]" />
        <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">Make It Mine</h2>
      </div>
      <p className="mt-1 font-secondary italic text-[13px] text-[#7A7151]">
        Choose how you want to feel — and watch this trip become yours.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {MODIFIERS.map((m) => {
          const active = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`relative rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                active
                  ? "bg-[#0c4d47] text-[#FDF9F0]"
                  : "border border-[#E5DFC6] bg-white text-[#0a2225] hover:border-[#C7B892]"
              }`}
            >
              {m.label}
              {active && (
                <motion.span
                  layoutId="modifier-underline"
                  className="absolute -bottom-1 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-[#C7B892]"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={generate}
          disabled={loading || selected.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-5 py-2 text-[13px] font-medium text-[#FDF9F0] transition hover:bg-[#0c4d47]/90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {loading ? "Composing your version" : variant ? "Refine again" : "Make this mine"}
        </button>
        {variant && (
          <span className="font-secondary italic text-[12px] text-[#7A7151]">{variant.price_impact}</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {variant && (
          <motion.div
            key={variant.headline}
            initial={{ opacity: 0, filter: "blur(8px)", y: 8 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(8px)", y: -8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 border-t border-[#E5DFC6] pt-6"
          >
            <p className="font-secondary text-[15px] italic text-[#0a2225]">
              Your version of <span className="text-[#0c4d47]">{trip.title}</span>
            </p>
            <p className="mt-1 font-secondary text-[20px] leading-snug text-[#0a2225]">
              {variant.headline}
            </p>

            <div className="mt-5 space-y-4">
              {variant.days.map((d, i) => (
                <motion.div
                  key={`${variant.headline}-${d.day_number}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.4 }}
                  className="rounded-xl border border-[#E5DFC6]/70 bg-white/70 p-4"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-secondary text-[11px] uppercase tracking-widest text-[#C7B892]">
                      Day {String(d.day_number).padStart(2, "0")}
                    </span>
                    <span className="font-secondary text-[15px] text-[#0a2225]">{d.title}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#4a4a4a]">{d.description}</p>
                  <div className="mt-3 grid gap-1.5 text-[12px] text-[#7A7151] sm:grid-cols-3">
                    <span><span className="text-[#C7B892]">Stay · </span>{d.accommodation}</span>
                    <span><span className="text-[#C7B892]">Do · </span>{d.hero_activity}</span>
                    <span><span className="text-[#C7B892]">Dine · </span>{d.dining}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#0c4d47] px-4 py-2 text-[12px] font-medium text-[#0c4d47] transition hover:bg-[#0c4d47] hover:text-[#FDF9F0] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save my version"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}