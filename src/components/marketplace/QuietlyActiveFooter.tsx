import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subtle realtime presence indicator: "X travelers are quietly exploring this collection."
 * Uses Supabase Realtime presence on the `marketplace-presence` channel.
 */
export function QuietlyActiveFooter() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const id = crypto.randomUUID();
    const channel = supabase.channel("marketplace-presence", {
      config: { presence: { key: id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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