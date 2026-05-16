import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Layers, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteStoryboard } from "@/services/storyboardsService";
import { toast } from "sonner";

export interface PinItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  storyboard_id: string;
  storyboard_title: string;
  storyboard_destination: string | null;
}

export interface BoardSummary {
  id: string;
  title: string;
  destination: string | null;
  is_public: boolean;
}

interface Props {
  items: PinItem[];
  storyboards: BoardSummary[];
  creatorId: string;
  isOwnProfile?: boolean;
  onCreateNew?: () => void;
  onBoardDeleted?: () => void;
}

export function CreatorStorefrontFeed({
  items,
  storyboards,
  creatorId,
  isOwnProfile,
  onCreateNew,
  onBoardDeleted,
}: Props) {
  const navigate = useNavigate();
  const [activeBoard, setActiveBoard] = useState<string | null>(null);

  const filteredItems = activeBoard
    ? items.filter((item) => item.storyboard_id === activeBoard)
    : items;

  if (items.length === 0 && !isOwnProfile) return null;

  return (
    <div>
      {/* Board filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
        <button
          onClick={() => setActiveBoard(null)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeBoard === null
              ? "bg-[#0a2225] text-white"
              : "bg-white border border-[#E5DFC6] text-[#6B7280] hover:text-[#0a2225] hover:border-[#C7A962]/50"
          }`}
        >
          All
        </button>
        {storyboards.map((sb) => (
          <div key={sb.id} className="shrink-0 flex items-center">
            <button
              onClick={() => setActiveBoard(sb.id)}
              className={`px-4 py-1.5 text-sm font-medium transition-all ${
                activeBoard === sb.id
                  ? "bg-[#0a2225] text-white rounded-full"
                  : "bg-white border border-[#E5DFC6] text-[#6B7280] hover:text-[#0a2225] hover:border-[#C7A962]/50 rounded-full"
              } ${isOwnProfile ? "rounded-r-none" : ""}`}
            >
              {sb.title}
            </button>
            {isOwnProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-1.5 py-1.5 rounded-r-full text-sm transition-all ${
                      activeBoard === sb.id
                        ? "bg-[#0a2225] text-white"
                        : "bg-white border border-l-0 border-[#E5DFC6] text-[#6B7280] hover:text-[#0a2225]"
                    }`}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/storyboards/${sb.id}`)}>
                    <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit Board
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-600"
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: `Delete "${sb.title}"?`,
                        description: "This cannot be undone.",
                        confirmText: "Delete",
                        destructive: true,
                      });
                      if (!ok) return;
                      try {
                        await deleteStoryboard(sb.id);
                        toast.success("Storyboard deleted");
                        if (activeBoard === sb.id) setActiveBoard(null);
                        onBoardDeleted?.();
                      } catch {
                        toast.error("Failed to delete storyboard");
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
        {isOwnProfile && onCreateNew && (
          <button
            onClick={onCreateNew}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-[#E5DFC6] text-[#C7A962] hover:border-[#C7A962] transition-all flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            New Board
          </button>
        )}
      </div>

      {/* Masonry grid */}
      {filteredItems.length > 0 ? (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {filteredItems.map((pin) => (
            <div
              key={pin.id}
              className="break-inside-avoid group cursor-pointer"
              onClick={() => navigate(`/storyboards/${pin.storyboard_id}`)}
            >
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={pin.image_url}
                  alt={pin.title || "Travel pin"}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {pin.title && (
                    <p className="text-white text-sm font-medium leading-snug">{pin.title}</p>
                  )}
                  {pin.storyboard_title && (
                    <p className="text-white/70 text-xs mt-1">{pin.storyboard_title}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isOwnProfile ? (
        <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white/60 p-12 text-center">
          <p className="font-secondary text-lg text-[#0a2225] mb-2">Create your first storyboard</p>
          <p className="text-sm text-[#6B7280] mb-6 max-w-md mx-auto">
            Pin photos, places, and experiences to build visual travel collections.
          </p>
          {onCreateNew && (
            <Button
              onClick={onCreateNew}
              className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-8 h-11"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Storyboard
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
