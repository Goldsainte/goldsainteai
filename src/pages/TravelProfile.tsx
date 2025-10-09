import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Settings, Heart, Video, MessageCircle, CheckCircle2, Share2, Grid3X3, TrendingUp, ChevronDown, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

import FollowButton from "@/components/FollowButton";
import StoryHighlights from "@/components/StoryHighlights";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  is_verified?: boolean;
  followers_count?: number;
  following_count?: number;
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
            onClick={() => navigate(-1)}
            className="gap-1 hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <button className="flex items-center gap-1 font-semibold hover:opacity-70 transition-opacity">
            <span>{profile?.username || 'Profile'}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/travel-settings')}
                className="hover:bg-transparent"
              >
                <Settings className="h-6 w-6" />
              </Button>
            )}
            {!isOwnProfile && <div className="w-10" />}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-4 pb-2 space-y-4">
        <div className="flex items-start justify-between">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 ring-2 ring-background">
                <PlusCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-8 pt-2">
            <button className="text-center">
              <div className="text-xl font-bold">{formatNumber(stats.postsCount)}</div>
              <div className="text-xs text-muted-foreground">posts</div>
            </button>
            <button className="text-center">
              <div className="text-xl font-bold">{formatNumber(profile?.followers_count || 0)}</div>
              <div className="text-xs text-muted-foreground">followers</div>
            </button>
            <button className="text-center">
              <div className="text-xl font-bold">{formatNumber(profile?.following_count || 0)}</div>
              <div className="text-xs text-muted-foreground">following</div>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold text-sm">
              {profile?.first_name && profile?.last_name
                ? `${profile.first_name} ${profile.last_name}`.toUpperCase()
                : (profile?.username || 'User').toUpperCase()}
            </h2>
            {profile?.is_verified && (
              <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500" />
            )}
          </div>
          {profile?.bio && (
            <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
          )}
        </div>

        {/* Dashboard Card for own profile */}
        {isOwnProfile && stats.viewsCount > 0 && (
          <Card className="p-3 bg-muted/50 border-muted">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">Your dashboard</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {formatNumber(stats.viewsCount)} views in the last 30 days.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOwnProfile ? (
            <>
              <Button
                variant="secondary"
                className="flex-1 h-8 text-sm font-semibold"
                onClick={() => navigate('/travel-settings/edit')}
              >
                Edit profile
              </Button>
              <Button
                variant="secondary"
                className="flex-1 h-8 text-sm font-semibold"
              >
                Share profile
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {user && <FollowButton targetUserId={profileUserId!} />}
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Story Highlights */}
        <StoryHighlights 
          isOwnProfile={isOwnProfile}
          onAddNew={() => toast.info("Story highlights coming soon!")}
        />
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full mt-2">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-t h-11 bg-transparent">
          <TabsTrigger 
            value="posts" 
            className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none"
          >
            <Grid3X3 className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger 
            value="reels"
            className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none"
          >
            <Video className="h-5 w-5" />
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger 
              value="liked"
              className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none"
            >
              <Heart className="h-5 w-5" />
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="reels" className="mt-0">
          <div className="flex items-center justify-center p-12 text-center">
            <div>
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Reels view coming soon</p>
            </div>
          </div>
        </TabsContent>

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
