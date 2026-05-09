import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Heart, Send, Loader2, ChevronLeft, ChevronRight, MessageCircle, Share2, Instagram, MessageSquare, Volume2, VolumeX, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { CommentsSheet } from "@/components/CommentsSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEngagementFraud } from "@/hooks/useEngagementFraud";

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
  musicTrackId?: string;
  musicTrackName?: string;
  musicTrackArtist?: string;
  musicPreviewUrl?: string;
  musicAlbumArt?: string;
  musicService?: string;
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
  userAvatar,
  musicTrackId,
  musicTrackName,
  musicTrackArtist,
  musicPreviewUrl,
  musicAlbumArt,
  musicService,
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const { musicVolume } = useUserPreferences();

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
        if (unsubscribe) {
          unsubscribe();
        }
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

  // Audio playback management
  useEffect(() => {
    if (open && musicPreviewUrl) {
      const audio = new Audio(musicPreviewUrl);
      audio.volume = 0.7;
      audio.loop = true;
      audioRef.current = audio;
      
      audio.play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch((error) => {
          console.warn('Unable to start carousel audio preview', error);
          setIsAudioPlaying(false);
        });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsAudioPlaying(false);
      }
    };
  }, [open, musicPreviewUrl]);

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

  const { checkEngagement } = useEngagementFraud();

  const handleLike = async () => {
    if (!postId || !user) {
      toast.error("Sign in to like posts");
      return;
    }
    
    // Check fraud prevention before liking (not for unlikes)
    if (!isLiked) {
      const allowed = await checkEngagement('like');
      if (!allowed) return;
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

    // Check fraud prevention before commenting
    const allowed = await checkEngagement('comment');
    if (!allowed) return;

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
        ...(musicTrackId && {
          music_track_id: musicTrackId,
          music_track_name: musicTrackName,
          music_track_artist: musicTrackArtist,
          music_preview_url: musicPreviewUrl,
          music_album_art: musicAlbumArt,
          music_service: musicService,
        }),
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
    } catch (error) {
      console.warn('Native share failed for Instagram', error);
    }

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
    } catch (error) {
      console.warn('Native share failed for TikTok', error);
    }

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
      <DialogContent className="w-full h-full max-w-full p-0 m-0 bg-black border-none [&>button]:hidden md:max-w-[90vw] md:max-h-[90vh] md:h-auto overflow-hidden">
        {/* Mobile Layout (Vertical) */}
        <div className="relative w-full h-full flex flex-col safe-top safe-bottom md:hidden">
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
                    loading="lazy"/>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShareToMoment}
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <Share2 className="h-8 w-8" />
                </Button>
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

            {/* Music Track Info - Mobile */}
            {musicTrackId && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                  {musicAlbumArt && (
                    <img 
                      src={musicAlbumArt} 
                      alt="Album art"
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    loading="lazy"/>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {musicTrackName || 'Unknown Track'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {musicTrackArtist || 'Unknown Artist'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (audioRef.current) {
                        if (isAudioPlaying) {
                          audioRef.current.pause();
                          setIsAudioPlaying(false);
                        } else {
                          audioRef.current.play();
                          setIsAudioPlaying(true);
                        }
                      }
                    }}
                    className="flex-shrink-0"
                  >
                    {isAudioPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                </div>
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

        {/* Desktop Layout (Horizontal - Instagram style) */}
        <div className="hidden md:flex h-[90vh] w-full bg-background">
          {/* Left side - Image */}
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <Carousel
              opts={{ startIndex, loop: false, dragFree: false, align: 'center', containScroll: 'trimSnaps' }}
              setApi={setCarouselApi}
              className="w-full h-full"
            >
              <CarouselContent className="h-full -ml-0">
                {images.map((img, idx) => (
                  <CarouselItem key={idx} className="h-full flex items-center justify-center pl-0 p-4">
                    <img 
                      src={img} 
                      alt={`Photo ${idx + 1}`} 
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                    loading="lazy"/>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Navigation arrows */}
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

              {/* Photo counter */}
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

          {/* Right side - Instagram-style sidebar */}
          <div className="w-[400px] border-l border-border flex flex-col">
            {/* Header with user info */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">{username}</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Caption */}
            {caption && (
              <div className="p-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold mr-2">{username}</span>
                      {caption}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Music Track Info - Desktop */}
            {musicTrackId && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2">
                  {musicAlbumArt && (
                    <img 
                      src={musicAlbumArt} 
                      alt="Album art"
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    loading="lazy"/>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {musicTrackName || 'Unknown Track'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {musicTrackArtist || 'Unknown Artist'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (audioRef.current) {
                        if (isAudioPlaying) {
                          audioRef.current.pause();
                          setIsAudioPlaying(false);
                        } else {
                          audioRef.current.play();
                          setIsAudioPlaying(true);
                        }
                      }
                    }}
                    className="flex-shrink-0"
                  >
                    {isAudioPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Comments section - Scrollable */}
            <ScrollArea className="flex-1 px-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold mr-2">{comment.profiles?.username}</span>
                          {comment.comment_text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Action buttons */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-4 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <Heart 
                    className={`h-6 w-6 transition-transform active:scale-110 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShareToMoment}
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>

              {/* Like count */}
              {likeCount > 0 && (
                <p className="text-sm font-semibold mb-3">
                  {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
                </p>
              )}

              {/* Add comment input */}
              <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border-none focus-visible:ring-0 px-0"
                  disabled={submitting || !user}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={!newComment.trim() || submitting}
                  className="text-[#BFAD72] hover:text-[#BFAD72]/80 hover:bg-transparent p-0 h-auto font-semibold"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Comments sheet for mobile */}
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
