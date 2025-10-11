import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Heart, Send, Loader2, ChevronLeft, ChevronRight, Smile, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

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
        .is("parent_comment_id", null)
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

  const handleShare = () => {
    if (navigator.share && postId) {
      navigator.share({
        title: caption || 'Check out this post',
        url: `${window.location.origin}/travel-feed?postId=${postId}`
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/travel-feed?postId=${postId}`);
      toast.success("Link copied to clipboard");
    }
  };

  const handlePrevious = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleNext = () => {
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

          {/* Image area */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
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

            {/* Clickable areas for navigation */}
            <div className="relative w-full h-full flex">
              {images.length > 1 && index > 0 && (
                <div 
                  className="absolute left-0 top-0 w-1/3 h-full cursor-pointer z-5"
                  onClick={handlePrevious}
                />
              )}
              
              <img 
                src={images[index]} 
                alt={`Photo ${index + 1}`} 
                className="w-full h-full object-contain"
              />
              
              {images.length > 1 && index < images.length - 1 && (
                <div 
                  className="absolute right-0 top-0 w-1/3 h-full cursor-pointer z-5"
                  onClick={handleNext}
                />
              )}
            </div>

            {/* Photo counter */}
            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      idx === index ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Instagram-style bottom section */}
          <div className="bg-background border-t border-border max-h-[40vh] flex flex-col pb-safe">
            {/* Action bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className="hover:bg-transparent p-0 h-auto flex items-center gap-1.5"
                >
                  <Heart 
                    className={`h-7 w-7 md:h-6 md:w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                  {likeCount > 0 && (
                    <span className="text-sm font-semibold">{likeCount}</span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-transparent p-0 h-auto flex items-center gap-1.5"
                >
                  <MessageCircle className="h-7 w-7 md:h-6 md:w-6" />
                  {comments.length > 0 && (
                    <span className="text-sm font-semibold">{comments.length}</span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <Send className="h-7 w-7 md:h-6 md:w-6" />
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

            {/* Caption */}
            {caption && (
              <div className="px-4 pb-2">
                <p className="text-sm">
                  <span className="font-semibold">{username}</span> {caption}
                </p>
              </div>
            )}

            {/* Always show comments section label */}
            <div className="px-4 pb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">
                Comments {comments.length > 0 && `(${comments.length})`}
              </p>
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground">Be the first to comment</p>
              )}
            </div>

            {/* Comments section - always visible, scrollable */}
            <ScrollArea className="flex-1 px-4 min-h-[120px] max-h-[200px]">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3 pb-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {comment.profiles?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold mr-2">
                            {comment.profiles?.username || "Anonymous"}
                          </span>
                          {comment.comment_text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                  <p className="text-xs text-muted-foreground/70">Be the first to comment!</p>
                </div>
              )}
            </ScrollArea>

            {/* Comment input - Always visible with safe area support */}
            <form onSubmit={handleSubmitComment} className="flex items-center gap-3 px-4 py-3 border-t bg-background sticky bottom-0 pb-safe">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback>
                  {username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "Add a comment..." : "Sign in to comment"}
                disabled={submitting || !user}
                className="flex-1 h-10"
              />
              {newComment.trim() && (
                <Button 
                  type="submit" 
                  disabled={submitting}
                  variant="ghost"
                  size="sm"
                  className="text-primary font-semibold hover:text-primary/80 h-auto p-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              )}
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCarouselModal;
