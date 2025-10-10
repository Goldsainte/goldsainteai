import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Heart, Play } from "lucide-react";
import { toast } from "sonner";

interface ExplorePost {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  profiles?: {
    username: string | null;
    instagram_username?: string | null;
  };
}

const Trending = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      // Fetch top posts by engagement
      const { data: topPosts, error: topError } = await supabase
        .from("travel_posts")
        .select("id, user_id, video_url, thumbnail_url, caption, view_count, like_count, comment_count, created_at")
        .eq('status', 'active')
        .order("like_count", { ascending: false })
        .limit(15);

      if (topError) throw topError;

      // Fetch recent posts (last 30 days) for discovery
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentPosts, error: recentError } = await supabase
        .from("travel_posts")
        .select("id, user_id, video_url, thumbnail_url, caption, view_count, like_count, comment_count, created_at")
        .eq('status', 'active')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(15);

      if (recentError) throw recentError;

      // Combine and shuffle for a mixed feed
      const allPosts = [...(topPosts || []), ...(recentPosts || [])];
      
      // Remove duplicates
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );

      // Shuffle to create variety
      const shuffled = uniquePosts.sort(() => Math.random() - 0.5);

      // Fetch profiles separately
      const postsWithProfiles = await Promise.all(
        shuffled.slice(0, 30).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, instagram_username')
            .eq('id', post.user_id)
            .maybeSingle();

          return {
            ...post,
            profiles: profile,
          };
        })
      );

      setPosts(postsWithProfiles);
    } catch (error: any) {
      console.error("Error fetching explore posts:", error);
      toast.error("Failed to load explore content");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/travel-feed')}
            className="hover:bg-transparent"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Explore</h1>
        </div>
      </div>

      {/* Explore Grid */}
      <div className="p-1">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Play className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No posts to explore yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for trending content
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post, index) => {
              // Create varied grid sizing for visual interest (Instagram-style)
              const isFeatured = index % 7 === 0;
              const isWide = index % 11 === 0;
              
              return (
                <div
                  key={post.id}
                  className={`relative cursor-pointer group overflow-hidden ${
                    isFeatured ? 'col-span-2 row-span-2' : 
                    isWide && index % 3 === 0 ? 'col-span-2' : ''
                  }`}
                  onClick={() => navigate(`/travel-feed?postId=${post.id}`)}
                  style={{ aspectRatio: isFeatured ? '1/1' : isWide ? '2/1' : '1/1' }}
                >
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  )}
                  
                  {/* Hover overlay with stats */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="h-5 w-5 fill-white" />
                        <span className="font-semibold">{formatNumber(post.like_count)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="h-5 w-5 fill-white" />
                        <span className="font-semibold">{formatNumber(post.view_count)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video indicator */}
                  <div className="absolute top-2 right-2">
                    <Play className="h-4 w-4 text-white drop-shadow-lg" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;
