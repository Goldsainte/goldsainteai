import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PackageSearchHero } from "@/components/PackageSearchHero";
import { DestinationCard } from "@/components/DestinationCard";
import { TopDestinationsSection } from "@/components/TopDestinationsSection";
import { TopAttractionsSection } from "@/components/TopAttractionsSection";
import { TopToursCarousel } from "@/components/TopToursCarousel";
import { EnhancedPackageCard } from "@/components/EnhancedPackageCard";
import { PackageFilters, PackageFilterState } from "@/components/PackageFilters";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchAmadeusToursForLocation, 
  transformAmadeusToPackage,
  groupByDestination,
  groupByCategory,
  AmadeusActivity,
  TransformedPackage
} from "@/lib/amadeusHelpers";
import { 
  fetchAgentPackages, 
  groupAgentPackagesByDestination, 
  groupAgentPackagesByType,
  TransformedAgentPackage
} from "@/lib/agentPackageHelpers";
import { findLocationCoordinates, getUserLocation } from "@/lib/locationMapping";
import { 
  curatedTopDestinations, 
  curatedTopAttractions, 
  curatedDefaultCity 
} from "@/lib/curatedContent";

export default function CoCuratedJourneys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [packages, setPackages] = useState<(TransformedPackage | TransformedAgentPackage)[]>([]);
  const [topDestinations, setTopDestinations] = useState<any[]>([]);
  const [topAttractions, setTopAttractions] = useState<any[]>([]);
  const [topTours, setTopTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dataSource, setDataSource] = useState<'amadeus' | 'agent'>('amadeus');
  const [currentLocation, setCurrentLocation] = useState({ latitude: 48.8566, longitude: 2.3522, name: 'Paris' });
  
  const [packageFilters, setPackageFilters] = useState<PackageFilterState>({
    priceRange: [0, 10000],
    durationRanges: [],
    destinations: [],
    tripTypes: [],
    minRating: 0,
    dateRange: {},
  });

  useEffect(() => {
    const initializeData = async () => {
      const destParam = searchParams.get('destination');
      const categoryParam = searchParams.get('category');
      
      if (dataSource === 'amadeus') {
        if (destParam) {
          // URL has destination, fetch that
          const location = findLocationCoordinates(destParam);
          if (location) {
            setCurrentLocation(location);
            await fetchToursForLocation(
              location.latitude, 
              location.longitude, 
              location.name,
              categoryParam ? [categoryParam] : undefined
            );
          } else {
            toast.error("Destination not found");
            const userLoc = await getUserLocation();
            setCurrentLocation(userLoc);
            await fetchToursForLocation(userLoc.latitude, userLoc.longitude, userLoc.name);
          }
        } else {
          // No destination in URL, use user location
          const location = await getUserLocation();
          setCurrentLocation(location);
          await fetchToursForLocation(location.latitude, location.longitude, location.name);
        }
      } else {
        await fetchAgentPackagesData();
      }
      setLoading(false);
    };

    initializeData();
  }, [dataSource, searchParams]);

  const fetchAgentPackagesData = async () => {
    setLoading(true);
    try {
      const agentPkgs = await fetchAgentPackages();
      
      if (agentPkgs.length === 0) {
        toast.info("No agent packages available yet");
      }
      
      setPackages(agentPkgs);
      
      const destGroups = groupAgentPackagesByDestination(agentPkgs);
      setTopDestinations(destGroups.length > 0 ? destGroups : curatedTopDestinations);
      
      const typeGroups = groupAgentPackagesByType(agentPkgs);
      setTopAttractions(typeGroups.length > 0 ? typeGroups : curatedTopAttractions);
      
      setTopTours(agentPkgs.slice(0, 10));
    } catch (error) {
      console.error("Error fetching agent packages:", error);
      toast.error("Failed to load agent packages");
      setPackages([]);
      setTopDestinations(curatedTopDestinations);
      setTopAttractions(curatedTopAttractions);
      setTopTours([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchToursForLocation = async (
    latitude: number, 
    longitude: number, 
    destinationName: string, 
    categories?: string[]
  ) => {
    setLoading(true);
    try {
      const activities = await fetchAmadeusToursForLocation(latitude, longitude, 20, categories);
      
      if (activities.length === 0) {
        // No results even after retry - fallback to Paris and show curated lists
        console.log('No tours found, fetching from default city (Paris)...');
        const parisActivities = await fetchAmadeusToursForLocation(
          curatedDefaultCity.latitude,
          curatedDefaultCity.longitude,
          20
        );
        
        if (parisActivities.length > 0) {
          const parisPackages = parisActivities.map(activity => 
            transformAmadeusToPackage(activity, curatedDefaultCity.name)
          );
          setPackages(parisPackages);
          
          const parisToursCarousel = parisActivities.slice(0, 10).map(tour => ({
            id: tour.id,
            packageName: tour.name,
            destination: curatedDefaultCity.name,
            coverImage: tour.pictures?.[0] || '/placeholder.svg',
            retailPrice: parseFloat(tour.price.amount),
            currency: tour.price.currencyCode,
            rating: tour.rating ? parseFloat(tour.rating) : undefined,
            totalReviews: tour.numberOfRatings,
            agencyName: 'Via Amadeus',
            likelyToSellOut: !!tour.bookingLink
          }));
          setTopTours(parisToursCarousel);
        } else {
          setPackages([]);
          setTopTours([]);
        }
        
        // Always show curated destinations and attractions for visual richness
        setTopDestinations(curatedTopDestinations);
        setTopAttractions(curatedTopAttractions);
        
        toast.info(`Showing popular options. Click a destination above to explore!`);
        return;
      }

      // Transform activities to packages
      const transformedPackages = activities.map(activity => 
        transformAmadeusToPackage(activity, destinationName)
      );
      setPackages(transformedPackages);

      // Generate top destinations
      const destinations = groupByDestination(activities, destinationName);
      setTopDestinations(destinations.length > 0 ? destinations : curatedTopDestinations);

      // Generate top attractions by category
      const attractions = groupByCategory(activities);
      setTopAttractions(attractions.length > 0 ? attractions : curatedTopAttractions);

      // Set top tours (first 10 activities)
      const toursForCarousel = activities.slice(0, 10).map(tour => ({
        id: tour.id,
        packageName: tour.name,
        destination: destinationName,
        coverImage: tour.pictures?.[0] || '/placeholder.svg',
        retailPrice: parseFloat(tour.price.amount),
        currency: tour.price.currencyCode,
        rating: tour.rating ? parseFloat(tour.rating) : undefined,
        totalReviews: tour.numberOfRatings,
        agencyName: 'Via Amadeus',
        likelyToSellOut: !!tour.bookingLink
      }));
      setTopTours(toursForCarousel);

      console.log(`Loaded ${activities.length} tours for ${destinationName}`);
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast.error("Failed to load tours");
      // Fallback to curated on error
      setTopDestinations(curatedTopDestinations);
      setTopAttractions(curatedTopAttractions);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a destination");
      return;
    }

    if (dataSource === 'agent') {
      // For agent packages, just filter locally
      const filtered = packages.filter(pkg => 
        pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setPackages(filtered);
      return;
    }

    const location = findLocationCoordinates(searchQuery);
    if (location) {
      setCurrentLocation(location);
      await fetchToursForLocation(location.latitude, location.longitude, location.name);
    } else {
      toast.error("Destination not found. Try: Paris, Rome, London, etc.");
    }
  };

  const requestPromotion = async (packageId: string) => {
    if (!user) {
      toast.error('Please sign in to request promotions');
      navigate('/auth');
      return;
    }
    toast.info('Promotions are not available for Amadeus packages');
  };

  const getPromotionStatus = (packageId: string) => {
    return false; // Promotions disabled for Amadeus packages
  };

  const uniqueDestinations = [currentLocation.name];

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = searchQuery === "" || 
      pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = pkg.retailPrice >= packageFilters.priceRange[0] && 
      pkg.retailPrice <= packageFilters.priceRange[1];

    const matchesRating = packageFilters.minRating === 0 ||
      pkg.rating >= packageFilters.minRating;

    return matchesSearch && matchesPrice && matchesRating;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PackageSearchHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          onOpenFilters={() => setFiltersOpen(true)}
          dataSource={dataSource}
          onDataSourceChange={setDataSource}
        />

        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Loading tours from {currentLocation.name}...</p>
            </div>
          ) : (
            <>
              {/* Top Destinations */}
              {topDestinations.length > 0 && (
                <TopDestinationsSection destinations={topDestinations} />
              )}

              {/* Top Attractions */}
              {topAttractions.length > 0 && (
                <TopAttractionsSection attractions={topAttractions.map(attr => ({
                  destination: attr.name || attr.destination,
                  imageUrl: attr.image || attr.imageUrl,
                  packageCount: attr.packageCount
                }))} />
              )}

              {/* Top Tours Carousel */}
              {topTours.length > 0 && (
                <section className="mb-16">
                  <h2 className="text-3xl font-bold mb-8">
                    {dataSource === 'amadeus' ? `Top Tours in ${currentLocation.name}` : 'Featured CoCurated Packages'}
                  </h2>
                  <TopToursCarousel tours={topTours} />
                </section>
              )}

              {/* All Travel Packages */}
              <section className="py-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold">All Travel Packages</h2>
                  <p className="text-muted-foreground">{filteredPackages.length} packages available</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPackages.map((pkg) => (
                    <EnhancedPackageCard
                      key={pkg.id}
                      id={pkg.id}
                      packageName={pkg.packageName}
                      destination={pkg.destination}
                      coverImage={pkg.coverImage}
                      retailPrice={pkg.retailPrice}
                      currency={pkg.currency}
                      rating={pkg.rating}
                      totalReviews={pkg.totalReviews}
                      agencyName={pkg.agencyName}
                      durationDays={1}
                      isPromoting={false}
                      source={dataSource}
                      onViewDetails={() => navigate(`/cocurated-package/${pkg.id}`)}
                      onRequestPromotion={() => requestPromotion(pkg.id)}
                    />
                  ))}
                </div>

                {filteredPackages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No packages match your filters. Try adjusting your search.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Filters Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
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
