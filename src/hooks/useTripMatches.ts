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
  reasons?: string[];
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
        const { data, error } = await supabase.functions.invoke("concierge-suggest-partners", {
          body: { trip_request_id: tripId },
        });

        if (cancelled) return;

        if (error) {
          console.error("concierge-suggest-partners error", error);
          setError("Could not load AI matches.");
          setMatches([]);
        } else {
          // Transform creators to TripMatch format
          const creatorMatches: TripMatch[] = (data?.creators || []).map((c: any) => ({
            provider_id: c.creator.id,
            provider_type: "creator" as const,
            full_name: c.creator.display_name,
            tiktok_handle: c.creator.tiktok_handle,
            tiktok_followers: null,
            bio: null,
            score: c.score,
            reasons: c.reasons,
          }));

          setMatches(creatorMatches);
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
