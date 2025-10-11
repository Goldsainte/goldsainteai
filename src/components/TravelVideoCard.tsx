import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, MoreVertical, MapPin, CheckCircle2, ExternalLink, Edit, Volume2, VolumeX, Repeat2, Send, Bookmark, Users, Music, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CommentsSheet } from "./CommentsSheet";
import VideoEditModal from "./VideoEditModal";
import { CollectionSelector } from "./CollectionSelector";
import { CollaboratorSelector } from "./CollaboratorSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { renderTextWithHashtags } from "@/lib/hashtagHelpers";
import { renderTextWithMentionsAndHashtags } from "@/lib/mentionHelpers";
import { useCollections } from "@/hooks/useCollections";
import { SendGiftModal } from "@/components/SendGiftModal";
import { Coins } from "lucide-react";
import { BrandPartnershipProposal } from "./BrandPartnershipProposal";
import { PromotePostModal } from "./PromotePostModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
    is_suggested?: boolean;
    profiles?: {
      username: string | null;
      avatar_url: string | null;
      is_verified?: boolean;
      instagram_username?: string | null;
    };
  };
  isActive: boolean;
  onUpdate: () => void;
  layout?: 'mobile' | 'desktop';
  isMuted: boolean;
  onToggleMute: () => void;
}

