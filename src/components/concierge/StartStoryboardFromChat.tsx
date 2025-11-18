import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutTemplate, Loader2 } from "lucide-react";

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

      const { data, error } = await supabase
        .from("storyboards")
        .insert({
          owner_id: user.id,
          owner_role: ownerRole,
          title: "Trip from Madison chat",
          subtitle: "Storyboard created from concierge conversation",
          related_concierge_session_id: sessionId,
          visibility: "private",
        })
        .select("id")
        .single();

      if (error || !data?.id) throw error;

      navigate(`/tiktok-lab/storyboards/${data.id}?from=concierge`);
    } catch (err) {
      console.error("Error starting storyboard from chat", err);
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
