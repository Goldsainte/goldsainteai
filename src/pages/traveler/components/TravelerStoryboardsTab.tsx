import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Plus, ArrowRight, Globe, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Storyboard {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean | null;
  cover_image_url: string | null;
  created_at: string;
  item_count?: number;
}

interface TravelerStoryboardsTabProps {
  userId: string;
}

export function TravelerStoryboardsTab({ userId }: TravelerStoryboardsTabProps) {
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoryboards = async () => {
      const { data, error } = await supabase
        .from("storyboards")
        .select(`
          id,
          title,
          description,
          is_public,
          cover_image_url,
          created_at
        `)
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Get item counts for each storyboard
        const storyboardsWithCounts = await Promise.all(
          data.map(async (sb: any) => {
            const { count } = await supabase
              .from("storyboard_items")
              .select("*", { count: "exact", head: true })
              .eq("storyboard_id", sb.id);
            return { 
              id: sb.id,
              title: sb.title,
              description: sb.description,
              is_public: sb.is_public,
              cover_image_url: sb.cover_image_url,
              created_at: sb.created_at,
              item_count: count || 0 
            } as Storyboard;
          })
        );
        setStoryboards(storyboardsWithCounts);
      }
      setLoading(false);
    };

    if (userId) {
      fetchStoryboards();
    }
  }, [userId]);

  const StoryboardCard = ({ storyboard }: { storyboard: Storyboard }) => (
    <Link to={`/storyboards/${storyboard.id}`}>
      <Card className="bg-white border-[#E5DFC6] rounded-2xl hover:shadow-md transition-all group overflow-hidden">
        {/* Cover Image */}
        <div className="aspect-[16/9] bg-[#F6F0E4] relative overflow-hidden">
          {storyboard.cover_image_url ? (
            <img
              src={storyboard.cover_image_url}
              alt={storyboard.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Bookmark className="h-12 w-12 text-[#C7A962]/40" />
            </div>
          )}
          
          {/* Visibility Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              storyboard.is_public 
                ? "bg-white/90 text-[#0a2225]" 
                : "bg-[#0a2225]/80 text-white"
            }`}>
              {storyboard.is_public ? (
                <><Globe className="h-3 w-3" /> Public</>
              ) : (
                <><Lock className="h-3 w-3" /> Private</>
              )}
            </span>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-secondary text-lg text-[#0a2225] line-clamp-1 group-hover:text-[#C7A962] transition-colors">
            {storyboard.title}
          </h3>
          {storyboard.description && (
            <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">
              {storyboard.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[#6B7280]">
              {storyboard.item_count} {storyboard.item_count === 1 ? "item" : "items"}
            </span>
            <ArrowRight className="h-4 w-4 text-[#C7A962] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F6F0E4] flex items-center justify-center">
        <Bookmark className="h-8 w-8 text-[#C7A962]" />
      </div>
      <h3 className="font-secondary text-xl text-[#0a2225] mb-2">No storyboards yet</h3>
      <p className="text-[#6B7280] mb-6 max-w-sm mx-auto">
        Create visual mood boards of your dream trips. Save inspiration, organize ideas, and share with travel experts.
      </p>
      <Button asChild className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full px-6">
        <Link to="/storyboards">
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Storyboard
        </Link>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[4/3] bg-[#F6F0E4] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">Your Inspiration</p>
          <h2 className="font-secondary text-2xl text-[#0a2225] mt-1">Storyboards</h2>
        </div>
        <Button asChild className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full px-6">
          <Link to="/storyboards">
            <Plus className="h-4 w-4 mr-2" />
            New Storyboard
          </Link>
        </Button>
      </div>

      {/* Grid */}
      {storyboards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storyboards.map((storyboard) => (
            <StoryboardCard key={storyboard.id} storyboard={storyboard} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
