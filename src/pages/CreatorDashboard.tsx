import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Eye, Heart, Share2, DollarSign, Coins, Briefcase, ShoppingBag, Users, Plus, MapPin, Calendar, Star, Sparkles, ArrowLeft } from "lucide-react";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { BuyCoinsModal } from "@/components/BuyCoinsModal";
import { PartnershipRequests } from "@/components/PartnershipRequests";
import { CreatorStripeOnboarding } from "@/components/CreatorStripeOnboarding";
import { CreateProductModal } from "@/components/CreateProductModal";
import { CreatorEscrowDashboard } from "@/components/CreatorEscrowDashboard";
import { PackageMarketingEditor } from "@/components/PackageMarketingEditor";
import { ItineraryTemplateBuilder } from "@/components/ItineraryTemplateBuilder";
import { CreatorTierCard } from "@/components/CreatorTierCard";
import { TierUpgradeHistory } from "@/components/TierUpgradeHistory";
import { AllTiersOverview } from "@/components/AllTiersOverview";
import { TierSystemExplainer } from "@/components/TierSystemExplainer";

interface CreatorStats {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_posts: number;
  total_comments: number;
  estimated_earnings: number;
  featured_posts: number;
  base_earnings: number;
  duration_bonus: number;
  retention_bonus: number;
  engagement_bonus: number;
}

interface VerificationStatus {
  is_verified_creator: boolean;
  total_followers: number;
  views_last_30_days: number;
  original_content_count: number;
  total_content_count: number;
}

