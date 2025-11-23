import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getStoryboardById, type Storyboard } from "@/services/storyboardsService";

export type TripPrefill = {
  title: string;
  destination: string;
  description: string;
  tags: string[];
};

export function useStoryboardPrefill() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [prefill, setPrefill] = useState<TripPrefill | null>(null);
  const [sourceStoryboard, setSourceStoryboard] = useState<Storyboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storyboardId = 
    searchParams.get("fromStoryboard") || 
    (searchParams.get("from") === "storyboard" ? searchParams.get("storyboardId") : null);

  useEffect(() => {
    if (!storyboardId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const sb = await getStoryboardById(storyboardId);
        if (cancelled) return;

        if (!sb) {
          setError("We couldn't find that storyboard.");
          setPrefill(null);
          setSourceStoryboard(null);
          return;
        }

        const title = sb.title || "Trip inspired by storyboard";
        const description = sb.description 
          ? `Inspired by "${sb.title}". ${sb.description}`
          : `Trip inspired by my Goldsainte storyboard.`;
        
        const tags = sb.tags || [];

        setSourceStoryboard(sb);
        setPrefill({
          title,
          destination: "",
          description,
          tags,
        });
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "We had trouble loading the storyboard details.");
          setPrefill(null);
          setSourceStoryboard(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [storyboardId]);

  return { storyboardId, loading, prefill, sourceStoryboard, error };
}
