import { useState, useEffect } from "react";
import { TrendingUp, Eye, Heart, MessageCircle, Share2, Bookmark, MousePointerClick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AnalyticsData {
  partnership_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  click_throughs: number;
  post: {
    caption: string;
    media_url: string;
  };
  creator: {
    username: string;
    avatar_url: string | null;
  };
}

export const PartnershipAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Get approved partnerships for this brand
      const { data: partnerships, error: partnershipError } = await supabase
        .from("paid_partnerships")
        .select(`
          id,
          post:travel_posts(caption, media_url),
          creator:profiles!paid_partnerships_creator_id_fkey(username, avatar_url)
        `)
        .eq("brand_id", user?.id)
        .eq("status", "approved");

      if (partnershipError) throw partnershipError;

      // Get analytics for each partnership
      const analyticsPromises = (partnerships || []).map(async (p: any) => {
        const { data: analyticsData } = await supabase
          .from("partnership_analytics")
          .select("*")
          .eq("partnership_id", p.id)
          .order("date", { ascending: false })
          .limit(1)
          .single();

        return {
          partnership_id: p.id,
          views: analyticsData?.views || 0,
          likes: analyticsData?.likes || 0,
          comments: analyticsData?.comments || 0,
          shares: analyticsData?.shares || 0,
          saves: analyticsData?.saves || 0,
          click_throughs: analyticsData?.click_throughs || 0,
          post: p.post,
          creator: p.creator,
        };
      });

      const results = await Promise.all(analyticsPromises);
      setAnalytics(results);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (analytics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No partnership analytics available yet</p>
      </div>
    );
  }

  const StatItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value.toLocaleString()}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {analytics.map((data) => (
        <Card key={data.partnership_id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={data.creator.avatar_url || ""} />
                <AvatarFallback>
                  {data.creator.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-base">@{data.creator.username}</CardTitle>
                <CardDescription className="text-sm line-clamp-1">
                  {data.post.caption}
                </CardDescription>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem icon={Eye} label="Views" value={data.views} />
              <StatItem icon={Heart} label="Likes" value={data.likes} />
              <StatItem icon={MessageCircle} label="Comments" value={data.comments} />
              <StatItem icon={Share2} label="Shares" value={data.shares} />
              <StatItem icon={Bookmark} label="Saves" value={data.saves} />
              <StatItem icon={MousePointerClick} label="Click-throughs" value={data.click_throughs} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
