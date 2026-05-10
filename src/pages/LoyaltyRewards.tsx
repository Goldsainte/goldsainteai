import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trophy, Star, Gift, TrendingUp, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LoyaltyPoints {
  points_balance: number;
  lifetime_points: number;
  tier: string;
}

interface PointsTransaction {
  id: string;
  points_amount: number;
  transaction_type: string;
  reason: string;
  created_at: string;
}

interface Referral {
  id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  referrer_points_earned: number;
  created_at: string;
}

const tierConfig = {
  bronze: { next: "silver", threshold: 2000, color: "text-orange-600", benefits: ["5% discount on services"] },
  silver: { next: "gold", threshold: 5000, color: "text-gray-400", benefits: ["10% discount", "Priority support"] },
  gold: { next: "platinum", threshold: 10000, color: "text-[#C7A962]", benefits: ["15% discount", "Priority matching", "Free cancellation"] },
  platinum: { next: null, threshold: Infinity, color: "text-purple-600", benefits: ["20% discount", "Dedicated agent", "VIP support", "Exclusive deals"] },
};

export default function LoyaltyRewards() {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoyaltyData();
    generateReferralCode();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get loyalty points
      const { data: points } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setLoyaltyData(points);

      // Get transactions
      const { data: txns } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setTransactions(txns || []);

      // Get referrals
      const { data: refs } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      setReferrals(refs || []);
    } catch (error) {
      console.error("Error loading loyalty data:", error);
      toast.error("Failed to load loyalty data");
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate a simple referral code based on user ID
    const code = `REF${user.id.slice(0, 8).toUpperCase()}`;
    setReferralCode(code);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader><div className="h-6 bg-muted rounded" /></CardHeader>
                <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentTier = loyaltyData?.tier || "bronze";
  const config = tierConfig[currentTier as keyof typeof tierConfig];
  const progress = config.next
    ? ((loyaltyData?.lifetime_points || 0) / config.threshold) * 100
    : 100;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8" />
          Loyalty & Rewards
        </h1>
        <p className="text-muted-foreground mt-2">
          Earn points and unlock exclusive benefits
        </p>
      </div>

      {/* Tier Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-2xl ${config.color}`}>
                {currentTier.toUpperCase()} Tier
              </CardTitle>
              <CardDescription>
                {loyaltyData?.points_balance || 0} points available
              </CardDescription>
            </div>
            <Trophy className={`h-12 w-12 ${config.color}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.next && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {config.next}</span>
                <span>{loyaltyData?.lifetime_points || 0} / {config.threshold} points</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          <div>
            <p className="font-medium mb-2">Your Benefits:</p>
            <ul className="space-y-1">
              {config.benefits.map((benefit, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="earn" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earn">Earn Points</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="referral">Referral Program</TabsTrigger>
        </TabsList>

        <TabsContent value="earn" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Star className="h-8 w-8 text-[#C7A962] mb-2" />
                <CardTitle>Complete Bookings</CardTitle>
                <CardDescription>Earn 100 points per booking</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Gift className="h-8 w-8 text-[#0c4d47] mb-2" />
                <CardTitle>Leave Reviews</CardTitle>
                <CardDescription>Get 50 points for each review</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Refer Friends</CardTitle>
                <CardDescription>Earn 500 points per referral</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{txn.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={txn.points_amount > 0 ? "default" : "secondary"}>
                        {txn.points_amount > 0 ? "+" : ""}{txn.points_amount} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite Friends</CardTitle>
              <CardDescription>
                Share your referral code and earn 500 points for each friend who completes a booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralCode} readOnly />
                <Button onClick={copyReferralLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Your Referrals ({referrals.length})</h4>
                {referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No referrals yet</p>
                ) : (
                  <div className="space-y-2">
                    {referrals.map((ref) => (
                      <div key={ref.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <Badge>{ref.status}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {ref.status === "rewarded" && (
                          <Badge variant="default">+{ref.referrer_points_earned} pts</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
