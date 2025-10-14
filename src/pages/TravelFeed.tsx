import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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

interface TravelPost {
  id: string;
  user_id: string;
  video_url?: string;
  embed_url?: string;
  embed_platform?: string;
  original_creator?: string;
  thumbnail_url: string | null;
  image_urls?: string[];
  media_type?: string;
  caption: string | null;
  location: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count?: number;
  is_featured?: boolean;
  music_track_id?: string;
  music_track_name?: string;
  music_track_artist?: string;
  music_preview_url?: string;
  music_album_art?: string;
  music_service?: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    is_verified?: boolean;
    instagram_username?: string | null;
  };
}

const TravelFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createMomentOpen, setCreateMomentOpen] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollSnapTimer = useRef<number | null>(null);
  const { isAdmin } = useUserRole();
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get('postId');
  const isMobile = useIsMobile();

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
    fetchPosts(targetPostId || undefined);
  }, [targetPostId]);

  const fetchPosts = async (focusPostId?: string) => {
    try {
      setLoading(true);
      let loadedPosts: TravelPost[] = [];
      // Fast-first: show chronological quickly, then merge personalized when ready
      if (user && !focusPostId) {
        const chronoPromise = fetchChronologicalPosts(0, 12);
        const personalizedPromise = supabase.functions.invoke('get-personalized-feed');

        // Render chrono ASAP for faster first paint
        const chrono = await chronoPromise;
        loadedPosts = chrono;
        setIsPersonalized(false);
        setLoading(false); // Show posts immediately

        // When personalized resolves, merge and update
        const { data, error } = await personalizedPromise;
        if (!error) {
          const personalized = ((data as any)?.posts || []) as TravelPost[];
          const map = new Map<string, TravelPost>();
          chrono.forEach(p => map.set(p.id, p));
          personalized.forEach(p => {
            const existing = map.get(p.id) || ({} as TravelPost);
            map.set(p.id, { ...existing, ...p });
          });
          const merged = Array.from(map.values());
          setPosts(merged);
          loadedPosts = merged;
          setIsPersonalized(true);
        } else {
          console.error('Error fetching personalized feed:', error);
        }
      } else {
        // Show chronological feed for non-logged in users or when focusing specific post
        setIsPersonalized(false);
        loadedPosts = await fetchChronologicalPosts(0, 12);
        setLoading(false);
      }

      // If a specific post is requested (from profile grid), jump to it
      if (focusPostId && loadedPosts.length) {
        const idx = loadedPosts.findIndex((p) => p.id === focusPostId);
        if (idx >= 0) {
          setCurrentIndex(idx);
          const container = containerRef.current;
          if (container) {
            requestAnimationFrame(() => {
              container.scrollTo({ top: idx * container.clientHeight, behavior: 'instant' as ScrollBehavior });
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load feed');
      setIsPersonalized(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchChronologicalPosts = async (offset = 0, limit = 12): Promise<TravelPost[]> => {
    console.log('Fetching chronological posts...', { offset, limit });
    const { data, error } = await supabase
      .from('travel_posts')
      .select('id, user_id, video_url, embed_url, embed_platform, original_creator, thumbnail_url, image_urls, media_type, caption, location, view_count, like_count, comment_count, share_count, is_featured, music_track_id, music_track_name, music_track_artist, music_preview_url, music_album_art, music_service, native_video_volume, music_volume, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
    
    console.log('Found posts:', data?.length || 0);

    // Batch fetch profiles to avoid N+1
    const userIds = Array.from(new Set((data || []).map((p: any) => p.user_id).filter(Boolean)));
    let profilesData: any[] = [];
    if (userIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_verified, instagram_username')
        .in('id', userIds);
      profilesData = pData || [];
    }
    const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

    const postsWithProfiles = (data || []).map((post: any) => ({
      ...post,
      profiles: profilesMap.get(post.user_id) || { username: 'TravelExplorer', avatar_url: null, is_verified: false, instagram_username: null }
    }));
    
    console.log('Posts with profiles:', postsWithProfiles.length);
    
    if (offset === 0) {
      setPosts(postsWithProfiles);
    } else {
      setPosts(prev => [...prev, ...postsWithProfiles]);
    }
    
    setHasMore(postsWithProfiles.length === limit);
    return postsWithProfiles;
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      await fetchChronologicalPosts(posts.length, 8);
    } catch (error) {
      console.error('Error loading more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  };

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

    // Hard snap after scrolling stops to prevent peeking
    if (scrollSnapTimer.current) window.clearTimeout(scrollSnapTimer.current);
    scrollSnapTimer.current = window.setTimeout(() => {
      const targetTop = newIndex * windowHeight;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }, 80);
  };

  const handleVideoUpload = () => {
    fetchPosts();
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
                        onUpdate={fetchPosts}
                        layout="desktop"
                        isMuted={visibleVideoId !== post.id}
                        onToggleMute={() => setIsMuted(!isMuted)}
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
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading feed...</div>
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
              posts.map((post, index) => (
                <div
                  key={post.id}
                  className="min-h-[100dvh] h-[100dvh] w-full snap-start snap-always"
                >
                  <TravelVideoCard
                    post={post}
                    isActive={index === currentIndex}
                    onUpdate={fetchPosts}
                    isMuted={isMuted}
                    onToggleMute={() => setIsMuted(!isMuted)}
                  />
                </div>
              ))
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
