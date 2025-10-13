import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchGifs, getTrendingGifs, GiphyGif } from "@/lib/giphyHelpers";
import { Search, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GifSelectorProps {
  onSelectGif: (gifUrl: string) => void;
}

export const GifSelector = ({ onSelectGif }: GifSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [trendingGifs, setTrendingGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrendingGifs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadTrendingGifs = async () => {
    setLoading(true);
    const trending = await getTrendingGifs(20);
    setTrendingGifs(trending);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    const results = await searchGifs(searchQuery, 20);
    setGifs(results);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trending">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-2">
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-2 p-2">
              {trendingGifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => onSelectGif(gif.images.fixed_height.url)}
                  className="relative overflow-hidden rounded-lg hover:ring-2 ring-primary transition-all"
                >
                  <img
                    src={gif.images.fixed_width_small.url}
                    alt={gif.title}
                    className="w-full h-auto"
                  />
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="search" className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for GIFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <ScrollArea className="h-[350px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : gifs.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 p-2">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => onSelectGif(gif.images.fixed_height.url)}
                    className="relative overflow-hidden rounded-lg hover:ring-2 ring-primary transition-all"
                  >
                    <img
                      src={gif.images.fixed_width_small.url}
                      alt={gif.title}
                      className="w-full h-auto"
                    />
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No GIFs found</p>
              </div>
            ) : null}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};