export default function CreatorDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { balance: coinBalance, refetch: refetchCoins } = useCoinBalance();
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<CreatorStats>({
    total_views: 0,
    total_likes: 0,
    total_shares: 0,
    total_comments: 0,
    total_posts: 0,
    estimated_earnings: 0,
    featured_posts: 0,
    base_earnings: 0,
    duration_bonus: 0,
    retention_bonus: 0,
    engagement_bonus: 0,
  });
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
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

      // Check verification status
      const { data: verificationData } = await supabase
        .from("creator_verification_status")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (verificationData) {
        setVerificationStatus(verificationData);
      }

      // Check eligibility (this will update verification status)
      await supabase.rpc('check_creator_eligibility', { p_user_id: user.id });

      // Get user's posts and aggregate stats with new analytics
      const { data: posts } = await supabase
        .from("travel_posts")
        .select("view_count, like_count, share_count, comment_count, is_featured, video_duration_seconds, total_watch_time_seconds, average_watch_percentage")
        .eq("user_id", user.id);

      if (posts) {
        const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
        const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
        const totalShares = posts.reduce((sum, p) => sum + (p.share_count || 0), 0);
        const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
        const featuredCount = posts.filter(p => p.is_featured).length;

        // Calculate advanced earnings for each post
        let totalBaseEarnings = 0;
        let totalDurationBonus = 0;
        let totalRetentionBonus = 0;
        let totalEngagementBonus = 0;

        for (const post of posts) {
          const duration = post.video_duration_seconds || 0;
          const watchTime = post.total_watch_time_seconds || 0;
          const retention = post.average_watch_percentage || 0;
          const views = post.view_count || 0;
          const likes = post.like_count || 0;
          const shares = post.share_count || 0;
          const comments = post.comment_count || 0;

          // Base earnings
          const baseEarnings = views * 0.0005;
          totalBaseEarnings += baseEarnings;

          // Duration bonus
          let durationBonus = 0;
          if (duration > 30 && duration <= 60) {
            durationBonus = baseEarnings * 0.2;
          } else if (duration > 60 && duration <= 180) {
            durationBonus = baseEarnings * 0.5;
          } else if (duration > 180) {
            durationBonus = baseEarnings * 1.0;
          }
          totalDurationBonus += durationBonus;

          // Retention bonus
          if (retention >= 50) {
            const retentionBonus = baseEarnings * (retention / 100);
            totalRetentionBonus += retentionBonus;
          }

          // Engagement bonus
          const engagementBonus = (likes * 0.01) + (comments * 0.02) + (shares * 0.05);
          totalEngagementBonus += engagementBonus;
        }

        const estimatedEarnings = totalBaseEarnings + totalDurationBonus + totalRetentionBonus + totalEngagementBonus;

        setStats({
          total_views: totalViews,
          total_likes: totalLikes,
          total_shares: totalShares,
          total_comments: totalComments,
          total_posts: posts.length,
          estimated_earnings: estimatedEarnings,
          featured_posts: featuredCount,
          base_earnings: totalBaseEarnings,
          duration_bonus: totalDurationBonus,
          retention_bonus: totalRetentionBonus,
          engagement_bonus: totalEngagementBonus,
        });
      }

      // Refresh verification status after calculation
      const { data: updatedVerification } = await supabase
        .from("creator_verification_status")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (updatedVerification) {
        setVerificationStatus(updatedVerification);
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
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 font-secondary">Creator Dashboard</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Track your content performance, earnings, and partnerships
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1.5 md:py-2 whitespace-nowrap">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.estimated_earnings)} earned
              </Badge>
              <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1.5 md:py-2 cursor-pointer whitespace-nowrap" onClick={() => setBuyCoinsOpen(true)}>
                <Coins className="w-4 h-4 mr-1 text-yellow-500" />
                {coinBalance} coins
              </Badge>
            </div>
          </div>

          {/* Creator Verification Status */}
          {verificationStatus && (
            <Card className={verificationStatus.is_verified_creator ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Creator Eligibility Status</h3>
                    <Badge variant={verificationStatus.is_verified_creator ? "default" : "secondary"}>
                      {verificationStatus.is_verified_creator ? "✓ Verified Creator" : "Not Yet Verified"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Followers</p>
                      <p className={`font-bold ${verificationStatus.total_followers >= 10000 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {verificationStatus.total_followers.toLocaleString()} / 10,000
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Views (Last 30 Days)</p>
                      <p className={`font-bold ${verificationStatus.views_last_30_days >= 100000 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {verificationStatus.views_last_30_days.toLocaleString()} / 100,000
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Original Content</p>
                      <p className={`font-bold ${(verificationStatus.original_content_count / Math.max(verificationStatus.total_content_count, 1)) >= 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {Math.round((verificationStatus.original_content_count / Math.max(verificationStatus.total_content_count, 1)) * 100)}% (Need 80%+)
                      </p>
                    </div>
                  </div>

                  {!verificationStatus.is_verified_creator && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        <strong>Creator Requirements:</strong> To earn money from your content, you need 10,000+ followers, 100,000+ video views in the last 30 days, and mostly original content (80%+).
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Access Navigation */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 mb-8">
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 text-sm md:text-base h-auto py-2 md:py-2.5"
            onClick={() => navigate('/cocurated-dashboard')}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">CoCurated™</span>
            <span className="sm:hidden">CoCurated</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 text-sm md:text-base h-auto py-2 md:py-2.5"
            onClick={() => setCreateProductOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Product/Package</span>
            <span className="sm:hidden">Create</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 text-sm md:text-base h-auto py-2 md:py-2.5"
            onClick={() => navigate('/shop')}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Visit Shop</span>
            <span className="sm:hidden">Shop</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 text-sm md:text-base h-auto py-2 md:py-2.5"
            onClick={() => navigate('/marketplace')}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Agent Marketplace</span>
            <span className="sm:hidden">Marketplace</span>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tier" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <Star className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Tier</span>
            </TabsTrigger>
            <TabsTrigger value="escrow" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Escrow</span>
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <Briefcase className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Packages</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="partnerships" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <Briefcase className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Partners</span>
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
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.total_views * 0.001)} earned
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
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.total_likes * 0.01)} earned
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
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.total_shares * 0.05)} earned
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

        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Your earnings are calculated based on multiple performance factors</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Base Earnings</p>
                <p className="text-lg font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.base_earnings)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Duration Bonus</p>
                <p className="text-lg font-bold text-blue-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.duration_bonus)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Retention Bonus</p>
                <p className="text-lg font-bold text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.retention_bonus)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Engagement Bonus</p>
                <p className="text-lg font-bold text-purple-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.engagement_bonus)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How You Earn Info */}
        <Card>
          <CardHeader>
            <CardTitle>How Payouts Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
              <AlertDescription>
                <strong>Only verified creators earn money.</strong> You must meet all requirements: 10,000+ followers, 100,000+ views in last 30 days, and 80%+ original content.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Earning Factors</h3>
              
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Video Length (Duration Bonus)</p>
                  <p className="text-sm text-muted-foreground">
                    Longer videos earn more: 0-30s (1x), 31-60s (1.2x), 61-180s (1.5x), 181s+ (2x base rate)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Watch Time & Retention</p>
                  <p className="text-sm text-muted-foreground">
                    Higher retention (50%+) earns significant bonuses. Keep viewers engaged throughout your video.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Engagement</p>
                  <p className="text-sm text-muted-foreground">
                    Likes, comments, and shares boost your earnings. Active community engagement pays off.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Viewer Region</p>
                  <p className="text-sm text-muted-foreground">
                    Earnings vary by viewer location. Premium regions have higher earning rates.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Direct Monetization</h3>
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Virtual Gifts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive virtual gifts from fans on your posts. Each gift converts to real money (70-80% payout).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Product & Package Sales</p>
                  <p className="text-sm text-muted-foreground">
                    Sell travel packages, guides, presets, and digital products. Keep up to 85% after platform fees.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Brand Partnerships</p>
                  <p className="text-sm text-muted-foreground">
                    Collaborate with brands on sponsored content. Negotiate your own rates and build lasting partnerships.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Affiliate Commissions</p>
                  <p className="text-sm text-muted-foreground">
                    Earn commissions by sharing affiliate links to hotels, tours, and travel products you recommend.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">💡 Pro Tip</p>
                <p className="text-xs text-muted-foreground">
                  Diversify your income streams! Successful creators combine engagement earnings, virtual gifts, product sales, and brand partnerships for maximum revenue.
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

          <TabsContent value="tier" className="space-y-6">
            <TierSystemExplainer />
            <CreatorTierCard />
            <AllTiersOverview />
            <TierUpgradeHistory />
          </TabsContent>

          <TabsContent value="escrow">
            <CreatorEscrowDashboard />
          </TabsContent>

          <TabsContent value="packages">
            <PackageMarketingEditor />
          </TabsContent>

          <TabsContent value="templates">
            <ItineraryTemplateBuilder />
          </TabsContent>

          <TabsContent value="partnerships">
            <PartnershipRequests />
          </TabsContent>
        </Tabs>
      </div>

      <BuyCoinsModal open={buyCoinsOpen} onOpenChange={setBuyCoinsOpen} />
      <CreateProductModal open={createProductOpen} onOpenChange={setCreateProductOpen} />
    </div>
  );
}
