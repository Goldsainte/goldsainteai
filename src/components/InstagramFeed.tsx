import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: Date;
  liked: boolean;
  saved: boolean;
}

export const InstagramFeed = () => {
  const { user } = useAuth();
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
      // Mock data for now - will be replaced with real posts later
      const mockPosts: FeedPost[] = [];
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
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="h-96 bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {posts.map(post => (
        <Card key={post.id} className="overflow-hidden border-0 shadow-sm">
          {/* Post Header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.userAvatar} />
                <AvatarFallback>{post.userName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{post.userName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Report</DropdownMenuItem>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuItem>Share to...</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Image */}
          {post.image && (
            <div className="relative aspect-square bg-muted">
              <img 
                src={post.image} 
                alt="Post" 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleLike(post.id)}
                >
                  <Heart 
                    className={`h-6 w-6 ${post.liked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Send className="h-6 w-6" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleSave(post.id)}
              >
                <Bookmark className={`h-6 w-6 ${post.saved ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Likes Count */}
            {post.likes > 0 && (
              <p className="text-sm font-semibold">{post.likes} {post.likes === 1 ? 'like' : 'likes'}</p>
            )}

            {/* Caption */}
            {post.content && (
              <div className="text-sm">
                <span className="font-semibold mr-2">{post.userName}</span>
                <span>{post.content}</span>
              </div>
            )}

            {/* Comments */}
            {post.comments > 0 && (
              <button className="text-sm text-muted-foreground">
                View all {post.comments} comments
              </button>
            )}

            {/* Add Comment */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText[post.id] || ''}
                onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment(post.id);
                  }
                }}
                className="border-0 focus-visible:ring-0 px-0"
              />
              {commentText[post.id]?.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleComment(post.id)}
                  className="text-primary font-semibold"
                >
                  Post
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
