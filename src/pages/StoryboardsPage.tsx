import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Sparkles } from "lucide-react";
import { getPublishedStoryboards, StoryboardGalleryItem } from "@/services/storyboardService";

const BG = "bg-[#f7f3ea]";

export default function StoryboardsPage() {
  const [storyboards, setStoryboards] = useState<StoryboardGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublishedStoryboards();
        if (!cancelled) setStoryboards(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Could not load storyboards.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={`${BG} min-h-screen text-[#0a2225]`}>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-4 md:pt-14 md:pb-6">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] border border-[#BFAD72]/40">
            <Film className="h-3 w-3 text-[#BFAD72]" />
            <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
              Goldsainte Storyboards
            </span>
          </div>
          <h1 className="font-display text-[24px] md:text-[28px] leading-snug">
            Trips laid out like a wall of inspiration.
          </h1>
          <p className="text-[11px] md:text-[12px] text-[#4a4a4a] max-w-xl">
            This is where travelers, creators and agents meet in visuals first.
            Each card is a real storyboard: scenes, moments and moods mapped out
            before a booking ever happens.
          </p>
        </header>

        {error && (
          <p className="mt-3 text-[11px] text-red-600">
            {error}
          </p>
        )}
        {loading && !error && (
          <p className="mt-3 text-[11px] text-[#8D8D8D]">
            Loading storyboards…
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
        {storyboards.length === 0 && !loading && !error ? (
          <p className="text-[11px] text-[#8D8D8D]">
            No storyboards are live yet. Once creators and agents publish boards,
            they'll appear here as a wall of journeys.
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {storyboards.map((sb) => (
              <StoryboardCard key={sb.id} storyboard={sb} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StoryboardCard({ storyboard }: { storyboard: StoryboardGalleryItem }) {
  const navigate = useNavigate();

  const {
    id,
    trip_id,
    title,
    description,
    hero_image_url,
    duration_label,
    theme_tags,
    scenes_preview,
  } = storyboard;

  const handleClick = () => {
    if (trip_id) {
      navigate(`/trip/${trip_id}`);
    } else {
      navigate(`/storyboards/${id}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-4 w-full text-left inline-block align-top"
    >
      <div className="rounded-3xl overflow-hidden bg-white border border-[#E5DFC6] shadow-sm hover:shadow-md transition-shadow">
        {hero_image_url ? (
          <div className="relative h-40">
            <img
              src={hero_image_url}
              alt={title || "Goldsainte storyboard"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          </div>
        ) : (
          <div className="h-20 bg-[#f6f3ea] flex items-center justify-center">
            <Film className="h-6 w-6 text-[#BFAD72]" />
          </div>
        )}

        <div className="p-3.5 space-y-2 text-[11px] text-[#0a2225]">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D] flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#BFAD72]" />
            <span>Storyboard</span>
          </p>

          <div className="space-y-0.5">
            <p className="text-[12px] font-semibold">
              {title || "Untitled storyboard"}
            </p>
            {duration_label && (
              <p className="text-[10px] text-[#8D8D8D]">{duration_label}</p>
            )}
            {description && (
              <p className="text-[10px] text-[#4a4a4a] line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>

          {scenes_preview && scenes_preview.length > 0 && (
            <ul className="mt-1 space-y-1">
              {scenes_preview.slice(0, 3).map((scene, idx) => (
                <li key={idx} className="flex gap-2 text-[#4a4a4a]">
                  <span className="mt-[5px] h-1 w-1 rounded-full bg-[#BFAD72]" />
                  <span>{scene}</span>
                </li>
              ))}
            </ul>
          )}

          {theme_tags && theme_tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {theme_tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-[#f6f3ea] border border-[#E5DFC6] px-2 py-0.5 text-[10px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
