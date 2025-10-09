import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TravelVideoCard from "@/components/TravelVideoCard";
import VideoUploadModal from "@/components/VideoUploadModal";
import { toast } from "sonner";

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
  };
}

const TravelFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('travel_posts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Fetch profile data separately with maybeSingle to handle missing profiles
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', post.user_id)
            .maybeSingle();
          
          return {
            ...post,
            profiles: profile || { username: 'TravelExplorer', avatar_url: null }
          };
        })
      );
      
      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
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
    <div className="relative h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-background/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Travel Feed</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Floating Upload Button (FAB) */}
      <Button
        onClick={() => setUploadModalOpen(true)}
        className="absolute bottom-24 right-6 z-20 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <Upload className="h-6 w-6" />
      </Button>

      {/* Video Feed - Vertical Scroll */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
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
              />
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <VideoUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={handleVideoUpload}
      />
    </div>
  );
};

export default TravelFeed;
