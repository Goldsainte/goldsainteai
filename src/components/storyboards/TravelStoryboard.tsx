import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ExperienceCard } from "./ExperienceCard";
import { SaveToStoryboardButton } from "./SaveToStoryboardButton";

type StoryboardItemRow = Database["public"]["Tables"]["storyboard_items"]["Row"];

type StoryboardImage = {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  label?: string | null;
  destination_tags?: string[] | null;
  mood_tags?: string[] | null;
};

interface TravelStoryboardProps {
  storyboardId?: string;
  title?: string;
  subtitle?: string;
  maxItems?: number;
  highlightTags?: string[];
  onImageClick?: (image: StoryboardImage) => void;
  showSaveButtons?: boolean;
}

// Fallback image for broken URLs
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80";

// Diversify images by mood to ensure variety
function diversifyImages(images: StoryboardImage[], limit: number): StoryboardImage[] {
  if (images.length <= limit) {
    return images.sort(() => Math.random() - 0.5);
  }

  // Group by primary mood tag
  const byMood: Record<string, StoryboardImage[]> = {};
  images.forEach(img => {
    const mood = img.mood_tags?.[0] || 'general';
    if (!byMood[mood]) byMood[mood] = [];
    byMood[mood].push(img);
  });

  // Shuffle within each mood group
  Object.keys(byMood).forEach(mood => {
    byMood[mood] = byMood[mood].sort(() => Math.random() - 0.5);
  });

  // Round-robin select from each mood category for variety
  const result: StoryboardImage[] = [];
  const moods = Object.keys(byMood);
  let index = 0;

  while (result.length < limit && moods.length > 0) {
    const moodIndex = index % moods.length;
    const mood = moods[moodIndex];
    
    if (byMood[mood] && byMood[mood].length > 0) {
      result.push(byMood[mood].shift()!);
    } else {
      moods.splice(moodIndex, 1);
    }
    index++;
  }

  // Final shuffle to mix moods together
  return result.sort(() => Math.random() - 0.5);
}

export function TravelStoryboard({
  storyboardId,
  title = "Travel storyboard",
  subtitle = "Use these visuals to imagine and design your next trip.",
  maxItems = 100,
  highlightTags = [],
  onImageClick,
  showSaveButtons = false,
}: TravelStoryboardProps) {
  const [images, setImages] = useState<StoryboardImage[]>([]);
  const [items, setItems] = useState<StoryboardItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        if (storyboardId) {
          const { data, error } = await supabase
            .from("storyboard_items")
            .select("*")
            .eq("storyboard_id", storyboardId)
            .order("position", { ascending: true });

          if (error) {
            console.error("Error loading storyboard items:", error);
            if (!isMounted) return;
            setItems([]);
          } else if (isMounted) {
            setItems(data ?? []);
          }
        } else {
          // Fetch larger pool for diversification (no ordering - we'll diversify client-side)
          const query = supabase
            .from("storyboard_media_library")
            .select("id, url, thumbnail_url, label, destination_tags, mood_tags")
            .limit(200); // Fetch more to ensure good variety

          const { data, error } = await query;

          if (error) {
            console.error("Error loading storyboard media:", error);
            if (!isMounted) return;
            setImages([]);
          } else if (isMounted) {
            // Apply diversification to get a good mix of moods
            const diversified = diversifyImages((data ?? []) as StoryboardImage[], maxItems);
            setImages(diversified);
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
            <div key={item.id} className="break-inside-avoid">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title || "Trip photo"}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                  className="w-full rounded-xl object-cover"
                />
              ) : (
                <ExperienceCard
                  dayNumber={undefined}
                  timeOfDay={undefined}
                  caption={item.subtitle || "Experience"}
                  locationLabel={item.title ?? undefined}
                  categoryTag={undefined}
                />
              )}
            </div>
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
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
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
