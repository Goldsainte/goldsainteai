// src/pages/TikTokLab/StoryboardEditorPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";
import { StoryboardBuilder } from "@/components/storyboards/StoryboardBuilder";

export default function StoryboardEditorPage() {
  const { checking, allowed } = useRequireOnboarding();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const effectiveMode: "create" | "edit" = params.id ? "edit" : "create";
  const storyboardId = params.id;

  const [initialTitle, setInitialTitle] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const titleFromQuery = searchParams.get("title");
    if (titleFromQuery) {
      setInitialTitle(titleFromQuery);
    }
  }, [location.search]);

  if (checking || !allowed) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] flex items-center justify-center">
        <p className="text-[11px]">Preparing your storyboard editor…</p>
      </main>
    );
  }

  function handleStoryboardSaved(id: string) {
    navigate("/tiktok-lab/storyboards");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/tiktok-lab/storyboards"
          className="mb-6 inline-flex items-center gap-2 text-[11px] text-[#4a4a4a] hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to storyboards
        </Link>

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
      </div>
    </main>
  );
}
