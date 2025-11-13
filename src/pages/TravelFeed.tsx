import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as Sentry from "@sentry/react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, ChevronLeft, Settings, User, PlusSquare, Home, Search as SearchIcon, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TravelVideoCard from "@/components/TravelVideoCard";
import ContentUploadModal from "@/components/ContentUploadModal";
import CreateContentSheet from "@/components/CreateContentSheet";
import { ClearSampleDataButton } from "@/components/ClearSampleDataButton";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { FeedSidebar } from "@/components/FeedSidebar";
import { FeedSuggestions } from "@/components/FeedSuggestions";
import StoryHighlights from "@/components/StoryHighlights";
import { MomentsRing } from "@/components/MomentsRing";
import { CreateMomentModal } from "@/components/CreateMomentModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { FeedSkeleton } from "@/components/FeedSkeleton";
import { SuggestedUsers } from "@/components/SuggestedUsers";
import { DraftPostsManager } from "@/components/DraftPostsManager";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import VendorPromotionFeed from "@/components/VendorPromotionFeed";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFeedPaginated } from "@/lib/data/posts";
import type { TravelPost } from "@/lib/data/posts";
import { useNewMomentsToast } from "@/hooks/useNewMomentsToast";

const TravelFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useNewMomentsToast(); // Real-time notifications for new posts
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createMomentOpen, setCreateMomentOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useUserRole();
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get('postId');
  const isMobile = useIsMobile();
  const [hasInteracted, setHasInteracted] = useState(false);
  const feedQuery = useInfiniteQuery({
    queryKey: ["travel-feed", user?.id ?? "anonymous", targetPostId ?? null],
    queryFn: async ({ pageParam, signal }) => {
      const cursorParam = typeof pageParam === "string" ? pageParam : pageParam?.cursor;
      const focusParam = typeof pageParam === "object" ? pageParam?.focusPostId : undefined;
      return fetchFeedPaginated({
        cursor: cursorParam ?? undefined,
        limit: focusParam ? 12 : 20,
        personalized: Boolean(user && !focusParam && !targetPostId),
        focusPostId: focusParam ?? (cursorParam ? undefined : targetPostId ?? undefined),
        signal,
      });
    },
    initialPageParam: { cursor: undefined, focusPostId: targetPostId ?? undefined },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? { cursor: lastPage.nextCursor, focusPostId: undefined } : undefined),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const posts = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => (page as any).items) ?? [],
    [feedQuery.data],
  );

  const isPersonalized = useMemo(
    () => Boolean(feedQuery.data?.pages.find((page) => (page as any).personalized)),
    [feedQuery.data],
  );

  const loading = feedQuery.status === "pending";
  const loadingMore = feedQuery.isFetchingNextPage;
  const hasMore = Boolean(feedQuery.hasNextPage);
  const { refetch, fetchNextPage } = feedQuery;

  const refreshFeed = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const loadMorePosts = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchNextPage().catch((error) => {
      Sentry.captureException(error, {
        level: 'warning',
        tags: { feature: 'travel_feed', operation: 'pagination' },
      });
      toast.error('Failed to load more posts');
    });
  }, [fetchNextPage, hasMore, loadingMore, toast]);

  useEffect(() => {
    if (!feedQuery.error) return;
    Sentry.captureException(feedQuery.error, {
      level: 'error',
      tags: { feature: 'travel_feed', operation: 'initial_load' },
    });
    toast.error('Failed to load posts');
  }, [feedQuery.error, toast]);

  useEffect(() => {
    if (!targetPostId || posts.length === 0) {
      return;
    }

    const focusIndex = posts.findIndex((post) => post.id === targetPostId);
    if (focusIndex >= 0) {
      setCurrentIndex(focusIndex);
      const container = containerRef.current;
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTo({ top: focusIndex * container.clientHeight, behavior: 'instant' as ScrollBehavior });
        });
      }
      return;
    }

    if (hasMore && !loadingMore) {
      fetchNextPage().catch(() => undefined);
    }
  }, [fetchNextPage, hasMore, loadingMore, posts, targetPostId]);

  // Track which video is currently visible in viewport
  useEffect(() => {
    if (isMobile) return; // Mobile already handles this with currentIndex

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const videoId = entry.target.getAttribute('data-video-id');
            if (videoId) {
              setVisibleVideoId(videoId);
            }
          }
        });
      },
      {
        threshold: [0.5],
        root: null,
      }
    );

    // Observe all video containers
    const videoContainers = document.querySelectorAll('[data-video-id]');
    videoContainers.forEach((container) => observer.observe(container));

    return () => observer.disconnect();
  }, [posts, isMobile]);

  useEffect(() => {
    // Capture first user interaction for autoplay compliance
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('wheel', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('wheel', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('wheel', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      const handleScroll = () => {
        if (
          window.innerHeight + document.documentElement.scrollTop
          >= document.documentElement.offsetHeight - 800 &&
          !loadingMore &&
          hasMore
        ) {
          loadMorePosts();
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [posts.length, loadingMore, hasMore, isMobile]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const windowHeight = container.clientHeight;
    const newIndex = Math.round(container.scrollTop / windowHeight);

    if (newIndex !== currentIndex && newIndex < posts.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleVideoUpload = () => {
    void refreshFeed();
    setUploadModalOpen(false);
  };

  const handleCreateContent = (type: string) => {
    if (type === "moment") {
      setCreateSheetOpen(false);
      setCreateMomentOpen(true);
      return;
    }
    if (type === "reel") {
      setUploadModalOpen(true);
      setCreateSheetOpen(false);
    } else if (type === "post") {
      setUploadModalOpen(true);
      setCreateSheetOpen(false);
    } else {
      toast.info(`${type} feature coming soon!`);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in to View the Journeys Feed</h2>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Layout - Cleaner Instagram-style */}
      {!isMobile ? (
        <div className="flex w-full min-h-screen bg-background">
          {/* Left Sidebar - Sticky */}
          <div className="sticky top-0 h-screen">
            <FeedSidebar />
          </div>

          {/* Center Feed - Instagram width */}
          <div className="flex-1 max-w-[470px] mx-auto border-x">
            {/* Moments Ring - Compact */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
              <MomentsRing />
            </div>
            
            {/* Feed Posts - No gaps like Instagram */}
            <div>
              {loading ? (
                <FeedSkeleton />
              ) : posts.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No journeys yet</p>
                    <Button onClick={() => setCreateSheetOpen(true)} variant="default">
                      <Upload className="mr-2 h-4 w-4" />
                      Share Your First Journey
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {posts.map((post) => (
                    <div key={post.id} data-video-id={post.id} className="animate-fade-in">
                      <TravelVideoCard
                        post={post}
                        isActive={visibleVideoId === post.id}
                        onUpdate={refreshFeed}
                        layout="desktop"
                        isMuted={visibleVideoId !== post.id}
                        onToggleMute={() => setIsMuted(!isMuted)}
                        hasInteracted={hasInteracted}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground text-sm">Loading more...</div>
                </div>
              )}

              {/* End of feed message */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-muted-foreground border-t">
                  <p className="text-sm font-medium">You're all caught up</p>
                  <p className="text-xs mt-1">You've seen all new posts</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Suggestions Panel - Sticky */}
          <div className="sticky top-0 h-screen">
            <FeedSuggestions />
          </div>
        </div>
      ) : (
        /* Mobile Layout - Full Screen Vertical Scroll */
        <div className="relative h-[100dvh] w-full bg-black overflow-hidden fixed inset-0">
          {/* Top bar - minimal "For You" label only */}
          {isPersonalized && (
            <div id="feed-top-bar" className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-3 safe-top">
              <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
                <p className="text-white text-sm font-semibold">For You</p>
              </div>
            </div>
          )}

          {/* Video Feed - Full Screen Vertical Scroll */}
          <div
            id="feed-scroll"
            ref={containerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory overscroll-y-contain touch-pan-y"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style>{`
              #feed-scroll::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            
            {loading ? (
              <div className="h-[100dvh] w-full bg-black">
                <FeedSkeleton />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">No journeys yet</p>
                  <Button onClick={() => setUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Journey
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="min-h-[100dvh] h-[100dvh] w-full snap-start snap-always"
                  >
                    <TravelVideoCard
                      post={post}
                      isActive={index === currentIndex}
                      onUpdate={refreshFeed}
                      isMuted={isMuted}
                      onToggleMute={() => setIsMuted(!isMuted)}
                      hasInteracted={hasInteracted}
                    />
                  </div>
                ))}
                {/* Intermix promoted vendors after every 5 posts */}
                {posts.length > 5 && Math.floor(posts.length / 5) > 0 && (
                  <div className="min-h-[100dvh] h-[100dvh] w-full snap-start snap-always bg-background overflow-y-auto">
                    <div className="h-full flex items-center justify-center p-4">
                      <VendorPromotionFeed displayContext="journey_feed" limit={1} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Navigation Bar - compact */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur border-t border-white/20 pb-safe">
            <div className="flex items-center justify-around py-1.5 px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-white/20 h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
                aria-label="Home"
              >
                <Home className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/search')}
                className="hover:bg-white/20 h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
                aria-label="Search"
              >
                <SearchIcon className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCreateSheetOpen(true)}
                className="hover:bg-white/20 h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
                aria-label="Create"
              >
                <PlusSquare className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/travel-profile')}
                className="hover:bg-white/20 h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
                aria-label="Profile"
              >
                <User className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Content Sheet */}
      <CreateContentSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSelectType={handleCreateContent}
      />

      {/* Upload Modal */}
      <ContentUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={handleVideoUpload}
        initialTab="video"
      />

      {/* Create Moment Modal */}
      <CreateMomentModal
        open={createMomentOpen}
        onOpenChange={setCreateMomentOpen}
      />
    </>
  );
};

export default TravelFeed;
