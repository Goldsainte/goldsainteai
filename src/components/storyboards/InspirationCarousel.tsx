import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MediaImage {
  id: string;
  url: string;
  thumbnail_url: string | null;
  label: string | null;
  destination_tags: string[] | null;
  mood_tags: string[] | null;
}

interface InspirationCarouselProps {
  onImageClick: (img: MediaImage) => void;
}

export function InspirationCarousel({ onImageClick }: InspirationCarouselProps) {
  const [row1, setRow1] = useState<MediaImage[]>([]);
  const [row2, setRow2] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("storyboard_media_library")
        .select("id, url, thumbnail_url, label, destination_tags, mood_tags")
        .limit(200);

      if (cancelled) return;

      if (error || !data?.length) {
        console.error("InspirationCarousel fetch error:", error);
        setLoading(false);
        return;
      }

      // Shuffle for variety each session
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const mid = Math.ceil(shuffled.length / 2);
      setRow1(shuffled.slice(0, mid));
      setRow2(shuffled.slice(mid));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((r) => (
          <div key={r} className="flex gap-2 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] w-28 flex-shrink-0 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!row1.length && !row2.length) return null;

  return (
    <div className="space-y-2 overflow-hidden">
      <MarqueeRow images={row1} direction="left" onImageClick={onImageClick} />
      <MarqueeRow images={row2} direction="right" onImageClick={onImageClick} />
    </div>
  );
}

function MarqueeRow({
  images,
  direction,
  onImageClick,
}: {
  images: MediaImage[];
  direction: "left" | "right";
  onImageClick: (img: MediaImage) => void;
}) {
  // Duplicate for seamless loop
  const doubled = [...images, ...images];
  const animClass = direction === "left" ? "animate-scroll-left" : "animate-scroll-right";

  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-2 w-max ${animClass} hover:[animation-play-state:paused]`}
      >
        {doubled.map((img, i) => (
          <button
            key={`${img.id}-${i}`}
            type="button"
            onClick={() => onImageClick(img)}
            className="aspect-[3/4] w-28 flex-shrink-0 rounded-lg overflow-hidden relative group focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={img.thumbnail_url || img.url}
              alt={img.label || "Inspiration"}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] text-white font-medium line-clamp-1 drop-shadow-lg">
                {img.label || "Tap to add"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
