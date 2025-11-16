// src/hooks/useStoryboardPrefill.ts
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getStoryboardById, type StoryboardGalleryItem } from "@/services/storyboardService";

export type TripPrefill = {
  title: string;
  destination: string;
  summary: string;
  notesForPartners: string;
};

export function useStoryboardPrefill() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [prefill, setPrefill] = useState<TripPrefill | null>(null);
  const [sourceStoryboard, setSourceStoryboard] = useState<StoryboardGalleryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storyboardId = searchParams.get("fromStoryboard");

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

        const destination = sb.destination || "";
        const title =
          sb.title ||
          (destination ? `${destination} – curated by Goldsainte` : "Goldsainte journey");

        const summaryLines: string[] = [];
        if (destination) summaryLines.push(`Destination: ${destination}`);
        if (sb.duration_label) summaryLines.push(`Duration: ${sb.duration_label}`);
        if (sb.ideal_traveler) summaryLines.push(`Ideal traveler: ${sb.ideal_traveler}`);
        if (sb.description) summaryLines.push(`\n${sb.description}`);

        const summary = summaryLines.join("\n");

        const notesParts: string[] = [];
        if (sb.vibe_tags && sb.vibe_tags.length) {
          notesParts.push(`Vibes to keep: ${sb.vibe_tags.join(", ")}.`);
        }
        if (sb.theme_tags && sb.theme_tags.length) {
          notesParts.push(`Themes: ${sb.theme_tags.join(", ")}.`);
        }

        const notesForPartners = notesParts.join(" ");

        setSourceStoryboard(sb);
        setPrefill({
          title,
          destination,
          summary,
          notesForPartners,
        });
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setError(
            err?.message || "We had trouble loading the storyboard details."
          );
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
