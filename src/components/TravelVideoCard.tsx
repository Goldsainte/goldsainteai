import { useState, useEffect, useRef, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, MoreVertical, MapPin, ExternalLink, Edit, Volume2, VolumeX, Repeat2, Send, Bookmark, Users, Music2, TrendingUp, Play, Pause, Trash2, Gift } from "lucide-react";
import { InstagramVerifiedBadge } from "@/components/badges/InstagramVerifiedBadge";
import { BusinessVerifiedBadge } from "@/components/badges/BusinessVerifiedBadge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CommentsSheet } from "./CommentsSheet";
import VideoEditModal from "./VideoEditModal";
import { CollectionSelector } from "./CollectionSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { renderTextWithHashtags } from "@/lib/hashtagHelpers";
import { renderTextWithMentionsAndHashtags } from "@/lib/mentionHelpers";
import { useCollections } from "@/hooks/useCollections";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { SendGiftModal } from "@/components/SendGiftModal";
import { Coins } from "lucide-react";
import { PromotePostModal } from "./PromotePostModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { OptimizedImage } from "./OptimizedImage";
import { useEngagementFraud } from "@/hooks/useEngagementFraud";

interface TravelVideoCardProps {
  post: {
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
    native_video_volume?: number;
    music_volume?: number;
    profiles?: {
      id?: string;
      username: string | null;
      avatar_url: string | null;
      is_verified?: boolean;
      is_business_verified?: boolean;
      instagram_username?: string | null;
    };
  };
  isActive: boolean;
  onUpdate: () => void;
  layout?: 'mobile' | 'desktop';
  isMuted: boolean;
  onToggleMute: () => void;
  hasInteracted?: boolean;
}

