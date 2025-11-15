import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type StoryboardImage = {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  label?: string | null;
  destination_tags?: string[] | null;
  mood_tags?: string[] | null;
};

interface TravelStoryboardProps {
  title?: string;
  subtitle?: string;
  maxItems?: number;
  highlightTags?: string[];
  onImageClick?: (image: StoryboardImage) => void;
}

export function TravelStoryboard({
  title = "Travel storyboard",
  subtitle = "Use these visuals to imagine and design your next trip.",
  maxItems = 24,
  highlightTags = [],
  onImageClick,
}: TravelStoryboardProps) {
  const [images, setImages] = useState<StoryboardImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadImages() {
      setLoading(true);
      try {
        let query = supabase
          .from("storyboard_media_library")
          .select("id, url, thumbnail_url, label, destination_tags, mood_tags")
          .order("created_at", { ascending: false })
          .limit(maxItems);

        // Properly filter by tags if provided using array overlap operator
        if (highlightTags.length > 0) {
          const tagFilter = highlightTags.join(',');
          query = query.or(
            `destination_tags.ov.{${tagFilter}},mood_tags.ov.{${tagFilter}}`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading storyboard media:", error);
          if (!isMounted) return;
          setImages([]);
        } else if (isMounted) {
          setImages((data ?? []) as StoryboardImage[]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [maxItems, highlightTags.join("|")]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground md:text-base">
          {title}
        </h2>
        <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
          {subtitle}
        </p>
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-muted/60 animate-pulse" />
      ) : images.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-muted-foreground/30 px-4 py-8 text-center text-[11px] text-muted-foreground">
          No storyboard images yet. We'll soon fill this with a curated library
          of travel visuals.
        </div>
      ) : (
        <div
          className={cn(
            "columns-2 gap-2 sm:columns-3 md:columns-4",
            "space-y-2"
          )}
        >
          {images.map((img) => (
            <figure
              key={img.id}
              className={cn(
                "group relative overflow-hidden rounded-xl bg-muted",
                onImageClick && "cursor-pointer"
              )}
              onClick={() => onImageClick?.(img)}
            >
              <img
                src={img.thumbnail_url || img.url}
                alt={img.label || "Storyboard"}
                loading="lazy"
                className="h-full w-full transform object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {(img.label || (img.destination_tags && img.destination_tags[0])) && (
                <figcaption className="pointer-events-none absolute inset-x-2 bottom-2 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur">
                  {img.label || img.destination_tags?.[0]}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
