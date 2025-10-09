import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Settings, Heart, Video, MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  is_verified?: boolean;
}

interface Post {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  view_count: number;
  like_count: number;
}

const TravelProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    postsCount: 0,
    likesCount: 0,
    viewsCount: 0,
  });

  const profileUserId = userId || user?.id;
  const isOwnProfile = user?.id === profileUserId;

  useEffect(() => {
    if (profileUserId) {
      fetchProfile();
      fetchUserPosts();
      fetchLikedPosts();
      fetchStats();
    }
  }, [profileUserId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileUserId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data || {
        id: profileUserId!,
        username: 'User',
        avatar_url: null,
        first_name: null,
        last_name: null,
        bio: null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('travel_posts')
        .select('id, video_url, thumbnail_url, caption, view_count, like_count')
        .eq('user_id', profileUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserPosts(data || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedPosts = async () => {
    if (!isOwnProfile) return;

    try {
      const { data: likes, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', profileUserId);

      if (error) throw error;

      const postIds = likes?.map(l => l.post_id) || [];
      if (postIds.length === 0) {
        setLikedPosts([]);
        return;
      }

      const { data: posts, error: postsError } = await supabase
        .from('travel_posts')
        .select('id, video_url, thumbnail_url, caption, view_count, like_count')
        .in('id', postIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setLikedPosts(posts || []);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: posts } = await supabase
        .from('travel_posts')
        .select('view_count, like_count')
        .eq('user_id', profileUserId)
        .eq('status', 'active');

      if (posts) {
        const totalViews = posts.reduce((sum, post) => sum + post.view_count, 0);
        const totalLikes = posts.reduce((sum, post) => sum + post.like_count, 0);
        
        setStats({
          postsCount: posts.length,
          likesCount: totalLikes,
          viewsCount: totalViews,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!user && !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in to view profiles</h2>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">{profile?.username || 'Profile'}</h1>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/travel-settings')}
            >
              <Settings className="h-6 w-6" />
            </Button>
          )}
          {!isOwnProfile && <div className="w-10" />}
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.username || 'User'}
              </h2>
              {profile?.is_verified && (
                <CheckCircle2 className="h-6 w-6 text-blue-500 fill-blue-500" />
              )}
            </div>
            <p className="text-muted-foreground">@{profile?.username || 'user'}</p>
          </div>
        </div>

        {profile?.bio && (
          <p className="text-sm">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-8 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(stats.postsCount)}</div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(stats.likesCount)}</div>
            <div className="text-xs text-muted-foreground">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(stats.viewsCount)}</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
        </div>

        {isOwnProfile && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/settings')}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
          <TabsTrigger value="posts" className="gap-2">
            <Video className="h-4 w-4" />
            Posts
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="h-4 w-4" />
              Liked
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-muted-foreground">Loading posts...</div>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No posts yet</p>
              {isOwnProfile && (
                <Button
                  className="mt-4"
                  onClick={() => navigate('/travel-feed')}
                >
                  Create your first post
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-[9/16] bg-muted cursor-pointer group"
                  onClick={() => navigate(`/travel-feed?postId=${post.id}`)}
                >
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                      <Video className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-sm space-y-1 flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 fill-white" />
                        <span>{formatNumber(post.like_count)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="liked" className="mt-0">
            {likedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No liked posts yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Videos you like will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {likedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-[9/16] bg-muted cursor-pointer group"
                    onClick={() => navigate(`/travel-feed?postId=${post.id}`)}
                  >
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.caption || 'Video'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TravelProfile;
