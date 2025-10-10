import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Eye, Heart, Share2, DollarSign, Coins, Briefcase, ShoppingBag, Users } from "lucide-react";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { BuyCoinsModal } from "@/components/BuyCoinsModal";
import { PartnershipRequests } from "@/components/PartnershipRequests";
import { CreatorStripeOnboarding } from "@/components/CreatorStripeOnboarding";

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
  const navigate = useNavigate();
  const { balance: coinBalance, refetch: refetchCoins } = useCoinBalance();
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
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
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    const coinsPurchased = searchParams.get('coins_purchased');
    const sessionId = searchParams.get('session_id');
    
    if (coinsPurchased === 'true' && sessionId) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-coin-payment', {
          body: { session_id: sessionId }
        });

        if (error) throw error;

        if (data?.success) {
          toast({
            title: "Coins Added! 🎉",
            description: `${data.coins_added} coins added to your balance`,
          });
          refetchCoins();
        }
      } catch (error) {
        console.error('Error verifying coin payment:', error);
      } finally {
        // Clean up URL
        searchParams.delete('coins_purchased');
        searchParams.delete('session_id');
        setSearchParams(searchParams);
      }
    }
  };

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 font-secondary">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Track your content performance, earnings, and partnerships
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <DollarSign className="w-4 h-4 mr-1" />
              ${stats.estimated_earnings.toFixed(2)} earned
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2 cursor-pointer" onClick={() => setBuyCoinsOpen(true)}>
              <Coins className="w-4 h-4 mr-1 text-yellow-500" />
              {coinBalance} coins
            </Badge>
          </div>
        </div>

        {/* Quick Access Navigation */}
        <div className="flex gap-3 mb-8">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/shop')}
          >
            <ShoppingBag className="w-4 h-4" />
            Visit Shop
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/marketplace')}
          >
            <Users className="w-4 h-4" />
            Agent Marketplace
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="partnerships" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Brand Partnerships
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stripe Payout Setup */}
            <CreatorStripeOnboarding />

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

            {/* Coin Balance & Purchase */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  Virtual Coins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{coinBalance}</p>
                    <p className="text-sm text-muted-foreground">Available Coins</p>
                  </div>
                  <Button onClick={() => setBuyCoinsOpen(true)}>
                    Buy More Coins
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use coins to send virtual gifts to other creators and show your support!
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partnerships">
            <PartnershipRequests />
          </TabsContent>
        </Tabs>
      </div>

      <BuyCoinsModal open={buyCoinsOpen} onOpenChange={setBuyCoinsOpen} />
    </div>
  );
}
