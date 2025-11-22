import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutTemplate, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  sessionId: string;
  ownerRole?: "traveler" | "creator" | "agent";
};

export function StartStoryboardFromChat({ sessionId, ownerRole = "traveler" }: Props) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleClick() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sessionStorage.setItem('returnTo', '/concierge');
        navigate("/auth?returnTo=/concierge");
        return;
      }

      // Call AI storyboard itinerary function
      const { data, error } = await supabase.functions.invoke(
        "ai-storyboard-itinerary",
        {
          body: {
            conversationId: sessionId,
            userId: user.id,
            ownerRole,
            maxPhotos: 20,
          },
        }
      );

      if (error) {
        console.error("AI storyboard generation failed:", error);
        toast.error("Failed to create storyboard. Please try again.");
        return;
      }

      const storyboardId = data?.storyboardId;
      if (!storyboardId) {
        throw new Error("No storyboardId returned");
      }

      toast.success("✨ Your storyboard is ready!");
      navigate(`/storyboards/${storyboardId}`);
    } catch (err) {
      console.error("Storyboard from chat error:", err);
      toast.error("Something went wrong creating your storyboard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-3 py-1.5 text-[10px] font-semibold text-[#E5DFC6] hover:bg-[#073331] disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" /> Creating storyboard…
        </>
      ) : (
        <>
          <LayoutTemplate className="h-3 w-3" />
          Start a storyboard with these ideas
        </>
      )}
    </button>
  );
}
