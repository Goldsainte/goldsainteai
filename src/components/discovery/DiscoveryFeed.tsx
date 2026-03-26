import { useState, useEffect, useRef, useCallback } from "react";
import { Bookmark, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiscoveryFeed, type UnsplashImage } from "@/hooks/useDiscoveryFeed";
import { SaveToStoryboardModal } from "./SaveToStoryboardModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DiscoveryFeedProps {
  category: string;
  subcategory: string | null;
  tags?: string[];
  /** Existing creator pins to show first */
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
}

export function DiscoveryFeed({
  category,
  subcategory,
  tags = [],
  creatorPins = [],
  onMoreLikeThis,
  creatorId,
}: DiscoveryFeedProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const observerRef = useRef<HTMLDivElement>(null);

  const [saveModal, setSaveModal] = useState<{
    open: boolean;
    imageUrl: string;
    title?: string;
    sourceType?: string;
    sourceId?: string;
    repinnedFromItemId?: string;
    repinnedFromUserId?: string;
  }>({ open: false, imageUrl: "" });

  const showDiscovery = category !== "All";
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useDiscoveryFeed(category, subcategory, tags, showDiscovery);

  const discoveryImages =
    data?.pages.flatMap((p) => p.images) || [];

  // Infinite scroll observer
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
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "400px",
    });
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
    setSaveModal({
      open: true,
      imageUrl,
      title,
      sourceType,
      sourceId,
      repinnedFromItemId,
      repinnedFromUserId,
    });
  }

  function handleMoreLikeThis(img: UnsplashImage) {
    const newTags = [
      img.alt_description,
      img.description,
    ]
      .filter(Boolean)
      .join(" ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3);
    onMoreLikeThis?.(newTags);
  }

  const categoryPath = [
    category !== "All" ? category : null,
    subcategory,
  ].filter(Boolean) as string[];

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
                      openSaveModal(
                        pin.image_url,
                        pin.title || undefined,
                        "storyboard_pin",
                        pin.id,
                        pin.id,
                        pin.owner_id
                      );
                    }}
                    className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-[#C7A962] transition-colors"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
                <div>
                  {pin.title && (
                    <p className="font-secondary text-white text-base leading-snug mb-1">
                      {pin.title}
                    </p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/post-trip?fromCreator=${creatorId}&storyboard=${pin.storyboard_id}${
                          pin.storyboard_destination
                            ? `&destination=${encodeURIComponent(pin.storyboard_destination)}`
                            : ""
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
              <Sparkles className="h-4 w-4 text-[#C7A962]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#C7A962]">
                Discover More
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#C7A962]/30 to-transparent" />
            </div>
          )}

          {isLoading && discoveryImages.length === 0 && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#C7A962]" />
            </div>
          )}

          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
            {discoveryImages.map((img) => (
              <div
                key={img.id}
                className="break-inside-avoid mb-4 group relative"
              >
                <img
                  src={img.urls.small}
                  alt={img.alt_description || "Travel inspiration"}
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                  style={{
                    aspectRatio: `${img.width}/${img.height}`,
                  }}
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
                        openSaveModal(
                          img.urls.regular,
                          img.alt_description || img.description || undefined,
                          "unsplash",
                          img.id
                        )
                      }
                      className="h-8 w-8 rounded-full bg-[#C7A962] flex items-center justify-center hover:bg-[#b89a55] transition-colors shadow-lg"
                    >
                      <Bookmark className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                  <div>
                    {img.alt_description && (
                      <p className="text-white/90 text-xs line-clamp-2 mb-2">
                        {img.alt_description}
                      </p>
                    )}
                    <p className="text-white/50 text-[10px]">
                      Photo by {img.user.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={observerRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#C7A962]" />
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
        tags={tags}
        repinnedFromItemId={saveModal.repinnedFromItemId}
        repinnedFromUserId={saveModal.repinnedFromUserId}
      />
    </>
  );
}
