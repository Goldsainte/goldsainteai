import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SaveToStoryboardButtonProps {
  assetType: "brand_collection" | "creator_profile";
  assetData: {
    id: string;
    title?: string;
    name?: string;
    cover_image_url?: string;
    avatar_url?: string;
    tags?: string[];
  };
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function SaveToStoryboardButton({
  assetType,
  assetData,
  variant = "outline",
  size = "default",
  className = "",
}: SaveToStoryboardButtonProps) {
  const [open, setOpen] = useState(false);
  const [storyboards, setStoryboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleOpen = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items to your storyboard.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);
    setOpen(true);

    // Load user's storyboards
    const { data, error } = await supabase
      .from("storyboards")
      .select("id, title, hero_image_url")
      .eq("owner_id", session.user.id)
      .eq("owner_role", "traveler")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setStoryboards(data);
    }
    setLoading(false);
  };

  const handleSave = async (storyboardId: string) => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.functions.invoke("save-to-storyboard", {
      body: {
        userId: session.user.id,
        storyboardId,
        assetType,
        assetData,
      },
    });

    if (error) {
      toast({
        title: "Save failed",
        description: error.message || "Could not save to storyboard.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved!",
        description: "Added to your storyboard.",
      });
      setOpen(false);
    }

    setLoading(false);
  };

  const handleCreateNew = () => {
    setOpen(false);
    navigate("/trip/create?returnTo=" + encodeURIComponent(window.location.pathname));
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpen}
        className={className}
      >
        <BookmarkPlus className="h-4 w-4 mr-2" />
        Save to Storyboard
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Save to Storyboard</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="py-6 text-center text-[12px] text-[#8D8D8D]">
              Loading your storyboards...
            </div>
          ) : storyboards.length === 0 ? (
            <div className="py-4 space-y-3">
              <p className="text-[12px] text-[#4a4a4a]">
                You don't have any storyboards yet. Create one to start saving inspiration!
              </p>
              <Button
                onClick={handleCreateNew}
                className="w-full rounded-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331]"
              >
                Create New Storyboard
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {storyboards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => handleSave(board.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E5DFC6] hover:bg-[#f7f3ea] transition-colors text-left disabled:opacity-50"
                  >
                    {board.hero_image_url ? (
                      <img
                        src={board.hero_image_url}
                        alt={board.title || "Storyboard"}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#E5DFC6] flex items-center justify-center">
                        <BookmarkPlus className="h-5 w-5 text-[#8D8D8D]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#0a2225] truncate">
                        {board.title || "Untitled Storyboard"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="w-full rounded-full"
              >
                Create New Storyboard
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
