import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PackageSearchHero } from "@/components/PackageSearchHero";
import { DestinationCard } from "@/components/DestinationCard";
import { CategoryPackageSection } from "@/components/CategoryPackageSection";
import { PackageStatsBar } from "@/components/PackageStatsBar";
import { EnhancedPackageCard } from "@/components/EnhancedPackageCard";
import { PackageFilters, PackageFilterState } from "@/components/PackageFilters";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface AgentPackage {
  id: string;
  agent_id: string;
  package_name: string;
  description?: string;
  destination: string;
  duration_days: number;
  retail_price: number;
  wholesale_cost?: number;
  currency: string;
  agent_commission_percentage?: number;
  influencer_commission_percentage?: number;
  available_from?: string;
  available_until?: string;
  max_participants?: number;
  inclusions?: any;
  exclusions?: any;
  highlights?: any;
  cover_image_url?: string;
  trip_type?: string;
  status: string;
  is_active: boolean;
  travel_agents?: {
    agency_name: string;
    rating?: number;
    total_reviews?: number;
    user_id: string;
  };
}

interface Promotion {
  id: string;
  package_id: string;
  status: string;
  promo_code?: string;
}

export default function CoCuratedJourneys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [packages, setPackages] = useState<AgentPackage[]>([]);
  const [topDestinations, setTopDestinations] = useState<any[]>([]);
  const [myPromotions, setMyPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalDestinations: 0,
    averageRating: 0,
  });
  
  const [packageFilters, setPackageFilters] = useState<PackageFilterState>({
    priceRange: [0, 10000],
    durationRanges: [],
    destinations: [],
    tripTypes: [],
    minRating: 0,
    dateRange: {},
  });

  useEffect(() => {
    fetchPackages();
    fetchTopDestinations();
    fetchMyPromotions();
    fetchStats();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_packages')
        .select(`
          *,
          travel_agents (
            agency_name,
            rating,
            total_reviews,
            user_id
          )
        `)
        .eq('is_active', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error("Failed to load packages");
    }
  };

  const fetchTopDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_packages')
        .select('destination, cover_image_url, retail_price')
        .eq('is_active', true)
        .eq('status', 'active');

      if (error) throw error;

      const destinationMap = new Map();
      data?.forEach(pkg => {
        const dest = pkg.destination;
        if (!destinationMap.has(dest)) {
          destinationMap.set(dest, {
            destination: dest,
            packageCount: 0,
            startingPrice: pkg.retail_price,
            imageUrl: pkg.cover_image_url,
          });
        }
        const destData = destinationMap.get(dest);
        destData.packageCount++;
        destData.startingPrice = Math.min(destData.startingPrice, pkg.retail_price);
      });

      const destinations = Array.from(destinationMap.values())
        .sort((a, b) => b.packageCount - a.packageCount)
        .slice(0, 8);

      setTopDestinations(destinations);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: packagesData, error: packagesError } = await supabase
        .from('agent_packages')
        .select('id, destination')
        .eq('is_active', true)
        .eq('status', 'active');

      const { data: agentsData, error: agentsError } = await supabase
        .from('travel_agents')
        .select('rating')
        .eq('is_active', true);

      if (packagesError || agentsError) throw packagesError || agentsError;

      const uniqueDestinations = new Set(packagesData?.map(p => p.destination) || []);
      const avgRating = agentsData?.length 
        ? agentsData.reduce((sum, a) => sum + (a.rating || 0), 0) / agentsData.length 
        : 0;

      setStats({
        totalPackages: packagesData?.length || 0,
        totalDestinations: uniqueDestinations.size,
        averageRating: avgRating,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const requestPromotion = async (packageId: string) => {
    if (!user) {
      toast.error('Please sign in to request promotions');
      navigate('/auth');
      return;
    }

    try {
      const promoCode = `${user.id.slice(0, 8).toUpperCase()}-${packageId.slice(0, 8).toUpperCase()}`;
      
      const { error } = await supabase
        .from('influencer_promotions')
        .insert({
          package_id: packageId,
          influencer_id: user.id,
          status: 'active',
          promo_code: promoCode,
        });

      if (error) throw error;
      
      toast.success(`Promotion activated! Your code: ${promoCode}`);
      fetchMyPromotions();
    } catch (error: any) {
      console.error('Error requesting promotion:', error);
      toast.error('Failed to activate promotion');
    }
  };

  const getPromotionStatus = (packageId: string) => {
    return myPromotions.some(p => p.package_id === packageId && p.status === 'active');
  };

  const uniqueDestinations = Array.from(new Set(packages.map(pkg => pkg.destination))).sort();

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = searchQuery === "" || 
      pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = pkg.retail_price >= packageFilters.priceRange[0] && 
      pkg.retail_price <= packageFilters.priceRange[1];
    
    const matchesDuration = packageFilters.durationRanges.length === 0 ||
      packageFilters.durationRanges.some(rangeId => {
        if (rangeId === '1-3') return pkg.duration_days >= 1 && pkg.duration_days <= 3;
        if (rangeId === '4-7') return pkg.duration_days >= 4 && pkg.duration_days <= 7;
        if (rangeId === '8-14') return pkg.duration_days >= 8 && pkg.duration_days <= 14;
        if (rangeId === '15+') return pkg.duration_days >= 15;
        return false;
      });
    
    const matchesDestination = packageFilters.destinations.length === 0 ||
      packageFilters.destinations.includes(pkg.destination);

    const matchesTripType = packageFilters.tripTypes.length === 0 ||
      (pkg.trip_type && packageFilters.tripTypes.includes(pkg.trip_type.toLowerCase()));

    const matchesRating = packageFilters.minRating === 0 ||
      (pkg.travel_agents?.rating && pkg.travel_agents.rating >= packageFilters.minRating);

    return matchesSearch && matchesPrice && matchesDuration && matchesDestination && matchesTripType && matchesRating;
  });

  const adventurePackages = packages.filter(p => p.trip_type?.toLowerCase().includes('adventure'));
  const luxuryPackages = packages.filter(p => p.trip_type?.toLowerCase().includes('luxury'));
  const familyPackages = packages.filter(p => p.trip_type?.toLowerCase().includes('family'));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PackageSearchHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={() => {}}
        />

        <PackageStatsBar
          totalPackages={stats.totalPackages}
          totalDestinations={stats.totalDestinations}
          averageRating={stats.averageRating}
        />

        <div className="container mx-auto px-4 py-12">
          {topDestinations.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Popular Destinations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topDestinations.map((dest, idx) => (
                  <DestinationCard key={idx} {...dest} />
                ))}
              </div>
            </div>
          )}

          {adventurePackages.length > 0 && (
            <CategoryPackageSection
              title="Top Adventure Packages"
              description="Thrilling experiences for the adventurous soul"
              packages={adventurePackages}
              myPromotions={myPromotions}
              onRequestPromotion={requestPromotion}
            />
          )}

          {luxuryPackages.length > 0 && (
            <CategoryPackageSection
              title="Luxury Escapes"
              description="Premium experiences for discerning travelers"
              packages={luxuryPackages}
              myPromotions={myPromotions}
              onRequestPromotion={requestPromotion}
            />
          )}

          {familyPackages.length > 0 && (
            <CategoryPackageSection
              title="Family Vacations"
              description="Perfect getaways for the whole family"
              packages={familyPackages}
              myPromotions={myPromotions}
              onRequestPromotion={requestPromotion}
            />
          )}

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">All Travel Packages</h2>
            <div className="flex gap-6">
              <div className="w-80 flex-shrink-0">
                <PackageFilters
                  onFilterChange={setPackageFilters}
                  availableDestinations={uniqueDestinations}
                />
              </div>

              <div className="flex-1">
                {loading ? (
                  <div className="text-center py-12">Loading packages...</div>
                ) : filteredPackages.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPackages.map((pkg) => (
                      <EnhancedPackageCard
                        key={pkg.id}
                        id={pkg.id}
                        packageName={pkg.package_name}
                        destination={pkg.destination}
                        coverImage={pkg.cover_image_url}
                        durationDays={pkg.duration_days}
                        retailPrice={pkg.retail_price}
                        currency={pkg.currency}
                        agencyName={pkg.travel_agents?.agency_name}
                        rating={pkg.travel_agents?.rating}
                        totalReviews={pkg.travel_agents?.total_reviews}
                        maxParticipants={pkg.max_participants}
                        highlights={Array.isArray(pkg.highlights) ? pkg.highlights : []}
                        influencerCommission={pkg.influencer_commission_percentage}
                        onViewDetails={() => navigate(`/cocurated-package/${pkg.id}`)}
                        onRequestPromotion={() => requestPromotion(pkg.id)}
                        isPromoting={getPromotionStatus(pkg.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">
                      No packages match your criteria. Try adjusting your filters.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
