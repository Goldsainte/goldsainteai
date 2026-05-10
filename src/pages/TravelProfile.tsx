import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Settings, Heart, Video, MessageCircle, Share2, Grid3X3, TrendingUp, ChevronDown, PlusCircle, Edit, Star, Coins, Briefcase, Sparkles, X, Home, Search as SearchIcon, PlusSquare, User, Music2, MapPin, Compass, Lock } from "lucide-react";
import { InstagramVerifiedBadge } from "@/components/badges/InstagramVerifiedBadge";
import { BusinessVerifiedBadge } from "@/components/badges/BusinessVerifiedBadge";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { LiveTripCard } from "@/components/marketplace/LiveTripCard";
import { TravelerBookingsTab } from "@/pages/traveler/components/TravelerBookingsTab";

import FollowButton from "@/components/FollowButton";
import StoryHighlights from "@/components/StoryHighlights";
import VideoEditModal from "@/components/VideoEditModal";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { ActivityStatus } from "@/components/ActivityStatus";
import { CloseFriendsManager } from "@/components/CloseFriendsManager";
import { useCloseFriends } from "@/hooks/useCloseFriends";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { BuyCoinsModal } from "@/components/BuyCoinsModal";
import PhotoCarouselModal from "@/components/PhotoCarouselModal";
import { OptimizedImage } from "@/components/OptimizedImage";
import { PostGridSkeleton } from "@/components/PostGridSkeleton";
import { MomentsViewer } from "@/components/MomentsViewer";
import { ProfilePhotoModal } from "@/components/ProfilePhotoModal";
import { PinnedPosts } from "@/components/PinnedPosts";
import { ShareToStoryButton } from "@/components/ShareToStoryButton";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  cover_image_url?: string | null;
  full_name?: string | null;
  created_at?: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  instagram_username: string | null;
  is_verified?: boolean;
  is_business_verified?: boolean;
  account_type?: string;
  show_account_type?: boolean;
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
  music_track_id?: string;
  music_track_name?: string;
  music_track_artist?: string;
  music_preview_url?: string;
  music_album_art?: string;
  music_service?: string;
  music_volume?: number;
  native_video_volume?: number;
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
    commentsCount: 0,
    sharesCount: 0,
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [collaborationSheetOpen, setCollaborationSheetOpen] = useState(false);
  const [closeFriendsOpen, setCloseFriendsOpen] = useState(false);
  const [unreadCollabCount, setUnreadCollabCount] = useState(0);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadInitialTab, setUploadInitialTab] = useState<"photo" | "video">("photo");
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);

  const { isCloseFriend } = useCloseFriends();
