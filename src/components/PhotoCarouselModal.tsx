import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Heart, Send, Loader2, ChevronLeft, ChevronRight, MessageCircle, Share2, Instagram, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { CommentsSheet } from "@/components/CommentsSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface PhotoCarouselModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  startIndex?: number;
  postId?: string;
  caption?: string | null;
  likeCount?: number;
  username?: string;
  userAvatar?: string;
}

const PhotoCarouselModal = ({ 
  open, 
  onOpenChange, 
  images, 
  startIndex = 0,
  postId,
  caption,
  likeCount: initialLikeCount = 0,
  username,
  userAvatar
}: PhotoCarouselModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(startIndex);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIndex(startIndex);

    if (postId) {
      // Always fetch comments when opening, regardless of auth state
      fetchComments();

      // Subscribe to new comments; cleanup on close/unmount
      const unsubscribe = subscribeToComments();

      // Only check like status if user is signed in
      if (user) {
        checkIfLiked();
      }

      return () => {
        unsubscribe && unsubscribe();
      };
    }
  }, [open, startIndex, postId, user]);

  useEffect(() => {
    if (!carouselApi) return;
    // Sync selected slide with local index state
    setIndex(carouselApi.selectedScrollSnap());
    const onSelect = () => setIndex(carouselApi.selectedScrollSnap());
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect as any);
    };
  }, [carouselApi]);

  const checkIfLiked = async () => {
    if (!postId || !user) return;
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, comment_text, created_at, user_id")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", comment.user_id)
            .maybeSingle();

          return {
            ...comment,
            profiles: profile,
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToComments = () => {
    if (!postId) return;
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleLike = async () => {
    if (!postId || !user) {
      toast.error("Sign in to like posts");
      return;
    }
    
    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !postId) {
      if (!user) toast.error("Please sign in to comment");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("post_comments").insert([{
        post_id: postId,
        user_id: user.id,
        comment_text: newComment.trim(),
      }]);

      if (error) throw error;

      setNewComment("");
      // Ensure UI updates immediately even if realtime is unavailable
      await fetchComments();
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareToMoment = async () => {
    try {
      const current = images[index];
      if (!current) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to share a Moment");
        return;
      }
      const isVideo = /\.(mp4|mov|webm)$/i.test(current);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('moments').insert({
        user_id: user.id,
        media_url: current,
        media_type: isVideo ? 'video' : 'image',
        caption: caption || null,
        expires_at: expiresAt,
      });
      if (error) throw error;
      toast.success("Shared as a Moment! Your ring is live.");
    } catch (err) {
      console.error('Share as Moment failed', err);
      toast.error("Could not share as a Moment");
    }
  };

  const handleShareToInstagram = async () => {
    const shareUrl = `${window.location.origin}/travel-feed?postId=${postId}`;
    try {
      // Try Web Share first
      if (navigator.share) {
        await navigator.share({ title: caption || 'Check this out', url: shareUrl });
        return;
      }
    } catch {}

    // Try app deep link
    const appUrl = 'instagram://app';
    const webUrl = 'https://www.instagram.com/';
    const timer = setTimeout(() => {
      window.open(webUrl, '_blank');
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied. Open Instagram to paste.');
    }, 800);
    window.location.href = appUrl;
    setTimeout(() => clearTimeout(timer), 1500);
  };

  const handleShareToTikTok = async () => {
    const shareUrl = `${window.location.origin}/travel-feed?postId=${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: caption || 'Check this out', url: shareUrl });
        return;
      }
    } catch {}

    const appUrl = 'tiktok://app';
    const webUrl = 'https://www.tiktok.com/upload';
    const timer = setTimeout(() => {
      window.open(webUrl, '_blank');
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied. Open TikTok to paste.');
    }, 800);
    window.location.href = appUrl;
    setTimeout(() => clearTimeout(timer), 1500);
  };

  const handleShareViaText = () => {
    const shareUrl = `${window.location.origin}/travel-feed?postId=${postId}`;
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(ua);
    if (isMobile) {
      const smsUrl = `sms:?body=${encodeURIComponent(`Check this out: ${shareUrl}`)}`;
      window.location.href = smsUrl;
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied. Paste into your messaging app.');
    }
  };

  const handlePrevious = () => {
    if (carouselApi) {
      carouselApi.scrollPrev();
      return;
    }
    if (index > 0) setIndex(index - 1);
  };

  const handleNext = () => {
    if (carouselApi) {
      carouselApi.scrollNext();
      return;
    }
    if (index < images.length - 1) setIndex(index + 1);
  };
  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 bg-black border-none [&>button]:hidden">
        <div className="relative w-full h-full flex flex-col safe-top safe-bottom">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/10 rounded-full"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image area - Swipeable Carousel */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden touch-pan-x">
            <Carousel
              opts={{ startIndex, loop: false, dragFree: false, align: 'center', containScroll: 'trimSnaps' }}
              setApi={setCarouselApi}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <CarouselContent className="h-full -ml-0 select-none">
                {images.map((img, idx) => (
                  <CarouselItem key={idx} className="h-full flex items-center justify-center pl-0 select-none">
                    <img 
                      src={img} 
                      alt={`Photo ${idx + 1}`} 
                      className="w-full h-full object-contain select-none pointer-events-none"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Navigation arrows - only show if multiple images */}
              {images.length > 1 && index > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              
              {images.length > 1 && index < images.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Photo counter dots */}
              {images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === index ? 'bg-white w-2' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </Carousel>
          </div>

          {/* Instagram-style bottom section */}
          <div className="bg-background border-t border-border max-h-[40vh] flex flex-col pb-safe">
            {/* Action bar - Larger touch targets */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className="hover:bg-transparent p-0 h-auto flex items-center gap-2"
                >
                  <Heart 
                    className={`h-8 w-8 transition-transform active:scale-110 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                  {likeCount > 0 && (
                    <span className="text-base font-semibold">{likeCount}</span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentsSheetOpen(true)}
                  className="hover:bg-transparent p-0 h-auto flex items-center gap-2"
                >
                  <MessageCircle className="h-8 w-8" />
                  {comments.length > 0 && (
                    <span className="text-base font-semibold">{comments.length}</span>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent p-0 h-auto"
                    >
                      <Share2 className="h-8 w-8" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={handleShareToMoment} className="cursor-pointer text-[#BFAD72]">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Share as Moment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareToInstagram} className="cursor-pointer text-[#BFAD72]">
                      <Instagram className="mr-2 h-4 w-4" />
                      Share to Instagram
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareToTikTok} className="cursor-pointer text-[#BFAD72]">
                      <Send className="mr-2 h-4 w-4" />
                      Share to TikTok
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareViaText} className="cursor-pointer text-[#BFAD72]">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Share via Text Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Liked by text */}
            {likeCount > 0 && (
              <div className="px-4 pb-2">
                <p className="text-sm">
                  <span className="font-semibold">{likeCount.toLocaleString()}</span> {likeCount === 1 ? 'like' : 'likes'}
                </p>
              </div>
            )}

            {/* Caption */}
            {caption && (
              <div className="px-4 pb-2">
                <p className="text-sm">
                  <span className="font-semibold">{username}</span> {caption}
                </p>
              </div>
            )}

            {/* Comments hidden until user taps the comment button */}
            <div className="px-4 pb-3">
              {comments.length > 0 && (
                <p className="text-sm text-muted-foreground">{comments.length} comment{comments.length === 1 ? '' : 's'}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      {postId && (
        <CommentsSheet
          open={commentsSheetOpen}
          onOpenChange={setCommentsSheetOpen}
          postId={postId}
          onCommentAdded={fetchComments}
        />
      )}
    </Dialog>
  );
};

export default PhotoCarouselModal;
