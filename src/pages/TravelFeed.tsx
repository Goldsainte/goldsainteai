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

interface TravelPost {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  location: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  is_suggested?: boolean;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    is_verified?: boolean;
  };
}

const TravelFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createMomentOpen, setCreateMomentOpen] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
      let loadedPosts: TravelPost[] = [];
      // Use personalized feed if user is logged in and we're not targeting a specific post
      if (user && !focusPostId) {
        const { data, error } = await supabase.functions.invoke('get-personalized-feed');
        
        if (error) {
          console.error('Error fetching personalized feed:', error);
          toast.error('Failed to load personalized feed, showing recent posts');
          setIsPersonalized(false);
          // Fallback to chronological feed
          loadedPosts = await fetchChronologicalPosts();
        } else {
          const postsArr = (data as any)?.posts || [];
          setPosts(postsArr);
          loadedPosts = postsArr;
          setIsPersonalized(true);
        }
      } else {
        // Show chronological feed for non-logged in users or when focusing specific post
        setIsPersonalized(false);
        loadedPosts = await fetchChronologicalPosts();
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

  const fetchChronologicalPosts = async (): Promise<TravelPost[]> => {
    console.log('Fetching chronological posts...');
    const { data, error } = await supabase
      .from('travel_posts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
    
    console.log('Found posts:', data?.length || 0);
    
    // Fetch profile data separately with maybeSingle to handle missing profiles
    const postsWithProfiles = await Promise.all(
      (data || []).map(async (post) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, is_verified, instagram_username')
          .eq('id', post.user_id)
          .maybeSingle();
        
        return {
          ...post,
          profiles: profile || { username: 'TravelExplorer', avatar_url: null, is_verified: false, instagram_username: null }
        };
      })
    );
    
    console.log('Posts with profiles:', postsWithProfiles.length);
    setPosts(postsWithProfiles);
    return postsWithProfiles;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const windowHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / windowHeight);
    
    if (newIndex !== currentIndex && newIndex < posts.length) {
      setCurrentIndex(newIndex);
    }
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
    if (type === "reel" || type === "post") {
      setUploadModalOpen(true);
    } else {
      toast.info(`${type} feature coming soon!`);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in to view Travel Feed</h2>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Layout - 3 columns */}
      {!isMobile ? (
        <div className="flex w-full min-h-screen bg-background">
          {/* Left Sidebar */}
          <FeedSidebar />

          {/* Center Feed */}
          <div className="flex-1 max-w-[630px] mx-auto">
            {/* Moments Ring */}
            <MomentsRing />
            
            {/* Feed Posts */}
            <div className="py-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading feed...</div>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No journeys yet</p>
                    <Button onClick={() => setCreateSheetOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload First Journey
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} data-video-id={post.id}>
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
            </div>
          </div>

          {/* Right Suggestions Panel */}
          <FeedSuggestions />
        </div>
      ) : (
        /* Mobile Layout - Full Screen Vertical Scroll */
        <div className="relative h-screen w-full bg-black overflow-hidden">
          {/* Top bar - minimal "For You" label only */}
          {isPersonalized && (
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-3 safe-top">
              <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
                <p className="text-white text-sm font-semibold">For You</p>
              </div>
            </div>
          )}

          {/* Video Feed - Full Screen Vertical Scroll */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`
              div::-webkit-scrollbar {
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
                  className="h-screen w-full snap-start snap-always"
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

          {/* Bottom Navigation Bar - Instagram Style */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/20 pb-safe">
            <div className="flex items-center justify-around py-3 px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
className="text-white hover:bg-white/20 h-16 w-16 rounded-full ring-1 ring-foreground/30"
                aria-label="Home"
              >
                <Home className="h-8 w-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/search')}
className="text-white hover:bg-white/20 h-16 w-16 rounded-full ring-1 ring-foreground/30"
                aria-label="Search"
              >
                <SearchIcon className="h-8 w-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCreateSheetOpen(true)}
className="text-white hover:bg-white/20 h-16 w-16 rounded-full ring-1 ring-foreground/30"
                aria-label="Create"
              >
                <PlusSquare className="h-8 w-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/travel-profile')}
                className="text-white hover:bg-white/20 h-16 w-16 rounded-full ring-1 ring-foreground/30"
                aria-label="Profile"
              >
                <User className="h-8 w-8" />
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
