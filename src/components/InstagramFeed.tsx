import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { FeedSkeleton } from './FeedSkeleton';

interface FeedPost {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  imageUrl?: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  liked: boolean;
  saved: boolean;
}

export const InstagramFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  const loadFeed = async () => {
    if (!user) return;

    try {
      // Mock data - replace with actual Stream API feed loading
      const mockPosts: FeedPost[] = [
        {
          id: '1',
          user: {
            id: user?.id || '1',
            name: user?.user_metadata?.username || 'traveler',
            avatar: user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
          },
          imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
          caption: 'Exploring new destinations 🌍✈️',
          likes: 1234,
          comments: 56,
          timestamp: '2h',
          liked: false,
          saved: false,
        },
        {
          id: '2',
          user: {
            id: '2',
            name: 'wanderlust_jane',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
          },
          imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
          caption: 'Sunset views from paradise 🌅',
          likes: 892,
          comments: 34,
          timestamp: '5h',
          liked: true,
          saved: false,
        },
      ];
      setPosts(mockPosts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load feed:', error);
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
          : post
      ));
      toast.success('Liked!');
    } catch (error) {
      console.error('Failed to like post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText[postId]?.trim()) return;

    try {
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, comments: post.comments + 1 }
          : post
      ));

      setCommentText({ ...commentText, [postId]: '' });
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleSave = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, saved: !post.saved }
        : post
    ));
    toast.success(posts.find(p => p.id === postId)?.saved ? 'Removed from saved' : 'Saved to collection');
  };

  if (loading) {
    return <FeedSkeleton />;
  }

  return (
    <div className="max-w-[630px] mx-auto pb-20">
      <div className="space-y-0">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full border-2 border-foreground p-8 mb-6">
              <MessageCircle className="h-16 w-16" strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-light mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground">Follow people to see their posts here</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="mb-3 border-b border-border pb-5">
              {/* Post Header */}
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-background cursor-pointer hover:ring-muted transition-all">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1">
                    <button 
                      className="font-semibold text-sm hover:opacity-70 transition-opacity"
                      onClick={() => navigate(`/travel-profile/${post.user.id}`)}
                    >
                      {post.user.name}
                    </button>
                    <span className="text-muted-foreground text-sm">• {post.timestamp}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>

              {/* Post Image */}
              {post.imageUrl && (
                <div className="w-full bg-black">
                  <img
                    src={post.imageUrl}
                    alt="Post content"
                    className="w-full object-contain max-h-[585px]"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:opacity-70 transition-opacity"
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart
                        className={`h-6 w-6 ${post.liked ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:opacity-70 transition-opacity"
                    >
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:opacity-70 transition-opacity"
                    >
                      <Send className="h-6 w-6" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:opacity-70 transition-opacity"
                    onClick={() => handleSave(post.id)}
                  >
                    <Bookmark
                      className={`h-6 w-6 ${post.saved ? 'fill-current' : ''}`}
                    />
                  </Button>
                </div>

                {/* Likes Count */}
                <div className="mt-1 mb-2">
                  <button className="font-semibold text-sm hover:opacity-70 transition-opacity">
                    {post.likes.toLocaleString()} likes
                  </button>
                </div>

                {/* Caption */}
                <div className="text-sm">
                  <button 
                    className="font-semibold hover:opacity-70 transition-opacity mr-2"
                    onClick={() => navigate(`/travel-profile/${post.user.id}`)}
                  >
                    {post.user.name}
                  </button>
                  <span>{post.caption}</span>
                </div>

                {/* View Comments */}
                {post.comments > 0 && (
                  <button className="text-sm text-muted-foreground mt-1 hover:opacity-70 transition-opacity">
                    View all {post.comments} comments
                  </button>
                )}

                {/* Add Comment */}
                <div className="flex items-center gap-2 mt-3 pb-1">
                  <Input
                    placeholder="Add a comment..."
                    value={commentText[post.id] || ''}
                    onChange={(e) =>
                      setCommentText({ ...commentText, [post.id]: e.target.value })
                    }
                    className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  {commentText[post.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary font-semibold h-8 px-2 hover:text-primary/80"
                      onClick={() => handleComment(post.id)}
                    >
                      Post
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
