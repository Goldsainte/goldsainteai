import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Eye, Heart, Share2, DollarSign } from "lucide-react";
import { Header } from "@/components/Header";

interface CreatorStats {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_posts: number;
  estimated_earnings: number;
  featured_posts: number;
}

export default function CreatorDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<CreatorStats>({
    total_views: 0,
    total_likes: 0,
    total_shares: 0,
    total_posts: 0,
    estimated_earnings: 0,
    featured_posts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreatorStats();
  }, []);

  const loadCreatorStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's posts and aggregate stats
      const { data: posts } = await supabase
        .from("travel_posts")
        .select("view_count, like_count, share_count, is_featured")
        .eq("user_id", user.id);

      if (posts) {
        const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
        const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
        const totalShares = posts.reduce((sum, p) => sum + (p.share_count || 0), 0);
        const featuredCount = posts.filter(p => p.is_featured).length;

        // Calculate earnings: $0.001/view + $0.01/like + $0.05/share
        const estimatedEarnings = 
          (totalViews * 0.001) + 
          (totalLikes * 0.01) + 
          (totalShares * 0.05);

        setStats({
          total_views: totalViews,
          total_likes: totalLikes,
          total_shares: totalShares,
          total_posts: posts.length,
          estimated_earnings: estimatedEarnings,
          featured_posts: featuredCount,
        });
      }
    } catch (error) {
      console.error("Error loading creator stats:", error);
      toast({
        title: "Error",
        description: "Failed to load creator statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Track your content performance and earnings
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <DollarSign className="w-4 h-4 mr-1" />
            ${stats.estimated_earnings.toFixed(2)} earned
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_views.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ${(stats.total_views * 0.001).toFixed(2)} earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_likes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ${(stats.total_likes * 0.01).toFixed(2)} earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_shares.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ${(stats.total_shares * 0.05).toFixed(2)} earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Featured Posts</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.featured_posts}</div>
              <p className="text-xs text-muted-foreground">
                out of {stats.total_posts} total posts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Info */}
        <Card>
          <CardHeader>
            <CardTitle>How You Earn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="font-medium">Views</p>
                <p className="text-sm text-muted-foreground">
                  Earn $0.001 per view on your travel content
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-red-500 mt-1" />
              <div>
                <p className="font-medium">Likes</p>
                <p className="text-sm text-muted-foreground">
                  Earn $0.01 per like from engaged viewers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <p className="font-medium">Shares</p>
                <p className="text-sm text-muted-foreground">
                  Earn $0.05 per share - help your content go viral!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-yellow-500 mt-1" />
              <div>
                <p className="font-medium">Featured Content</p>
                <p className="text-sm text-muted-foreground">
                  Get featured to boost visibility and earnings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Creator Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">✨ Post authentic travel experiences to build trust</p>
            <p className="text-sm">📍 Tag locations to reach travelers interested in those destinations</p>
            <p className="text-sm">🎬 High-quality videos get more engagement and featured spots</p>
            <p className="text-sm">💬 Engage with comments to build your community</p>
            <p className="text-sm">🔗 Share inspiring content from TikTok/Instagram with proper attribution</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
