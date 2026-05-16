import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, ArrowRight, Layers, MoreVertical, Edit2, Trash2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { CATEGORY_KEYWORDS } from "@/components/ui/CategoryChips";
import { RefinementChips } from "@/components/discovery/RefinementChips";
import { DiscoveryFeed } from "@/components/discovery/DiscoveryFeed";
import { DiscoveryWelcomeModal } from "@/components/discovery/DiscoveryWelcomeModal";
import { DiscoveryTooltipTour } from "@/components/discovery/DiscoveryTooltipTour";
import { useDiscoveryMilestone } from "@/hooks/useDiscoveryMilestone";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteStoryboard } from "@/services/storyboardsService";
import { toast } from "sonner";

const ONBOARDED_KEY = "goldsainte_discovery_onboarded";
const INSTRUCTION_DISMISSED_KEY = "goldsainte_instruction_dismissed";

export interface PinItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  storyboard_id: string;
  storyboard_title: string;
  storyboard_destination: string | null;
  owner_id?: string;
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
  onDeleteItem?: (itemId: string) => void;
  onBoardDeleted?: () => void;
}

export function CreatorPinterestFeed({
  items,
  storyboards,
  creatorId,
  isOwnProfile,
  onCreateNew,
  onDeleteItem,
  onBoardDeleted,
}: Props) {
  const navigate = useNavigate();
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [refinementPath, setRefinementPath] = useState<string[]>([]);
  const { recordSave } = useDiscoveryMilestone();

  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem(ONBOARDED_KEY) !== "true"
  );
  const [tourReady, setTourReady] = useState(false);
  const [instructionDismissed, setInstructionDismissed] = useState(
    () => localStorage.getItem(INSTRUCTION_DISMISSED_KEY) === "true"
  );

  const activeCategory = refinementPath[0] || "All";

  const filteredItems = items.filter((item) => {
    if (activeBoard && item.storyboard_id !== activeBoard) return false;
    if (activeCategory !== "All") {
      const keywords = CATEGORY_KEYWORDS[activeCategory] || [];
      const haystack = [item.title, item.subtitle, item.storyboard_title, item.storyboard_destination]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!keywords.some((kw) => haystack.includes(kw))) return false;
    }
    return true;
  });

  function handleWelcomeDismiss() {
    setShowWelcome(false);
    localStorage.setItem(ONBOARDED_KEY, "true");
    setTourReady(true);
  }

  function handleDismissInstruction() {
    setInstructionDismissed(true);
    localStorage.setItem(INSTRUCTION_DISMISSED_KEY, "true");
  }

  function handleSetTopCategory(cat: string) {
    setRefinementPath([cat]);
  }
  function handleAddRefinement(term: string) {
    setRefinementPath((prev) => [...prev, term]);
  }
  function handlePopToIndex(index: number) {
    setRefinementPath((prev) => prev.slice(0, index));
  }
  function handleReset() {
    setRefinementPath([]);
  }
  function handleMoreLikeThis(tags: string[]) {
    setRefinementPath((prev) => {
      const combined = [...prev, ...tags.filter((t) => !prev.some((p) => p.toLowerCase() === t.toLowerCase()))];
      return combined.slice(0, 8);
    });
  }

  if (items.length === 0 && refinementPath.length === 0) {
    return (
      <div>
        <DiscoveryWelcomeModal open={showWelcome} onDismiss={handleWelcomeDismiss} />
        <DiscoveryTooltipTour run={tourReady} onFinish={() => setTourReady(false)} />

        <RefinementChips
          refinementPath={refinementPath}
          onSetTopCategory={handleSetTopCategory}
          onAddRefinement={handleAddRefinement}
          onPopToIndex={handlePopToIndex}
          onReset={handleReset}
          className="mb-2"
        />

        {/* Inline instruction bar */}
        {!instructionDismissed && (
          <div className="flex items-center justify-between bg-accent/50 rounded-full px-4 py-2 mb-4">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-medium text-foreground">Browse</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium text-foreground">Save</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium text-foreground">Build your trip</span>
            </p>
            <button onClick={handleDismissInstruction} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {refinementPath.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/60 p-12 text-center">
            <p className="font-secondary text-lg text-foreground mb-2">
              {isOwnProfile ? "Create your first storyboard" : "No inspiration yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {isOwnProfile
                ? "Pin photos, places, and experiences to build visual travel collections that inspire your audience."
                : "This creator hasn't published any travel pins yet — check back soon."}
            </p>
            {isOwnProfile && onCreateNew && (
              <Button
                onClick={onCreateNew}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-11"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Storyboard
              </Button>
            )}
          </div>
        ) : (
          <DiscoveryFeed
            refinementPath={refinementPath}
            onMoreLikeThis={handleMoreLikeThis}
            creatorId={creatorId}
            onSaveComplete={recordSave}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <DiscoveryWelcomeModal open={showWelcome} onDismiss={handleWelcomeDismiss} />
      <DiscoveryTooltipTour run={tourReady} onFinish={() => setTourReady(false)} />

      {/* Refinement discovery chips */}
      <RefinementChips
        refinementPath={refinementPath}
        onSetTopCategory={handleSetTopCategory}
        onAddRefinement={handleAddRefinement}
        onPopToIndex={handlePopToIndex}
        onReset={handleReset}
        className="mb-2"
      />

      {/* Inline instruction bar */}
      {!instructionDismissed && (
        <div className="flex items-center justify-between bg-accent/50 rounded-full px-4 py-2 mb-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="font-medium text-foreground">Browse</span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">Save</span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">Build your trip</span>
          </p>
          <button onClick={handleDismissInstruction} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Board filter section — visually distinct from discovery categories */}
      <div className="border-t border-border/50 pt-4 mt-2 mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {isOwnProfile ? "Your Boards" : "Boards"}
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveBoard(null)}
            className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium tracking-wide transition-all ${
              activeBoard === null
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            All
          </button>
          {storyboards.map((sb) => (
            <div key={sb.id} className="shrink-0 flex items-center gap-0">
              <button
                onClick={() => setActiveBoard(sb.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium tracking-wide transition-all flex items-center gap-1.5 ${
                  activeBoard === sb.id
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/50 border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                } ${isOwnProfile ? "rounded-r-none" : ""}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeBoard === sb.id ? "bg-primary" : "bg-primary/40"}`} />
                {sb.title}
                {isOwnProfile && !sb.is_public && <span className="ml-1 opacity-60">· Draft</span>}
              </button>
              {isOwnProfile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-1.5 py-1.5 rounded-r-lg text-sm transition-all ${
                        activeBoard === sb.id
                          ? "bg-foreground text-background"
                          : "bg-muted/50 border border-l-0 border-border text-muted-foreground hover:text-foreground"
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
                      className="text-red-400 focus:text-red-300"
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
                        } catch (err) {
                          console.error(err);
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
              className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-border text-primary hover:border-primary transition-all flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              New Board
            </button>
          )}
        </div>
      </div>

      {/* Discovery feed with creator pins mixed in */}
      <DiscoveryFeed
        refinementPath={refinementPath}
        creatorPins={filteredItems.map((item) => ({ ...item, owner_id: creatorId }))}
        onMoreLikeThis={handleMoreLikeThis}
        creatorId={creatorId}
        onSaveComplete={recordSave}
      />
    </div>
  );
}
