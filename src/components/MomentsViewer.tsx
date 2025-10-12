import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, X, Eye } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Moment {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  duration_seconds: number;
  view_count: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface MomentsViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialMomentId?: string;
}

export const MomentsViewer = ({ open, onOpenChange, userId, initialMomentId }: MomentsViewerProps) => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && userId) {
      fetchMoments();
    }
  }, [open, userId]);

  useEffect(() => {
    if (moments.length === 0) return;

    const currentMoment = moments[currentIndex];
    if (!currentMoment) return;

    // Record view
    recordView(currentMoment.id);

    // Progress bar animation
    const duration = currentMoment.media_type === 'image' ? currentMoment.duration_seconds * 1000 : 15000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    setProgress(0);
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, moments]);

  const fetchMoments = async () => {
    try {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile separately
      if (data && data.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', userId)
          .single();

        const momentsWithProfile = data.map(moment => ({
          ...moment,
          profiles: profile,
        }));

        setMoments(momentsWithProfile as Moment[]);
      } else {
        setMoments([]);
      }
      
      if (initialMomentId && data) {
        const index = data.findIndex(m => m.id === initialMomentId);
        if (index !== -1) setCurrentIndex(index);
      }
    } catch (error) {
      console.error('Error fetching moments:', error);
      toast.error("Failed to load moments");
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (momentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('moment_views')
        .insert({
          moment_id: momentId,
          viewer_id: user.id,
        });
    } catch (error) {
      // Ignore duplicate view errors
      console.log('View already recorded');
    }
  };

  const handleNext = () => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading || moments.length === 0) {
    return null;
  }

  const currentMoment = moments[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[90vh] p-0 bg-black border-none overflow-hidden">
        <div className="relative w-full h-full bg-black">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {moments.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 ring-2 ring-white">
                <AvatarImage src={currentMoment.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                  {currentMoment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-sm">
                {currentMoment.profiles?.username || 'User'}
              </span>
              <span className="text-white/70 text-xs">
                {new Date(currentMoment.created_at).toLocaleString()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Media */}
          <div className="w-full h-full flex items-center justify-center">
            {currentMoment.media_type === 'image' ? (
              <img
                src={currentMoment.media_url}
                alt="Moment"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={currentMoment.media_url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                onEnded={handleNext}
              />
            )}
          </div>

          {/* Caption & Stats */}
          {(currentMoment.caption || currentMoment.view_count > 0) && (
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {currentMoment.caption && (
                <p className="text-white text-sm mb-2">{currentMoment.caption}</p>
              )}
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <Eye className="w-4 h-4" />
                <span>{currentMoment.view_count} views</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          {currentIndex < moments.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
