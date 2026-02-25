import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getStoryboardById, type Storyboard } from "@/services/storyboardsService";

export type TripPrefill = {
  title: string;
  destination: string;
  departure_city: string;
  description: string;
  tags: string[];
  start_date: string;
  end_date: string;
  budget_min: string;
  budget_max: string;
  budget_level: string;
  travelers_adults: string;
  travelers_children: string;
  occasion: string;
  accommodation_style: string;
  pace: string;
  interests: string[];
  flexibility: string;
  special_notes: string;
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

        const sbAny = sb as any;

        const title = sb.title || "Trip inspired by storyboard";
        const description = sb.description 
          ? `Inspired by "${sb.title}". ${sb.description}`
          : `Trip inspired by my Goldsainte storyboard.`;

        setSourceStoryboard(sb);
        setPrefill({
          title,
          destination: sbAny.destination || "",
          departure_city: sbAny.departure_city || "",
          description,
          tags: sb.tags || [],
          start_date: sbAny.start_date || "",
          end_date: sbAny.end_date || "",
          budget_min: sbAny.budget_min?.toString() || "",
          budget_max: sbAny.budget_max?.toString() || "",
          budget_level: sbAny.budget_level || "",
          travelers_adults: sbAny.travelers_adults?.toString() || "2",
          travelers_children: sbAny.travelers_children?.toString() || "0",
          occasion: sbAny.occasion || "",
          accommodation_style: sbAny.accommodation_style || "",
          pace: sbAny.pace || "",
          interests: sbAny.interests || [],
          flexibility: sbAny.flexibility || "",
          special_notes: sbAny.special_notes || "",
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
    return () => { cancelled = true; };
  }, [storyboardId]);

  return { storyboardId, loading, prefill, sourceStoryboard, error };
}
