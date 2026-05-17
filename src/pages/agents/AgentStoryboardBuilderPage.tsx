import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { StoryboardBuilder } from "@/components/storyboards/StoryboardBuilder";

export default function AgentStoryboardBuilderPage() {
  const navigate = useNavigate();

  function handleStoryboardSaved(storyboardId: string) {
    navigate(`/agent-dashboard?storyboard=${storyboardId}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/agent-dashboard")
          }
          className="mb-6 inline-flex items-center gap-2 text-[11px] text-[#4a4a4a] hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to dashboard
        </button>

        <div className="mb-6">
          <h1 className="font-display text-[28px] text-[#0a2225]">
            Create Proposal Storyboard
          </h1>
          <p className="mt-2 text-[13px] text-[#4a4a4a]">
            Build a visual proposal with photos, experiences, and links to send to travelers.
          </p>
        </div>

        <StoryboardBuilder mode="agent" onSaved={handleStoryboardSaved} />
      </div>
    </main>
  );
}
