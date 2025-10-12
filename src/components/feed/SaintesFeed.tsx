import { useState, useEffect } from 'react';
import { useStreamActivity } from '@/contexts/StreamActivityContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Bookmark, Share2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Sainte {
  id: string;
  actor: {
    id: string;
    data: {
      name: string;
      profileImage: string;
    };
  };
  verb: string;
  object: string;
  time: string;
  images?: string[];
  caption?: string;
  location?: string;
  reaction_counts?: {
    like?: number;
    comment?: number;
  };
  own_reactions?: {
    like?: any[];
  };
}

export const SaintesFeed = () => {
  const { timelineFeed, userFeed, isReady } = useStreamActivity();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saintes, setSaintes] = useState<Sainte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && (timelineFeed || userFeed)) {
      fetchSaintes();
    }
  }, [isReady, timelineFeed, userFeed]);

  const fetchSaintes = async () => {
    try {
      setLoading(true);
      console.log('[SaintesFeed] Fetching saintes...', { timelineFeed, userFeed, isReady });
      
      const feed = timelineFeed || userFeed;
      if (!feed) {
        console.error('[SaintesFeed] No feed available (timeline or user)');
        toast.error('Failed to connect to feed service');
        return;
      }
      
      const response = await feed.get({ 
        limit: 25,
        withReactionCounts: true,
        withOwnReactions: true,
      });
      
      console.log('[SaintesFeed] Response received:', response);
      
      // Filter for sainte-type posts (permanent posts with images)
      const saintePosts = response.results.filter(
        (activity: any) => activity.verb === 'sainte' || activity.verb === 'post'
      );
      
      console.log('[SaintesFeed] Sainte posts:', saintePosts.length);
      setSaintes(saintePosts);
    } catch (error) {
      console.error('[SaintesFeed] Error fetching saintes:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (sainte: Sainte) => {
    try {
      const feed = timelineFeed || userFeed;
      if (!feed) return;
      if (sainte.own_reactions?.like && sainte.own_reactions.like.length > 0) {
        await feed.removeReaction(sainte.own_reactions.like[0].id);
      } else {
        await feed.addReaction('like', sainte.id);
      }
      await fetchSaintes();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like');
    }
  };

  const handleComment = (sainte: Sainte) => {
    toast.info('Comments coming soon');
  };

  const handleSave = async (sainte: Sainte) => {
    try {
      await userFeed.addReaction('bookmark', sainte.id);
      toast.success('Saved to collection');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    }
  };

  const handleShare = (sainte: Sainte) => {
    const link = `${window.location.origin}/sainte/${sainte.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    );
  }

  if (saintes.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">No posts yet</p>
        <Button onClick={() => navigate('/create')}>Create your first post</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      {saintes.map((sainte) => {
        const isLiked = sainte.own_reactions?.like && sainte.own_reactions.like.length > 0;
        
        return (
          <Card key={sainte.id} className="border-0 shadow-none">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => navigate(`/travel-profile/${sainte.actor.id}`)}
                  >
                    <AvatarImage src={sainte.actor.data.profileImage} />
                    <AvatarFallback>{sainte.actor.data.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <button
                      onClick={() => navigate(`/travel-profile/${sainte.actor.id}`)}
                      className="font-semibold text-sm hover:opacity-80"
                    >
                      {sainte.actor.data.name}
                    </button>
                    {sainte.location && (
                      <p className="text-xs text-muted-foreground">{sainte.location}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              {/* Images Carousel */}
              {sainte.images && sainte.images.length > 0 && (
                <div className="relative">
                  {sainte.images.length === 1 ? (
                    <img
                      src={sainte.images[0]}
                      alt="Post"
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {sainte.images.map((image, index) => (
                          <CarouselItem key={index}>
                            <img
                              src={image}
                              alt={`Post ${index + 1}`}
                              className="w-full aspect-square object-cover"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleLike(sainte)}
                    >
                      <Heart
                        className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleComment(sainte)}
                    >
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShare(sainte)}
                    >
                      <Share2 className="h-6 w-6" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSave(sainte)}
                  >
                    <Bookmark className="h-6 w-6" />
                  </Button>
                </div>

                {/* Likes */}
                {(sainte.reaction_counts?.like || 0) > 0 && (
                  <p className="text-sm font-semibold">
                    {sainte.reaction_counts?.like} {sainte.reaction_counts?.like === 1 ? 'like' : 'likes'}
                  </p>
                )}

                {/* Caption */}
                {sainte.caption && (
                  <p className="text-sm">
                    <span
                      className="font-semibold mr-2 cursor-pointer hover:opacity-80"
                      onClick={() => navigate(`/travel-profile/${sainte.actor.id}`)}
                    >
                      {sainte.actor.data.name}
                    </span>
                    {sainte.caption}
                  </p>
                )}

                {/* Comments */}
                {(sainte.reaction_counts?.comment || 0) > 0 && (
                  <button
                    className="text-sm text-muted-foreground hover:opacity-80"
                    onClick={() => handleComment(sainte)}
                  >
                    View all {sainte.reaction_counts?.comment} comments
                  </button>
                )}

                {/* Time */}
                <p className="text-xs text-muted-foreground">
                  {new Date(sainte.time).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
