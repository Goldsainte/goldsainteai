import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TripMatch = {
  provider_id: string;
  provider_type: "creator" | "agent";
  full_name: string | null;
  tiktok_handle: string | null;
  tiktok_followers: number | null;
  bio: string | null;
  score: number;
};

export function useTripMatches(tripId: string | undefined) {
  const [matches, setMatches] = useState<TripMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke("ai-trip-matches", {
          body: { tripId },
        });

        if (cancelled) return;

        if (error) {
          console.error("ai-trip-matches error", error);
          setError("Could not load AI matches.");
          setMatches([]);
        } else {
          setMatches((data?.matches ?? []) as TripMatch[]);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setError("Could not load AI matches.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return { matches, loading, error };
}
