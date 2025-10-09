import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, MoreVertical, MapPin, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CommentsSheet } from "./CommentsSheet";
import { renderTextWithHashtags } from "@/lib/hashtagHelpers";

interface TravelVideoCardProps {
  post: {
    id: string;
    user_id: string;
    video_url?: string;
    embed_url?: string;
    embed_platform?: string;
    original_creator?: string;
    thumbnail_url: string | null;
    caption: string | null;
    location: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    share_count?: number;
    is_featured?: boolean;
    profiles?: {
      username: string | null;
      avatar_url: string | null;
      is_verified?: boolean;
    };
  };
  isActive: boolean;
  onUpdate: () => void;
  layout?: 'mobile' | 'desktop';
}

const TravelVideoCard = ({ post, isActive, onUpdate, layout = 'mobile' }: TravelVideoCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasViewed, setHasViewed] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count);

  useEffect(() => {
    checkIfLiked();
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
        .single();
      
      setIsLiked(!!data);
    } catch (error) {
      // Not liked
    }
  };

  const trackView = async () => {
    try {
      await supabase.from('post_views').insert({
        post_id: post.id,
        user_id: user?.id || null,
      });

      await supabase
        .from('travel_posts')
        .update({ view_count: post.view_count + 1 })
        .eq('id', post.id);
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
    const url = `${window.location.origin}/post/${post.id}`;
    
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
          title: post.caption || 'Check out this travel video',
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
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/travel-profile/${post.user_id}`)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
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
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
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
            <video
              ref={videoRef}
              src={post.video_url}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={false}
              crossOrigin="anonymous"
              onLoadedData={() => setVideoLoading(false)}
              onError={() => {
                setVideoError(true);
                setVideoLoading(false);
              }}
            />
          ) : post.embed_url ? (
            getEmbedComponent()
          ) : null}
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
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
            <button
              onClick={handleShare}
              className="transition-transform active:scale-90"
            >
              <Share2 className="h-6 w-6" />
            </button>
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
                {renderTextWithHashtags(post.caption, (hashtag) => 
                  navigate(`/search?q=${encodeURIComponent(`#${hashtag}`)}&tab=posts`)
                ).map((part, idx) => 
                  typeof part === 'string' ? part : <span key={idx} {...part.props}>{part.props.children}</span>
                )}
              </span>
            )}
          </div>

          {/* Original Creator Attribution */}
          {post.original_creator && (
            <div className="text-xs text-muted-foreground">
              Original: {post.original_creator}
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
      
      {/* Video or Embed */}
      {post.video_url ? (
        <video
          ref={videoRef}
          src={post.video_url}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          muted={false}
          crossOrigin="anonymous"
          onLoadedData={() => setVideoLoading(false)}
          onError={() => {
            setVideoError(true);
            setVideoLoading(false);
          }}
        />
      ) : post.embed_url ? (
        getEmbedComponent()
      ) : null}

      {/* Gradient Overlay - Stronger for better readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 text-white">
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
                {renderTextWithHashtags(post.caption, (hashtag) => 
                  navigate(`/search?q=${encodeURIComponent(`#${hashtag}`)}&tab=posts`)
                ).map((part, idx) => 
                  typeof part === 'string' ? part : <span key={idx} {...part.props}>{part.props.children}</span>
                )}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-5 pb-2">
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div className={`rounded-full p-3 shadow-xl ${isLiked ? 'bg-red-500' : 'bg-black/40 backdrop-blur-md'}`}>
                <Heart className={`h-7 w-7 ${isLiked ? 'fill-white' : ''}`} />
              </div>
              <span className="text-sm font-bold drop-shadow-lg">{formatCount(localLikeCount)}</span>
            </button>

            <button
              onClick={() => setCommentsOpen(true)}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div className="rounded-full bg-black/40 backdrop-blur-md p-3 shadow-xl">
                <MessageCircle className="h-7 w-7" />
              </div>
              <span className="text-sm font-bold drop-shadow-lg">{formatCount(localCommentCount)}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div className="rounded-full bg-black/40 backdrop-blur-md p-3 shadow-xl">
                <Share2 className="h-7 w-7" />
              </div>
              <span className="text-xs font-bold drop-shadow-lg">Share</span>
            </button>

            <button className="rounded-full bg-black/40 backdrop-blur-md p-3 shadow-xl transition-transform active:scale-90">
              <MoreVertical className="h-7 w-7" />
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
    </div>
  );
};

export default TravelVideoCard;
