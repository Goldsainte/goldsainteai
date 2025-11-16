// src/pages/TikTokLab/StoryboardEditorPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";

type StoryboardData = {
  id: string;
  trip_id: string | null;
  title: string | null;
  description: string | null;
  theme_tags: string[] | null;
  visibility: string;
};

export default function StoryboardEditorPage() {
  const { checking, allowed } = useRequireOnboarding();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const effectiveMode: "create" | "edit" = params.id ? "edit" : "create";
  const storyboardId = params.id;

  const [loading, setLoading] = useState(effectiveMode === "edit");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [themeTagsRaw, setThemeTagsRaw] = useState("");
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    if (checking || !allowed) return;

    if (effectiveMode === "create") {
      const searchParams = new URLSearchParams(location.search);
      const tripFromQuery = searchParams.get("tripId");
      if (tripFromQuery) {
        setTripId(tripFromQuery);
      }
      setLoading(false);
      return;
    }

    if (!storyboardId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("storyboards")
          .select("*")
          .eq("id", storyboardId)
          .maybeSingle();

        if (!cancelled) {
          if (fetchError) throw fetchError;
          if (!data) {
            setError("Storyboard not found.");
          } else {
            hydrateFromStoryboard(data as StoryboardData);
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

    function hydrateFromStoryboard(sb: StoryboardData) {
      setTitle(sb.title || "");
      setDescription(sb.description || "");
      setThemeTagsRaw((sb.theme_tags || []).join(", "));
      setTripId(sb.trip_id || null);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [effectiveMode, storyboardId, checking, allowed, location.search]);

  if (checking || !allowed) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] flex items-center justify-center">
        <p className="text-[11px]">Preparing your storyboard editor…</p>
      </main>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const tags = themeTagsRaw
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const payload: any = {
        trip_id: tripId,
        title: title || null,
        description: description || null,
        theme_tags: tags.length ? tags : null,
        visibility: "trip",
      };

      if (!storyboardId) {
        payload.owner_id = user.id;
        const accountType = user.user_metadata?.account_type;
        if (accountType) {
          payload.owner_role = accountType;
        }
      }

      const query = supabase.from("storyboards");
      const { data, error: saveError } = storyboardId
        ? await query.update(payload).eq("id", storyboardId).select("*").maybeSingle()
        : await query.insert(payload).select("*").maybeSingle();

      if (saveError) throw saveError;
      if (!data) throw new Error("No storyboard data returned.");

      if (!storyboardId) {
        navigate(`/tiktok-lab/storyboards/${data.id}/edit`, { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save storyboard.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!storyboardId) {
      setError("Save the storyboard before publishing.");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const { error: pubError } = await supabase
        .from("storyboards")
        .update({ visibility: "public_template" })
        .eq("id", storyboardId);

      if (pubError) throw pubError;
      navigate(`/storyboards/${storyboardId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not publish storyboard.");
    } finally {
      setPublishing(false);
    }
  };

  const pageTitle =
    effectiveMode === "create"
      ? "Create a new storyboard"
      : "Edit storyboard";

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-8 pb-4 md:pt-10 md:pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D] mb-3 hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] border border-[#BFAD72]/40">
            <Sparkles className="h-3 w-3 text-[#BFAD72]" />
            <span className="tracking-[0.18em] uppercase text-[#8D8D8D]">
              TikTok Lab · Storyboard
            </span>
          </div>
          <h1 className="font-display text-[22px] md:text-[24px] leading-snug">
            {pageTitle}
          </h1>
          <p className="text-[11px] text-[#4a4a4a] max-w-xl">
            This is the version travelers will eventually see — a visual script
            for the trip. Think in scenes: arrival, reveals, quiet moments,
            golden hour, last night.
          </p>
        </header>

        {error && (
          <p className="mt-3 text-[11px] text-red-600">{error}</p>
        )}
        {loading && (
          <p className="mt-3 text-[11px] text-[#8D8D8D]">
            Loading storyboard…
          </p>
        )}
      </section>

      {!loading && (
        <section className="mx-auto max-w-5xl px-4 pb-14 md:pb-20">
          <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-4 text-[11px]">
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="font-semibold">Storyboard title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none"
                  placeholder="Maldives in three acts: arrival, reveal, unwind"
                />
              </label>

              <label className="block space-y-1">
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none"
                  placeholder="A brief overview of the journey..."
                />
              </label>

              <label className="block space-y-1">
                <span>Theme tags</span>
                <input
                  type="text"
                  value={themeTagsRaw}
                  onChange={(e) => setThemeTagsRaw(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 text-[11px] outline-none"
                  placeholder="overwater, sunrise, slow luxury, content-friendly"
                />
                <p className="text-[10px] text-[#8D8D8D]">
                  Comma-separated tags that describe the vibe.
                </p>
              </label>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2 border-t border-[#E5DFC6]">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3 py-1.5 font-semibold hover:bg-[#073331] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  disabled={publishing}
                  onClick={handlePublish}
                  className="inline-flex items-center gap-1 rounded-full bg-[#BFAD72] text-[#0a2225] px-3 py-1.5 font-semibold hover:bg-[#d4c58d] disabled:opacity-50"
                >
                  {publishing ? "Publishing…" : "Publish storyboard"}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              {storyboardId && (
                <Link
                  to={`/storyboards/${storyboardId}`}
                  className="text-[10px] text-[#0c4d47] underline"
                >
                  Preview as a traveler
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
