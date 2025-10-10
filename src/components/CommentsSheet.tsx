import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { renderTextWithMentionsAndHashtags } from "@/lib/mentionHelpers";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    instagram_username?: string | null;
  };
}

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentsSheet = ({ open, onOpenChange, postId, onCommentAdded }: CommentsSheetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchComments();
      subscribeToComments();
    }
  }, [open, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, comment_text, created_at, user_id")
        .eq("post_id", postId)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url, instagram_username")
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
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToComments = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) {
      toast.error("Please sign in to comment");
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
      onCommentAdded?.();
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.profiles?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {comment.profiles?.username || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    {renderTextWithMentionsAndHashtags(
                      comment.comment_text,
                      (username) => {
                        navigate(`/travel-profile?user=${username}`);
                        onOpenChange(false);
                      },
                      (hashtag) => {
                        navigate(`/search?q=${encodeURIComponent(`#${hashtag}`)}&tab=posts`);
                        onOpenChange(false);
                      },
                      comment.profiles?.instagram_username || undefined
                    ).map((part, idx) => {
                      if (typeof part === 'string') return part;
                      return (
                        <button
                          key={part.key}
                          onClick={() => {
                            if (part.type === 'mention') {
                              if ('isInstagram' in part && part.isInstagram) {
                                window.open(`https://instagram.com/${part.value}`, '_blank');
                              } else {
                                navigate(`/travel-profile?user=${part.value}`);
                                onOpenChange(false);
                              }
                            } else {
                              navigate(`/search?q=${encodeURIComponent(`#${part.value}`)}&tab=posts`);
                              onOpenChange(false);
                            }
                          }}
                          className={part.type === 'mention' ? 'font-semibold text-primary hover:underline' : 'text-primary hover:underline'}
                        >
                          {part.type === 'mention' ? `@${part.value}` : `#${part.value}`}
                        </button>
                      );
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... Use @username to mention"
            disabled={submitting || !user}
            className="flex-1"
          />
          <Button type="submit" disabled={submitting || !newComment.trim()} size="icon">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
