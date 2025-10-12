import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeedItem {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  mediaUrl: string;
  mediaType: 'image' | 'video';
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
}

const StreamActivityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockItems: FeedItem[] = [
      {
        id: '1',
        user: {
          id: user?.id || '1',
          username: 'andrepowelljr',
          avatar: user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        },
        mediaUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        mediaType: 'image',
        likes: 1234,
        comments: 56,
        liked: false,
        saved: false,
      },
      {
        id: '2',
        user: {
          id: '2',
          username: 'traveler_jane',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        },
        mediaUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
        mediaType: 'image',
        likes: 892,
        comments: 34,
        liked: true,
        saved: false,
      },
    ];
    setItems(mockItems);
  }, [user]);

  const handleLike = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
        : item
    ));
  };

  const handleSave = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, saved: !item.saved }
        : item
    ));
    toast.success('Saved to collection');
  };

  const handleShare = () => {
    toast.success('Share link copied!');
  };

  if (items.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* For You Header */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
        <div className="flex items-center justify-center py-4">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-6 py-2">
            <h1 className="text-white font-semibold text-lg">For You</h1>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="h-full w-full relative">
        {/* Media */}
        <div className="h-full w-full flex items-center justify-center" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)' }}>
          {currentItem.mediaType === 'image' ? (
            <img
              src={currentItem.mediaUrl}
              alt="Feed content"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={currentItem.mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              playsInline
            />
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="absolute right-3 flex flex-col gap-6 z-10" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 120px)' }}>
          {/* Like Button */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-transparent hover:bg-transparent"
              onClick={() => handleLike(currentItem.id)}
            >
              <Heart
                className={`h-8 w-8 ${
                  currentItem.liked ? 'fill-red-500 text-red-500' : 'text-white'
                }`}
                strokeWidth={1.5}
              />
            </Button>
            <span className="text-white text-xs font-semibold drop-shadow-lg">
              {currentItem.likes}
            </span>
          </div>

          {/* Comment Button */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-transparent hover:bg-transparent"
              onClick={() => toast.info('Comments feature coming soon')}
            >
              <MessageCircle className="h-8 w-8 text-white" strokeWidth={1.5} />
            </Button>
            <span className="text-white text-xs font-semibold drop-shadow-lg">
              {currentItem.comments}
            </span>
          </div>

          {/* Save Button */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-transparent hover:bg-transparent"
              onClick={() => handleSave(currentItem.id)}
            >
              <Bookmark
                className={`h-8 w-8 ${
                  currentItem.saved ? 'fill-yellow-500 text-yellow-500' : 'text-white'
                }`}
                strokeWidth={1.5}
              />
            </Button>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-transparent hover:bg-transparent"
              onClick={handleShare}
            >
              <Share2 className="h-8 w-8 text-white" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Bottom Bar with User Info (does not cover media) */}
        <div className="absolute left-0 right-0 bottom-0 z-20">
          {/* Gradient for readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative px-3 pt-4 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center gap-3">
            <Avatar
              className="h-12 w-12 ring-2 ring-white cursor-pointer"
              onClick={() => navigate(`/travel-profile/${currentItem.user.id}`)}
            >
              <AvatarImage src={currentItem.user.avatar} />
              <AvatarFallback>{currentItem.user.username[0]}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => navigate(`/travel-profile/${currentItem.user.id}`)}
              className="text-white font-semibold text-base drop-shadow-lg hover:opacity-80 transition-opacity"
            >
              {currentItem.user.username}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamActivityFeed;