const { balance, refetch: refetchCoins } = useCoinBalance();
  const [hasActiveMoments, setHasActiveMoments] = useState(false);
  const [momentsViewerOpen, setMomentsViewerOpen] = useState(false);
  const [profilePhotoModalOpen, setProfilePhotoModalOpen] = useState(false);

  // Photo carousel modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalImages, setPhotoModalImages] = useState<string[]>([]);
  const [photoStartIndex, setPhotoStartIndex] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [bookingStats, setBookingStats] = useState({ completed: 0, upcoming: 0, countries: 0 });
  const [savedTrips, setSavedTrips] = useState<any[]>([]);

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
      fetchBookingStats();
      fetchSavedTrips();
      
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
    // Collaboration feature removed
    setUnreadCollabCount(0);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, account_type, show_account_type, is_business_verified')
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
          is_business_verified: data.is_business_verified,
          account_type: data.account_type,
          show_account_type: data.show_account_type,
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
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      // Fetch only photo posts for the Posts tab - limit for faster initial load
      let query: any = supabase
        .from('travel_posts')
        .select('id, image_urls, media_type, thumbnail_url, caption, location, view_count, like_count, comment_count, music_track_id, music_track_name, music_track_artist, music_preview_url, music_album_art, music_service, music_volume')
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
      
      setUserPosts(data || []);
    } catch (error) {
      console.error('Error fetching photo posts:', error);
      toast.error('Failed to load photos');
    }
  };

  const fetchVideoPosts = async () => {
    try {
      // Fetch only video posts for the Journeys tab
      let query: any = supabase
        .from('travel_posts')
        .select('id, video_url, media_type, thumbnail_url, caption, location, view_count, like_count, comment_count, music_track_id, music_track_name, music_track_artist, music_preview_url, music_album_art, music_service, native_video_volume, music_volume')
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
      
      setVideoPosts(data || []);
    } catch (error) {
      console.error('Error fetching video posts:', error);
      toast.error('Failed to load videos');
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
        .select('id, video_url, image_urls, media_type, thumbnail_url, caption, location, view_count, like_count, music_track_id, music_track_name, music_track_artist, music_preview_url, music_album_art, music_service, music_volume')
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
        .select('view_count, like_count, comment_count, share_count')
        .eq('user_id', profileUserId);

      // Only count active posts for other users
      if (!isOwnProfile) {
        query = query.eq('status', 'active');
      }

      const { data: posts } = await query;

      if (posts) {
        const totalViews = posts.reduce((sum, post) => sum + post.view_count, 0);
        const totalLikes = posts.reduce((sum, post) => sum + post.like_count, 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comment_count || 0), 0);
        const totalShares = posts.reduce((sum, post) => sum + (post.share_count || 0), 0);
        
        setStats({
          postsCount: posts.length,
          likesCount: totalLikes,
          viewsCount: totalViews,
          commentsCount: totalComments,
          sharesCount: totalShares,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const { data } = await supabase
        .from('trip_bookings')
        .select('status')
        .eq('traveler_id', profileUserId!);
      const list = (data as any[]) || [];
      const completed = list.filter((b) => b.status === 'completed').length;
      const upcoming = list.filter((b) => ['confirmed', 'deposit_pending'].includes(b.status)).length;
      setBookingStats({ completed, upcoming, countries: completed });
    } catch (e) {
      console.error('Error fetching booking stats:', e);
    }
  };

  const fetchSavedTrips = async () => {
    try {
      const { data } = await supabase
        .from('trip_wishlists')
        .select('packaged_trips(id, slug, title, destination, cover_image_url, price_per_person, currency, duration_days, max_participants, current_bookings, difficulty_level, rating, review_count, available_from, available_until, tags)')
        .eq('user_id', profileUserId!);
      const trips = ((data as any[]) || []).map((w: any) => w.packaged_trips).filter(Boolean);
      setSavedTrips(trips);
    } catch (e) {
      console.error('Error fetching saved trips:', e);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 10000) return `${(num / 1000).toFixed(1)}K`;
    if (num >= 1000) return num.toLocaleString('en-US');
    return num.toString();
  };

  const handleCreateContent = (type: string) => {
    if (type === 'reel') {
      setUploadInitialTab("video");
      setUploadModalOpen(true);
      setCreateSheetOpen(false);
    } else if (type === 'post') {
      setUploadInitialTab("photo");
      setUploadModalOpen(true);
      setCreateSheetOpen(false);
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

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-background pb-28 md:pb-0 md:ml-64">
          <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
            <div className="flex gap-8 mb-12 items-start">
              <div className="h-40 w-40 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-5">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <div className="flex gap-10">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-28 pb-safe md:pb-0 md:ml-64">
      {/* Header - Mobile Only */}
        <div className="md:hidden sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {isOwnProfile && (
              <Avatar 
                className="h-9 w-9 cursor-pointer"
                onClick={() => setProfilePhotoModalOpen(true)}
              >
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">{profile?.username || 'Profile'}</h1>
            {profile?.is_business_verified ? (
              <BusinessVerifiedBadge />
            ) : profile?.is_verified ? (
              <InstagramVerifiedBadge />
            ) : null}
          </div>
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

      {/* Cover banner */}
      <div className="relative h-40 md:h-56 w-full bg-gradient-to-br from-[#0c4d47] to-[#0a2225] overflow-hidden">
        {(profile as any)?.cover_image_url && (
          <img src={(profile as any).cover_image_url} className="w-full h-full object-cover opacity-60" loading="eager" alt="" />
        )}
        {isOwnProfile && (
          <button
            onClick={() => setEditProfileOpen(true)}
            className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/30 transition-colors"
          >
            Change cover
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Avatar + actions row */}
        <div className="flex items-end justify-between -mt-12 md:-mt-16 mb-6">
          <Avatar
            className="h-20 w-20 md:h-28 md:w-28 ring-4 ring-[#FDF9F0] cursor-pointer flex-shrink-0"
            onClick={() => isOwnProfile && setProfilePhotoModalOpen(true)}
          >
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-[#0c4d47] text-white text-2xl">
              {(profile?.full_name || profile?.username || 'T')[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2 mb-1">
            {isOwnProfile ? (
              <>
                <Button variant="outline" size="sm" className="rounded-full border-[#E5DFC6] text-[#0a2225]" onClick={() => setEditProfileOpen(true)}>
                  Edit Profile
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/travel-settings')}>
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            ) : (
              user && <FollowButton targetUserId={profileUserId!} />
            )}
          </div>
        </div>

        {/* Name, location, bio */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-secondary text-2xl text-[#0a2225]">
              {profile?.full_name || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile?.username) || 'Traveler'}
            </h1>
            {profile?.is_business_verified ? <BusinessVerifiedBadge /> : profile?.is_verified ? <InstagramVerifiedBadge /> : null}
          </div>
          {profile?.location && (
            <p className="text-sm text-[#6B7280] flex items-center gap-1 mb-2">
              <MapPin className="h-3.5 w-3.5" /> {profile.location}
            </p>
          )}
          {profile?.bio && <p className="text-sm text-[#0a2225] leading-relaxed max-w-xl">{profile.bio}</p>}
          <p className="text-xs text-[#9A9384] mt-2">
            Member since {format(new Date(profile?.created_at || Date.now()), 'MMMM yyyy')}
          </p>
        </div>

        {/* Travel stats row */}
        <div className="flex gap-6 pb-6 border-b border-[#E5DFC6]">
          {[
            { label: 'Trips Taken', value: bookingStats.completed },
            { label: 'Countries', value: bookingStats.countries },
            { label: 'Upcoming', value: bookingStats.upcoming },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-secondary text-2xl text-[#0a2225]">{stat.value}</p>
              <p className="text-xs text-[#9A9384]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="w-full bg-transparent border-b border-[#E5DFC6] rounded-none h-12 px-4 md:px-6 justify-start gap-0">
            <TabsTrigger value="trips" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4">
              My Trips
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4">
              Saved
            </TabsTrigger>
            <TabsTrigger value="journal" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4">
              Travel Journal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trips" className="mt-6 px-4 md:px-6">
            {isOwnProfile ? (
              <TravelerBookingsTab userId={profileUserId!} />
            ) : (
              <div className="text-center py-16">
                <Lock className="h-8 w-8 text-[#9A9384] mx-auto mb-3" />
                <p className="text-sm text-[#6B7280]">
                  {profile?.full_name?.split(' ')[0] || profile?.username || 'This user'}'s trips are private.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6 px-4 md:px-6">
            {isOwnProfile ? (
              savedTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedTrips.map((trip: any) => (
                    <LiveTripCard key={trip.id} trip={trip as any} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Compass className="h-10 w-10 text-[#C7A962] mx-auto mb-4" />
                  <p className="font-secondary text-lg text-[#0a2225] mb-1">No saved trips yet</p>
                  <p className="text-sm text-[#6B7280] mb-5">Browse the marketplace to save trips you love</p>
                  <Button onClick={() => navigate('/marketplace')} className="bg-[#0c4d47] text-white rounded-full px-6 hover:bg-[#0c4d47]/90">
                    Browse Trips
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <Lock className="h-8 w-8 text-[#9A9384] mx-auto mb-3" />
                <p className="text-sm text-[#6B7280]">
                  {profile?.full_name?.split(' ')[0] || profile?.username || 'This user'}'s saved trips are private.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="journal" className="mt-4">
            <div className="px-4 md:px-6">
              <StoryHighlights userId={profileUserId!} isOwnProfile={isOwnProfile} />
            </div>
            <Tabs defaultValue="posts" className="w-full mt-4">
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 rounded-none h-11 bg-transparent border-t border-border">
                <TabsTrigger value="posts" className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none h-full flex items-center justify-center gap-0" title="Photos">
                  <Grid3X3 className="h-6 w-6 md:h-5 md:w-5" />
                </TabsTrigger>
                <TabsTrigger value="journeys" className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none h-full flex items-center justify-center gap-0" title="Videos">
                  <Video className="h-6 w-6 md:h-5 md:w-5" />
                </TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger value="liked" className="hidden md:flex data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none h-full items-center justify-center gap-0" title="Saved">
                    <Heart className="h-5 w-5" />
                  </TabsTrigger>
                )}
              </TabsList>
          {/* Profile Picture */}
          <div className="relative flex-shrink-0">
            <Avatar 
              className={`h-[150px] w-[150px] cursor-pointer ${hasActiveMoments ? 'ring-4 ring-[#BFAD72] ring-offset-2 ring-offset-background' : ''}`}
              onClick={() => {
                if (hasActiveMoments) {
                  setMomentsViewerOpen(true);
                } else if (isOwnProfile) {
                  setProfilePhotoModalOpen(true);
                }
              }}
            >
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-5xl">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-5">
              {/* Username and Buttons Row */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-light">{profile?.username || 'User'}</h2>
                  {profile?.is_business_verified ? (
                    <BusinessVerifiedBadge />
                  ) : profile?.is_verified ? (
                    <InstagramVerifiedBadge />
                  ) : null}
                </div>
              
              {isOwnProfile ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 bg-[#EFEFEF] hover:bg-[#DBDBDB] border-0 font-semibold text-sm"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    Edit profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 bg-[#EFEFEF] hover:bg-[#DBDBDB] border-0 font-semibold text-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Profile link copied!");
                    }}
                  >
                    View archive
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
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 text-sm font-semibold"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Profile link copied!");
                    }}
                  >
                    Message
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
              <p className="font-semibold text-sm">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`.toUpperCase()
                  : (profile?.username || '').toUpperCase()}
              </p>
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

          </div>
        </div>

        {/* Mobile Profile Layout - Instagram Style */}
        <div className="md:hidden space-y-3 mb-3 px-4">
          {/* Profile Photo and Stats Row */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar 
                className={`h-[86px] w-[86px] cursor-pointer ${hasActiveMoments ? 'ring-4 ring-[#BFAD72] ring-offset-2 ring-offset-background' : ''}`}
                onClick={() => {
                  if (hasActiveMoments) {
                    setMomentsViewerOpen(true);
                  } else if (isOwnProfile) {
                    setProfilePhotoModalOpen(true);
                  }
                }}
              >
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Stats */}
            <div className="flex-1 flex justify-around">
              <button className="flex flex-col items-center">
                <span className="font-semibold text-base">{formatNumber(stats.postsCount)}</span>
                <span className="text-xs text-muted-foreground font-normal">posts</span>
              </button>
              <button className="flex flex-col items-center">
                <span className="font-semibold text-base">{formatNumber(profile?.followers_count || 0)}</span>
                <span className="text-xs text-muted-foreground font-normal">followers</span>
              </button>
              <button className="flex flex-col items-center">
                <span className="font-semibold text-base">{formatNumber(profile?.following_count || 0)}</span>
                <span className="text-xs text-muted-foreground font-normal">following</span>
              </button>
            </div>
          </div>

          {/* Name and Bio Section */}
          <div className="space-y-1">
            <p className="font-semibold text-sm uppercase">
              {profile?.first_name && profile?.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile?.username || 'User'}
            </p>

            {profile?.bio && (
              <p className="text-sm whitespace-pre-wrap leading-tight">{profile.bio}</p>
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-[30px] bg-[#EFEFEF] hover:bg-[#DBDBDB] border-0 font-semibold"
                  onClick={() => setEditProfileOpen(true)}
                >
                  Edit profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-[30px] bg-[#EFEFEF] hover:bg-[#DBDBDB] border-0 font-semibold"
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
                  variant="outline"
                  className="flex-1 h-[30px] bg-[#EFEFEF] hover:bg-[#DBDBDB] border-0 font-semibold text-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Profile link copied!");
                  }}
                >
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Story Highlights */}
        <div className="border-t border-border pt-3 pb-3">
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
              title="Saved"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
              </svg>
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
                  onClick={() => navigate(`/storyboards`)}
                >
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption || 'Video'}
                      className="w-full h-full object-cover"
                    loading="lazy"/>
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
          {isOwnProfile && <PinnedPosts userId={profileUserId!} />}
          
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
                    <img
                      src={post.image_urls[0]}
                      alt={post.caption || 'Photo'}
                      className="w-full h-full object-cover"
                    loading="lazy"/>
                  ) : post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption || 'Photo'}
                      className="w-full h-full object-cover"
                    loading="lazy"/>
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
                        navigate(`/storyboards`);
                      }
                    }}
                  >
                    {post.media_type === 'photo' && post.image_urls && post.image_urls.length > 0 ? (
                      <img
                        src={post.image_urls[0]}
                        alt={post.caption || 'Photo'}
                        className="w-full h-full object-cover"
                      loading="lazy"/>
                    ) : post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.caption || 'Content'}
                        className="w-full h-full object-cover"
                      loading="lazy"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                        {post.media_type === 'video' ? (
                          <Video className="h-8 w-8 text-white" />
                        ) : (
                          <Grid3X3 className="h-8 w-8 text-white" />
                        )}
                      </div>
                    )}
                    
                    {/* Music Icon Overlay */}
                    {post.music_track_id && (
                      <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm rounded-full p-1.5">
                        <Music2 className="h-4 w-4 text-white" />
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
              {/* CollaborationInvites component removed */}
              <div className="p-4 text-sm text-muted-foreground">
                Collaboration feature has been removed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Friends Manager */}
      <CloseFriendsManager
        open={closeFriendsOpen}
        onOpenChange={setCloseFriendsOpen}
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
        musicTrackId={selectedPost?.music_track_id}
        musicTrackName={selectedPost?.music_track_name}
        musicTrackArtist={selectedPost?.music_track_artist}
        musicPreviewUrl={selectedPost?.music_preview_url}
        musicAlbumArt={selectedPost?.music_album_art}
        musicService={selectedPost?.music_service}
      />

      {/* ContentUploadModal removed - feature consolidated into moment creation */}

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

      {/* Profile Photo Modal */}
      <ProfilePhotoModal
        open={profilePhotoModalOpen}
        onOpenChange={setProfilePhotoModalOpen}
        userId={user?.id || ''}
        currentAvatarUrl={profile?.avatar_url || null}
        onSuccess={fetchProfile}
      />


      {/* Spacer for mobile nav to prevent overlap */}
      <div className="h-16 md:hidden" aria-hidden />

      {/* Bottom Navigation Bar - Mobile Only, compact */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t md:hidden pb-safe">
        <div className="flex items-center justify-around py-1.5 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-accent h-12 w-12 rounded-lg [&>svg]:text-[#BFAD72]"
            aria-label="Home"
          >
            <Home className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/marketplace')}
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
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) navigate(`/creator/${user.id}`);
            }}
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
