import { useState, useCallback, useEffect } from "react";
import { Search, Music, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  onSelectTrack: (track: SpotifyTrack | null) => void;
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
    onSelectTrack(track);
    setShowResults(false);
    setSearchQuery("");
  };

  const handleRemoveTrack = () => {
    onSelectTrack(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Music className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Add Music</span>
      </div>

      {selectedTrack ? (
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