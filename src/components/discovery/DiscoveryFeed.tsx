import { useState, useEffect, useRef, useCallback } from "react";
import { Bookmark, Sparkles, ArrowRight, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiscoveryFeed, type UnsplashImage } from "@/hooks/useDiscoveryFeed";
import { SaveToStoryboardModal } from "./SaveToStoryboardModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DiscoveryFeedProps {
  refinementPath: string[];
  creatorPins?: {
    id: string;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    storyboard_id: string;
    storyboard_title: string;
    storyboard_destination: string | null;
    owner_id?: string;
  }[];
  onMoreLikeThis?: (tags: string[]) => void;
  creatorId?: string;
  onSaveComplete?: () => void;
}

export function DiscoveryFeed({
  refinementPath,
  creatorPins = [],
  onMoreLikeThis,
  creatorId,
  onSaveComplete,
}: DiscoveryFeedProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const observerRef = useRef<HTMLDivElement>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [saveModal, setSaveModal] = useState<{
    open: boolean;
    imageUrl: string;
    title?: string;
    sourceType?: string;
    sourceId?: string;
    repinnedFromItemId?: string;
    repinnedFromUserId?: string;
  }>({ open: false, imageUrl: "" });

  const showDiscovery = refinementPath.length > 0;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useDiscoveryFeed(refinementPath, showDiscovery);

  const discoveryImages = data?.pages.flatMap((p) => p.images) || [];

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: "400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  function openSaveModal(
    imageUrl: string,
    title?: string,
    sourceType?: string,
    sourceId?: string,
    repinnedFromItemId?: string,
    repinnedFromUserId?: string
  ) {
    if (!user) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setSaveModal({ open: true, imageUrl, title, sourceType, sourceId, repinnedFromItemId, repinnedFromUserId });
  }

  function handleSaveComplete() {
    // Track the saved image for animation
    if (saveModal.sourceId) {
      setSavedIds((prev) => new Set(prev).add(saveModal.sourceId!));
    }
    onSaveComplete?.();
  }

  function handleMoreLikeThis(img: UnsplashImage) {
    const newTags = [img.alt_description, img.description]
      .filter(Boolean)
      .join(" ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3);
    onMoreLikeThis?.(newTags);
  }

  const categoryPath = refinementPath;

  // Empty state when no discovery content and no creator pins
  if (!showDiscovery && creatorPins.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background/60 p-12 text-center">
        <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
        <p className="font-secondary text-lg text-foreground mb-2">
          You haven't created a trip yet
        </p>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Save images to start building your travel storyboard
        </p>
        <Button
          onClick={() => setSaveModal({ open: true, imageUrl: "", sourceType: "empty_state" })}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Storyboard
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Creator pins section */}
      {creatorPins.length > 0 && (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance] mb-4">
          {creatorPins.map((pin) => (
            <div
              key={pin.id}
              className="break-inside-avoid mb-4 group relative cursor-pointer"
              onClick={() => navigate(`/storyboards/${pin.storyboard_id}`)}
            >
              <img
                src={pin.image_url}
                alt={pin.title || "Travel inspiration"}
                className="w-full rounded-2xl object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSaveModal(pin.image_url, pin.title || undefined, "storyboard_pin", pin.id, pin.id, pin.owner_id);
                    }}
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                      savedIds.has(pin.id)
                        ? "bg-primary scale-110"
                        : "bg-white/20 backdrop-blur-sm hover:bg-primary"
                    )}
                    data-tour="save-button"
                  >
                    <Bookmark className={cn("h-3.5 w-3.5 text-white", savedIds.has(pin.id) && "fill-white")} />
                  </button>
                </div>
                <div>
                  {pin.title && (
                    <p className="font-secondary text-white text-base leading-snug mb-1">{pin.title}</p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/post-trip?fromCreator=${creatorId}&storyboard=${pin.storyboard_id}${
                          pin.storyboard_destination ? `&destination=${encodeURIComponent(pin.storyboard_destination)}` : ""
                        }`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 text-white text-xs font-medium bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/30 transition-colors"
                  >
                    Plan a trip like this
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unsplash discovery section */}
      {showDiscovery && (
        <>
          {creatorPins.length > 0 && discoveryImages.length > 0 && (
            <div className="flex items-center gap-3 my-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Discover More</span>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
          )}

          {isLoading && discoveryImages.length === 0 && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          <div data-tour="discovery-grid" className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
            {discoveryImages.map((img, idx) => (
              <div key={img.id} className="break-inside-avoid mb-4 group relative">
                <img
                  src={img.urls.small}
                  alt={img.alt_description || "Travel inspiration"}
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                  style={{ aspectRatio: `${img.width}/${img.height}` }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-between p-4">
                  <div className="flex justify-end gap-2">
                    {onMoreLikeThis && (
                      <button
                        onClick={() => handleMoreLikeThis(img)}
                        className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                        title="More like this"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        openSaveModal(img.urls.regular, img.alt_description || img.description || undefined, "unsplash", img.id)
                      }
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-lg",
                        savedIds.has(img.id)
                          ? "bg-primary scale-110"
                          : "bg-primary hover:bg-primary/90"
                      )}
                      {...(idx === 0 ? { "data-tour": "save-button" } : {})}
                    >
                      <Bookmark className={cn("h-3.5 w-3.5 text-primary-foreground", savedIds.has(img.id) && "fill-primary-foreground")} />
                    </button>
                  </div>
                  <div>
                    {img.alt_description && (
                      <p className="text-white/90 text-xs line-clamp-2 mb-2">{img.alt_description}</p>
                    )}
                    <p className="text-white/50 text-[10px]">Photo by {img.user.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={observerRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </>
      )}

      <SaveToStoryboardModal
        open={saveModal.open}
        onOpenChange={(o) => setSaveModal((s) => ({ ...s, open: o }))}
        imageUrl={saveModal.imageUrl}
        title={saveModal.title}
        sourceType={saveModal.sourceType}
        sourceId={saveModal.sourceId}
        categoryPath={categoryPath}
        tags={refinementPath}
        repinnedFromItemId={saveModal.repinnedFromItemId}
        repinnedFromUserId={saveModal.repinnedFromUserId}
        onSaveComplete={handleSaveComplete}
      />
    </>
  );
}
