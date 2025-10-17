import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TourFilters, { FilterState } from "@/components/TourFilters";
import PackageFilters, { PackageFilterState, DURATION_FILTERS } from "@/components/PackageFilters";
import { Sparkles, MapPin, Calendar, Users, DollarSign, TrendingUp, Search, ArrowLeft, Star, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface TourActivity {
  id: string;
  name: string;
  shortDescription?: string;
  rating?: string;
  pictures?: string[];
  price: {
    currencyCode: string;
    amount: string;
    baseAmount?: string;
  };
  geoCode?: {
    latitude: number;
    longitude: number;
  };
  minimumDuration?: string;
}

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

export default function CoCuratedJourneys() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tours' | 'cocurated'>('tours');
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [tours, setTours] = useState<TourActivity[]>([]);
  const [packages, setPackages] = useState<AgentPackage[]>([]);
  const [myPromotions, setMyPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1000],
    categories: [],
  });
  
  const [packageFilters, setPackageFilters] = useState<PackageFilterState>({
    priceRange: [0, 10000],
    durationRanges: [],
    destinations: [],
  });

  useEffect(() => {
    fetchPackages();
    if (user) {
      fetchMyPromotions();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'tours' && location) {
      fetchTours();
    }
  }, [activeTab, location, filters]);

  const fetchTours = async () => {
    if (!location) {
      toast.error('Please enter a location to search for tours');
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, using Paris coordinates. In production, you'd geocode the location input
      const defaultCoords = { lat: 48.8566, lng: 2.3522 }; // Paris

      const { data, error } = await supabase.functions.invoke('amadeus-search-tours', {
        body: {
          latitude: defaultCoords.lat,
          longitude: defaultCoords.lng,
          radius: 10,
          categories: filters.categories.length > 0 ? filters.categories : undefined,
        }
      });

      if (error) throw error;

      let filteredTours = data.data || [];

      // Apply client-side filters
      if (filters.priceRange) {
        filteredTours = filteredTours.filter((tour: TourActivity) => {
          const price = parseFloat(tour.price.amount);
          return price >= filters.priceRange[0] && price <= filters.priceRange[1];
        });
      }

      if (filters.minRating) {
        filteredTours = filteredTours.filter((tour: TourActivity) => {
          const rating = parseFloat(tour.rating || '0');
          return rating >= filters.minRating!;
        });
      }

      setTours(filteredTours);
    } catch (error: any) {
      console.error('Error fetching tours:', error);
      toast.error('Failed to load tours');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
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
    return myPromotions.find(p => p.package_id === packageId);
  };

  const calculatePotentialEarnings = (pkg: AgentPackage) => {
    return (pkg.retail_price * (pkg.influencer_commission_percentage / 100)).toFixed(2);
  };

  // Get unique destinations for filter
  const uniqueDestinations = Array.from(new Set(packages.map(pkg => pkg.destination))).sort();

  // Apply all filters to packages
  const filteredPackages = packages.filter(pkg => {
    // Text search filter
    const matchesSearch = 
      pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Price filter
    const matchesPrice = 
      pkg.retail_price >= packageFilters.priceRange[0] && 
      pkg.retail_price <= packageFilters.priceRange[1];
    
    if (!matchesPrice) return false;

    // Duration filter
    if (packageFilters.durationRanges.length > 0) {
      const matchesDuration = packageFilters.durationRanges.some(rangeId => {
        const range = DURATION_FILTERS.find(d => d.id === rangeId);
        if (!range) return false;
        return pkg.duration_days >= range.min && pkg.duration_days <= range.max;
      });
      if (!matchesDuration) return false;
    }

    // Destination filter
    if (packageFilters.destinations.length > 0) {
      const matchesDestination = packageFilters.destinations.includes(pkg.destination);
      if (!matchesDestination) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">CoCurated Journeys + Live Deals</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Exclusive creator packages & real-time tour deals from around the world
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tours" className="relative">
              Tours & Activities
              <Badge variant="secondary" className="ml-2 text-xs">
                Live
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cocurated" className="relative">
              CoCurated Packages
              <Badge variant="outline" className="ml-2 text-xs">
                Exclusive
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tours Tab */}
          <TabsContent value="tours" className="space-y-6">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <TourFilters onFilterChange={setFilters} />
              </div>

              <div className="lg:col-span-3 space-y-6">
                {/* Location Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Enter destination (e.g., Paris, Tokyo, New York)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && fetchTours()}
                    />
                  </div>
                  <Button onClick={fetchTours} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Tours Grid */}
                {loading && tours.length === 0 ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : tours.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tours.map((tour) => (
                      <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {tour.pictures && tour.pictures[0] && (
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={tour.pictures[0]} 
                              alt={tour.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg line-clamp-2">{tour.name}</CardTitle>
                            {tour.rating && (
                              <Badge variant="secondary" className="shrink-0">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                {tour.rating}
                              </Badge>
                            )}
                          </div>
                          {tour.shortDescription && (
                            <CardDescription className="line-clamp-2">
                              {tour.shortDescription}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {tour.minimumDuration && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{tour.minimumDuration.replace('PT', '').toLowerCase()}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-2xl font-bold">
                                  {tour.price.currencyCode} {tour.price.amount}
                                </div>
                                {tour.price.baseAmount && (
                                  <div className="text-xs text-muted-foreground line-through">
                                    Was {tour.price.currencyCode} {tour.price.baseAmount}
                                  </div>
                                )}
                              </div>
                              <Badge className="bg-green-500">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Live Deal
                              </Badge>
                            </div>
                            <Button 
                              className="w-full"
                              onClick={() => navigate(`/tour/${tour.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      {location 
                        ? "No tours found matching your criteria. Try adjusting filters or searching a different location."
                        : "Enter a destination above to discover amazing tours and activities"
                      }
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* CoCurated Packages Tab */}
          <TabsContent value="cocurated" className="space-y-6">
            {/* Search and Filters Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <PackageFilters 
                  onFilterChange={setPackageFilters}
                  availableDestinations={uniqueDestinations}
                />
              </div>

              <div className="lg:col-span-3 space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search packages by name or destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Packages Grid */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredPackages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPackages.map((pkg) => {
                      const promotion = getPromotionStatus(pkg.id);
                      const potentialEarnings = calculatePotentialEarnings(pkg);

                      return (
                        <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-xl line-clamp-2">{pkg.package_name}</CardTitle>
                              <Badge variant="outline">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Exclusive
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {pkg.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{pkg.destination}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{pkg.duration_days} days</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>Max {pkg.max_participants} participants</span>
                              </div>
                            </div>

                            <div className="pt-4 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Price</span>
                                <span className="text-2xl font-bold">
                                  {pkg.currency} {pkg.retail_price}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <DollarSign className="h-4 w-4" />
                                <span>Earn {pkg.currency} {potentialEarnings} per booking</span>
                              </div>
                            </div>

                            {promotion ? (
                              promotion.status === 'active' ? (
                                <div className="space-y-2">
                                  <Badge className="w-full justify-center py-2" variant="secondary">
                                    ✓ Promoting
                                  </Badge>
                                  <p className="text-xs text-center text-muted-foreground">
                                    Code: {promotion.promo_code}
                                  </p>
                                </div>
                              ) : (
                                <Badge className="w-full justify-center py-2" variant="outline">
                                  {promotion.status}
                                </Badge>
                              )
                            ) : (
                              <Button
                                className="w-full"
                                onClick={() => requestPromotion(pkg.id, pkg.package_name)}
                              >
                                Request to Promote
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => navigate(`/cocurated-package/${pkg.id}`)}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      {packages.length > 0 ? "No packages match your filters" : "No CoCurated packages available yet"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {packages.length > 0 
                        ? "Try adjusting your filters to see more packages"
                        : "Be the first to create a curated travel experience!"
                      }
                    </p>
                    {packages.length === 0 && (
                      <Button onClick={() => navigate('/agent-onboarding')}>
                        Become an Agent
                      </Button>
                    )}
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
