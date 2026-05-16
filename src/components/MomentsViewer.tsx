import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, X, Eye, Archive, Volume2, VolumeX, Trash, Music2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { MomentDrawingDisplay } from "./MomentDrawingDisplay";
import { MomentInteractionDisplay } from "./MomentInteractionDisplay";
import { MomentReactions } from "./MomentReactions";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface Moment {
  id: string;
  user_id: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
  caption: string | null;
  duration_seconds: number;
  view_count: number;
  created_at: string;
  drawing_data?: string | null;
  interactions?: any | null;
  music_track_id?: string | null;
  music_track_name?: string | null;
  music_track_artist?: string | null;
  music_preview_url?: string | null;
  music_album_art?: string | null;
  music_service?: string | null;
  text_styling?: {
    font: string;
    animation: string;
    color: string;
    bgType: string;
    bgGradient: string;
  } | null;
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

interface Highlight {
  id: string;
  title: string;
}

export const MomentsViewer = ({ open, onOpenChange, userId, initialMomentId }: MomentsViewerProps) => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [creatingVault, setCreatingVault] = useState(false);
  const [newVaultTitle, setNewVaultTitle] = useState("");
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { musicVolume } = useUserPreferences();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
      } catch (error) {
        console.warn('Failed to load current user for MomentsViewer', error);
      }

      if (open && userId) {
        fetchMoments();
        fetchHighlights();
      } else if (!open && audio) {
        // Clean up audio when dialog closes
        audio.pause();
        audio.currentTime = 0;
        setAudio(null);
      }
    };

    init();
    
    // Cleanup navigation timeout on unmount
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [open, userId]);

  useEffect(() => {
    if (moments.length === 0) return;

    const currentMoment = moments[currentIndex];
    if (!currentMoment) return;

    // Record view
    recordView(currentMoment.id);

    // Reset progress when index changes
    setProgress(0);

    // If save dialog is open, pause auto-advance
    if (saveDialogOpen) {
      return;
    }

    // Progress bar animation
    const duration = currentMoment.media_type === 'image' ? currentMoment.duration_seconds * 1000 : 15000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          // Small delay before auto-advancing to next moment
          setTimeout(() => {
            if (currentIndex < moments.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              onOpenChange(false);
            }
          }, 100);
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, moments, saveDialogOpen, onOpenChange]);

  // Handle Spotify audio playback
  useEffect(() => {
    if (moments.length === 0) return;

    const currentMoment = moments[currentIndex];
    if (!currentMoment) return;

    // Clean up previous audio
    if (audio) {
      audio.pause();
      audio.src = '';
    }

    // Play new audio if available
    if (currentMoment.music_preview_url) {
            const newAudio = new Audio(currentMoment.music_preview_url);
      newAudio.preload = 'auto';
      newAudio.crossOrigin = 'anonymous';
      newAudio.volume = (musicVolume / 100) * 0.7;

      let stopTimeout: NodeJS.Timeout;

      newAudio.addEventListener('loadedmetadata', () => {
                const startTime = 0; // Apple Music doesn't use start time
        try {
          newAudio.currentTime = startTime;
                  } catch (e) {
          console.error('Error setting currentTime:', e);
        }
        // Stop after 30 seconds
        stopTimeout = setTimeout(() => {
          newAudio.pause();
                  }, 30000);
      });

      newAudio.addEventListener('error', (e) => {
        console.error('🎵 Audio error:', e);
        toast.error('Failed to load audio preview');
      });

      // Autoplay if sound is on
      if (isSoundOn) {
                newAudio.play()
          .then(() => {
                        setAutoplayBlocked(false);
          })
          .catch((error) => {
            console.error('🎵 Audio play failed:', error);
            setAutoplayBlocked(true);
          });
      } else {
                setAutoplayBlocked(true);
      }

      setAudio(newAudio);

      return () => {
        if (stopTimeout) clearTimeout(stopTimeout);
        newAudio.pause();
        newAudio.src = '';
      };
    } else {
      setAudio(null);
    }
  }, [currentIndex, moments, isSoundOn]);

  const fetchMoments = async () => {
    try {
      // Optimized: Join moments with profiles in single query to avoid N+1
      const { data, error } = await supabase
        .from('moments')
        .select(`
          *,
          profiles!moments_user_id_fkey(username, avatar_url)
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const momentsWithProfile = data.map(moment => ({
          ...moment,
          text_styling: moment.text_styling as Moment['text_styling'],
          interactions: moment.interactions,
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
          }
  };

  // Debounced navigation to prevent setState thrash on rapid swipes
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleNext = () => {
    if (navigationTimeoutRef.current) return; // Guard against rapid navigation
    
    setProgress(0);
    if (currentIndex < moments.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Prefetch next moment's media
      if (currentIndex + 2 < moments.length) {
        const nextMoment = moments[currentIndex + 2];
        if (nextMoment?.media_url) {
          const img = new Image();
          img.src = nextMoment.media_url;
        }
      }
    } else {
      setSaveDialogOpen(false);
      onOpenChange(false);
    }
    
    // Debounce subsequent navigation
    navigationTimeoutRef.current = setTimeout(() => {
      navigationTimeoutRef.current = null;
    }, 100);
  };

  const handlePrevious = () => {
    if (navigationTimeoutRef.current) return; // Guard against rapid navigation
    
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Prefetch previous moment's media
      if (currentIndex - 2 >= 0) {
        const prevMoment = moments[currentIndex - 2];
        if (prevMoment?.media_url) {
          const img = new Image();
          img.src = prevMoment.media_url;
        }
      }
    }
    
    // Debounce subsequent navigation
    navigationTimeoutRef.current = setTimeout(() => {
      navigationTimeoutRef.current = null;
    }, 100);
  };

  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);

    // Toggle video audio
    if (currentMoment?.media_type === 'video' && videoRef.current) {
      videoRef.current.muted = !next;
      if (next) {
        videoRef.current.play().catch((error) => {
          console.warn('Unable to resume video playback', error);
        });
      }
    }

    // Toggle Spotify preview audio
    if (next) {
      if (audio) {
        audio
          .play()
          .then(() => setAutoplayBlocked(false))
          .catch((error) => {
            console.warn('Unable to resume audio playback', error);
            setAutoplayBlocked(true);
          });
      } else if (currentMoment?.music_preview_url) {
        const a = new Audio(currentMoment.music_preview_url);
        a.preload = 'auto';
        a.volume = 0.7;
        try {
          a.currentTime = 0;
        } catch (error) {
          console.warn('Failed to reset audio preview time', error);
        }
        a
          .play()
          .then(() => setAutoplayBlocked(false))
          .catch((error) => {
            console.warn('Unable to start audio preview', error);
            setAutoplayBlocked(true);
          });
        setAudio(a);
      }
    } else {
      if (audio) audio.pause();
    }
  };

  const handleDeleteMoment = async () => {
    if (!currentUserId || currentUserId !== currentMoment.user_id) return;
    const confirmDel = await confirmDialog({
      title: 'Delete this story?',
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!confirmDel) return;
    try {
      const { error } = await supabase.from('moments').delete().eq('id', currentMoment.id);
      if (error) throw error;
      toast.success('Moment deleted');
      const newMoments = moments.filter((m) => m.id !== currentMoment.id);
      setMoments(newMoments);
      if (newMoments.length === 0) {
        onOpenChange(false);
      } else if (currentIndex >= newMoments.length) {
        setCurrentIndex(newMoments.length - 1);
      }
    } catch (e) {
      console.error('Delete failed:', e);
      toast.error('Failed to delete moment');
    }
  };
  const fetchHighlights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('story_highlights')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  const handleSaveToVault = async () => {
        
    if (!selectedHighlightId) {
      toast.error("Please select a vault");
      return;
    }

    setSaving(true);
    try {
      const currentMoment = moments[currentIndex];
            
      // Check if already saved
      const { data: existing, error: checkError } = await supabase
        .from('moment_highlight_items')
        .select('id')
        .eq('highlight_id', selectedHighlightId)
        .eq('moment_id', currentMoment.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing:', checkError);
        throw checkError;
      }

      if (existing) {
                toast.info("This moment is already in this vault");
        setSaveDialogOpen(false);
        return;
      }

      // Save to vault
      const { error } = await supabase
        .from('moment_highlight_items')
        .insert({
          highlight_id: selectedHighlightId,
          moment_id: currentMoment.id,
        });

      if (error) {
        console.error('Error inserting:', error);
        throw error;
      }

            toast.success("Moment saved to vault!");
      setSaveDialogOpen(false);
      setSelectedHighlightId("");
    } catch (error) {
      console.error('Error saving moment:', error);
      toast.error("Failed to save moment to vault");
    } finally {
      setSaving(false);
    }
  };

  if (loading || moments.length === 0) {
    return null;
  }

  const currentMoment = moments[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[90vh] p-0 bg-black border-none overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Moments Viewer</DialogTitle>
        <DialogDescription className="sr-only">View and save moments to your vault.</DialogDescription>
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSound}
                className="text-white hover:bg-white/20"
                title={isSoundOn ? 'Sound on' : 'Sound off'}
              >
                {isSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              {currentUserId === currentMoment.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteMoment}
                  className="text-white hover:bg-white/20"
                  title="Delete story"
                >
                  <Trash className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20"
                title="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Save Button - Bottom Right */}
          <div className="absolute bottom-20 right-4 z-20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="text-white bg-white/10 hover:bg-white/20 px-3"
              title="Save to Vault"
            >
              <Archive className="w-5 h-5" />
              <span className="ml-2 text-sm">Save</span>
            </Button>
          </div>

          {/* Music Track Info Display - Bottom */}
          {currentMoment.music_track_id && (
            <div className="absolute bottom-24 left-4 right-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 max-w-xs">
              {currentMoment.music_album_art && (
                <img 
                  src={currentMoment.music_album_art} 
                  alt="Album art"
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                loading="lazy"/>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate leading-tight">
                  {currentMoment.music_track_name || 'Unknown Track'}
                </p>
                <p className="text-white/70 text-xs truncate leading-tight">
                  {currentMoment.music_track_artist || 'Unknown Artist'}
                </p>
              </div>
              <Music2 className="w-4 h-4 text-white flex-shrink-0" />
            </div>
          )}

          {/* Global tap-to-play overlay */}
          {!isSoundOn && (currentMoment.music_preview_url || currentMoment.media_type === 'video') && (
            <div 
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/30"
              onClick={() => {
                setIsSoundOn(true);
                // Ensure we start the audio on this user gesture
                if (!audio && currentMoment.music_preview_url) {
                  const a = new Audio(currentMoment.music_preview_url);
                  a.preload = 'auto';
                  a.volume = 0.7;
        try {
          a.currentTime = 0;
        } catch (error) {
          console.warn('Failed to reset overlay audio preview time', error);
        }
                  a.play()
                    .then(() => setAutoplayBlocked(false))
                    .catch((e) => {
                      console.error('Overlay audio play failed:', e);
                      toast.error('Unable to play audio');
                      setAutoplayBlocked(true);
                    });
                  setAudio(a);
                } else if (audio) {
                  audio.play().catch((error) => {
                    console.warn('Unable to resume overlay audio playback', error);
                  });
                }
                if (currentMoment.media_type === 'video' && videoRef.current) {
                  videoRef.current.muted = false;
                  videoRef.current.play().catch((error) => {
                    console.warn('Unable to resume video playback with audio', error);
                  });
                }
              }}
            >
              <div className="bg-black/80 text-white px-6 py-3 rounded-full border border-white/30 flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                <span className="text-sm font-medium">Tap for sound</span>
              </div>
            </div>
          )}

          {/* Media */}

          {autoplayBlocked && currentMoment.music_preview_url && isSoundOn && (
            <div className="absolute inset-0 z-30 flex items-start justify-center pt-24">
              <button
                onClick={() => {
                  if (audio) {
                    audio.play()
                      .then(() => setAutoplayBlocked(false))
                      .catch((error) => {
                        console.error('Audio playback failed after user interaction', error);
                        toast.error("Unable to play audio");
                      });
                  }
                }}
                className="bg-black/60 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur border border-white/20"
                aria-label="Tap to play sound"
              >
                Tap for sound
              </button>
            </div>
          )}

          <div className="flex items-center justify-center w-full h-full bg-black p-2 md:p-4">
            {currentMoment.media_type === 'text' ? (
              <div 
                className="w-full h-full flex items-center justify-center p-8"
                style={{ background: currentMoment.text_styling?.bgGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <div className="text-center max-w-md px-4">
                  <p
                    key={`${currentMoment.text_styling?.font}-${currentMoment.text_styling?.animation}-${currentMoment.text_styling?.bgType}-${currentMoment.text_styling?.color}-${(currentMoment.caption || '').length}`}
                    className={`text-4xl font-bold ${
                      currentMoment.text_styling?.font === 'classic' ? 'font-story-classic' :
                      currentMoment.text_styling?.font === 'modern' ? 'font-story-modern' :
                      currentMoment.text_styling?.font === 'elegant' ? 'font-story-elegant' :
                      currentMoment.text_styling?.font === 'typewriter' ? 'font-story-typewriter' :
                      currentMoment.text_styling?.font === 'neon' ? 'font-story-neon' :
                      'font-story-classic'
                    } ${
                      currentMoment.text_styling?.animation === 'sparkle' ? 'animate-sparkle' :
                      currentMoment.text_styling?.animation === 'pop' ? 'animate-pop' :
                      currentMoment.text_styling?.animation === 'fadeIn' ? 'animate-fadeIn' :
                      ''
                    } ${
                      currentMoment.text_styling?.bgType === 'solid' ? 'text-bg-solid' :
                      currentMoment.text_styling?.bgType === 'outline' ? 'text-bg-outline' :
                      ''
                    }`}
                    style={
                      currentMoment.text_styling?.bgType === 'solid' 
                        ? { 
                            background: currentMoment.text_styling?.color || '#FFFFFF',
                            color: '#FFFFFF',
                          }
                        : currentMoment.text_styling?.bgType === 'outline'
                        ? {
                            WebkitTextStroke: `3px ${currentMoment.text_styling?.color || '#FFFFFF'}`,
                            WebkitTextFillColor: 'white',
                            color: currentMoment.text_styling?.color || '#FFFFFF',
                          }
                        : { 
                            color: currentMoment.text_styling?.color || '#FFFFFF',
                          }
                    }
                  >
                    {currentMoment.caption}
                  </p>
                </div>
              </div>
            ) : currentMoment.media_type === 'image' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <OptimizedImage
                  src={currentMoment.media_url || ''}
                  alt="Moment"
                  mode="contain"
                  className="max-h-[85vh]"
                  priority
                />
                {currentMoment.drawing_data && (
                  <MomentDrawingDisplay
                    drawingData={currentMoment.drawing_data}
                    width={400}
                    height={600}
                  />
                )}
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={currentMoment.media_url || ''}
                  className="w-full h-full max-h-[85vh] object-contain bg-black"
                  autoPlay
                  muted={!isSoundOn}
                  playsInline
                  onPlay={() => setAutoplayBlocked(false)}
                  onEnded={() => { if (!saveDialogOpen) handleNext(); }}
                />
                {currentMoment.drawing_data && (
                  <MomentDrawingDisplay
                    drawingData={currentMoment.drawing_data}
                    width={400}
                    height={600}
                  />
                )}
              </div>
            )}
          </div>

          {/* Interactive Element */}
          {currentMoment.interactions && (
            <MomentInteractionDisplay
              momentId={currentMoment.id}
              interaction={currentMoment.interactions}
            />
          )}

          {/* Music Track Display */}
          {currentMoment.music_track_id && (
            <div className="absolute top-16 right-4 z-20 bg-black/60 backdrop-blur-sm rounded-lg p-2 max-w-[200px]">
              <div className="flex items-center gap-2">
                {currentMoment.music_album_art && (
                  <img 
                    src={currentMoment.music_album_art} 
                    alt="Album art" 
                    className="w-10 h-10 rounded"
                  loading="lazy"/>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {currentMoment.music_track_name}
                  </p>
                  <p className="text-white/70 text-xs truncate">
                    {currentMoment.music_track_artist}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Caption, Stats & Reactions */}
          {!currentMoment.interactions && (
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent space-y-3">
              {currentMoment.caption && (
                <p className="text-white text-sm">{currentMoment.caption}</p>
              )}
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <Eye className="w-4 h-4" />
                <span>{currentMoment.view_count} views</span>
              </div>
              <MomentReactions momentId={currentMoment.id} />
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

      {/* Save to Vault Dialog */}
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Moment to Vault</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a vault to save this moment permanently. It will be preserved even after it expires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {highlights.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create a vault to save this moment.
              </p>
              <Input
                placeholder="Vault name (e.g. Summer 2025)"
                value={newVaultTitle}
                onChange={(e) => setNewVaultTitle(e.target.value)}
                disabled={creatingVault}
              />
              <Button
                className="w-full"
                disabled={!newVaultTitle || creatingVault}
                onClick={async () => {
                  try {
                    setCreatingVault(true);
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { toast.error('You must be signed in'); setCreatingVault(false); return; }
                    const { data, error } = await supabase
                      .from('story_highlights')
                      .insert({ user_id: user.id, title: newVaultTitle })
                      .select('id, title')
                      .single();
                    if (error) throw error;
                    setHighlights([data as Highlight, ...highlights]);
                    setSelectedHighlightId((data as Highlight).id);
                    setNewVaultTitle('');
                    toast.success('Vault created');
                  } catch (err) {
                    console.error('Error creating vault:', err);
                    toast.error('Failed to create vault');
                  } finally {
                    setCreatingVault(false);
                  }
                }}
              >
                {creatingVault ? 'Creating...' : 'Create Vault'}
              </Button>
            </div>
          ) : (
            <Select value={selectedHighlightId} onValueChange={setSelectedHighlightId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a vault" />
              </SelectTrigger>
              <SelectContent>
                {highlights.map((highlight) => (
                  <SelectItem key={highlight.id} value={highlight.id}>
                    {highlight.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSaveToVault}
              disabled={!selectedHighlightId || saving}
            >
              {saving ? "Saving..." : "Save to Vault"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
