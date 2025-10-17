import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PackageSearchHero } from "@/components/PackageSearchHero";
import { DestinationCard } from "@/components/DestinationCard";
import { CategoryPackageSection } from "@/components/CategoryPackageSection";
import { TopAttractionsSection } from "@/components/TopAttractionsSection";
import { TopToursCarousel } from "@/components/TopToursCarousel";
import { EnhancedPackageCard } from "@/components/EnhancedPackageCard";
import { PackageFilters, PackageFilterState } from "@/components/PackageFilters";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

const FALLBACK_DESTINATIONS = [
  { destination: "Las Vegas", packageCount: 2847, startingPrice: 45, imageUrl: "https://images.unsplash.com/photo-1605833556294-ea5f7d4ef200?w=800&q=80" },
  { destination: "Rome", packageCount: 3214, startingPrice: 52, imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80" },
  { destination: "Paris", packageCount: 4156, startingPrice: 48, imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80" },
  { destination: "London", packageCount: 3892, startingPrice: 55, imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80" },
  { destination: "New York City", packageCount: 5234, startingPrice: 62, imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80" },
  { destination: "Barcelona", packageCount: 2567, startingPrice: 49, imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80" },
  { destination: "Cancun", packageCount: 1893, startingPrice: 68, imageUrl: "https://images.unsplash.com/photo-1569077333975-580f7740f54e?w=800&q=80" },
  { destination: "Florence", packageCount: 1456, startingPrice: 58, imageUrl: "https://images.unsplash.com/photo-1543429258-2b513e3a5a18?w=800&q=80" },
];

const FALLBACK_ATTRACTIONS = [
  { destination: "Colosseum", packageCount: 1846, imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80" },
  { destination: "Ephesus (Efes)", packageCount: 892, imageUrl: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80" },
  { destination: "Sagrada Familia", packageCount: 1523, imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80" },
  { destination: "Yellowstone National Park", packageCount: 734, imageUrl: "https://images.unsplash.com/photo-1490077476659-095159692ab5?w=400&q=80" },
  { destination: "Moraine Lake", packageCount: 567, imageUrl: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=400&q=80" },
  { destination: "Blue Lagoon", packageCount: 1234, imageUrl: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400&q=80" },
];

const FALLBACK_TOURS = [
  {
    id: "demo_1",
    packageName: "Vatican Museums & Sistine Chapel Skip-the-Line Ticket",
    destination: "Rome",
    coverImage: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&q=80",
    retailPrice: 89,
    currency: "USD",
    rating: 4.8,
    totalReviews: 12453,
    likelyToSellOut: true,
    agencyName: "Rome Tours Inc."
  },
  {
    id: "demo_2",
    packageName: "Chicago River Architecture Tour",
    destination: "Chicago",
    coverImage: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
    retailPrice: 42,
    currency: "USD",
    rating: 4.9,
    totalReviews: 8934,
    likelyToSellOut: true,
    agencyName: "Chicago Adventures"
  },
  {
    id: "demo_3",
    packageName: "Tuscany Day Trip from Florence with Wine Tasting",
    destination: "Florence",
    coverImage: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80",
    retailPrice: 125,
    currency: "USD",
    rating: 4.7,
    totalReviews: 5672,
    likelyToSellOut: false,
    agencyName: "Tuscany Excursions"
  },
  {
    id: "demo_4",
    packageName: "Grand Canyon West Rim Tour with Skywalk",
    destination: "Las Vegas",
    coverImage: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
    retailPrice: 189,
    currency: "USD",
    rating: 4.6,
    totalReviews: 3421,
    likelyToSellOut: true,
    agencyName: "Vegas Day Tours"
  },
  {
    id: "demo_5",
    packageName: "Eiffel Tower Summit with Skip-the-Line Access",
    destination: "Paris",
    coverImage: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&q=80",
    retailPrice: 68,
    currency: "USD",
    rating: 4.8,
    totalReviews: 15234,
    likelyToSellOut: true,
    agencyName: "Paris Premium Tours"
  },
  {
    id: "demo_6",
    packageName: "Snorkeling Adventure in the Great Barrier Reef",
    destination: "Cairns",
    coverImage: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&q=80",
    retailPrice: 156,
    currency: "USD",
    rating: 4.9,
    totalReviews: 7892,
    likelyToSellOut: false,
    agencyName: "Reef Adventures"
  },
  {
    id: "demo_7",
    packageName: "Santorini Sunset Cruise with Dinner",
    destination: "Santorini",
    coverImage: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80",
    retailPrice: 95,
    currency: "USD",
    rating: 4.7,
    totalReviews: 4567,
    likelyToSellOut: true,
    agencyName: "Greek Island Cruises"
  },
  {
    id: "demo_8",
    packageName: "Northern Lights Tour with Professional Photography",
    destination: "Reykjavik",
    coverImage: "https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=800&q=80",
    retailPrice: 145,
    currency: "USD",
    rating: 4.8,
    totalReviews: 3234,
    likelyToSellOut: false,
    agencyName: "Iceland Adventures"
  }
];

export default function CoCuratedJourneys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [packages, setPackages] = useState<AgentPackage[]>([]);
  const [topDestinations, setTopDestinations] = useState<any[]>([]);
  const [topAttractions, setTopAttractions] = useState<any[]>([]);
  const [topTours, setTopTours] = useState<any[]>([]);
  const [myPromotions, setMyPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
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
    fetchTopAttractions();
    fetchTopTours();
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
        .from("agent_packages")
        .select("destination, cover_image_url, retail_price")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by destination and get the first 8
      const destinationMap = new Map();
      data?.forEach((pkg) => {
        if (!destinationMap.has(pkg.destination)) {
          destinationMap.set(pkg.destination, {
            destination: pkg.destination,
            packageCount: 1,
            startingPrice: pkg.retail_price,
            imageUrl: pkg.cover_image_url,
          });
        } else {
          const dest = destinationMap.get(pkg.destination);
          dest.packageCount += 1;
          dest.startingPrice = Math.min(dest.startingPrice, pkg.retail_price);
        }
      });

      const destinations = Array.from(destinationMap.values())
        .sort((a, b) => b.packageCount - a.packageCount)
        .slice(0, 8);

      setTopDestinations(destinations.length > 0 ? destinations : FALLBACK_DESTINATIONS);
    } catch (error) {
      console.error("Error fetching top destinations:", error);
      setTopDestinations(FALLBACK_DESTINATIONS);
    }
  };

  const fetchTopAttractions = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_packages")
        .select("destination, cover_image_url")
        .eq("is_active", true);

      if (error) throw error;

      // Group by destination for attractions
      const attractionMap = new Map();
      data?.forEach((pkg) => {
        if (!attractionMap.has(pkg.destination)) {
          attractionMap.set(pkg.destination, {
            destination: pkg.destination,
            packageCount: 1,
            imageUrl: pkg.cover_image_url,
          });
        } else {
          const attr = attractionMap.get(pkg.destination);
          attr.packageCount += 1;
        }
      });

      const attractions = Array.from(attractionMap.values())
        .sort((a, b) => b.packageCount - a.packageCount)
        .slice(0, 6);

      setTopAttractions(attractions.length > 0 ? attractions : FALLBACK_ATTRACTIONS);
    } catch (error) {
      console.error("Error fetching top attractions:", error);
      setTopAttractions(FALLBACK_ATTRACTIONS);
    }
  };

  const fetchTopTours = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_packages")
        .select(`
          id,
          package_name,
          destination,
          cover_image_url,
          retail_price,
          currency,
          travel_agents (
            agency_name,
            rating,
            total_reviews
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const tours = data?.map((pkg) => ({
        id: pkg.id,
        packageName: pkg.package_name,
        destination: pkg.destination,
        coverImage: pkg.cover_image_url,
        retailPrice: pkg.retail_price,
        currency: pkg.currency || "USD",
        rating: pkg.travel_agents?.rating,
        totalReviews: pkg.travel_agents?.total_reviews,
        agencyName: pkg.travel_agents?.agency_name,
        likelyToSellOut: Math.random() > 0.7,
      })) || [];

      setTopTours(tours.length > 0 ? tours : FALLBACK_TOURS);
    } catch (error) {
      console.error("Error fetching top tours:", error);
      setTopTours(FALLBACK_TOURS);
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
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <div className="container mx-auto px-4 py-12">
          {/* Top Destinations */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Top Destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topDestinations.map((dest, idx) => (
                <DestinationCard key={idx} {...dest} />
              ))}
            </div>
          </div>

          {/* Top Attractions */}
          <TopAttractionsSection attractions={topAttractions} />

          {/* Top Tours Carousel */}
          <TopToursCarousel tours={topTours} />

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                <div className="text-center py-12 col-span-full">Loading packages...</div>
              ) : filteredPackages.length > 0 ? (
                filteredPackages.map((pkg) => (
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
                ))
              ) : (
                <Card className="p-12 text-center col-span-full">
                  <p className="text-muted-foreground">
                    No packages match your criteria. Try adjusting your filters.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Filters Sheet - Left Sidebar */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <PackageFilters
              onFilterChange={setPackageFilters}
              availableDestinations={uniqueDestinations}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
