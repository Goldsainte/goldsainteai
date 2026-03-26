import { useState, useEffect } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyStoryboards,
  createStoryboard,
  addStoryboardItem,
} from "@/services/storyboardsService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SaveToStoryboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  sourceType?: string;
  sourceId?: string;
  categoryPath?: string[];
  tags?: string[];
  repinnedFromItemId?: string;
  repinnedFromUserId?: string;
  onSaveComplete?: () => void;
}

interface BoardOption {
  id: string;
  title: string;
  is_public: boolean;
  items_count?: number;
}

export function SaveToStoryboardModal({
  open,
  onOpenChange,
  imageUrl,
  title,
  subtitle,
  sourceType = "unsplash",
  sourceId,
  categoryPath = [],
  tags = [],
  repinnedFromItemId,
  repinnedFromUserId,
  onSaveComplete,
}: SaveToStoryboardModalProps) {
  const queryClient = useQueryClient();
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");

  useEffect(() => {
    if (open) loadBoards();
  }, [open]);

  async function loadBoards() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const data = await getMyStoryboards(user.id);
      setBoards(
        data.map((b) => ({
          id: b.id,
          title: b.title,
          is_public: b.is_public,
          items_count: b.items_count,
        }))
      );
    } catch {
      toast.error("Failed to load storyboards");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(boardId: string) {
    setSaving(boardId);
    try {
      await addStoryboardItem({
        storyboardId: boardId,
        itemType: "image",
        title: title || null,
        subtitle: subtitle || null,
        imageUrl,
        sourceType,
        sourceId: sourceId || undefined,
        metadata: {
          category_path: categoryPath,
          tags,
          ...(repinnedFromItemId
            ? {
                repinned_from_item_id: repinnedFromItemId,
                repinned_from_user_id: repinnedFromUserId,
              }
            : {}),
        },
      });
      toast.success("Saved to storyboard!");
      queryClient.invalidateQueries({ queryKey: ["storyboards"] });
      queryClient.invalidateQueries({ queryKey: ["storyboard-items"] });
      onSaveComplete?.();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function handleCreateAndSave() {
    if (!newBoardTitle.trim()) return;
    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const board = await createStoryboard({
        ownerId: user.id,
        role: "traveler",
        title: newBoardTitle.trim(),
        isPublic: false,
      });

      await handleSave(board.id);
      setNewBoardTitle("");
    } catch {
      toast.error("Failed to create storyboard");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-secondary">
            Save to Storyboard
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 mb-4">
          <img
            src={imageUrl}
            alt={title || "Pin"}
            className="w-20 h-20 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0">
            {title && (
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {title}
              </p>
            )}
            {categoryPath.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {categoryPath.join(" → ")}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => handleSave(board.id)}
                disabled={saving !== null}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-[#C7A962] hover:bg-[#faf8f2] transition-all text-left group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {board.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {board.items_count || 0} pins ·{" "}
                    {board.is_public ? "Public" : "Private"}
                  </p>
                </div>
                {saving === board.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#C7A962]" />
                ) : (
                  <Check className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Create new board
          </p>
          <div className="flex gap-2">
            <Input
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Board name…"
              className="text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndSave()}
            />
            <Button
              size="sm"
              onClick={handleCreateAndSave}
              disabled={!newBoardTitle.trim() || creating}
              className="shrink-0 bg-[#C7A962] hover:bg-[#b89a55] text-white"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
