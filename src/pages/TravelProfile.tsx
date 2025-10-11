import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Settings, Heart, Video, MessageCircle, CheckCircle2, Share2, Grid3X3, TrendingUp, ChevronDown, PlusCircle, Edit, Star, Coins, Briefcase, Sparkles, X, Home, Search as SearchIcon, PlusSquare, User, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import CreateContentSheet from "@/components/CreateContentSheet";
import ContentUploadModal from "@/components/ContentUploadModal";
import { BrandPartnershipProposal } from "@/components/BrandPartnershipProposal";
import { CreatorPartnershipRequest } from "@/components/CreatorPartnershipRequest";

import FollowButton from "@/components/FollowButton";
import StoryHighlights from "@/components/StoryHighlights";
import VideoEditModal from "@/components/VideoEditModal";
import { CollaborationInvites } from "@/components/CollaborationInvites";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { ActivityStatus } from "@/components/ActivityStatus";
import { CloseFriendsManager } from "@/components/CloseFriendsManager";
import { useCloseFriends } from "@/hooks/useCloseFriends";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { BuyCoinsModal } from "@/components/BuyCoinsModal";
import PhotoCarouselModal from "@/components/PhotoCarouselModal";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  instagram_username: string | null;
  is_verified?: boolean;
  followers_count?: number;
  following_count?: number;
}

interface Post {
  id: string;
  video_url?: string;
  image_urls?: string[];
  media_type?: string;
  thumbnail_url: string | null;
  caption: string | null;
  location: string | null;
  view_count: number;
  like_count: number;
  comment_count?: number;
}

const TravelProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({
    postsCount: 0,
    likesCount: 0,
    viewsCount: 0,
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [collaborationSheetOpen, setCollaborationSheetOpen] = useState(false);
  const [closeFriendsOpen, setCloseFriendsOpen] = useState(false);
  const [unreadCollabCount, setUnreadCollabCount] = useState(0);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);
  const [partnershipProposalOpen, setPartnershipProposalOpen] = useState(false);
  const [partnershipRequestOpen, setPartnershipRequestOpen] = useState(false);
  const { isCloseFriend } = useCloseFriends();
const { balance, refetch: refetchCoins } = useCoinBalance();

  // Photo carousel modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalImages, setPhotoModalImages] = useState<string[]>([]);
  const [photoStartIndex, setPhotoStartIndex] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const profileUserId = userId || user?.id;
  const isOwnProfile = user?.id === profileUserId;

  useEffect(() => {
    if (profileUserId) {
      fetchProfile();
      fetchUserPosts();
      fetchVideoPosts();
      fetchLikedPosts();
      fetchStats();
      
      // Fetch collaboration invites count only for own profile
      if (isOwnProfile && user) {
        fetchCollabCount();
      }
    }
  }, [profileUserId, isOwnProfile, user]);

  useEffect(() => {
    if (isOwnProfile) {
      handlePaymentSuccess();
    }
  }, [searchParams, isOwnProfile]);

  const handlePaymentSuccess = async () => {
    const coinsPurchased = searchParams.get('coins_purchased');
    const sessionId = searchParams.get('session_id');
    
    if (coinsPurchased === 'true' && sessionId) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-coin-payment', {
          body: { session_id: sessionId }
        });

        if (error) throw error;

        if (data?.success) {
          toast.success(`${data.coins_added} coins added to your balance! 🎉`);
          refetchCoins();
        }
      } catch (error) {
        console.error('Error verifying coin payment:', error);
      } finally {
        // Clean up URL
        searchParams.delete('coins_purchased');
        searchParams.delete('session_id');
        setSearchParams(searchParams);
      }
    }
  };

  const fetchCollabCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('post_collaborators')
      .select('*', { count: 'exact', head: true })
      .eq('collaborator_id', user.id)
      .eq('status', 'pending');
    
    setUnreadCollabCount(count || 0);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileUserId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url,
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio,
          phone: data.phone,
          website: data.website,
          location: data.location,
          instagram_username: data.instagram_username,
          is_verified: data.is_verified,
          followers_count: data.followers_count,
          following_count: data.following_count,
        });
      } else {
        setProfile({
          id: profileUserId!,
          username: 'User',
          avatar_url: null,
          first_name: null,
          last_name: null,
          bio: null,
          phone: null,
          website: null,
          location: null,
          instagram_username: null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const fetchUserPosts = async () => {
    try {
      console.log('Fetching photo posts for user:', profileUserId);
      // Fetch only photo posts for the Posts tab
      let query: any = supabase
        .from('travel_posts')
        .select('id, image_urls, media_type, thumbnail_url, caption, location, view_count, like_count, comment_count')
        .eq('user_id', profileUserId)
        .eq('media_type', 'photo')
        .order('created_at', { ascending: false });

      // Only show active posts for other users; show all on own profile
      if (!isOwnProfile) {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error in fetchUserPosts:', error);
        throw error;
      }
      
      console.log('Fetched photo posts:', data?.length || 0, 'posts');
      setUserPosts(data || []);
    } catch (error) {
      console.error('Error fetching photo posts:', error);
      toast.error('Failed to load photos');
    }
  };

  const fetchVideoPosts = async () => {
    try {
      console.log('Fetching video posts for user:', profileUserId);
      // Fetch only video posts for the Journeys tab
      let query: any = supabase
        .from('travel_posts')
        .select('id, video_url, media_type, thumbnail_url, caption, location, view_count, like_count, comment_count')
        .eq('user_id', profileUserId)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false });

      // Only show active posts for other users; show all on own profile
      if (!isOwnProfile) {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error in fetchVideoPosts:', error);
        throw error;
      }
      
      console.log('Fetched video posts:', data?.length || 0, 'posts');
      setVideoPosts(data || []);
    } catch (error) {
      console.error('Error fetching video posts:', error);
      toast.error('Failed to load videos');
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
        .select('id, video_url, image_urls, media_type, thumbnail_url, caption, location, view_count, like_count')
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
      let query: any = supabase
        .from('travel_posts')
        .select('view_count, like_count')
        .eq('user_id', profileUserId);

      // Only count active posts for other users
      if (!isOwnProfile) {
        query = query.eq('status', 'active');
      }

      const { data: posts } = await query;

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

  const handleCreateContent = (type: string) => {
    if (type === 'reel' || type === 'post') {
      setUploadModalOpen(true);
    } else if (type === 'moments-vault') {
      toast.info('Tap the + button in the Moments Vaults section below to create a new vault');
      setCreateSheetOpen(false);
    }
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    fetchUserPosts();
    fetchVideoPosts();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile photo updated!');
      fetchProfile();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
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
    <div className="min-h-screen bg-background pb-28 pb-safe md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-1 hover:bg-transparent"
            aria-label="Back"
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
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-start justify-between">
          <div className="relative">
            <Avatar className="h-24 w-24 md:h-20 md:w-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl md:text-2xl">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={uploadingAvatar}
                />
                <button
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 md:p-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <div className="h-5 w-5 md:h-4 md:w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <PlusCircle className="h-5 w-5 md:h-4 md:w-4" />
                  )}
                </button>
              </>
            )}
          </div>
          
          <div className="flex items-start gap-6 md:gap-8 pt-2">
            <button className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold">{formatNumber(stats.postsCount)}</div>
              <div className="text-xs text-muted-foreground">posts</div>
            </button>
            <button className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold">{formatNumber(profile?.followers_count || 0)}</div>
              <div className="text-xs text-muted-foreground">followers</div>
            </button>
            <button className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold">{formatNumber(profile?.following_count || 0)}</div>
              <div className="text-xs text-muted-foreground">following</div>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold text-base md:text-sm">
              {profile?.first_name && profile?.last_name
                ? `${profile.first_name} ${profile.last_name}`.toUpperCase()
                : (profile?.username || 'User').toUpperCase()}
            </h2>
            {profile?.is_verified && (
              <CheckCircle2 className="h-5 w-5 md:h-4 md:w-4 text-blue-500 fill-blue-500" />
            )}
          </div>
          {profile?.bio && (
            <p className="text-sm md:text-sm whitespace-pre-wrap">{profile.bio}</p>
          )}
          {profile?.website && (
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline block mt-1"
            >
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {profile?.location && (
            <p className="text-sm text-muted-foreground mt-1">📍 {profile.location}</p>
          )}
          
          {/* Activity Status */}
          {!isOwnProfile && profileUserId && (
            <ActivityStatus userId={profileUserId} showText size="md" />
          )}
        </div>

        {/* Dashboard and Coins Cards for own profile - Hidden on mobile */}
        {isOwnProfile && (
          <div className="flex flex-col md:flex-row gap-2">
            {/* Dashboard Card */}
            {stats.viewsCount > 0 && (
              <Card className="p-3 bg-dashboard-bg border-dashboard-bg flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm md:text-sm text-dashboard-text">Your dashboard</p>
                    <p className="text-xs text-dashboard-text flex items-center gap-1 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {formatNumber(stats.viewsCount)} views in the last 30 days.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Coin Balance Card - Hidden on mobile */}
            <Card className="hidden md:flex p-3 bg-coins-bg border-coins-bg flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-white" />
                  <div>
                    <p className="font-semibold text-sm text-white">Your Coins</p>
                    <p className="text-xs text-white/80">{balance} coins available</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setBuyCoinsOpen(true)}
                  className="h-9 px-3 bg-coins-button hover:bg-coins-button/90 text-coins-bg"
                >
                  Buy Coins
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons - Instagram-style layout */}
        <div className="grid grid-cols-2 gap-2">
          {isOwnProfile ? (
            <>
              <Button
                variant="secondary"
                className="w-full h-9 md:h-8 text-sm font-semibold"
                style={{ backgroundColor: '#0c4d47', color: '#bfad72' }}
                onClick={() => setEditProfileOpen(true)}
              >
                Edit profile
              </Button>
              <Button
                variant="secondary"
                className="w-full h-9 md:h-8 text-sm font-semibold"
                style={{ backgroundColor: '#0c4d47', color: '#bfad72' }}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Profile link copied!");
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share profile
              </Button>
            </>
          ) : (
            <>
              {user && <FollowButton targetUserId={profileUserId!} />}
              <Button
                variant="secondary"
                className="flex-1 h-9 md:h-8 text-sm font-semibold"
                onClick={() => setPartnershipProposalOpen(true)}
              >
                <Briefcase className="h-4 w-4 mr-1" />
                Partner
              </Button>
              <Button
                variant="secondary"
                className="flex-1 h-9 md:h-8 text-sm font-semibold"
                onClick={() => setPartnershipRequestOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Request
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 md:h-8 md:w-8"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              {user && profileUserId && isCloseFriend(profileUserId) && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 md:h-8 md:w-8 bg-green-100 dark:bg-green-900"
                  title="Close Friend"
                >
                  <Star className="h-4 w-4 text-green-600 dark:text-green-400 fill-current" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Moments Vaults */}
        <StoryHighlights
          userId={profileUserId!}
          isOwnProfile={isOwnProfile}
        />
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full mt-2">
        <TabsList className="w-full grid grid-cols-3 rounded-none h-11 bg-transparent">
          <TabsTrigger 
            value="posts" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none flex flex-col gap-0.5"
            title="Photos"
          >
            <Grid3X3 className="h-5 w-5" />
            <span className="text-[10px]">Posts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="journeys"
            className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none flex flex-col gap-0.5"
            title="Videos - Your travel journeys"
          >
            <Video className="h-5 w-5" />
            <span className="text-[10px]">Journeys</span>
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger 
              value="liked"
              className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none flex flex-col gap-0.5"
              title="Liked content"
            >
              <Heart className="h-5 w-5" />
              <span className="text-[10px]">Liked</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="journeys" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-muted-foreground">Loading videos...</div>
            </div>
          ) : videoPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No videos yet</p>
              {isOwnProfile && (
                <Button
                  className="mt-4"
                  onClick={() => setCreateSheetOpen(true)}
                >
                  Create your first journey
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 pb-20 md:pb-0">
              {videoPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square bg-muted cursor-pointer group overflow-hidden"
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
                  {/* Instagram-style hover overlay for videos */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-sm flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="h-5 w-5 fill-white" />
                        <span className="font-semibold">{formatNumber(post.like_count)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="h-5 w-5 fill-white" />
                        <span className="font-semibold">{formatNumber(post.view_count)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Edit button in corner - only visible on hover */}
                  {isOwnProfile && (
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPost(post);
                        setEditOpen(true);
                      }}
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 border-none"
                    >
                      <Edit className="h-4 w-4 text-white" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-muted-foreground">Loading photos...</div>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos yet</p>
              {isOwnProfile && (
                <Button
                  className="mt-4"
                  onClick={() => setUploadModalOpen(true)}
                >
                  Share your first photo
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 pb-20 md:pb-0">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square bg-muted cursor-pointer group overflow-hidden"
                  onClick={() => {
                    if (post.image_urls && post.image_urls.length > 0) {
                      setPhotoModalImages(post.image_urls);
                      setPhotoStartIndex(0);
                      setSelectedPost(post);
                      setPhotoModalOpen(true);
                    }
                  }}
                >
                  {post.image_urls && post.image_urls.length > 0 ? (
                    <img
                      src={post.image_urls[0]}
                      alt={post.caption || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                  ) : post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                      <Grid3X3 className="h-8 w-8 text-white" />
                    </div>
                  )}
                  {/* Instagram-style hover overlay - NO edit button on photos */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-sm flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="h-5 w-5 fill-white" />
                        <span className="font-semibold">{formatNumber(post.like_count)}</span>
                      </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-5 w-5 fill-white" />
                          <span className="font-semibold">{formatNumber(post.comment_count || 0)}</span>
                        </div>
                    </div>
                  </div>
                  {/* Edit button in corner - only visible on hover */}
                  {isOwnProfile && (
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPost(post);
                        setEditOpen(true);
                      }}
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 border-none"
                    >
                      <Edit className="h-4 w-4 text-white" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="liked" className="mt-4">
            {likedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No liked posts yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Videos you like will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 pb-20 md:pb-0">
                {likedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square bg-muted cursor-pointer group overflow-hidden"
                    onClick={() => {
                      if (post.media_type === 'photo' && post.image_urls && post.image_urls.length > 0) {
                        setPhotoModalImages(post.image_urls);
                        setPhotoStartIndex(0);
                        setSelectedPost(post);
                        setPhotoModalOpen(true);
                      } else {
                        navigate(`/travel-feed?postId=${post.id}`);
                      }
                    }}
                  >
                    {post.media_type === 'photo' && post.image_urls && post.image_urls.length > 0 ? (
                      <img
                        src={post.image_urls[0]}
                        alt={post.caption || 'Photo'}
                        className="w-full h-full object-cover"
                      />
                    ) : post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.caption || 'Content'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                        {post.media_type === 'video' ? (
                          <Video className="h-8 w-8 text-white" />
                        ) : (
                          <Grid3X3 className="h-8 w-8 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {isOwnProfile && editingPost && (
        <VideoEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          postId={editingPost.id}
          currentCaption={editingPost.caption}
          currentLocation={editingPost.location}
          currentThumbnailUrl={editingPost.thumbnail_url}
          videoUrl={editingPost.video_url || null}
          onSuccess={() => {
            fetchUserPosts();
            fetchVideoPosts();
          }}
        />
      )}

      {/* Edit Profile Dialog */}
      {isOwnProfile && profile && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          profile={profile}
          onProfileUpdated={fetchProfile}
        />
      )}

      {/* Collaboration Invites Sheet */}
      {collaborationSheetOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
            <div className="bg-card rounded-lg p-4 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => setCollaborationSheetOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CollaborationInvites />
            </div>
          </div>
        </div>
      )}

      {/* Close Friends Manager */}
      <CloseFriendsManager
        open={closeFriendsOpen}
        onOpenChange={setCloseFriendsOpen}
      />

      {/* Create Content Sheet */}
      <CreateContentSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSelectType={handleCreateContent}
      />

      {/* Photo Carousel Modal */}
      <PhotoCarouselModal
        open={photoModalOpen}
        onOpenChange={setPhotoModalOpen}
        images={photoModalImages}
        startIndex={photoStartIndex}
        postId={selectedPost?.id}
        caption={selectedPost?.caption}
        likeCount={selectedPost?.like_count}
        username={profile?.username || undefined}
        userAvatar={profile?.avatar_url || undefined}
      />

      {/* Upload Modal */}
      <ContentUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={handleUploadSuccess}
      />

      {/* Buy Coins Modal */}
      <BuyCoinsModal
        open={buyCoinsOpen}
        onOpenChange={setBuyCoinsOpen}
      />

      {/* Brand Partnership Proposal Modal */}
      {!isOwnProfile && profileUserId && (
        <>
          <BrandPartnershipProposal
            open={partnershipProposalOpen}
            onOpenChange={setPartnershipProposalOpen}
            creatorId={profileUserId}
          />
          <CreatorPartnershipRequest
            open={partnershipRequestOpen}
            onOpenChange={setPartnershipRequestOpen}
            brandId={profileUserId}
          />
        </>
      )}

      {/* Spacer for mobile nav to prevent overlap */}
      <div className="h-16 md:hidden" aria-hidden />

      {/* Bottom Navigation Bar - Mobile Only, compact */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t md:hidden pb-safe">
        <div className="flex items-center justify-around py-1.5 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="hover:bg-accent h-12 w-12 rounded-lg border-2 border-primary"
            aria-label="Home"
          >
            <Home className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/travel-feed')}
            className="hover:bg-accent h-12 w-12 rounded-lg border-2 border-primary"
            aria-label="Journeys"
          >
            <Video className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCreateSheetOpen(true)}
            className="hover:bg-accent h-12 w-12 rounded-lg border-2 border-primary"
            aria-label="Create"
          >
            <PlusSquare className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/travel-profile')}
            className="hover:bg-accent h-12 w-12 rounded-lg border-2 border-primary"
            aria-label="Profile"
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TravelProfile;