const TravelVideoCard = ({ post, isActive, onUpdate, layout = 'mobile', isMuted, onToggleMute }: TravelVideoCardProps) => {
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
  const [collaboratorSelectorOpen, setCollaboratorSelectorOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Array<{id: string, username: string | null, avatar_url: string | null}>>([]);
  const [partnership, setPartnership] = useState<any>(null);
  const { collections, createCollection, addPostToCollection } = useCollections();
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [partnershipProposalOpen, setPartnershipProposalOpen] = useState(false);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const isOwnPost = user?.id === post.user_id;

  useEffect(() => {
    console.log('Collection selector open state:', collectionSelectorOpen);
  }, [collectionSelectorOpen]);

  useEffect(() => {
    checkIfLiked();
    checkIfSaved();
    fetchCollaborators();
    fetchPartnership();
  }, [post.id]);

  useEffect(() => {
    if (isActive && videoRef.current && post.video_url) {
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
      
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
      console.log('Attempting quick save...');
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
  const fetchCollaborators = async () => {
    try {
      const { data } = await supabase
        .from('post_collaborators')
        .select('collaborator_id')
        .eq('post_id', post.id)
        .eq('status', 'accepted');
      
      if (!data || data.length === 0) {
        setCollaborators([]);
        return;
      }
      
      const collaboratorIds = data.map(c => c.collaborator_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', collaboratorIds);
      
      setCollaborators(profiles || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

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

      if (error) {
        console.error("Error fetching partnership:", error);
        return;
      }
      setPartnership(data);
    } catch (error) {
      console.error("Error fetching partnership:", error);
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
        await supabase
          .from('travel_posts')
          .update({ view_count: post.view_count + 1 })
          .eq('id', post.id);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Sign in to like videos');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        setLocalLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('post_likes').insert({
          post_id: post.id,
          user_id: user.id,
        });
        
        setIsLiked(true);
        setLocalLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/travel-feed?postId=${post.id}`;
    
    // Track share
    try {
      await supabase
        .from('travel_posts')
        .update({ share_count: (post.share_count || 0) + 1 })
        .eq('id', post.id);
    } catch (error) {
      console.error('Error tracking share:', error);
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.caption || 'Check out this journey',
          url: url,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleShareToTikTok = async () => {
    const url = `${window.location.origin}/travel-feed?postId=${post.id}`;
    const caption = post.caption || 'Check out this journey';
    
    // Track share
    try {
      await supabase
        .from('travel_posts')
        .update({ share_count: (post.share_count || 0) + 1 })
        .eq('id', post.id);
    } catch (error) {
      console.error('Error tracking share:', error);
    }

    // Try to open TikTok app first
    const tiktokAppUrl = `tiktok://share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(caption)}`;
    
    // Fallback to TikTok web upload
    const tiktokWebUrl = `https://www.tiktok.com/upload?share_url=${encodeURIComponent(url)}`;
    
    // Try app first, then fallback to web
    window.location.href = tiktokAppUrl;
    
    // Set timeout to check if app opened, otherwise open web
    setTimeout(() => {
      window.open(tiktokWebUrl, '_blank');
    }, 1500);
    
    toast.success('Opening TikTok...');
  };

  const handleShareToInstagram = async () => {
    const url = `${window.location.origin}/travel-feed?postId=${post.id}`;
    
    // Track share
    try {
      await supabase
        .from('travel_posts')
        .update({ share_count: (post.share_count || 0) + 1 })
        .eq('id', post.id);
    } catch (error) {
      console.error('Error tracking share:', error);
    }

    // Try to open Instagram app
    const instagramAppUrl = post.video_url 
      ? `instagram://story-camera`
      : `instagram://library?AssetPath=${encodeURIComponent(post.video_url || post.thumbnail_url || '')}`;
    
    // Fallback to Instagram web
    const instagramWebUrl = `https://www.instagram.com/create/story/`;
    
    // Try app first, then fallback to web
    window.location.href = instagramAppUrl;
    
    // Set timeout to check if app opened, otherwise open web
    setTimeout(() => {
      window.open(instagramWebUrl, '_blank');
    }, 1500);
    
    toast.success('Opening Instagram...');
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
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
      <div className="bg-card rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div 
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => navigate(`/travel-profile/${post.user_id}`)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm">{post.profiles?.username || 'Anonymous'}</p>
                {post.profiles?.is_verified && (
                  <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500" />
                )}
              </div>
              {post.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {post.location}
                </div>
              )}
              {post.is_suggested && (
                <p className="text-xs text-muted-foreground font-medium">Suggested for you</p>
              )}
            </div>
          </div>
          {isOwnPost ? (
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
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPartnershipProposalOpen(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Propose Partnership
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Video/Image */}
        <div className="relative bg-black aspect-square">
          {videoLoading && !videoError && post.video_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-sm">Loading video...</div>
            </div>
          )}
          
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
              <div className="text-center space-y-2 p-4">
                <p className="text-white text-sm">Video unavailable</p>
              </div>
            </div>
          )}
          
          {post.video_url ? (
            <>
              <video
                ref={videoRef}
                src={post.video_url}
                poster={post.thumbnail_url || undefined}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={isMuted}
                preload="metadata"
                crossOrigin="anonymous"
                onLoadedData={() => setVideoLoading(false)}
                onCanPlay={() => setVideoLoading(false)}
                onError={() => {
                  setVideoError(true);
                  setVideoLoading(false);
                }}
              />
              {/* Mute Button */}
              <button
                onClick={onToggleMute}
                className="absolute top-4 right-4 rounded-full bg-black/40 backdrop-blur-md p-2 shadow-xl transition-all duration-200 hover:bg-black/60 hover:scale-110"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>
            </>
          ) : post.embed_url ? (
            getEmbedComponent()
          ) : post.image_urls && post.image_urls.length > 0 ? (
            <div 
              className="relative w-full h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPhotoIndex(0);
                setPhotoGalleryOpen(true);
              }}
            >
              <img 
                src={post.image_urls[0]} 
                alt="Post content"
                className="w-full h-full object-contain bg-black"
              />
              {post.image_urls.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                  1 / {post.image_urls.length}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="transition-transform active:scale-90"
              >
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button
                onClick={() => setCommentsOpen(true)}
                className="transition-transform active:scale-90"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="transition-transform active:scale-90">
                    <Share2 className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareToTikTok}>
                    <Music className="h-4 w-4 mr-2" />
                    Share to TikTok
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareToInstagram}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Share to Instagram
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveClick}
                className="transition-transform active:scale-90"
              >
                <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setGiftModalOpen(true)}
                className="transition-transform active:scale-90"
                data-tour="send-gift-post"
              >
                <Coins className="h-6 w-6 text-yellow-500" />
              </button>
              {isOwnPost && (
                <button
                  onClick={() => setPromoteModalOpen(true)}
                  className="transition-transform active:scale-90"
                  title="Promote this post"
                >
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </button>
              )}
            </div>
          </div>

          {/* Like count */}
          <div className="text-sm font-semibold">
            {formatCount(localLikeCount)} likes
          </div>

          {/* Caption */}
          <div className="text-sm">
            <span className="font-semibold mr-2">{post.profiles?.username || 'Anonymous'}</span>
            {post.caption && (
              <span>
                {renderTextWithMentionsAndHashtags(
                  post.caption,
                  (username) => navigate(`/travel-profile?user=${username}`),
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
                            navigate(`/travel-profile?user=${part.value}`);
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

          {/* Collaborators */}
          {collaborators.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">with</span>
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map(collab => (
                  <Avatar
                    key={collab.id}
                    className="h-6 w-6 border-2 border-card cursor-pointer"
                    onClick={() => navigate(`/travel-profile/${collab.id}`)}
                  >
                    <AvatarImage src={collab.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {collab.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-muted-foreground font-medium">
                {collaborators.map(c => c.username).join(', ')}
              </span>
            </div>
          )}

          {/* View all comments */}
          {localCommentCount > 0 && (
            <button 
              onClick={() => setCommentsOpen(true)}
              className="text-sm text-muted-foreground"
            >
              View all {formatCount(localCommentCount)} comments
            </button>
          )}
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
                />

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
                      />
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
      
      {/* Partnership Label */}
      {partnership && (
        <div className="absolute top-4 left-4 right-4 z-10 px-3 py-1.5 bg-background/95 backdrop-blur-sm rounded-lg text-xs font-medium border shadow-sm">
          Paid Partnership with @{partnership.brand.username}
        </div>
      )}

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
            muted={isMuted}
            preload="metadata"
            crossOrigin="anonymous"
            onLoadedData={() => setVideoLoading(false)}
            onCanPlay={() => setVideoLoading(false)}
            onError={() => {
              setVideoError(true);
              setVideoLoading(false);
            }}
          />
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="absolute top-20 right-4 rounded-full bg-black/40 backdrop-blur-md p-3 shadow-xl transition-all duration-200 hover:bg-black/60 hover:scale-110 z-10"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-6 w-6 text-white" />
            ) : (
              <Volume2 className="h-6 w-6 text-white" />
            )}
          </button>
        </>
      ) : post.embed_url ? (
        getEmbedComponent()
      ) : post.image_urls && post.image_urls.length > 0 ? (
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentPhotoIndex(0);
            setPhotoGalleryOpen(true);
          }}
        >
          <img 
            src={post.image_urls[0]} 
            alt="Post content"
            className="w-full h-full object-contain bg-black"
          />
          {post.image_urls.length > 1 && (
            <div className="absolute top-24 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium z-10">
              1 / {post.image_urls.length}
            </div>
          )}
        </div>
      ) : null}

      {/* Gradient Overlay - Stronger for better readability */}
      <div className="absolute inset-x-0 bottom-24 md:bottom-0 h-2/5 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* Bottom Content */}
      <div className="absolute left-0 right-0 bottom-24 md:bottom-6 p-4 pb-safe text-white">
        <div className="flex items-end justify-between gap-4">
          {/* User Info & Caption */}
          <div className="flex-1 space-y-3 max-w-[70%]">
            {/* Featured Badge */}
            {post.is_featured && (
              <Badge className="mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-sm font-bold">
                ⭐ Featured
              </Badge>
            )}

            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/travel-profile/${post.user_id}`)}
            >
              <Avatar className="h-11 w-11 border-2 border-white ring-2 ring-black/20">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-base drop-shadow-lg">{post.profiles?.username || 'Anonymous'}</p>
                  {post.profiles?.is_verified && (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500 drop-shadow-lg" />
                  )}
                </div>
                {post.location && (
                  <div className="flex items-center gap-1 text-sm text-white drop-shadow-md">
                    <MapPin className="h-3.5 w-3.5" />
                    {post.location}
                  </div>
                )}
                {post.is_suggested && (
                  <p className="text-xs text-white/80 drop-shadow-md font-medium">
                    Suggested for you
                  </p>
                )}
              </div>
            </div>

            {/* Original Creator Attribution */}
            {post.original_creator && (
              <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
                <p className="text-xs font-medium">
                  Original: {post.original_creator}
                </p>
              </div>
            )}

            {post.caption && (
              <p className="text-base leading-relaxed drop-shadow-lg font-medium">
                {renderTextWithMentionsAndHashtags(
                  post.caption,
                  (username) => navigate(`/travel-profile?user=${username}`),
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
                            navigate(`/travel-profile?user=${part.value}`);
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

          {/* Action Buttons - Only essential ones for mobile */}
          <div className="flex flex-col items-center gap-6 pb-32">
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-110"
            >
              <Heart className={`h-7 w-7 text-white drop-shadow-2xl ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-xs font-bold drop-shadow-2xl">{formatCount(localLikeCount)}</span>
            </button>

            <button
              onClick={() => setCommentsOpen(true)}
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-110"
            >
              <MessageCircle className="h-7 w-7 text-white drop-shadow-2xl" />
              <span className="text-xs font-bold drop-shadow-2xl">{formatCount(localCommentCount)}</span>
            </button>

            <button
              onClick={handleSaveClick}
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-110"
            >
              <Bookmark className={`h-7 w-7 text-white drop-shadow-2xl ${isSaved ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={() => setGiftModalOpen(true)}
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-110"
              data-tour="send-gift-post"
            >
              <Coins className="h-7 w-7 text-[#BFAD72] drop-shadow-2xl" />
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
        onSuccess={onUpdate}
      />

      {/* Collection Selector */}
      <CollectionSelector
        postId={post.id}
        open={collectionSelectorOpen}
        onOpenChange={setCollectionSelectorOpen}
      />
      <CollaboratorSelector
        postId={post.id}
        open={collaboratorSelectorOpen}
        onOpenChange={setCollaboratorSelectorOpen}
      />
      <SendGiftModal
        open={giftModalOpen}
        onOpenChange={setGiftModalOpen}
        recipientId={post.user_id}
        postId={post.id}
      />

      {/* Brand Partnership Proposal Modal */}
      {!isOwnPost && (
        <BrandPartnershipProposal
          open={partnershipProposalOpen}
          onOpenChange={setPartnershipProposalOpen}
          creatorId={post.user_id}
          postId={post.id}
        />
      )}

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
              />

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
                    />
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
