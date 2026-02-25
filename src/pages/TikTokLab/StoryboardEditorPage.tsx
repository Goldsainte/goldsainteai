// src/pages/TikTokLab/StoryboardEditorPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { StoryboardBuilder } from "@/components/storyboards/StoryboardBuilder";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";
import { supabase } from "@/integrations/supabase/client";

export default function StoryboardEditorPage() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const effectiveMode: "create" | "edit" = params.id ? "edit" : "create";
  const storyboardId = params.id;

  const [initialTitle, setInitialTitle] = useState("");
  const [storyboard, setStoryboard] = useState<{
    id: string;
    title: string | null;
    created_at: string;
    related_concierge_session_id: string | null;
  } | null>(null);
  const [loadingStoryboard, setLoadingStoryboard] = useState(!!storyboardId);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const titleFromQuery = searchParams.get("title");
    if (titleFromQuery) {
      setInitialTitle(titleFromQuery);
    }
  }, [location.search]);

  useEffect(() => {
    if (!storyboardId) {
      setLoadingStoryboard(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("storyboards")
        .select("id, title, created_at, related_concierge_session_id")
        .eq("id", storyboardId)
        .single();

      if (error) {
        console.error("Error loading storyboard:", error);
        setLoadingStoryboard(false);
        return;
      }

      setStoryboard(data as any);
      setLoadingStoryboard(false);
    })();
  }, [storyboardId]);

  function handleStoryboardSaved(id: string) {
    navigate("/storyboards");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/storyboards"
          className="mb-6 inline-flex items-center gap-2 text-[11px] text-[#4a4a4a] hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to storyboards
        </Link>

        {storyboard && storyboard.related_concierge_session_id && !loadingStoryboard && (
          <div className="mb-4 rounded-2xl border border-[#E5DFC6] bg-white/90 px-3 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2">
            <div className="text-[#4a4a4a]">
              <span className="font-semibold text-[#0a2225]">
                Created from your conversation with Madison
              </span>
              <span className="text-[#8D8D8D]">
                {" "}· {new Date(storyboard.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <Link
              to={`/concierge?sessionId=${storyboard.related_concierge_session_id}`}
              className="text-[10px] font-semibold text-[#0c4d47] underline underline-offset-2 hover:text-[#073331]"
            >
              View that concierge thread
            </Link>
          </div>
        )}

        <div className="mb-6">
          <h1 className="font-display text-[28px] text-[#0a2225]">
            {effectiveMode === "edit" ? "Edit Storyboard" : "Create Storyboard"}
          </h1>
          <p className="mt-2 text-[13px] text-[#4a4a4a]">
            Build a visual storyboard with photos, experiences, and links to inspire your trips and packages.
          </p>
        </div>

        <StoryboardBuilder
          storyboardId={storyboardId}
          initialTitle={initialTitle}
          mode="creator"
          onSaved={handleStoryboardSaved}
        />

        {/* Browse Inspiration section */}
        {effectiveMode === "create" && (
          <div className="mt-10 pt-8 border-t border-[#E5DFC6]">
            <TravelStoryboard
              title="Browse Inspiration"
              subtitle="Save visual ideas to your storyboard. Click the save button on any image to add it."
              showSaveButtons={true}
              maxItems={50}
            />
          </div>
        )}
      </div>
    </main>
  );
}
