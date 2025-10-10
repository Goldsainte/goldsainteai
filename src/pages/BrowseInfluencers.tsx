import { useState, useEffect } from "react";
import { Search, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentInfluencerInvite } from "@/components/AgentInfluencerInvite";
import { toast } from "sonner";

interface Influencer {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number;
  engagement_rate: number;
}

export default function BrowseInfluencers() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      // Fetch users with followers and posts
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          bio
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate follower count and engagement for each profile
      const influencersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: followerCount } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);

          const { data: posts } = await supabase
            .from('travel_posts')
            .select('like_count, comment_count, view_count')
            .eq('user_id', profile.id);

          const totalEngagement = posts?.reduce(
            (sum, post) => sum + (post.like_count || 0) + (post.comment_count || 0),
            0
          ) || 0;
          const totalViews = posts?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 1;
          const engagementRate = (totalEngagement / totalViews) * 100;

          return {
            ...profile,
            follower_count: followerCount || 0,
            engagement_rate: Math.round(engagementRate * 10) / 10,
          };
        })
      );

      // Filter to show only those with at least some followers
      const qualifiedInfluencers = influencersWithStats
        .filter((inf) => inf.follower_count >= 100)
        .sort((a, b) => b.follower_count - a.follower_count);

      setInfluencers(qualifiedInfluencers);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      toast.error("Failed to load influencers");
    } finally {
      setLoading(false);
    }
  };

  const filteredInfluencers = influencers.filter((inf) =>
    inf.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Influencers</h1>
          <p className="text-muted-foreground">
            Discover creators to promote your packages
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search influencers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading influencers...</p>
          </div>
        ) : filteredInfluencers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No influencers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInfluencers.map((influencer) => (
              <Card key={influencer.id} className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={influencer.avatar_url || ""} />
                    <AvatarFallback>
                      {influencer.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2 w-full">
                    <h3 className="font-semibold text-lg">@{influencer.username}</h3>
                    {influencer.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {influencer.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4 w-full justify-center">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <Users className="h-4 w-4" />
                        {influencer.follower_count}
                      </div>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        {influencer.engagement_rate}%
                      </div>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedInfluencer(influencer)}
                    className="w-full"
                  >
                    Invite to Promote
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedInfluencer && (
        <AgentInfluencerInvite
          influencer={selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
          onSuccess={() => {
            setSelectedInfluencer(null);
            toast.success("Invitation sent!");
          }}
        />
      )}
    </div>
  );
}
