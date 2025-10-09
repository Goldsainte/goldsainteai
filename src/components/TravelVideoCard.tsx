import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, MoreVertical, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface TravelVideoCardProps {
  post: {
    id: string;
    user_id: string;
    video_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    location: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    profiles?: {
      username: string | null;
      avatar_url: string | null;
    };
  };
  isActive: boolean;
  onUpdate: () => void;
}

const TravelVideoCard = ({ post, isActive, onUpdate }: TravelVideoCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasViewed, setHasViewed] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  useEffect(() => {
    checkIfLiked();
  }, [post.id]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
      
      // Track view after 3 seconds
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

  return (
    <div className="relative h-full w-full bg-black">
      {/* Loading State */}
      {videoLoading && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-sm">Loading video...</div>
        </div>
      )}
      
      {/* Error State */}
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
          <div className="text-center space-y-2 p-4">
            <p className="text-white text-sm">Video unavailable</p>
            <p className="text-white/60 text-xs">Demo video - replace with real content</p>
          </div>
        </div>
      )}
      
      {/* Video */}
      <video
        ref={videoRef}
        src={post.video_url}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        playsInline
        muted={false}
        crossOrigin="anonymous"
        onLoadedData={() => setVideoLoading(false)}
        onError={() => {
          setVideoError(true);
          setVideoLoading(false);
          console.error('Video failed to load:', post.video_url);
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="flex items-end justify-between gap-4">
          {/* User Info & Caption */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.profiles?.username || 'Anonymous'}</p>
                {post.location && (
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <MapPin className="h-3 w-3" />
                    {post.location}
                  </div>
                )}
              </div>
            </div>
            {post.caption && (
              <p className="text-sm line-clamp-2">{post.caption}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4 pb-2">
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div className={`rounded-full p-2 ${isLiked ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'}`}>
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-white' : ''}`} />
              </div>
              <span className="text-xs font-semibold">{formatCount(localLikeCount)}</span>
            </button>

            <button
              onClick={() => toast.info('Comments coming soon!')}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div className="rounded-full bg-white/20 backdrop-blur-sm p-2">
                <MessageCircle className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold">{formatCount(post.comment_count)}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div className="rounded-full bg-white/20 backdrop-blur-sm p-2">
                <Share2 className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold">Share</span>
            </button>

            <button className="rounded-full bg-white/20 backdrop-blur-sm p-2 transition-transform active:scale-90">
              <MoreVertical className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelVideoCard;
