import { useState, useCallback, useEffect } from "react";
import { Search, Music, X, Play, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  previewUrl: string | null;
  duration: number;
  spotifyUrl: string;
}

interface SpotifyTrackSelectorProps {
  selectedTrack: SpotifyTrack | null;
  onSelectTrack: (track: SpotifyTrack | null, startTime?: number) => void;
  className?: string;
}

export const SpotifyTrackSelector = ({
  selectedTrack,
  onSelectTrack,
  className,
}: SpotifyTrackSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  const handlePlayPreview = () => {
    if (!selectedTrack?.previewUrl) return;

    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const newAudio = new Audio(selectedTrack.previewUrl);
      newAudio.currentTime = audioStartTime;
      newAudio.volume = 0.5;
      
      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);

      // Stop after 30 seconds
      setTimeout(() => {
        if (newAudio) {
          newAudio.pause();
          setIsPlaying(false);
        }
      }, 30000);
    }
  };

  const handleStartTimeChange = (value: number[]) => {
    setAudioStartTime(value[0]);
    onSelectTrack(selectedTrack, value[0]);
    
    // Stop current playback if any
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-search', {
        body: { query: searchQuery, limit: 10 },
      });

      if (error) throw error;

      setSearchResults(data.tracks || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching Spotify:', error);
      toast.error("Failed to search music");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectTrack = (track: SpotifyTrack) => {
    onSelectTrack(track, 0);
    setAudioStartTime(0);
    setShowResults(false);
    setSearchQuery("");
  };

  const handleRemoveTrack = () => {
    if (audio) {
      audio.pause();
      audio.src = '';
      setAudio(null);
    }
    setIsPlaying(false);
    setAudioStartTime(0);
    onSelectTrack(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Music className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Add Music</span>
      </div>

      {selectedTrack ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-card/50 border rounded-lg">
            {selectedTrack.albumArt && (
              <img
                src={selectedTrack.albumArt}
                alt={selectedTrack.name}
                className="w-12 h-12 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedTrack.name}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedTrack.artist}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveTrack}
              className="h-8 w-8 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {selectedTrack.previewUrl && (
            <div className="space-y-2 p-3 bg-card/30 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Select 30-second clip</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPreview}
                  className="h-7"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      <span className="text-xs">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      <span className="text-xs">Preview</span>
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-1">
                <Slider
                  value={[audioStartTime]}
                  onValueChange={handleStartTimeChange}
                  max={Math.max(0, selectedTrack.duration - 30)}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(audioStartTime)}</span>
                  <span>{formatTime(audioStartTime + 30)}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Audio will play from {formatTime(audioStartTime)} to {formatTime(audioStartTime + 30)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for a song..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-[300px] overflow-hidden">
              <ScrollArea className="h-full">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No tracks found
                  </div>
                ) : (
                  <div className="p-2">
                    {searchResults.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => handleSelectTrack(track)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors text-left"
                      >
                        {track.albumArt && (
                          <img
                            src={track.albumArt}
                            alt={track.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{track.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {track.artist}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
};