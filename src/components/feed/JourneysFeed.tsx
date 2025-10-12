import { useState, useEffect, useRef } from 'react';
import { useStreamActivity } from '@/contexts/StreamActivityContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Share2, Music } from 'lucide-react';
import { toast } from 'sonner';

interface Journey {
  id: string;
  actor: {
    id: string;
    data: {
      name: string;
      profileImage: string;
    };
  };
  object: string;
  verb: string;
  foreign_id?: string;
  time: string;
  video_url?: string;
  image_url?: string;
  caption?: string;
  music?: string;
  reaction_counts?: {
    like?: number;
    comment?: number;
  };
  own_reactions?: {
    like?: any[];
  };
}

export const JourneysFeed = () => {
  const { timelineFeed, userFeed, isReady } = useStreamActivity();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  useEffect(() => {
    if (isReady && (timelineFeed || userFeed)) {
      fetchJourneys();
    }
  }, [isReady, timelineFeed, userFeed]);

  useEffect(() => {
    // Play current video, pause others
    Object.keys(videoRefs.current).forEach((key, index) => {
      const video = videoRefs.current[key];
      if (video) {
        if (index === currentIndex) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      console.log('[JourneysFeed] Fetching journeys...', { timelineFeed, userFeed, isReady });
      
      // Prefer timeline if available, otherwise user feed
      let feed = timelineFeed || userFeed;
      if (!feed) {
        console.error('[JourneysFeed] No feed available (timeline or user)');
        toast.error('Failed to connect to feed service');
        return;
      }
      
      let response: any;
      try {
        response = await feed.get({ 
          limit: 25,
          enrich: true,
          withReactionCounts: true,
          withOwnReactions: true,
        });
      } catch (err: any) {
        // If timeline group doesn't exist, retry using userFeed
        const msg = (err?.message || '').toLowerCase();
        if (timelineFeed && userFeed && msg.includes('timeline feed group does not exist')) {
          console.warn('[JourneysFeed] Timeline unavailable, retrying with user feed');
          feed = userFeed;
          response = await userFeed.get({
            limit: 25,
            enrich: true,
            withReactionCounts: true,
            withOwnReactions: true,
          });
        } else {
          throw err;
        }
      }
      
      console.log('[JourneysFeed] Response received:', response);
      
      // Filter for journey-type posts (short videos)
      const journeyPosts = response.results.filter(
        (activity: any) => activity.verb === 'journey' || activity.video_url
      );
      
      console.log('[JourneysFeed] Journey posts:', journeyPosts.length);

      // If empty, seed a couple of example journeys once per browser
      if (journeyPosts.length === 0 && userFeed && typeof window !== 'undefined') {
        const seeded = localStorage.getItem('seededJourneys') === '1';
        if (!seeded) {
          try {
            console.log('[JourneysFeed] Seeding example journeys...');
            await userFeed.addActivity({
              verb: 'journey',
              object: 'video:travel1',
              time: new Date().toISOString(),
              video_url: '/videos/travel1.mp4',
              caption: 'AI travel inspiration: Santorini sunset',
            });
            await userFeed.addActivity({
              verb: 'journey',
              object: 'video:travel2',
              time: new Date().toISOString(),
              video_url: '/videos/travel2.mp4',
              caption: 'AI travel inspiration: Amalfi Coast drive',
            });
            localStorage.setItem('seededJourneys', '1');
            // Fetch again to include seeded items
            response = await userFeed.get({
              limit: 25,
              enrich: true,
              withReactionCounts: true,
              withOwnReactions: true,
            });
            const seededPosts = response.results.filter((a: any) => a.verb === 'journey' || a.video_url);
            setJourneys(seededPosts);
            return;
          } catch (seedErr) {
            console.warn('[JourneysFeed] Failed to seed example journeys:', seedErr);
          }
        }
      }

      setJourneys(journeyPosts);
    } catch (error) {
      console.error('[JourneysFeed] Error fetching journeys:', error);
      toast.error('Failed to load journeys');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (journey: Journey) => {
    try {
      const feed = timelineFeed || userFeed;
      if (!feed) return;
      if (journey.own_reactions?.like && journey.own_reactions.like.length > 0) {
        // Unlike
        await feed.removeReaction(journey.own_reactions.like[0].id);
      } else {
        // Like
        await feed.addReaction('like', journey.id);
      }
      
      // Refresh the feed
      await fetchJourneys();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like');
    }
  };

  const handleComment = (journey: Journey) => {
    // Navigate to comments or open comment sheet
    toast.info('Comments coming soon');
  };

  const handleSave = async (journey: Journey) => {
    try {
      // Add to saved collection
      await userFeed.addReaction('bookmark', journey.id);
      toast.success('Saved to collection');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    }
  };

  const handleShare = (journey: Journey) => {
    // Copy link or open share sheet
    const link = `${window.location.origin}/journey/${journey.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < journeys.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <p className="text-white">Loading Journeys...</p>
      </div>
    );
  }

  if (journeys.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black gap-4">
        <p className="text-white text-lg">No Journeys yet</p>
        <Button onClick={() => navigate('/create')}>Create your first Journey</Button>
      </div>
    );
  }

  const currentJourney = journeys[currentIndex];
  const isLiked = currentJourney.own_reactions?.like && currentJourney.own_reactions.like.length > 0;

  const rawActor: any = currentJourney.actor;
  const actorId = typeof rawActor === 'string' ? rawActor.replace('User:', '') : rawActor.id;
  const actorName = typeof rawActor === 'string' ? `@${actorId.slice(0, 6)}` : (rawActor.data?.name || `@${actorId.slice(0, 6)}`);
  const actorImage = typeof rawActor === 'string' ? undefined : rawActor.data?.profileImage;

  return (
    <div 
      className="relative h-screen w-full bg-black overflow-hidden"
      onWheel={handleScroll}
    >
      {/* Content */}
      <div className="h-full w-full relative">
        {/* Video/Image */}
        <div className="absolute inset-0">
          {currentJourney.video_url ? (
            <video
              ref={(el) => {
                if (el) videoRefs.current[currentJourney.id] = el;
              }}
              src={currentJourney.video_url}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted
            />
          ) : currentJourney.image_url ? (
            <img
              src={currentJourney.image_url}
              alt="Journey"
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>

        {/* Right Action Buttons */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50"
              onClick={() => handleLike(currentJourney)}
            >
              <Heart
                className={`h-7 w-7 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
              />
            </Button>
            <span className="text-white text-sm font-semibold drop-shadow-lg">
              {currentJourney.reaction_counts?.like || 0}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50"
              onClick={() => handleComment(currentJourney)}
            >
              <MessageCircle className="h-7 w-7 text-white" />
            </Button>
            <span className="text-white text-sm font-semibold drop-shadow-lg">
              {currentJourney.reaction_counts?.comment || 0}
            </span>
          </div>

          {/* Save */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50"
            onClick={() => handleSave(currentJourney)}
          >
            <Bookmark className="h-7 w-7 text-white" />
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50"
            onClick={() => handleShare(currentJourney)}
          >
            <Share2 className="h-7 w-7 text-white" />
          </Button>

          {/* Music (if available) */}
          {currentJourney.music && (
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 animate-spin-slow"
            >
              <Music className="h-6 w-6 text-white" />
            </Button>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute left-0 right-0 bottom-0 z-20 pb-safe">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent h-32" />
          <div className="relative px-4 pb-4 space-y-2">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <Avatar
                className="h-10 w-10 ring-2 ring-white cursor-pointer"
                onClick={() => navigate(`/travel-profile/${actorId}`)}
              >
                <AvatarImage src={actorImage} />
                <AvatarFallback>{actorName?.[0] ?? 'U'}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => navigate(`/travel-profile/${actorId}`)}
                className="text-white font-semibold drop-shadow-lg hover:opacity-80"
              >
                {actorName}
              </button>
              <Button size="sm" variant="outline" className="ml-2">
                Follow
              </Button>
            </div>

            {/* Caption */}
            {currentJourney.caption && (
              <p className="text-white text-sm drop-shadow-lg line-clamp-2">
                {currentJourney.caption}
              </p>
            )}

            {/* Music */}
            {currentJourney.music && (
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-white" />
                <p className="text-white text-xs drop-shadow-lg">
                  {currentJourney.music}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {journeys.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-1 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
