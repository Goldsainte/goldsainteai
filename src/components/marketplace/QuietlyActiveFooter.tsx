import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subtle realtime presence indicator: "X travelers are quietly exploring this collection."
 * Uses Supabase Realtime presence as a floor, layered over a softly drifting baseline so
 * the marketplace never reads as empty during quiet hours.
 */
export function QuietlyActiveFooter() {
  const [presence, setPresence] = useState<number>(0);
  const [baseline, setBaseline] = useState<number>(() => seedBaseline());

  useEffect(() => {
    const id = crypto.randomUUID();
    const channel = supabase.channel("marketplace-presence", {
      config: { presence: { key: id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPresence(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });

    // Drift the baseline every 6–12s so the number breathes.
    let timer: number;
    const tick = () => {
      setBaseline((b) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3..+3
        const next = b + delta;
        return Math.min(412, Math.max(184, next));
      });
      timer = window.setTimeout(tick, 6000 + Math.random() * 6000);
    };
    timer = window.setTimeout(tick, 5000);

    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const count = Math.max(baseline, presence);
  if (count < 1) return null;

  return (
    <div className="mt-12 flex items-center justify-center gap-2 text-center">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0c4d47]/40" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0c4d47]" />
      </span>
      <p className="font-secondary italic text-[12px] text-[#7A7151]">
        {count} {count === 1 ? "traveler is" : "travelers are"} quietly exploring this collection
      </p>
    </div>
  );
}

function seedBaseline() {
  // Time-of-day weighted baseline so peak hours feel busier.
  const hour = new Date().getHours();
  const peak = hour >= 9 && hour <= 23 ? 1 : 0.55;
  const base = 220 + Math.floor(Math.random() * 90); // 220–310
  return Math.floor(base * peak);
}