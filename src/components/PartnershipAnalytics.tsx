import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { TrendingUp, Eye, Heart, MessageCircle, Share2, Bookmark, MousePointerClick } from "lucide-react";

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
    image_urls: string[] | null;
    video_url: string | null;
    thumbnail_url: string | null;
    media_type: string | null;
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
          post:travel_posts(caption, image_urls, video_url, thumbnail_url, media_type),
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
    return <div className="text-center py-8 text-sm text-[#6B7280]">Loading analytics…</div>;
  }

  if (analytics.length === 0) {
    return (
      <div className="bg-white border border-[#E5DFC6] rounded-2xl p-10 text-center">
        <TrendingUp className="h-10 w-10 mx-auto mb-4 text-[#C7A962]" />
        <h3 className="font-secondary text-lg text-[#0a2225] mb-1">No analytics yet</h3>
        <p className="text-sm text-[#6B7280]">
          Approved partnership posts will surface their performance here.
        </p>
      </div>
    );
  }

  const StatItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-[#C7A962]" />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-[#7A7151]">{label}</p>
        <p className="text-lg font-medium text-[#0a2225]">{value.toLocaleString()}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {analytics.map((data) => (
        <div
          key={data.partnership_id}
          className="bg-white border border-[#E5DFC6] rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <Avatar className="h-10 w-10">
              <AvatarImage src={data.creator.avatar_url || ""} />
              <AvatarFallback className="bg-[#F5F0E0] text-[#0a2225]">
                {data.creator.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-secondary text-base text-[#0a2225]">@{data.creator.username}</p>
              <p className="text-xs text-[#6B7280] line-clamp-1">
                {data.post.caption}
              </p>
            </div>
            <span className="rounded-full bg-[#FDF9F0] border border-[#E5DFC6] px-3 py-1 text-[10px] uppercase tracking-wide text-[#0c4d47]">
              Active
            </span>
          </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem icon={Eye} label="Views" value={data.views} />
              <StatItem icon={Heart} label="Likes" value={data.likes} />
              <StatItem icon={MessageCircle} label="Comments" value={data.comments} />
              <StatItem icon={Share2} label="Shares" value={data.shares} />
              <StatItem icon={Bookmark} label="Saves" value={data.saves} />
              <StatItem icon={MousePointerClick} label="Click-throughs" value={data.click_throughs} />
            </div>
        </div>
      ))}
    </div>
  );
};
