import { useState, useEffect } from "react";
import { Search, Play, Pause, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  previewUrl: string | null;
  duration: number;
  appleMusicUrl: string;
}

interface MusicTrackSelectorProps {
  onTrackSelect: (track: {
    id: string;
    name: string;
    artist: string;
    previewUrl: string | null;
    albumArt: string | null;
    startTime?: number;
  }) => void;
  selectedTrack?: {
    id: string;
    name: string;
    artist: string;
    previewUrl: string | null;
    albumArt: string | null;
    startTime?: number;
  } | null;
  compact?: boolean;
}

export const MusicTrackSelector = ({ onTrackSelect, selectedTrack, compact = false }: MusicTrackSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [clipStartTime, setClipStartTime] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioElement?.pause();
      setAudioElement(null);
    };
  }, [audioElement]);

  const searchTracks = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorText(null);
    try {
      // Primary: backend function
      const { data, error } = await supabase.functions.invoke('apple-music-search', {
        body: { query: searchQuery }
      });

      if (error) throw error;

      const list: Track[] = data?.tracks ?? [];
      setTracks(list);
      if (list.length === 0) {
        setErrorText(null);
      }

    } catch (error: any) {
      console.error('Error searching tracks:', error);
      const rawMsg = (error?.context?.value?.message as string) || (error?.message as string) || '';
      if (rawMsg.toLowerCase().includes('unauthorized')) {
        setErrorText('Please sign in to search for tracks.');
      } else {
        setErrorText('Unable to search for music right now. Please try again.');
      }
      toast.error('Failed to search tracks');
    } finally {
      setIsSearching(false);
    }
  };

  const togglePlay = async (track: Track) => {
    if (!track.previewUrl) {
      toast.error('No preview available for this track');
      return;
    }

    if (playingTrackId === track.id) {
      audioElement?.pause();
      setPlayingTrackId(null);
      setAudioElement(null);
    } else {
      audioElement?.pause();
      const audio = new Audio();
      (audio as any).crossOrigin = 'anonymous';
      audio.src = track.previewUrl;
      audio.currentTime = clipStartTime;
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        toast.error('Unable to play preview. Try another track.');
        setPlayingTrackId(null);
        setAudioElement(null);
      };

      audio.onended = () => {
        setPlayingTrackId(null);
        setAudioElement(null);
      };

      try {
        await audio.play();
        setAudioElement(audio);
        setPlayingTrackId(track.id);
        setCurrentTrack(track);
      } catch (error) {
        console.error('Play error:', error);
        toast.error('Unable to play preview. Click play again or try another track.');
        setPlayingTrackId(null);
        setAudioElement(null);
      }
    }
  };

  const handleSelectTrack = (track: Track) => {
    onTrackSelect({
      id: track.id,
      name: track.name,
      artist: track.artist,
      previewUrl: track.previewUrl,
      albumArt: track.albumArt,
      startTime: clipStartTime
    });
    // Keep preview playing so user can hear their selection
  };

  const handleClipTimeChange = (value: number[]) => {
    const newTime = value[0];
    setClipStartTime(newTime);
    if (audioElement && currentTrack?.previewUrl) {
      audioElement.currentTime = newTime;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <Music2 className="h-4 w-4 text-primary" />
          Add Music from Apple Music
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Search for a song..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchTracks()}
          />
          <Button
            onClick={searchTracks}
            disabled={isSearching || !searchQuery.trim()}
            variant="outline"
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {errorText && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>
              {errorText}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {selectedTrack && (
        <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            {selectedTrack.albumArt && (
              <img
                src={selectedTrack.albumArt}
                alt={selectedTrack.name}
                className="w-12 h-12 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{selectedTrack.name}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedTrack.artist}</p>
              {selectedTrack.startTime !== undefined && (
                <p className="text-xs text-primary">Clip starts at {selectedTrack.startTime}s</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTrackSelect(null as any)}
            >
              Remove
            </Button>
          </div>
        </div>
      )}

      {tracks.length > 0 && (
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4 space-y-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {track.albumArt && (
                  <img
                    src={track.albumArt}
                    alt={track.album}
                    className="w-12 h-12 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 pr-2">
                  <p className="font-medium text-sm truncate break-words">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate break-words">{track.artist}</p>
                  <p className="text-xs text-muted-foreground truncate break-words">{track.album}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  {track.previewUrl ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePlay(track)}
                      className="h-8 w-8"
                    >
                      {playingTrackId === track.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      className="h-8 w-8 opacity-30"
                      title="No preview available"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant={selectedTrack?.id === track.id ? "secondary" : "default"}
                    size="sm"
                    disabled={selectedTrack?.id === track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="min-w-[76px] whitespace-nowrap"
                  >
                    {selectedTrack?.id === track.id ? "Selected" : "Select"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {currentTrack && playingTrackId && (
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs">Adjust clip start time (0-{Math.min(90, currentTrack.duration)}s)</Label>
          <Slider
            value={[clipStartTime]}
            onValueChange={handleClipTimeChange}
            max={Math.min(90, currentTrack.duration)}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-center text-muted-foreground">
            Clip will start at {clipStartTime}s
          </p>
        </div>
      )}

      {isSearching && (
        <div className="text-center py-8 text-muted-foreground">
          <Music2 className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          <p>Searching Apple Music...</p>
        </div>
      )}

      {!isSearching && tracks.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <Music2 className="h-8 w-8 mx-auto mb-2" />
          <p>No tracks found. Try a different search.</p>
        </div>
      )}
    </div>
  );
};