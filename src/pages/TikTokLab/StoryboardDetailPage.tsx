// src/pages/StoryboardDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BG = "bg-[#f7f3ea]";

type StoryboardDetail = {
  id: string;
  trip_id: string | null;
  title: string | null;
  description: string | null;
  theme_tags: string[] | null;
};

export default function StoryboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [storyboard, setStoryboard] = useState<StoryboardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Storyboard ID is missing.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("storyboards")
          .select("*")
          .eq("id", id)
          .single();

        if (!cancelled) {
          if (fetchError) throw fetchError;
          if (!data) {
            setError("This storyboard could not be found.");
          } else {
            setStoryboard(data as StoryboardDetail);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Could not load storyboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className={`${BG} min-h-screen flex items-center justify-center`}>
        <p className="text-[11px] text-[#8D8D8D]">Loading storyboard…</p>
      </main>
    );
  }

  if (error || !storyboard) {
    return (
      <main className={`${BG} min-h-screen flex items-center justify-center`}>
        <div className="text-center space-y-2 text-[11px] text-[#4a4a4a]">
          <p className="font-semibold text-[12px]">Something went wrong.</p>
          <p>{error || "This storyboard is not available."}</p>
          <button
            type="button"
            onClick={() => navigate("/tiktok-lab/storyboards")}
            className="mt-1 inline-flex items-center gap-1 text-[#0c4d47] font-semibold"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to storyboards
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`${BG} min-h-screen text-[#0a2225]`}>
      <section className="w-full bg-[#f7f3ea]">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-6 md:pt-10 md:pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D] mb-3 hover:text-[#0a2225]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>

          <div className="grid gap-6 md:grid-cols-[3fr,2fr] items-start">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-3xl bg-[#f6f3ea] border border-[#E5DFC6] h-56 md:h-64">
                <div className="h-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-[#BFAD72]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[10px] border border-[#BFAD72]/40">
                  <Sparkles className="h-3 w-3 text-[#BFAD72]" />
                  <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
                    Goldsainte Storyboard
                  </span>
                </div>
                <h1 className="font-display text-[22px] md:text-[24px] leading-snug">
                  {storyboard.title || "Untitled journey"}
                </h1>
                {storyboard.description && (
                  <p className="text-[11px] text-[#4a4a4a]">
                    {storyboard.description}
                  </p>
                )}
              </div>

              {storyboard.theme_tags && storyboard.theme_tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                  {storyboard.theme_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-[#f6f3ea] border border-[#E5DFC6] px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <aside className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 space-y-3 text-[11px]">
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#8D8D8D]">
                Turn this storyboard into your trip
              </p>
              <p className="text-sm font-semibold">
                Ask Goldsainte to recreate this exact vibe — or use it as a
                starting point for your own dates and budget.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/post-trip?fromStoryboard=${encodeURIComponent(storyboard.id)}`)
                  }
                  className="w-full inline-flex items-center justify-center gap-1 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3 py-2 text-[11px] font-semibold hover:bg-[#073331]"
                >
                  Request this trip
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <p className="text-[10px] text-[#8D8D8D]">
                Your brief goes to creators and agents in the Goldsainte
                marketplace. All messaging and payments stay on-platform for
                everyone's protection.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