const TravelVideoCard = ({ post, isActive, onUpdate, layout = 'mobile', isMuted, onToggleMute, hasInteracted = false }: TravelVideoCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasViewed, setHasViewed] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count);
  const [editOpen, setEditOpen] = useState(false);
  const [collectionSelectorOpen, setCollectionSelectorOpen] = useState(false);
  const { collections, createCollection, addPostToCollection } = useCollections();
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nativeVolume, setNativeVolume] = useState(post.native_video_volume || 100);
  const [musicVolume, setMusicVolume] = useState(post.music_volume || 80);
  const userInitiatedPlay = useRef(false);
  const pauseDebounceTimer = useRef<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const [dragStart, setDragStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [wasSwipe, setWasSwipe] = useState(false);
  const { nativeVideoVolume: userNativeVolume, musicVolume: userMusicVolume } = useUserPreferences();

  // Apply user preferences to volume when they change
  useEffect(() => {
    setNativeVolume(userNativeVolume);
    setMusicVolume(userMusicVolume);
  }, [userNativeVolume, userMusicVolume]);

  // Reset touch state on mount/unmount
  useEffect(() => {
    return () => {
      setTouchStartX(0);
      setTouchStartY(0);
      setTouchEndX(0);
      setTouchEndY(0);
      setDragStart(0);
      setIsDragging(false);
      setWasSwipe(false);
    };
  }, []);

  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  const isOwnPost = user?.id === post.user_id;

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Delete this Sainte?',
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('travel_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast.success('Sainte deleted successfully');
      onUpdate(); // Refresh the feed
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete Sainte');
    }
  };

  useEffect(() => {
    checkIfLiked();
    checkIfSaved();
    // fetchCollaborators removed - feature deleted
    fetchPartnership();
    checkIfFollowing();
  }, [post.id]);

  useEffect(() => {
    if (isActive && videoRef.current && post.video_url) {
      videoRef.current.play().catch(() => {});
      
      if (!hasViewed) {
        const viewTimer = setTimeout(() => {
          trackView();
          setHasViewed(true);
        }, 3000);
        return () => clearTimeout(viewTimer);
      }
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : nativeVolume / 100;
    }
  }, [nativeVolume, isMuted]);

  // Reset photo index when post changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [post.id]);

  // Instagram-style autoplay audio effect
  useEffect(() => {
    if (!audioRef.current || !post.music_preview_url) return;

    const audio = audioRef.current;

    const handleStalled = () => {
      if (isActive && !isMuted && hasInteracted) {
        audio.play().catch(console.error);
      }
    };

    const handleSuspended = () => {
      if (isActive && !isMuted && hasInteracted) {
        audio.play().catch(console.error);
      }
    };

    const handleEnded = () => {
      setAudioPlaying(false);
      userInitiatedPlay.current = false;
    };

    const handlePlay = () => {
      // Isolate playback: pause all other audio
      document.querySelectorAll('audio[data-post-id]').forEach((otherAudio) => {
        if (otherAudio !== audio && !(otherAudio as HTMLAudioElement).paused) {
          (otherAudio as HTMLAudioElement).pause();
        }
      });
    };

    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspended);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);

    // Active-first autoplay logic
    audio.volume = musicVolume / 100;
    
    if (!isActive || isMuted) {
      // Always pause when not active or muted
      audio.pause();
      setAudioPlaying(false);
    } else if (isActive && !isMuted && hasInteracted) {
      // Auto-play when active, unmuted, and user has interacted
      audio.play()
        .then(() => setAudioPlaying(true))
        .catch(console.error);
    }

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspended);
      audio.removeEventListener('play', handlePlay);
    };
  }, [isActive, isMuted, post.music_preview_url, hasInteracted, musicVolume]);

  const checkIfLiked = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking if liked:', error);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;
    
    try {
      const { data: collectionsData } = await supabase
        .from('post_collections')
        .select('id')
        .eq('user_id', user.id);
      
      if (!collectionsData || collectionsData.length === 0) {
        setIsSaved(false);
        return;
      }
      
      const collectionIds = collectionsData.map(c => c.id);
      
      const { data: savedData } = await supabase
        .from('collection_posts')
        .select('id')
        .eq('post_id', post.id)
        .in('collection_id', collectionIds)
        .maybeSingle();
      
      setIsSaved(!!savedData);
    } catch (error) {
      console.error('Error checking if saved:', error);
    }
  };
  const handleSaveClick = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    try {
      // If already saved, unsave it
      if (isSaved) {
        const { data: collectionsData } = await supabase
          .from('post_collections')
          .select('id')
          .eq('user_id', user.id);
        
        if (collectionsData) {
          const collectionIds = collectionsData.map(c => c.id);
          await supabase
            .from('collection_posts')
            .delete()
            .eq('post_id', post.id)
            .in('collection_id', collectionIds);
          
          setIsSaved(false);
          toast.success('Removed from Saved');
        }
        return;
      }

      // Save the post
      let target: any = collections?.find((c) => c.name?.toLowerCase?.() === 'saved');
      if (!target) {
        const created: any = await createCollection('Saved', 'Your saved items', true);
        if (created) target = created;
      }
      if (target) {
        await addPostToCollection(target.id, post.id);
        setIsSaved(true);
        toast.success('Saved to "Saved"');
      } else {
        toast.error('Could not create/find a collection');
      }
    } catch (e) {
      console.error('Save/unsave failed', e);
      toast.error('Failed to update save status');
    }
  };
  // Collaborators feature removed

  const fetchPartnership = async () => {
    try {
      const { data, error } = await supabase
        .from("paid_partnerships")
        .select(`
          id,
          status,
          brand:profiles!paid_partnerships_brand_id_fkey(id, username, avatar_url, is_verified)
        `)
        .eq("post_id", post.id)
        .eq("status", "approved")
        .maybeSingle();

    // Partnership feature removed
    } catch (error) {
      console.error("Error in fetchPartnership:", error);
    }
  };

  const trackView = async () => {
    try {
      // Track the view in post_views table
      await supabase.from('post_views').insert({
        post_id: post.id,
        user_id: user?.id || null,
      });

      // Only increment view_count if viewer is NOT the creator (for earnings calculation)
      if (!isOwnPost) {
        // View count aggregation handled server-side; skipping direct UPDATE to avoid RLS issues
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const checkIfFollowing = async () => {
    if (!user || !post.profiles?.id) return;
    
    try {
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", post.profiles.id)
        .maybeSingle();
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking if following:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !post.profiles?.id) {
      toast.error("Cannot follow this user");
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", post.profiles.id);
        
        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      } else {
        await supabase
          .from("user_follows")
          .insert({
            follower_id: user.id,
            following_id: post.profiles.id
          });
        
        setIsFollowing(true);
        toast.success("Following successfully");
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to update follow status');
    }
  };

  const { checkEngagement } = useEngagementFraud();

  const handleLike = async () => {
    if (!user) {
      toast.error('Sign in to like videos');
      return;
    }

    // Check fraud prevention before liking (not for unlikes)
    if (!isLiked) {
      const allowed = await checkEngagement('like');
      if (!allowed) return;
    }

    // Optimistic update
    const wasLiked = isLiked;
    const prevCount = localLikeCount;
    setIsLiked(!isLiked);
    setLocalLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({
          post_id: post.id,
          user_id: user.id,
        });
        
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error liking post:', error);
      // Revert on error
      setIsLiked(wasLiked);
      setLocalLikeCount(prevCount);
      toast.error(error.message || 'Failed to update like');
    }
  };

  const handleShare = async () => {
    if (!user) {
      toast.error('Sign in to share to your moments');
      navigate('/auth');
      return;
    }

    try {
      // Get the media URL from the post
      const mediaUrl = post.video_url || post.image_urls?.[0] || post.thumbnail_url;
      if (!mediaUrl) {
        toast.error('No media to share');
        return;
      }

      const mediaType = post.video_url ? 'video' : 'image';
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire after 24 hours

      // Create moment record
      const { error: insertError } = await supabase
        .from('moments')
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          caption: post.caption?.substring(0, 200) || null,
          expires_at: expiresAt.toISOString(),
          duration_seconds: mediaType === 'video' ? null : 5,
          ...(post.music_track_id && {
            music_track_id: post.music_track_id,
            music_track_name: post.music_track_name,
            music_track_artist: post.music_track_artist,
            music_preview_url: post.music_preview_url,
            music_album_art: post.music_album_art,
            music_service: post.music_service,
          }),
        });

      if (insertError) throw insertError;

      // Track the share
      try {
        await supabase
          .from('travel_posts')
          .update({ share_count: (post.share_count || 0) + 1 })
          .eq('id', post.id);
      } catch (error) {
        // Ignore share tracking errors
      }

      toast.success('Shared to your moments! 🎉');
    } catch (error: any) {
      console.error('Error sharing to moments:', error);
      toast.error(error.message || 'Failed to share to moments');
    }
  };

  const handleShareToTikTok = async () => {
    // This function is no longer used
  };

  const handleShareToInstagram = async () => {
    // This function is no longer used
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 10000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  const formatTimestamp = (createdAt: string): string => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${diffWeeks}w`;
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (audioPlaying) {
      audioRef.current.pause();
      userInitiatedPlay.current = false;
    } else {
      audioRef.current.play().catch(() => {});
      userInitiatedPlay.current = true;
    }
    setAudioPlaying(!audioPlaying);
  };

  const getEmbedComponent = () => {
    if (!post.embed_url) return null;

    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
        <div className="text-center p-6 space-y-4">
          <ExternalLink className="w-16 h-16 mx-auto text-white" />
          <div>
            <p className="text-white text-lg font-semibold mb-2">
              View on {post.embed_platform}
            </p>
            {post.original_creator && (
              <p className="text-white/80 text-sm mb-4">
                By {post.original_creator}
              </p>
            )}
          </div>
          <Button asChild variant="secondary" size="lg">
            <a href={post.embed_url} target="_blank" rel="noopener noreferrer">
              Open Original
            </a>
          </Button>
        </div>
      </div>
    );
  };

  // Desktop Instagram-style layout
  if (layout === 'desktop') {
    return (
      <div className="bg-card border-b last:border-b-0 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <div 
            className="flex items-center gap-2 cursor-pointer flex-1 hover:opacity-70 transition-opacity"
            onClick={() => navigate(`/creator/${post.user_id}`)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-sm truncate">{post.profiles?.username || 'Anonymous'}</p>
                {post.profiles?.is_business_verified ? (
                  <BusinessVerifiedBadge />
                ) : post.profiles?.is_verified ? (
                  <InstagramVerifiedBadge />
                ) : null}
              </div>
              {post.location && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground leading-tight text-left"
                >
                  <span className="truncate">{post.location}</span>
                </button>
            )}
          </div>
        </div>
          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Sainte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Video/Image - Optimized */}
        <div className="relative bg-black aspect-square">
          {post.image_urls && post.image_urls.length > 0 ? (
            <div className="w-full h-full relative">
              <div
                className="w-full h-full cursor-pointer"
                onClick={() => {
                  setPhotoGalleryOpen(true);
                }}
                onWheel={(e) => {
                  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                  if (Math.abs(delta) < 10 || !post.image_urls || post.image_urls.length < 2) return;
                  e.preventDefault();
                  setCurrentPhotoIndex((prev) =>
                    delta > 0
                      ? (prev + 1) % post.image_urls!.length
                      : (prev - 1 + post.image_urls!.length) % post.image_urls!.length
                  );
                }}
                onMouseDown={(e) => {
                  if (!post.image_urls || post.image_urls.length < 2) return;
                  const startX = e.clientX;
                  let handled = false;
                  const handleMove = (move: MouseEvent) => {
                    const dx = move.clientX - startX;
                    if (!handled && Math.abs(dx) > 30) {
                      handled = true;
                      setCurrentPhotoIndex((prev) =>
                        dx < 0
                          ? (prev + 1) % post.image_urls!.length
                          : (prev - 1 + post.image_urls!.length) % post.image_urls!.length
                      );
                    }
                  };
                  const handleUp = () => {
                    window.removeEventListener('mousemove', handleMove);
                    window.removeEventListener('mouseup', handleUp);
                  };
                  window.addEventListener('mousemove', handleMove);
                  window.addEventListener('mouseup', handleUp);
                }}
              >
                <OptimizedImage
                  src={post.image_urls[currentPhotoIndex]}
                  alt={`${post.caption || 'Post image'} ${currentPhotoIndex + 1}`}
                  aspectRatio="square"
                  priority={isActive}
                  className="w-full h-full"
                />
              </div>
              {post.image_urls.length > 1 && (
                <>
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs z-30 pointer-events-none">
                    {currentPhotoIndex + 1} / {post.image_urls.length}
                  </div>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-30 pointer-events-auto transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIndex((prev) => (prev - 1 + post.image_urls!.length) % post.image_urls!.length);
                    }}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-30 pointer-events-auto transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIndex((prev) => (prev + 1) % post.image_urls!.length);
                    }}
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          ) : post.video_url ? (
            <>
              {videoLoading && !videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                </div>
              )}
              
              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                  <div className="text-center space-y-2 p-4">
                    <p className="text-white text-sm">Video unavailable</p>
                  </div>
                </div>
              )}
              
              {!videoError && (
                <video
                  ref={videoRef}
                  src={post.video_url}
                  poster={post.thumbnail_url || undefined}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  preload="metadata"
                  crossOrigin="anonymous"
                  onLoadedData={() => setVideoLoading(false)}
                  onCanPlay={() => setVideoLoading(false)}
                  onError={() => {
                    setVideoError(true);
                    setVideoLoading(false);
                  }}
                />
              )}
              
              {/* Mute Button */}
              {!videoError && (
                <button
                  onClick={onToggleMute}
                  className="absolute top-4 right-4 rounded-full bg-black/40 backdrop-blur-md p-2 shadow-xl transition-all duration-200 hover:bg-black/60 hover:scale-110 z-20"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5 text-white" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-white" />
                  )}
                </button>
              )}
            </>
          ) : post.embed_url ? (
            getEmbedComponent()
          ) : (post.thumbnail_url) ? (
            <OptimizedImage
              src={post.thumbnail_url}
              alt={post.caption || 'Post'}
              aspectRatio="square"
              priority={isActive}
              className="w-full"
            />
          ) : null}
        </div>

        {/* Actions */}
        <div className="px-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="transition-transform active:scale-90 hover:opacity-70"
              >
                <Heart className={`h-6 w-6 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
              </button>
              <button
                onClick={() => setCommentsOpen(true)}
                className="transition-transform active:scale-90 hover:opacity-70"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <button
                onClick={handleShare}
                className="transition-transform active:scale-90 hover:opacity-70"
              >
                <Send className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveClick}
                className="transition-transform active:scale-90 hover:opacity-70"
              >
                <Bookmark className={`h-6 w-6 transition-all ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setGiftModalOpen(true)}
                className="transition-transform active:scale-90 hover:opacity-70"
                data-tour="send-gift-post"
              >
                <Gift className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Like count */}
          {localLikeCount > 0 && (
            <div className="text-sm font-semibold">
              {formatCount(localLikeCount)} likes
            </div>
          )}

          {/* Caption */}
          <div className="text-xs leading-[14px]">
            <span 
              className="font-semibold cursor-pointer hover:opacity-70 mr-1"
              onClick={() => navigate(`/creator/${post.user_id}`)}
            >
              {post.profiles?.username || 'Anonymous'}
            </span>
            {post.caption && (
              <span>
                {renderTextWithMentionsAndHashtags(
                  post.caption,
                  (username) => navigate(`/creator/${username}`),
                  (hashtag) => navigate(`/search?q=${encodeURIComponent(`#${hashtag}`)}&tab=posts`),
                  post.profiles?.instagram_username || undefined
                ).map((part, idx) => {
                  if (typeof part === 'string') return part;
                  return (
                    <span
                      key={part.key}
                      className="text-primary font-medium cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (part.type === 'mention') {
                          if ('isInstagram' in part && part.isInstagram) {
                            window.open(`https://instagram.com/${part.value}`, '_blank');
                          } else {
                            navigate(`/creator/${part.value}`);
                          }
                        } else {
                          navigate(`/search?q=${encodeURIComponent(`#${part.value}`)}&tab=posts`);
                        }
                      }}
                    >
                      {part.type === 'mention' ? `@${part.value}` : `#${part.value}`}
                    </span>
                  );
                })}
              </span>
            )}
          </div>

          {/* Original Creator Attribution */}
          {post.original_creator && (
            <div className="text-xs text-muted-foreground">
              Original: {post.original_creator}
            </div>
          )}

          {/* Collaborators feature removed */}

          {/* Music Player */}
          {post.music_track_name && (
            <div className="flex items-center gap-2 text-sm bg-background/80 backdrop-blur-sm rounded-lg p-2">
              {post.music_album_art && (
                <img
                  src={post.music_album_art}
                  alt={post.music_track_name}
                  className="w-10 h-10 rounded object-cover"
                loading="lazy"/>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{post.music_track_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {post.music_track_artist}
                </p>
              </div>
              {post.music_preview_url && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleAudio}
                    className="h-8 w-8 shrink-0"
                  >
                    {audioPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <audio
                    ref={(el) => {
                      audioRef.current = el;
                      if (el) {
                        el.volume = musicVolume / 100;
                        el.preload = 'auto';
                        el.crossOrigin = 'anonymous';
                      }
                    }}
                    src={post.music_preview_url}
                    data-post-id={post.id}
                    onEnded={() => {
                      setAudioPlaying(false);
                      userInitiatedPlay.current = false;
                    }}
                  />
                </>
              )}
              <Music2 className="w-4 h-4 text-[#1DB954] shrink-0" />
            </div>
          )}

          {/* View all comments */}
          {localCommentCount > 0 && (
            <button 
              onClick={() => setCommentsOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all {localCommentCount} comments
            </button>
          )}

          {/* Timestamp */}
          <div className="text-[10px] uppercase text-muted-foreground pt-0.5">
            {formatTimestamp(post.created_at)}
          </div>
        </div>

        {/* Comments Sheet */}
        <CommentsSheet
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          postId={post.id}
          onCommentAdded={() => {
            setLocalCommentCount(prev => prev + 1);
            onUpdate();
          }}
        />

        {/* Edit Modal */}
        <VideoEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          postId={post.id}
          currentCaption={post.caption}
          currentLocation={post.location}
          currentThumbnailUrl={post.thumbnail_url}
          videoUrl={post.video_url || null}
          currentNativeVolume={post.native_video_volume}
          currentMusicVolume={post.music_volume}
          currentMusicTrack={
            post.music_track_id
              ? {
                  id: post.music_track_id,
                  name: post.music_track_name || "",
                  artist: post.music_track_artist || "",
                  albumArt: post.music_album_art || "",
                  previewUrl: post.music_preview_url || undefined,
                }
              : undefined
          }
          onSuccess={onUpdate}
        />

        {/* Send Gift Modal */}
        <SendGiftModal
          open={giftModalOpen}
          onOpenChange={setGiftModalOpen}
          recipientId={post.user_id}
          postId={post.id}
        />

        {/* Promote Post Modal */}
        <PromotePostModal
          open={promoteModalOpen}
          onOpenChange={setPromoteModalOpen}
          postId={post.id}
        />

        {/* Photo Gallery Modal */}
        {post.image_urls && post.image_urls.length > 0 && (
          <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black">
              <div className="relative w-full h-[95vh] flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                  onClick={() => setPhotoGalleryOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>

                <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-4 py-2 rounded-lg">
                  {currentPhotoIndex + 1} / {post.image_urls.length}
                </div>

                <img 
                  src={post.image_urls[currentPhotoIndex]} 
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                loading="lazy"/>

                {post.image_urls.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                      onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + post.image_urls!.length) % post.image_urls!.length)}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                      onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % post.image_urls!.length)}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
                  {post.image_urls.map((img, idx) => (
                    <div
                      key={idx}
                      className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 flex-shrink-0 ${
                        currentPhotoIndex === idx ? "border-primary" : "border-transparent"
                      }`}
                      onClick={() => setCurrentPhotoIndex(idx)}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      loading="lazy"/>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Mobile TikTok-style layout
  return (
    <div className="relative h-full w-full bg-black">
      {/* Music section removed from top - now integrated in bottom user info */}

      {/* Hidden Audio Element for Music Playback */}
      {post.music_preview_url && (
        <>
          <audio
            ref={(el) => {
              audioRef.current = el;
              if (el) {
                el.volume = musicVolume / 100;
                el.preload = 'auto';
                el.crossOrigin = 'anonymous';
                
                // Handle stalls and resume playback
                el.onstalled = () => {
                  if (el.readyState < 3 && audioPlaying) {
                    setTimeout(() => {
                      el.play().catch(console.error);
                    }, 100);
                  }
                };
                
                el.onsuspend = () => {
                  if (el.readyState < 3 && audioPlaying) {
                    setTimeout(() => {
                      el.play().catch(console.error);
                    }, 100);
                  }
                };
              }
            }}
            src={post.music_preview_url}
            onEnded={() => {
              setAudioPlaying(false);
              userInitiatedPlay.current = false;
            }}
          />
        </>
      )}

      {/* Loading State */}
      {videoLoading && !videoError && post.video_url && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-sm">Loading video...</div>
        </div>
      )}
      
      {/* Error State */}
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
          <div className="text-center space-y-2 p-4">
            <p className="text-white text-sm">Video unavailable</p>
          </div>
        </div>
      )}
      
      {/* Partnership feature removed */}

      {/* Video, Embed, or Photos */}
      {post.video_url ? (
        <>
          <video
            ref={videoRef}
            src={post.video_url}
            poster={post.thumbnail_url || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            playsInline
            webkit-playsinline="true"
            preload="metadata"
            crossOrigin="anonymous"
            onLoadedData={() => setVideoLoading(false)}
            onCanPlay={() => setVideoLoading(false)}
            onError={() => {
              setVideoError(true);
              setVideoLoading(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current.play();
                } else {
                  videoRef.current.pause();
                }
              }
            }}
          />
          {/* More Options Button */}
          <div className="absolute bottom-20 right-4 z-10">
            {isOwnPost ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full bg-black/40 backdrop-blur-md p-3 shadow-xl transition-all duration-200 hover:bg-black/60 hover:scale-110">
                    <MoreVertical className="h-6 w-6 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Sainte
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Sainte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="absolute bottom-36 right-4 rounded-full bg-black/40 backdrop-blur-md p-2 shadow-xl transition-all duration-200 hover:bg-black/60 hover:scale-110 z-10"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-white" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </button>
        </>
      ) : post.embed_url ? (
        <>
          {getEmbedComponent()}
          
          {/* More Options Button for Embed */}
          <div className="absolute bottom-20 right-4 z-10">
            {isOwnPost ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full bg-black/40 backdrop-blur-md p-3 shadow-xl transition-all duration-200 hover:bg-black/60 hover:scale-110">
                    <MoreVertical className="h-6 w-6 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Sainte
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Sainte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </>
      ) : (post.image_urls?.length > 0 || post.thumbnail_url) ? (
        <>
          <div 
            className="absolute inset-0 cursor-grab active:cursor-grabbing select-none touch-pan-y"
            onTouchStart={(e) => {
              setTouchStartX(e.targetTouches[0].clientX);
              setTouchStartY(e.targetTouches[0].clientY);
            }}
            onTouchMove={(e) => {
              setTouchEndX(e.targetTouches[0].clientX);
              setTouchEndY(e.targetTouches[0].clientY);
            }}
            onTouchEnd={(e) => {
              if (!touchStartX || !touchEndX) return;
              
              const deltaX = touchStartX - touchEndX;
              const deltaY = touchStartY - touchEndY;
              
              const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
              
              if (isHorizontalSwipe && Math.abs(deltaX) > 50) {
                e.stopPropagation();
                
                if (deltaX > 0 && post.image_urls) {
                  setCurrentPhotoIndex((prev) => (prev + 1) % post.image_urls!.length);
                  setWasSwipe(true);
                  setTimeout(() => setWasSwipe(false), 100);
                } else if (deltaX < 0 && post.image_urls) {
                  setCurrentPhotoIndex((prev) => (prev - 1 + post.image_urls!.length) % post.image_urls!.length);
                  setWasSwipe(true);
                  setTimeout(() => setWasSwipe(false), 100);
                }
              }
              
              setTouchStartX(0);
              setTouchStartY(0);
              setTouchEndX(0);
              setTouchEndY(0);
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStart(e.clientX);
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
            }}
            onMouseUp={(e) => {
              if (!isDragging) return;
              setIsDragging(false);
              
              const distance = dragStart - e.clientX;
              const isLeftDrag = distance > 50;
              const isRightDrag = distance < -50;
              
              if (isLeftDrag && post.image_urls) {
                setCurrentPhotoIndex((prev) => (prev + 1) % post.image_urls!.length);
                setWasSwipe(true);
                setTimeout(() => setWasSwipe(false), 100);
              }
              
              if (isRightDrag && post.image_urls) {
                setCurrentPhotoIndex((prev) => (prev - 1 + post.image_urls!.length) % post.image_urls!.length);
                setWasSwipe(true);
                setTimeout(() => setWasSwipe(false), 100);
              }
            }}
            onMouseLeave={() => setIsDragging(false)}
          >
            <img 
              src={post.image_urls?.[currentPhotoIndex] || (post.thumbnail_url as string)} 
              alt="Post content"
              className="w-full h-full object-cover bg-black pointer-events-none"
              onClick={(e) => {
                e.stopPropagation();
                if (!wasSwipe) {
                  setPhotoGalleryOpen(true);
                }
              }}
              loading="lazy"
              draggable="false"
            />
            {post.image_urls && post.image_urls.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                {post.image_urls.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentPhotoIndex
                        ? "bg-white scale-110"
                        : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* More Options Button for Photos */}
          <div className="absolute bottom-20 right-4 z-10">
            {isOwnPost ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full bg-black/40 backdrop-blur-md p-3 shadow-xl transition-all duration-200 hover:bg-black/60 hover:scale-110">
                    <MoreVertical className="h-6 w-6 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Sainte
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Sainte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Gradient Overlay - Stronger for better readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Bottom Content */}
      <div className="absolute left-0 right-0 bottom-20 px-3 pb-4 text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-end justify-between gap-4">
          {/* User Info & Caption */}
          <div className="flex-1 space-y-2 max-w-[70%]">
            {/* Featured Badge */}
            {post.is_featured && (
              <Badge className="mb-1 bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-sm font-bold">
                ⭐ Featured
              </Badge>
            )}

            <div className="space-y-1">
              {/* User Info - Single Line */}
              <div className="flex items-center gap-2">
                <Avatar 
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => navigate(`/creator/${post.user_id}`)}
                >
                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <button 
                  onClick={() => navigate(`/creator/${post.user_id}`)}
                  className="font-semibold text-sm hover:opacity-80 transition-opacity"
                >
                  {post.profiles?.username || 'Anonymous'}
                </button>
                
                {!isFollowing && post.profiles?.id !== user?.id && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 px-2 text-xs font-bold hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow();
                    }}
                  >
                    Follow
                  </Button>
                )}
                
                {post.profiles?.is_business_verified ? (
                  <BusinessVerifiedBadge />
                ) : post.profiles?.is_verified ? (
                  <InstagramVerifiedBadge />
                ) : null}
              </div>
              
              {/* Music info - relocated from top */}
              {post.music_track_name && (
                <div className="flex items-center gap-1.5">
                  <Music2 className="h-3 w-3" />
                  <span className="text-xs font-normal truncate">{post.music_track_name}</span>
                </div>
              )}
              
              {/* Original Creator Attribution */}
              {post.original_creator && (
                <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
                  <p className="text-xs font-medium">
                    Original: {post.original_creator}
                  </p>
                </div>
              )}

              {/* Caption */}
              {post.caption && (
                <p className="text-[13px] leading-tight font-normal line-clamp-2">
                  {renderTextWithMentionsAndHashtags(
                    post.caption,
                    (username) => navigate(`/creator/${username}`),
                    (hashtag) => navigate(`/search?q=${encodeURIComponent(`#${hashtag}`)}&tab=posts`),
                    post.profiles?.instagram_username || undefined
                  ).map((part, idx) => {
                    if (typeof part === 'string') return part;
                    return (
                      <span
                        key={part.key}
                        className="text-primary font-medium cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (part.type === 'mention') {
                            if ('isInstagram' in part && part.isInstagram) {
                              window.open(`https://instagram.com/${part.value}`, '_blank');
                            } else {
                              navigate(`/creator/${part.value}`);
                            }
                          } else {
                            navigate(`/search?q=${encodeURIComponent(`#${part.value}`)}&tab=posts`);
                          }
                        }}
                      >
                        {part.type === 'mention' ? `@${part.value}` : `#${part.value}`}
                      </span>
                    );
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - Instagram Reels style */}
          <div className="flex flex-col items-center gap-5 pb-16">
            {/* Like button with "Likes" label */}
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            >
              <Heart className={`h-7 w-7 text-white ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-[11px] font-medium text-white">Likes</span>
              {localLikeCount > 0 && (
                <span className="text-[11px] font-extrabold text-white">{formatCount(localLikeCount)}</span>
              )}
            </button>

            {/* Comment button */}
            <button
              onClick={() => setCommentsOpen(true)}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            >
              <MessageCircle className="h-7 w-7 text-white" />
              {localCommentCount > 0 && (
                <span className="text-[11px] font-extrabold text-white">{formatCount(localCommentCount)}</span>
              )}
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            >
              <Send className="h-7 w-7 text-white" />
              {post.share_count > 0 && (
                <span className="text-[11px] font-extrabold text-white">{formatCount(post.share_count)}</span>
              )}
            </button>

            {/* Save button */}
            <button
              onClick={handleSaveClick}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            >
              <Bookmark className={`h-7 w-7 text-white ${isSaved ? 'fill-white' : ''}`} />
            </button>

            {/* Gift button */}
            <button
              onClick={() => setGiftModalOpen(true)}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
              data-tour="send-gift-post"
            >
              <Gift className="h-7 w-7 text-white" />
            </button>
          </div>

        </div>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={post.id}
        onCommentAdded={() => {
          setLocalCommentCount(prev => prev + 1);
          onUpdate();
        }}
      />

      {/* Edit Modal */}
      <VideoEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        postId={post.id}
        currentCaption={post.caption}
        currentLocation={post.location}
        currentThumbnailUrl={post.thumbnail_url}
        videoUrl={post.video_url || null}
        currentMusicTrack={
          post.music_track_id
            ? {
                id: post.music_track_id,
                name: post.music_track_name || "",
                artist: post.music_track_artist || "",
                albumArt: post.music_album_art || null,
                previewUrl: post.music_preview_url || null,
              }
            : null
        }
        onSuccess={onUpdate}
      />

      {/* Collection Selector */}
      <CollectionSelector
        postId={post.id}
        open={collectionSelectorOpen}
        onOpenChange={setCollectionSelectorOpen}
      />
      <SendGiftModal
        open={giftModalOpen}
        onOpenChange={setGiftModalOpen}
        recipientId={post.user_id}
        postId={post.id}
      />

      {/* Promote Post Modal */}
      <PromotePostModal
        open={promoteModalOpen}
        onOpenChange={setPromoteModalOpen}
        postId={post.id}
      />

      {/* Photo Gallery Modal for Mobile */}
      {post.image_urls && post.image_urls.length > 0 && (
        <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black">
            <div className="relative w-full h-[95vh] flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setPhotoGalleryOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-4 py-2 rounded-lg">
                {currentPhotoIndex + 1} / {post.image_urls.length}
              </div>

              <img 
                src={post.image_urls[currentPhotoIndex]} 
                alt={`Photo ${currentPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              loading="lazy"/>

              {post.image_urls.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                    onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + post.image_urls!.length) % post.image_urls!.length)}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                    onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % post.image_urls!.length)}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
                {post.image_urls.map((img, idx) => (
                  <div
                    key={idx}
                    className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 flex-shrink-0 ${
                      currentPhotoIndex === idx ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setCurrentPhotoIndex(idx)}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    loading="lazy"/>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TravelVideoCard;
