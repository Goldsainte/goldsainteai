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
import { OptimizedImage } from "@/components/OptimizedImage";
import { PostGridSkeleton } from "@/components/PostGridSkeleton";
import { TravelSidebar } from "@/components/TravelSidebar";
import { MomentsViewer } from "@/components/MomentsViewer";

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
  const [hasActiveMoments, setHasActiveMoments] = useState(false);
  const [momentsViewerOpen, setMomentsViewerOpen] = useState(false);

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
      checkActiveMoments();
      
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
      // Fetch only photo posts for the Posts tab - limit for faster initial load
      let query: any = supabase
        .from('travel_posts')
        .select('id, image_urls, media_type, thumbnail_url, caption, location, view_count, like_count, comment_count')
        .eq('user_id', profileUserId)
        .eq('media_type', 'photo')
        .order('created_at', { ascending: false })
        .limit(30); // Load first 30 for performance

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

  const checkActiveMoments = async () => {
    try {
      const { data, error } = await supabase
        .from('moments')
        .select('id')
        .eq('user_id', profileUserId)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (error) throw error;
      setHasActiveMoments((data?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking moments:', error);
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
    <>
      <TravelSidebar />
      <div className="min-h-screen bg-background pb-28 pb-safe md:pb-0 md:ml-64">
        {/* Header - Instagram style */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 md:px-6 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="md:invisible"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold">{profile?.username || 'Profile'}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/travel-settings')}
            className={isOwnProfile ? '' : 'invisible'}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
        
        {/* Profile Info - Instagram Desktop Layout */}
        <div className="hidden md:flex gap-8 mb-12 items-start">
          {/* Profile Picture */}
          <div className="relative flex-shrink-0">
            <Avatar 
              className={`h-40 w-40 cursor-pointer ${hasActiveMoments ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              onClick={() => hasActiveMoments && setMomentsViewerOpen(true)}
            >
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-5xl">
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
                  id="avatar-upload-desktop"
                  disabled={uploadingAvatar}
                />
                <button
                  onClick={() => document.getElementById('avatar-upload-desktop')?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-5">
            {/* Username and Buttons Row */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-light">{profile?.username || 'User'}</h2>
              
              {isOwnProfile ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-[6px] px-4 text-sm font-semibold"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    Edit profile
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-[6px] px-4 text-sm font-semibold"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Profile link copied!");
                    }}
                  >
                    Share profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate('/travel-settings')}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  {user && <FollowButton targetUserId={profileUserId!} />}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-4 text-sm font-semibold"
                    onClick={() => setPartnershipProposalOpen(true)}
                  >
                    Partner
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-4 text-sm font-semibold"
                    onClick={() => setPartnershipRequestOpen(true)}
                  >
                    Request
                  </Button>
                </>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-10">
              <button className="flex items-center gap-1">
                <span className="font-semibold">{formatNumber(stats.postsCount)}</span>
                <span className="text-sm">posts</span>
              </button>
              <button className="flex items-center gap-1">
                <span className="font-semibold">{formatNumber(profile?.followers_count || 0)}</span>
                <span className="text-sm">followers</span>
              </button>
              <button className="flex items-center gap-1">
                <span className="font-semibold">{formatNumber(profile?.following_count || 0)}</span>
                <span className="text-sm">following</span>
              </button>
            </div>

            {/* Bio Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`.toUpperCase()
                    : (profile?.username || '').toUpperCase()}
                </p>
                {profile?.is_verified && (
                  <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500" />
                )}
              </div>
              {profile?.bio && (
                <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
              )}
              {profile?.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {profile?.location && (
                <p className="text-sm text-muted-foreground">📍 {profile.location}</p>
              )}
            </div>

            {/* Coins Balance - Subtle on desktop */}
            {isOwnProfile && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="font-semibold">{balance} coins</span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-primary"
                  onClick={() => setBuyCoinsOpen(true)}
                >
                  Buy more
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Profile Layout - Instagram Style */}
        <div className="md:hidden space-y-2.5 mb-3">
          {/* Profile Photo and Name Row */}
          <div className="flex items-center gap-1">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar 
                className={`h-20 w-20 ring-2 ${hasActiveMoments ? 'ring-primary' : 'ring-border'} cursor-pointer`}
                onClick={() => hasActiveMoments && setMomentsViewerOpen(true)}
              >
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
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
                    id="avatar-upload-mobile"
                    disabled={uploadingAvatar}
                  />
                  <button
                    onClick={() => document.getElementById('avatar-upload-mobile')?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 ring-2 ring-background hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <PlusCircle className="h-3.5 w-3.5" />
                    )}
                  </button>
                </>
              )}
            </div>
            
            {/* Name */}
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-sm">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`.toUpperCase()
                  : (profile?.username || 'User').toUpperCase()}
              </h2>
              {profile?.is_verified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500" />
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center">
              <div className="text-sm font-bold">{formatNumber(stats.postsCount)}</div>
              <div className="text-[11px] text-muted-foreground">posts</div>
            </button>
            <button className="flex flex-col items-center">
              <div className="text-sm font-bold">{formatNumber(profile?.followers_count || 0)}</div>
              <div className="text-[11px] text-muted-foreground">followers</div>
            </button>
            <button className="flex flex-col items-center">
              <div className="text-sm font-bold">{formatNumber(profile?.following_count || 0)}</div>
              <div className="text-[11px] text-muted-foreground">following</div>
            </button>
          </div>

          {/* Bio Section - Standalone */}
          <div className="space-y-0.5">
            {profile?.bio && (
              <p className="text-xs leading-snug">{profile.bio}</p>
            )}
            {profile?.website && (
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline block"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {profile?.location && (
              <p className="text-[11px] text-muted-foreground">📍 {profile.location}</p>
            )}
          </div>

          {/* Your Dashboard Section */}
          {isOwnProfile && (
            <div className="rounded-lg p-1 space-y-1" style={{ backgroundColor: '#E5DFC6' }}>
              <div className="flex items-center gap-1 mb-0.5">
                <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold">Your Dashboard</h3>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold">{formatNumber(stats.viewsCount)}</div>
                  <div className="text-[10px] text-muted-foreground">views</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold">{formatNumber(stats.likesCount)}</div>
                  <div className="text-[10px] text-muted-foreground">likes</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold flex items-center gap-0.5">
                    <Coins className="h-3 w-3 text-accent" />
                    {balance}
                  </div>
                  <div className="text-[10px] text-muted-foreground">coins</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Compact Style */}
          <div className="flex gap-[1.6px]">
            {isOwnProfile ? (
              <>
                <Button
                  variant="secondary"
                  className="flex-1 h-[6px] text-[11px] font-semibold rounded-md"
                  onClick={() => setEditProfileOpen(true)}
                >
                  Edit profile
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 h-[6px] text-[11px] font-semibold rounded-md"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Profile link copied!");
                  }}
                >
                  Share profile
                </Button>
              </>
            ) : (
              <>
                {user && <FollowButton targetUserId={profileUserId!} />}
                <Button
                  variant="secondary"
                  className="flex-1 h-6 text-[11px] font-semibold rounded-md"
                  onClick={() => setPartnershipProposalOpen(true)}
                >
                  Partner
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 h-6 text-[11px] font-semibold rounded-md"
                  onClick={() => setPartnershipRequestOpen(true)}
                >
                  Request
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Moments Vault - Smaller circles for better spacing */}
        <div className="border-t border-border pt-2 pb-1.5 md:hidden">
          <div className="px-4">
            <h3 className="text-[10px] font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Moments Vault</h3>
            <div className="overflow-x-auto -mx-2 px-2">
              <StoryHighlights
                userId={profileUserId!}
                isOwnProfile={isOwnProfile}
              />
            </div>
          </div>
        </div>
        
        {/* Desktop Story Highlights */}
        <div className="hidden md:block border-t border-border pt-3 pb-2">
          <StoryHighlights
            userId={profileUserId!}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>

      {/* Content Tabs - Instagram Style */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 rounded-none h-11 bg-transparent border-t border-border">
          <TabsTrigger 
            value="posts" 
            className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none h-full flex items-center justify-center gap-0"
            title="Photos"
          >
            <Grid3X3 className="h-6 w-6 md:h-5 md:w-5" />
          </TabsTrigger>
          <TabsTrigger 
            value="journeys"
            className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none h-full flex items-center justify-center gap-0"
            title="Videos"
          >
            <Video className="h-6 w-6 md:h-5 md:w-5" />
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger 
              value="liked"
              className="hidden md:flex data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none h-full items-center justify-center gap-0"
              title="Liked"
            >
              <Heart className="h-5 w-5" />
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
                  className="relative aspect-[4/5] md:aspect-square bg-muted cursor-pointer group overflow-hidden"
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

        <TabsContent value="posts" className="mt-0">
          {loading ? (
            <PostGridSkeleton />
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
                  className="relative aspect-[4/5] md:aspect-square bg-muted cursor-pointer group overflow-hidden transition-transform active:scale-95"
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
                    <OptimizedImage
                      src={post.image_urls[0]}
                      alt={post.caption || 'Photo'}
                      aspectRatio="square"
                      className="w-full h-full"
                    />
                  ) : post.thumbnail_url ? (
                    <OptimizedImage
                      src={post.thumbnail_url}
                      alt={post.caption || 'Photo'}
                      aspectRatio="square"
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                      <Grid3X3 className="h-8 w-8 text-white" />
                    </div>
                  )}
                  {/* Instagram-style hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
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
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 border-none shadow-lg"
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
                    className="relative aspect-[4/5] md:aspect-square bg-muted cursor-pointer group overflow-hidden"
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

      {/* Moments Viewer */}
      <MomentsViewer
        open={momentsViewerOpen}
        onOpenChange={setMomentsViewerOpen}
        userId={profileUserId || ''}
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
            className="hover:bg-accent h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
            aria-label="Home"
          >
            <Home className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/travel-feed')}
            className="hover:bg-accent h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
            aria-label="Journeys"
          >
            <Video className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCreateSheetOpen(true)}
            className="hover:bg-accent h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
            aria-label="Create"
          >
            <PlusSquare className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/travel-profile')}
            className="hover:bg-accent h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
            aria-label="Profile"
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

export default TravelProfile;
