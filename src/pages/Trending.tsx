import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Hashtag {
  id: string;
  tag: string;
  use_count: number;
  last_used_at: string;
}

const Trending = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from("hashtags")
        .select("*")
        .order("use_count", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHashtags(data || []);
    } catch (error: any) {
      console.error("Error fetching trending hashtags:", error);
      toast({
        title: "Error",
        description: "Failed to load trending hashtags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent(`#${tag}`)}&tab=posts`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Trending</h1>
        </div>
        <p className="text-muted-foreground">
          Discover what's popular in the travel community
        </p>
      </div>

      {hashtags.length === 0 ? (
        <Card className="p-12 text-center">
          <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            No trending hashtags yet
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Start using hashtags in your posts to see trends
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {hashtags.map((hashtag, index) => (
            <Card
              key={hashtag.id}
              className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleHashtagClick(hashtag.tag)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">#{hashtag.tag}</h3>
                    <p className="text-sm text-muted-foreground">
                      {hashtag.use_count} {hashtag.use_count === 1 ? 'post' : 'posts'}
                    </p>
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Export Trending component
export default Trending;
