import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TravelSidebar } from "@/components/TravelSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, MessageCircle, Reply, Star } from "lucide-react";
import { toast } from "sonner";

interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'review';
  post_id?: string;
  moment_id?: string;
  content?: string;
  rating?: number;
  created_at: string;
  post_media_url?: string;
  post_caption?: string;
}

const YourActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("likes");
  const [likes, setLikes] = useState<ActivityItem[]>([]);
  const [comments, setComments] = useState<ActivityItem[]>([]);
  const [replies, setReplies] = useState<ActivityItem[]>([]);
  const [reviews, setReviews] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchActivity();
  }, [user, navigate]);

  const fetchActivity = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch likes
      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select(`
          id,
          created_at,
          post_id,
          travel_posts (
            id,
            media_urls,
            caption
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (likesError) throw likesError;

      const formattedLikes: ActivityItem[] = (likesData || []).map((like: any) => ({
        id: like.id,
        type: 'like' as const,
        post_id: like.post_id,
        created_at: like.created_at,
        post_media_url: like.travel_posts?.media_urls?.[0],
        post_caption: like.travel_posts?.caption,
      }));
      setLikes(formattedLikes);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          id,
          created_at,
          comment_text,
          post_id,
          travel_posts (
            id,
            media_urls,
            caption
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (commentsError) throw commentsError;

      const formattedComments: ActivityItem[] = (commentsData || []).map((comment: any) => ({
        id: comment.id,
        type: 'comment' as const,
        post_id: comment.post_id,
        content: comment.comment_text,
        created_at: comment.created_at,
        post_media_url: comment.travel_posts?.media_urls?.[0],
        post_caption: comment.travel_posts?.caption,
      }));
      setComments(formattedComments);

      // Set empty arrays for replies (feature coming soon)
      setReplies([]);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('agent_reviews')
        .select(`
          id,
          created_at,
          rating,
          review_text,
          agent_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (reviewsError) throw reviewsError;

      const formattedReviews: ActivityItem[] = (reviewsData || []).map((review: any) => ({
        id: review.id,
        type: 'review' as const,
        content: review.review_text,
        rating: review.rating,
        created_at: review.created_at,
      }));
      setReviews(formattedReviews);

    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId?: string, momentId?: string) => {
    if (postId) {
      navigate('/travel-feed');
    } else if (momentId) {
      navigate('/travel-feed');
    }
  };

  const ActivityGrid = ({ items }: { items: ActivityItem[] }) => (
    <div className="grid grid-cols-3 gap-1">
      {items.map((item) => (
        <Card
          key={item.id}
          className="aspect-square cursor-pointer overflow-hidden relative group"
          onClick={() => handlePostClick(item.post_id, item.moment_id)}
        >
          {item.post_media_url ? (
            <>
              <img
                src={item.post_media_url}
                alt="Activity item"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {item.type === 'like' && <Heart className="h-8 w-8 text-white fill-white" />}
                {item.type === 'comment' && <MessageCircle className="h-8 w-8 text-white" />}
                {item.type === 'reply' && <Reply className="h-8 w-8 text-white" />}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              {item.type === 'review' ? (
                <div className="text-center p-4">
                  <Star className="h-8 w-8 mx-auto mb-2 text-primary fill-primary" />
                  <div className="flex gap-1 justify-center mb-2">
                    {Array.from({ length: item.rating || 0 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground p-4 line-clamp-3">{item.content}</p>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <>
        <TravelSidebar />
        <div className="min-h-screen bg-background md:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-12 bg-muted rounded" />
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TravelSidebar />
      <div className="min-h-screen bg-background md:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold">Your activity</h1>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 space-x-8">
              <TabsTrigger
                value="likes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent pb-3"
              >
                <Heart className="h-4 w-4 mr-2" />
                LIKES
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent pb-3"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                COMMENTS
              </TabsTrigger>
              <TabsTrigger
                value="replies"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent pb-3"
              >
                <Reply className="h-4 w-4 mr-2" />
                STORY REPLIES
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent pb-3"
              >
                <Star className="h-4 w-4 mr-2" />
                REVIEWS
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="likes" className="mt-0">
                {likes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No likes yet</p>
                  </div>
                ) : (
                  <ActivityGrid items={likes} />
                )}
              </TabsContent>

              <TabsContent value="comments" className="mt-0">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No comments yet</p>
                  </div>
                ) : (
                  <ActivityGrid items={comments} />
                )}
              </TabsContent>

              <TabsContent value="replies" className="mt-0">
                {replies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Reply className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No story replies yet</p>
                  </div>
                ) : (
                  <ActivityGrid items={replies} />
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet</p>
                  </div>
                ) : (
                  <ActivityGrid items={reviews} />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default YourActivity;