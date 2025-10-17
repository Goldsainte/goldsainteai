import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PackageSearchHero } from "@/components/PackageSearchHero";
import { DestinationCard } from "@/components/DestinationCard";
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
import { findLocationCoordinates, getUserLocation } from "@/lib/locationMapping";

export default function CoCuratedJourneys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [packages, setPackages] = useState<TransformedPackage[]>([]);
  const [topDestinations, setTopDestinations] = useState<any[]>([]);
  const [topAttractions, setTopAttractions] = useState<any[]>([]);
  const [topTours, setTopTours] = useState<AmadeusActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
      const location = await getUserLocation();
      setCurrentLocation(location);
      await fetchToursForLocation(location.latitude, location.longitude, location.name);
      setLoading(false);
    };

    initializeData();
  }, []);

  const fetchToursForLocation = async (latitude: number, longitude: number, destinationName: string) => {
    setLoading(true);
    try {
      const activities = await fetchAmadeusToursForLocation(latitude, longitude, 20);
      
      if (activities.length === 0) {
        toast.error("No tours found for this location");
        setPackages([]);
        setTopDestinations([]);
        setTopAttractions([]);
        setTopTours([]);
        return;
      }

      // Transform activities to packages
      const transformedPackages = activities.map(activity => 
        transformAmadeusToPackage(activity, destinationName)
      );
      setPackages(transformedPackages);

      // Generate top destinations
      const destinations = groupByDestination(activities, destinationName);
      setTopDestinations(destinations);

      // Generate top attractions by category
      const attractions = groupByCategory(activities);
      setTopAttractions(attractions);

      // Set top tours (first 10 activities)
      setTopTours(activities.slice(0, 10));

      console.log(`Loaded ${activities.length} tours for ${destinationName}`);
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast.error("Failed to load tours");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a destination");
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
                <div className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Top Destinations</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {topDestinations.map((dest, idx) => (
                      <DestinationCard 
                        key={idx} 
                        destination={dest.destination}
                        imageUrl={dest.image}
                        packageCount={dest.packageCount}
                        startingPrice={dest.startingPrice}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Top Attractions */}
              {topAttractions.length > 0 && (
                <TopAttractionsSection attractions={topAttractions.map(attr => ({
                  destination: attr.name,
                  imageUrl: attr.image,
                  packageCount: attr.packageCount
                }))} />
              )}

              {/* Top Tours Carousel */}
              {topTours.length > 0 && (
                <section className="mb-16">
                  <h2 className="text-3xl font-bold mb-8">Top Tours in {currentLocation.name}</h2>
                  <TopToursCarousel tours={topTours.map(tour => ({
                    id: tour.id,
                    packageName: tour.name,
                    destination: currentLocation.name,
                    coverImage: tour.pictures?.[0] || '/placeholder.svg',
                    retailPrice: parseFloat(tour.price.amount),
                    currency: tour.price.currencyCode,
                    rating: tour.rating ? parseFloat(tour.rating) : undefined,
                    totalReviews: tour.numberOfRatings,
                    agencyName: 'Via Amadeus',
                    likelyToSellOut: !!tour.bookingLink
                  }))} />
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
