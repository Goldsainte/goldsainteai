import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Heart, Send, Loader2, ChevronLeft, ChevronRight, Smile } from "lucide-react";
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
    if (open) {
      setIndex(startIndex);
      if (postId && user) {
        checkIfLiked();
        fetchComments();
        subscribeToComments();
      }
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
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background border-none [&>button]:hidden">
        <div className="relative w-full h-[95vh] flex flex-col md:flex-row">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 hover:bg-muted rounded-full md:top-4 md:right-4"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Left: Image viewer */}
          <div className="relative flex-1 bg-black flex items-center justify-center">
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

            {/* Clickable image areas for navigation */}
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
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {index + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Right: Comments panel (desktop only) */}
          <div className="hidden md:flex md:w-[400px] bg-background border-l flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback>
                  {username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{username || 'Anonymous'}</p>
              </div>
            </div>

            {/* Comments */}
            <ScrollArea className="flex-1 p-4">
              {/* Caption as first "comment" */}
              {caption && (
                <div className="flex gap-3 mb-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar || undefined} />
                    <AvatarFallback>
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
              )}

              {/* Comments list */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 && !caption ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No comments yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {comment.profiles?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
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
              )}
            </ScrollArea>

            {/* Actions & Comment Input */}
            <div className="border-t">
              <div className="flex items-center gap-4 px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLike}
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <Heart 
                    className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>

              {likeCount > 0 && (
                <p className="px-4 pb-2 font-semibold text-sm">
                  {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
                </p>
              )}

              <form onSubmit={handleSubmitComment} className="flex gap-2 p-4 border-t">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  disabled={submitting || !user}
                  className="flex-1 border-none focus-visible:ring-0 px-0"
                />
                <Button 
                  type="submit" 
                  disabled={submitting || !newComment.trim()}
                  variant="ghost"
                  className="text-primary font-semibold hover:text-primary/80"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCarouselModal;
