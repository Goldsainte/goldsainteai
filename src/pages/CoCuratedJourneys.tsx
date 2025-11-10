import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PackageSearchHero } from "@/components/PackageSearchHero";
import { DestinationCard } from "@/components/DestinationCard";
import { TopDestinationsSection } from "@/components/TopDestinationsSection";
import { TopAttractionsSection } from "@/components/TopAttractionsSection";
import { TopToursCarousel } from "@/components/TopToursCarousel";
import { LuxuryExperiencesSection } from "@/components/LuxuryExperiencesSection";
import { EnhancedPackageCard } from "@/components/EnhancedPackageCard";
import { PackageFilters, PackageFilterState } from "@/components/PackageFilters";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Globe, Briefcase } from "lucide-react";
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
  const [packages, setPackages] = useState<TransformedAgentPackage[]>([]);
  const [topDestinations, setTopDestinations] = useState<any[]>([]);
  const [topAttractions, setTopAttractions] = useState<any[]>([]);
  const [topTours, setTopTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const [packageFilters, setPackageFilters] = useState<PackageFilterState>({
    priceRange: [0, 10000],
    durationRanges: [],
    destinations: [],
    tripTypes: [],
    minRating: 0,
    dateRange: {},
  });
  
  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState<string>('all');

  useEffect(() => {
    const initializeData = async () => {
      toast.info("Showing CoCurated by Agents - Expertly designed packages by certified travel professionals");
      await fetchAgentPackagesData();
      setLoading(false);
    };

    initializeData();
  }, [searchParams]);

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


  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a destination");
      return;
    }

    // Filter agent packages locally
    const filtered = packages.filter(pkg => 
      pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setPackages(filtered);
  };

  const handleClearSearch = async () => {
    // Clear URL parameters
    navigate('/cocurated-journeys', { replace: true });
    
    // Reset all filters and search
    setSearchQuery("");
    setSelectedDestinationFilter('all');
    setPackageFilters({
      priceRange: [0, 10000],
      durationRanges: [],
      destinations: [],
      tripTypes: [],
      minRating: 0,
      dateRange: {},
    });
    
    await fetchAgentPackagesData();
    toast.success("Search cleared");
  };

  const handleQuickFilter = (filterType: string) => {
    const filterMap: Record<string, Partial<PackageFilterState>> = {
      'Adventure': { 
        tripTypes: ['adventure'],
        priceRange: [0, 10000],
      },
      'Luxury': { 
        tripTypes: [],
        priceRange: [3000, 10000],
      },
      'Family-Friendly': { 
        tripTypes: ['family'],
        priceRange: [0, 10000],
      },
      'Budget': { 
        tripTypes: [],
        priceRange: [0, 1500],
      },
      'Romantic': { 
        tripTypes: ['romantic'],
        priceRange: [0, 10000],
      },
    };
    
    const newFilter = filterMap[filterType];
    if (newFilter) {
      setPackageFilters(prev => ({ 
        ...prev, 
        ...newFilter,
        durationRanges: prev.durationRanges,
        destinations: prev.destinations,
        minRating: prev.minRating,
        dateRange: prev.dateRange,
      }));
      toast.success(`Filtering by ${filterType}`);
      
      setTimeout(() => {
        const element = document.querySelector('.all-packages-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const requestPromotion = async (packageId: string) => {
    if (!user) {
      toast.error('Please sign in to request promotions');
      navigate('/auth');
      return;
    }
    toast.info('Promotions are not available');
  };

  const getPromotionStatus = (packageId: string) => {
    return false;
  };

  const uniqueDestinations = topDestinations.map(dest => 
    dest.destination || dest.name
  ).filter((dest, index, self) => self.indexOf(dest) === index);

  // Get unique destinations from top destinations for filtering
  const topDestinationCities = topDestinations.map(dest => 
    dest.destination || dest.name
  ).filter((dest, index, self) => self.indexOf(dest) === index);

  // Filter packages based on all criteria
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = searchQuery === "" || 
      pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = pkg.retailPrice >= packageFilters.priceRange[0] && 
      pkg.retailPrice <= packageFilters.priceRange[1];

    const matchesRating = packageFilters.minRating === 0 ||
      (pkg.rating || 0) >= packageFilters.minRating;
    
    const matchesTripType = packageFilters.tripTypes.length === 0 ||
      (pkg.tripType && packageFilters.tripTypes.includes(pkg.tripType));
      
    // Filter by selected destination
    const matchesDestination = selectedDestinationFilter === 'all' || 
      pkg.destination.toLowerCase().includes(selectedDestinationFilter.toLowerCase());

    return matchesSearch && matchesPrice && matchesRating && matchesTripType && matchesDestination;
  });

  // Get top 5 packages from top destination cities for default display
  const getDefaultPackages = () => {
    if (selectedDestinationFilter !== 'all') {
      return filteredPackages; // Show all matching when filter is applied
    }
    
    // Group packages by destination
    const packagesByDestination: { [key: string]: typeof packages } = {};
    packages.forEach(pkg => {
      const dest = pkg.destination;
      if (!packagesByDestination[dest]) {
        packagesByDestination[dest] = [];
      }
      packagesByDestination[dest].push(pkg);
    });
    
    // Get top 5 from each top destination city
    const defaultPackages: typeof packages = [];
    topDestinationCities.forEach(city => {
      const cityPackages = Object.entries(packagesByDestination)
        .filter(([dest]) => dest.toLowerCase().includes(city.toLowerCase()))
        .flatMap(([_, pkgs]) => pkgs)
        .slice(0, 5);
      defaultPackages.push(...cityPackages);
    });
    
    return defaultPackages.length > 0 ? defaultPackages : packages.slice(0, 20);
  };

  const displayedPackages = getDefaultPackages();

  // Determine if there's an active search or filter
  const destParam = searchParams.get('destination');
  const categoryParam = searchParams.get('category');
  const hasSearch = Boolean(destParam || searchQuery.trim());
  const hasCategory = Boolean(categoryParam);
  const hasNonDefaultFilters =
    selectedDestinationFilter !== 'all' ||
    packageFilters.minRating > 0 ||
    packageFilters.tripTypes.length > 0 ||
    packageFilters.destinations.length > 0 ||
    (packageFilters.priceRange[0] !== 0 || packageFilters.priceRange[1] !== 10000);
  const hasActiveSearchOrFilters = hasSearch || hasCategory || hasNonDefaultFilters;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 pb-8 sm:pb-12 md:pb-16">
        <PackageSearchHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          onOpenFilters={() => setFiltersOpen(true)}
          onQuickFilterClick={handleQuickFilter}
          onClearSearch={handleClearSearch}
        />

        {/* Luxury Experiences Section - Show at top when browsing */}
        {!hasActiveSearchOrFilters && (
          <LuxuryExperiencesSection />
        )}

        <div className="bg-luxury-ivory overflow-x-hidden">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-12">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <>
              {/* Top Destinations */}
              {topDestinations.length > 0 && (
                <TopDestinationsSection 
                  destinations={topDestinations}
                  onDestinationClick={async (destination) => {
                    setSearchQuery(destination);
                    navigate(`/cocurated-journeys?destination=${destination}`);
                  }}
                />
              )}

              {/* Top Attractions */}
              {topAttractions.length > 0 && (
                <TopAttractionsSection 
                  attractions={topAttractions.map(attr => ({
                    destination: attr.name || attr.destination,
                    imageUrl: attr.image || attr.imageUrl,
                    packageCount: attr.packageCount
                  }))}
                  onAttractionClick={async (category) => {
                    navigate(`/cocurated-journeys?category=${encodeURIComponent(category)}`);
                  }}
                />
              )}

              {/* Top Tours Carousel */}
              {topTours.length > 0 && (
                <section className="mb-16">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-1 bg-luxury-gold" />
                    <span className="px-3 py-1 bg-luxury-gold/20 text-luxury-emerald text-xs font-semibold rounded-full border border-luxury-gold/40 flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      Agent Curated
                    </span>
                  </div>
                  <h2 className="font-secondary text-3xl md:text-4xl text-luxury-emerald mb-8">
                    Featured CoCurated Packages
                  </h2>
                  <TopToursCarousel tours={topTours} />
                </section>
              )}

              {/* All Travel Packages */}
              <section className="py-6 sm:py-8 md:py-10 all-packages-section">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-1 bg-luxury-gold" />
                      <span className="px-3 py-1 bg-luxury-gold/20 text-luxury-emerald text-xs font-semibold rounded-full border border-luxury-gold/40 flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        Agent Curated
                      </span>
                    </div>
                    <h2 className="font-secondary text-xl sm:text-2xl md:text-3xl text-luxury-emerald">
                      All CoCurated Packages
                    </h2>
                    <p className="text-xs sm:text-sm text-luxury-emerald/60 mt-2">
                      {selectedDestinationFilter === 'all' 
                        ? `Showing top 5 from each destination (${displayedPackages.length} packages)`
                        : `${displayedPackages.length} packages in ${selectedDestinationFilter}`
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                      value={selectedDestinationFilter}
                      onChange={(e) => setSelectedDestinationFilter(e.target.value)}
                      className="w-full sm:w-auto px-2 sm:px-3 md:px-4 py-2 min-h-[44px] border border-luxury-gold/30 rounded-lg bg-white text-luxury-emerald text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all duration-300"
                    >
                      <option value="all">All Top Destinations</option>
                      {topDestinationCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {displayedPackages.map((pkg) => (
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

                {displayedPackages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No packages available for this destination. Try selecting a different destination.</p>
                  </div>
                )}
              </section>

              {/* Luxury Experiences Section - Show at bottom when searching/filtering */}
              {hasActiveSearchOrFilters && (
                <div className="mt-16">
                  <LuxuryExperiencesSection />
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </main>

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
