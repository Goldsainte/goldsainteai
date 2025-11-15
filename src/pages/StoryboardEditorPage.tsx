// src/pages/StoryboardEditorPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getOrCreateTripStoryboard,
  getStoryboardItems,
  addStoryboardItem,
  updateStoryboardItemOrder,
  Storyboard,
  StoryboardItem,
} from "@/services/storyboardService";
import { MediaLibrarySidebar } from "@/components/MediaLibrarySidebar";
import { TripAIMatches } from "@/components/TripAIMatches";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function StoryboardEditorPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [items, setItems] = useState<StoryboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const sb = await getOrCreateTripStoryboard(tripId);
        if (cancelled) return;
        setStoryboard(sb);
        const its = await getStoryboardItems(sb.id);
        if (!cancelled) setItems(its);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const handleAddTile = async (mediaUrl: string) => {
    if (!storyboard) return;
    setAdding(true);
    try {
      const newItem = await addStoryboardItem({
        storyboardId: storyboard.id,
        mediaUrl,
      });
      setItems((prev) => [...prev, newItem]);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleReorder = async (direction: "up" | "down", id: string) => {
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return;

    const newItems = [...items];
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= newItems.length) return;

    [newItems[index], newItems[swapWith]] = [
      newItems[swapWith],
      newItems[index],
    ];

    const reordered = newItems.map((i, idx) => ({
      ...i,
      order_index: idx,
    }));

    setItems(reordered);
    if (!storyboard) return;
    await updateStoryboardItemOrder(
      storyboard.id,
      reordered.map((i) => ({ id: i.id, order_index: i.order_index })),
    );
  };

  const handleGenerateWithAI = async () => {
    if (!storyboard || !tripId) return;
    setAiLoading(true);
    try {
      const { error } = await supabase.functions.invoke("ai-storyboard-suggestions", {
        body: { tripId, storyboardId: storyboard.id },
      });
      if (error) {
        console.error(error);
      } else {
        const updated = await getStoryboardItems(storyboard.id);
        setItems(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (!tripId) {
    return <p className="text-xs p-4">Missing trip id.</p>;
  }

  return (
    <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6] px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-[11px] text-[#BFAD72] font-semibold flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Goldsainte storyboard
            </p>
            <h1 className="text-lg font-semibold">
              Design the trip like a TikTok storyboard
            </h1>
            <p className="text-[11px] text-[#E5DFC6]/80 max-w-md">
              Drop scenes, hotels, shots, and experiences onto this board. The
              traveler sees this as the visual "mood" for their booked journey.
            </p>
            <Link
              to={`/trip/${tripId}`}
              className="text-[11px] text-[#BFAD72] underline mt-1 inline-block"
            >
              Back to trip detail
            </Link>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              type="button"
              size="sm"
              disabled={aiLoading || loading}
              onClick={handleGenerateWithAI}
              className="rounded-full bg-[#BFAD72] text-[#0a2225] text-[11px] hover:bg-[#d4c58d]"
            >
              {aiLoading ? "Shaping storyboard…" : "Let Goldsainte AI suggest scenes"}
            </Button>
            <p className="text-[10px] text-[#E5DFC6]/70 max-w-xs text-right">
              We'll create a first pass of arrival, hotel, golden hour, and
              hero moments based on the trip brief.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-[3fr,1.5fr]">
          <div className="space-y-4">
            <div className="rounded-3xl bg-black/30 border border-[#BFAD72]/30 p-3 md:p-4">
              {loading ? (
                <p className="text-[11px] text-[#E5DFC6]/80">
                  Loading storyboard…
                </p>
              ) : items.length === 0 ? (
                <p className="text-[11px] text-[#E5DFC6]/80">
                  No tiles yet. Pick images from the library to start sketching
                  the journey, or use Goldsainte AI for a first draft.
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-3 auto-rows-[140px]">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0c4d47] via-[#0a2225] to-[#BFAD72]"
                    >
                      {item.media_url && (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.media_url})` }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="relative h-full flex flex-col justify-between p-2">
                        <div className="flex items-center justify-between gap-1 text-[9px] text-[#E5DFC6]/80">
                          <span>
                            {item.category_tag || "Scene"}
                            {item.day_number
                              ? ` · Day ${item.day_number}`
                              : ""}
                          </span>
                          <div className="inline-flex rounded-full bg-black/50 border border-white/10">
                            <button
                              type="button"
                              className="px-1"
                              onClick={() => handleReorder("up", item.id)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="px-1 border-l border-white/10"
                              onClick={() => handleReorder("down", item.id)}
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                        <div>
                          {item.caption && (
                            <p className="text-[10px] text-[#E5DFC6] line-clamp-2">
                              {item.caption}
                            </p>
                          )}
                          {item.location_label && (
                            <p className="text-[9px] text-[#BFAD72] mt-0.5">
                              {item.location_label}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* AI matches panel under storyboard */}
            <TripAIMatches tripId={tripId} />
          </div>

          <MediaLibrarySidebar onSelect={handleAddTile} />
        </section>
      </div>
    </main>
  );
}
