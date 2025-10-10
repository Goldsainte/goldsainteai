import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, MapPin, Calendar, Users, DollarSign, TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface AgentPackage {
  id: string;
  package_name: string;
  description: string;
  destination: string;
  duration_days: number;
  retail_price: number;
  wholesale_cost: number;
  currency: string;
  agent_commission_percentage: number;
  influencer_commission_percentage: number;
  available_from: string;
  available_until: string;
  max_participants: number;
  inclusions: any;
  exclusions: any;
  travel_agents: {
    agency_name: string;
    rating: number;
  };
}

interface Promotion {
  id: string;
  package_id: string;
  status: string;
  promo_code: string;
  clicks: number;
  conversions: number;
  total_commission_earned: number;
}

export default function CoCuratedMarketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<AgentPackage[]>([]);
  const [myPromotions, setMyPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPackages();
    fetchMyPromotions();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_packages')
        .select(`
          *,
          travel_agents (
            agency_name,
            rating
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPromotions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('influencer_promotions')
        .select('*')
        .eq('influencer_id', user.id);

      if (error) throw error;
      setMyPromotions(data || []);
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
    }
  };

  const requestPromotion = async (packageId: string, packageName: string) => {
    if (!user) {
      toast.error('Please sign in to promote packages');
      navigate('/auth');
      return;
    }

    try {
      // Generate promo code: PACKAGE_USERNAME (simplified, max 20 chars)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      const username = profile?.username || user.email?.split('@')[0] || 'USER';
      const packagePrefix = packageName.substring(0, 8).toUpperCase().replace(/\s/g, '');
      const promoCode = `${packagePrefix}_${username.substring(0, 8).toUpperCase()}`;

      const { error } = await supabase
        .from('influencer_promotions')
        .insert({
          package_id: packageId,
          influencer_id: user.id,
          promo_code: promoCode,
          status: 'pending',
          approved_by_agent: false,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a promotion request for this package');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Promotion request sent! Waiting for agent approval');
      fetchMyPromotions();
    } catch (error: any) {
      console.error('Error requesting promotion:', error);
      toast.error(error.message || 'Failed to request promotion');
    }
  };

  const getPromotionStatus = (packageId: string) => {
    return myPromotions.find(p => p.package_id === packageId);
  };

  const calculatePotentialEarnings = (pkg: AgentPackage) => {
    const margin = pkg.retail_price - pkg.wholesale_cost;
    return margin * (pkg.influencer_commission_percentage / 100);
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">CoCurated™ Marketplace</h1>
          </div>
          <p className="text-sm text-muted-foreground">Discover and promote travel packages with shared commissions</p>
        </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by destination or package name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading packages...</div>
      ) : filteredPackages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No packages available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const promotion = getPromotionStatus(pkg.id);
            const potentialEarnings = calculatePotentialEarnings(pkg);

            return (
              <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">{pkg.package_name}</CardTitle>
                      <CardDescription className="text-xs">
                        by {pkg.travel_agents?.agency_name}
                      </CardDescription>
                    </div>
                    {promotion && (
                      <Badge variant={
                        promotion.status === 'active' ? 'default' :
                        promotion.status === 'pending' ? 'secondary' : 'outline'
                      }>
                        {promotion.status}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {pkg.destination}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {pkg.duration_days}d
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm line-clamp-2">{pkg.description}</p>

                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Customer Price:</span>
                      <span className="font-semibold">${pkg.retail_price.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-primary font-medium">Your Commission ({pkg.influencer_commission_percentage}%):</span>
                      <span className="text-primary font-bold">${potentialEarnings.toFixed(0)}</span>
                    </div>
                  </div>

                  {promotion?.status === 'active' && (
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="font-semibold text-primary">{promotion.clicks}</div>
                        <div className="text-xs text-muted-foreground">Clicks</div>
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{promotion.conversions}</div>
                        <div className="text-xs text-muted-foreground">Sales</div>
                      </div>
                      <div>
                        <div className="font-semibold text-primary">${promotion.total_commission_earned.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">Earned</div>
                      </div>
                    </div>
                  )}

                  {!promotion ? (
                    <Button 
                      onClick={() => requestPromotion(pkg.id, pkg.package_name)}
                      className="w-full"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Request to Promote
                    </Button>
                  ) : promotion.status === 'pending' ? (
                    <Button disabled className="w-full" variant="secondary">
                      Awaiting Agent Approval
                    </Button>
                  ) : promotion.status === 'active' ? (
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/cocurated-promotion/${promotion.id}`)}
                    >
                      View Promotion Details
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </main>
      <Footer />
    </div>
  );
}