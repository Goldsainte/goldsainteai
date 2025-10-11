import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, TrendingUp, Star } from "lucide-react";
import { BrandPartnershipProposal } from "@/components/BrandPartnershipProposal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Creator {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number;
  total_posts: number;
  engagement_rate: number;
  average_views: number;
}

export default function BrowseCreators() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [proposalOpen, setProposalOpen] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      setLoading(true);

      // Get profiles with basic info
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .not("username", "is", null);

      if (profilesError) throw profilesError;

      // Get follower counts
      const creatorIds = profiles?.map(p => p.id) || [];
      const { data: followData } = await supabase
        .from("user_follows")
        .select("following_id")
        .in("following_id", creatorIds);

      // Get post stats
      const { data: postData } = await supabase
        .from("travel_posts")
        .select("user_id, view_count, like_count, comment_count")
        .in("user_id", creatorIds);

      // Aggregate data per creator
      const creatorsWithStats = profiles?.map(profile => {
        const followerCount = followData?.filter(f => f.following_id === profile.id).length || 0;
        const userPosts = postData?.filter(p => p.user_id === profile.id) || [];
        const totalPosts = userPosts.length;
        const totalViews = userPosts.reduce((sum, p) => sum + (p.view_count || 0), 0);
        const totalEngagement = userPosts.reduce((sum, p) => sum + (p.like_count || 0) + (p.comment_count || 0), 0);
        
        const averageViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
        const engagementRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;

        return {
          id: profile.id,
          username: profile.username || "Unknown",
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          follower_count: followerCount,
          total_posts: totalPosts,
          engagement_rate: engagementRate,
          average_views: averageViews,
        };
      }) || [];

      // Filter creators with at least some activity
      const activeCreators = creatorsWithStats
        .filter(c => c.follower_count >= 100 || c.total_posts >= 5)
        .sort((a, b) => b.follower_count - a.follower_count);

      setCreators(activeCreators);
    } catch (error) {
      console.error("Error fetching creators:", error);
      toast({
        title: "Error",
        description: "Failed to load creators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendProposal = (creator: Creator) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send partnership proposals",
        variant: "destructive",
      });
      return;
    }
    setSelectedCreator(creator);
    setProposalOpen(true);
  };

  const filteredCreators = creators.filter(creator =>
    creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Discover Travel Creators</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Partner with influential travel creators to promote your brand
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search creators by name or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredCreators.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No creators found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </CardContent>
          </Card>
        )}

        {/* Creators Grid */}
        {!loading && filteredCreators.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCreators.map((creator) => (
              <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={creator.avatar_url || undefined} />
                        <AvatarFallback>
                          {creator.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base lg:text-lg truncate">@{creator.username}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          <span className="text-xs">{creator.follower_count.toLocaleString()}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{creator.total_posts}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{creator.engagement_rate}%</p>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Avg. Views per Post</p>
                    <p className="text-base sm:text-lg font-semibold">{creator.average_views.toLocaleString()}</p>
                  </div>

                  <Button 
                    onClick={() => handleSendProposal(creator)}
                    className="w-full min-h-[44px] text-sm"
                  >
                    Send Partnership Proposal
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Partnership Proposal Modal */}
      {selectedCreator && (
        <BrandPartnershipProposal
          open={proposalOpen}
          onOpenChange={setProposalOpen}
          creatorId={selectedCreator.id}
        />
      )}
    </div>
  );
}
