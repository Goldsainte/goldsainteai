import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Highlight {
  id: string;
  title: string;
  cover_image_url: string | null;
  created_at: string;
}

interface StoryHighlightsProps {
  userId: string;
  isOwnProfile: boolean;
}

export const StoryHighlights = ({ userId, isOwnProfile }: StoryHighlightsProps) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [newHighlightTitle, setNewHighlightTitle] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHighlights();
  }, [userId]);

  const fetchHighlights = async () => {
    try {
      const response = await supabase
        .from("story_highlights" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (response.error) {
        console.error("Error fetching highlights:", response.error);
        return;
      }

      setHighlights(response.data || []);
    } catch (e) {
      console.error("Highlights error:", e);
    }
  };

  const createHighlight = async () => {
    if (!newHighlightTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("story_highlights" as any)
        .insert({
          user_id: userId,
          title: newHighlightTitle.trim(),
        });

      if (error) throw error;

      toast.success("Highlight created");
      setNewHighlightTitle("");
      setCreateDialogOpen(false);
      fetchHighlights();
    } catch (error) {
      toast.error("Failed to create highlight");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHighlight = async (highlightId: string) => {
    try {
      const { error } = await supabase
        .from("story_highlights" as any)
        .delete()
        .eq("id", highlightId);

      if (error) throw error;

      toast.success("Highlight deleted");
      fetchHighlights();
    } catch (error) {
      toast.error("Failed to delete highlight");
      console.error(error);
    }
  };

  if (highlights.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 overflow-x-auto py-4 px-4 border-b">
      {highlights.map((highlight) => (
        <div key={highlight.id} className="flex flex-col items-center gap-1 min-w-[80px] group">
          <div className="relative">
            <Avatar className="w-16 h-16 ring-2 ring-primary cursor-pointer">
              <AvatarImage src={highlight.cover_image_url || undefined} />
              <AvatarFallback>{highlight.title[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteHighlight(highlight.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          <span className="text-xs text-center truncate w-full">{highlight.title}</span>
        </div>
      ))}

      {isOwnProfile && (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <div className="flex flex-col items-center gap-1 min-w-[80px] cursor-pointer">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:bg-accent transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-xs text-center">New</span>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Highlight</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Highlight Title</Label>
                <Input
                  id="title"
                  value={newHighlightTitle}
                  onChange={(e) => setNewHighlightTitle(e.target.value)}
                  placeholder="e.g., Summer Trips"
                  maxLength={50}
                />
              </div>
              <Button onClick={createHighlight} disabled={loading} className="w-full">
                Create Highlight
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StoryHighlights;
