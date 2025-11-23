import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ExperienceCard } from "./ExperienceCard";
import { SaveToStoryboardButton } from "./SaveToStoryboardButton";

type StoryboardImage = {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  label?: string | null;
  destination_tags?: string[] | null;
  mood_tags?: string[] | null;
};

type StoryboardItem = {
  id: string;
  media_url?: string | null;
  caption?: string | null;
  media_attribution?: string | null;
  location_label?: string | null;
  day_number?: number | null;
  time_of_day?: string | null;
  category_tag?: string | null;
};

interface TravelStoryboardProps {
  storyboardId?: string; // NEW: if provided, load items from storyboard_items
  title?: string;
  subtitle?: string;
  maxItems?: number;
  highlightTags?: string[];
  onImageClick?: (image: StoryboardImage) => void;
  showSaveButtons?: boolean; // NEW: show save to storyboard buttons
}

export function TravelStoryboard({
  storyboardId,
  title = "Travel storyboard",
  subtitle = "Use these visuals to imagine and design your next trip.",
  maxItems = 24,
  highlightTags = [],
  onImageClick,
  showSaveButtons = false,
}: TravelStoryboardProps) {
  const [images, setImages] = useState<StoryboardImage[]>([]);
  const [items, setItems] = useState<StoryboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        // If storyboardId provided, load from storyboard_items
        if (storyboardId) {
          const { data, error } = await supabase
            .from("storyboard_items")
            .select("id, media_url, caption, media_attribution, location_label, day_number, time_of_day, category_tag")
            .eq("storyboard_id", storyboardId)
            .order("order_index", { ascending: true });

          if (error) {
            console.error("Error loading storyboard items:", error);
            if (!isMounted) return;
            setItems([]);
          } else if (isMounted) {
            setItems((data ?? []) as StoryboardItem[]);
          }
        } else {
          // Fallback: load from media library
          const query = supabase
            .from("storyboard_media_library")
            .select("id, url, thumbnail_url, label, destination_tags, mood_tags")
            .order("created_at", { ascending: false })
            .limit(maxItems);

          const { data, error } = await query;

          if (error) {
            console.error("Error loading storyboard media:", error);
            if (!isMounted) return;
            setImages([]);
          } else if (isMounted) {
            setImages((data ?? []) as StoryboardImage[]);
          }
        }
      } catch (err) {
        console.error("Unexpected error loading storyboard:", err);
        if (isMounted) {
          setImages([]);
          setItems([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [storyboardId, maxItems]);

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
      ) : items.length > 0 ? (
        <div
          className={cn(
            "columns-2 gap-2 sm:columns-3 md:columns-4",
            "space-y-2"
          )}
        >
          {items.map((item) => (
            item.media_url ? (
              // Photo item
              <div key={item.id} className="break-inside-avoid">
                <img
                  src={item.media_url}
                  alt={item.caption || "Trip photo"}
                  loading="lazy"
                  className="w-full rounded-xl object-cover"
                />
                {item.media_attribution && (
                  <p className="mt-1 text-xs text-muted-foreground">{item.media_attribution}</p>
                )}
              </div>
            ) : (
              // Experience item
              <div key={item.id} className="break-inside-avoid">
                <ExperienceCard
                  dayNumber={item.day_number ?? undefined}
                  timeOfDay={item.time_of_day ?? undefined}
                  caption={item.caption || "Experience"}
                  locationLabel={item.location_label ?? undefined}
                  categoryTag={item.category_tag ?? undefined}
                />
              </div>
            )
          ))}
        </div>
      ) : images.length > 0 ? (
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
            >
              <div onClick={() => onImageClick?.(img)}>
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
              </div>
              {showSaveButtons && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SaveToStoryboardButton
                    assetType="brand_collection"
                    assetData={{
                      id: img.id,
                      title: img.label || undefined,
                      cover_image_url: img.url,
                      tags: [...(img.destination_tags || []), ...(img.mood_tags || [])],
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-white/90 hover:bg-white shadow-md"
                  />
                </div>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-muted-foreground/30 px-4 py-8 text-center text-[11px] text-muted-foreground">
          No storyboard content yet.
        </div>
      )}
    </section>
  );
}
