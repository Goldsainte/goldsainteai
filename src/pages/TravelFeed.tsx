import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, ChevronLeft, Settings, User, PlusSquare, Home, Search as SearchIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TravelVideoCard from "@/components/TravelVideoCard";
import VideoUploadModal from "@/components/VideoUploadModal";
import CreateContentSheet from "@/components/CreateContentSheet";
import { ClearSampleDataButton } from "@/components/ClearSampleDataButton";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { FeedSidebar } from "@/components/FeedSidebar";
import { FeedSuggestions } from "@/components/FeedSuggestions";
import StoryHighlights from "@/components/StoryHighlights";
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
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useUserRole();
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get('postId');
  const isMobile = useIsMobile();

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
          .select('username, avatar_url, is_verified')
          .eq('id', post.user_id)
          .maybeSingle();
        
        return {
          ...post,
          profiles: profile || { username: 'TravelExplorer', avatar_url: null, is_verified: false }
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
            {/* Stories Section */}
            <div className="border-b border-border py-4 px-2">
              <StoryHighlights />
            </div>

            {/* Feed Posts */}
            <div className="py-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading feed...</div>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No videos yet</p>
                    <Button onClick={() => setCreateSheetOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload First Video
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <TravelVideoCard
                      key={post.id}
                      post={post}
                      isActive={true}
                      onUpdate={fetchPosts}
                      layout="desktop"
                      isMuted={isMuted}
                      onToggleMute={() => setIsMuted(!isMuted)}
                    />
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
          {/* Top Navigation - Minimal */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/20"
                aria-label="Home"
              >
                <Home className="h-6 w-6" />
              </Button>
              <ClearSampleDataButton />
            </div>
            
            {isPersonalized && (
              <div className="absolute left-1/2 -translate-x-1/2 top-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full">
                <p className="text-white text-xs font-medium">For You</p>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/travel-settings')}
                className="text-white hover:bg-white/20 backdrop-blur-sm rounded-full h-10 w-10"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/travel-profile')}
                className="text-white hover:bg-white/20 backdrop-blur-sm rounded-full px-4 h-10 font-semibold text-sm"
              >
                Profile
              </Button>
            </div>
          </div>

          {/* Floating Upload Button (FAB) */}
          <Button
            onClick={() => setCreateSheetOpen(true)}
            className="absolute bottom-28 right-4 z-20 h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90"
            size="icon"
          >
            <PlusSquare className="h-6 w-6" />
          </Button>

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
                  <p className="text-muted-foreground">No videos yet</p>
                  <Button onClick={() => setUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Video
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
        </div>
      )}

      {/* Create Content Sheet */}
      <CreateContentSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSelectType={handleCreateContent}
      />

      {/* Upload Modal */}
      <VideoUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={handleVideoUpload}
      />
    </>
  );
};

export default TravelFeed;
