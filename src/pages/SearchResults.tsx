import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";
import { CompactHotelCard } from "@/components/CompactHotelCard";
import { CompactFlightCard } from "@/components/CompactFlightCard";
import { CompactRestaurantCard } from "@/components/CompactRestaurantCard";
import { CarCard } from "@/components/CarCard";
import { UberProductCard } from "@/components/UberProductCard";
import { UberBookingModal } from "@/components/UberBookingModal";
import { ResultsMapView } from "@/components/ResultsMapView";
import { HotelFilters } from "@/components/HotelFilters";
import { RestaurantFilters } from "@/components/RestaurantFilters";
import { AdvancedEventFilters } from "@/components/AdvancedEventFilters";
import { AdvancedFlightFilters } from "@/components/AdvancedFlightFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, SlidersHorizontal, Map, List, ArrowLeft, Trophy, DollarSign, Star, MapPin, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useAuth } from "@/contexts/AuthContext";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";
import VendorPromotionFeed from "@/components/VendorPromotionFeed";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addSearch } = useSearchHistory();
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [rankingSort, setRankingSort] = useState<string>("best_value");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedStarRatings, setSelectedStarRatings] = useState<number[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedEventCategories, setSelectedEventCategories] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [flightDictionaries, setFlightDictionaries] = useState<any>(null);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [uberProducts, setUberProducts] = useState<any[]>([]);
  const [selectedUberProduct, setSelectedUberProduct] = useState<any>(null);
  const [isUberModalOpen, setIsUberModalOpen] = useState(false);

  const searchType = searchParams.get("type") || "hotels";
  const location = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "2";
  
// Flight-specific params
const origin = searchParams.get("origin") || "";
const destination = searchParams.get("destination") || "";
const departureDate = searchParams.get("departureDate") || "";
const returnDate = searchParams.get("returnDate") || "";
const cabinClass = searchParams.get("cabinClass") || "ECONOMY";
const adults = searchParams.get("adults") || "1";
const children = searchParams.get("children") || "0";
const infants = searchParams.get("infants") || "0";

// Car-specific params
const pickup = searchParams.get("pickup") || "";
const dropoff = searchParams.get("dropoff") || "";
const pickupDateCar = searchParams.get("pickupDate") || "";
const returnDateCar = searchParams.get("returnDate") || "";
const carTripType = searchParams.get("carTripType") || "round-trip";

// Derived display codes
const pickupCode = pickup ? pickup.split(" - ")[0].trim() : "";
const dropoffCode = dropoff ? dropoff.split(" - ")[0].trim() : pickupCode;

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_booking_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setUserPreferences(data);
          
          // Only apply preferences if user has them enabled
          if (data.use_preferences_in_search !== false) {
            // Apply more preferences to filters from user profile
            if (data.price_range_min !== null && data.price_range_min !== undefined) {
              setPriceRange([data.price_range_min, data.price_range_max || 1000]);
            }
            if (data.min_review_score) {
              setMinRating(data.min_review_score);
            }
            if (data.cuisine_types && data.cuisine_types.length > 0) {
              // Store cuisine types for restaurant filtering
              setUserPreferences((prev: any) => ({ ...prev, cuisine_types: data.cuisine_types }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  useEffect(() => {
    const performSearch = async () => {
      // Normalize search type to singular form for database
      const normalizedType = searchType.replace(/s$/, ''); // Remove trailing 's'
      
      // Save search to history when performing a search
      if (location || origin) {
        addSearch({
          type: normalizedType,
          location: location || origin,
          ...(searchType === "hotels" && checkIn && checkOut && { checkIn, checkOut, guests }),
          ...(searchType === "flights" && departureDate && { checkIn: departureDate }),
          ...(searchType === "events" && checkIn && { checkIn })
        });
      }
      setLoading(true);
      setError(null);
      setResults([]); // Clear previous results immediately
      setSearchPerformed(true); // Mark that a search was performed
      
      // Auto-hide search bar on mobile when search starts
      if (window.innerWidth < 768) {
        setShowSearchBar(false);
      }

      try {
        if (searchType === "hotels") {
          let hotelResults: any[] = [];
          try {
            const { data, error } = await invokeEdgeFunction('unified-search-hotels', {
              body: { 
                location, 
                checkIn, 
                checkOut, 
                guests: parseInt(guests),
                sortBy: rankingSort 
              },
              timeout: 30000,
              showToastOnError: false, // Handle errors with fallback
            });
            if (error && error.type === 'RATE_LIMIT') {
              setError('Too many requests. Please wait a moment and try again.');
              return;
            }
            if (error && error.type === 'PAYMENT_REQUIRED') {
              setError('Service temporarily unavailable. Please try again later.');
              return;
            }
            hotelResults = data?.results || [];
          } catch (e) {
            console.warn('Unified hotel search failed, attempting fallbacks:', e);
            // Fallback chain just in case
            try {
              const getCityCode = (loc: string): string => {
                const cityMap: { [key: string]: string } = {
                  'charlotte': 'CLT', 'new york': 'NYC', 'los angeles': 'LAX', 'miami': 'MIA',
                  'chicago': 'CHI', 'san francisco': 'SFO', 'las vegas': 'LAS', 'seattle': 'SEA',
                  'boston': 'BOS', 'washington': 'WAS', 'atlanta': 'ATL', 'dallas': 'DFW',
                  'paris': 'PAR', 'london': 'LON', 'tokyo': 'TYO', 'dubai': 'DXB'
                };
                const cityName = loc.split(',')[0].trim().toLowerCase();
                return cityMap[cityName] || 'NYC';
              };
              const cityCode = getCityCode(location);
              const { data } = await supabase.functions.invoke('amadeus-search-hotels', {
                body: { cityCode, checkInDate: checkIn, checkOutDate: checkOut, adults: parseInt(guests), cityName: location }
              });
              hotelResults = data?.results || [];
            } catch {}
            
            if (!hotelResults || hotelResults.length === 0) {
              const { data: expediaData } = await supabase.functions.invoke('expedia-search-hotels', {
                body: { location, checkIn, checkOut, guests: parseInt(guests), rooms: 1 }
              }).catch(() => ({ data: { hotels: [] } } as any));
              hotelResults = expediaData?.hotels || [];
            }
          }

          // Clean out test/dummy hotels and empty names
          const cleanedHotels = (hotelResults || []).filter((h: any) => {
            const raw = (h?.property?.name || h?.name || h?.title || '').toString().trim();
            if (!raw) return false;
            const lower = raw.toLowerCase();
            return !(
              lower.includes('test') ||
              lower.includes('do not use') ||
              lower.includes('dummy') ||
              lower.includes('sample') ||
              lower.includes('qa') ||
              lower.includes('dev')
            );
          });

          setResults(cleanedHotels);
          setFilteredResults(cleanedHotels);
        } else if (searchType === "flights") {
          // Check if we have the required flight parameters
          if (!origin || !destination || !departureDate) {
            console.warn('Missing required flight parameters:', { origin, destination, departureDate });
            setError('Please enter flight details using the search form above');
            setResults([]);
            setFilteredResults([]);
            setLoading(false);
            return;
          }
          
          // Extract airport code from "CODE - City" format
          const originCode = origin.split(' - ')[0].trim();
          const destCode = destination.split(' - ')[0].trim();
          
          const { data, error } = await invokeEdgeFunction('unified-search-flights', {
            body: { 
              origin: originCode,
              destination: destCode,
              departureDate,
              ...(returnDate && { returnDate }),
              adults: parseInt(adults),
              children: parseInt(children),
              infants: parseInt(infants),
              cabinClass,
              sortBy: rankingSort
            },
            timeout: 30000,
            showToastOnError: true,
          });

          if (error) {
            if (error.type === 'RATE_LIMIT' || error.type === 'PAYMENT_REQUIRED' || error.type === 'TIMEOUT') {
              setResults([]);
              setFilteredResults([]);
              return;
            }
            throw error;
          }
          const flightResults = data.results || [];
          setResults(flightResults);
          setFilteredResults(flightResults);
          setFlightDictionaries(data.dictionaries || null);
        } else if (searchType === "destinations") {
          const { data, error } = await invokeEdgeFunction('search-destinations', {
            body: { query: location },
            timeout: 20000,
            showToastOnError: true,
          });

          if (error) {
            setResults([]);
            setFilteredResults([]);
            return;
          }
          const destResults = data.results || [];
          setResults(destResults);
          setFilteredResults(destResults);
        } else if (searchType === "restaurants") {
          if (!location || !location.trim()) {
            console.warn('Missing location for restaurant search');
            setError('Please enter a location to search for restaurants');
            setResults([]);
            setFilteredResults([]);
            setLoading(false);
            return;
          }
          
          console.log('Searching restaurants in:', location);
          const { data, error } = await invokeEdgeFunction('tripadvisor-search-restaurants', {
            body: { 
              location: location.trim(),
              sortBy: rankingSort 
            },
            timeout: 20000,
            showToastOnError: true,
          });

          if (error) {
            console.error('Restaurant search error:', error);
            setResults([]);
            setFilteredResults([]);
            return;
          }
          console.log('Restaurant results:', data?.results?.length || 0, 'restaurants found');
          const restaurantResults = data?.results || [];
          setResults(restaurantResults);
          setFilteredResults(restaurantResults);
        } else if (searchType === "cars") {
          try {
            const { data, error } = await invokeEdgeFunction('amadeus-search-cars', {
              body: {
                pickupLocation: pickup,
                pickupDate: pickupDateCar,
                dropoffDate: returnDateCar,
                dropoffLocation: dropoff || pickup,
                currencyCode: 'USD'
              },
              timeout: 25000,
              showToastOnError: false,
            });
            if (error) {
              console.warn('Car rental search error:', error);
              setResults([]);
              setFilteredResults([]);
              setError('No car rentals available for this location. Try a major airport like JFK, LAX, or LHR.');
              return;
            }
            const carResults = data.results || [];
            if (carResults.length === 0) {
              setError('No car rentals found for this location and date. Try a different airport or dates.');
            }
            setResults(carResults);
            setFilteredResults(carResults);
          } catch (err) {
            console.error('Car search failed:', err);
            setResults([]);
            setFilteredResults([]);
            setError('Unable to search for car rentals. The test API may not have data for this airport.');
          }
        } else if (searchType === "packages") {
          // Fetch hotels via unified function, plus flights and restaurants in parallel
          const [hotelsRes, flightsRes, restaurantsRes] = await Promise.all([
            supabase.functions.invoke('unified-search-hotels', {
              body: { location, checkIn, checkOut, guests: parseInt(guests) }
            }).catch(() => ({ data: { results: [] }, error: null })),
            supabase.functions.invoke('unified-search-flights', {
              body: { origin: 'JFK', destination: location, departureDate: checkIn, adults: parseInt(guests) }
            }).catch(() => ({ data: { results: [] }, error: null })),
            supabase.functions.invoke('tripadvisor-search-restaurants', {
              body: { location }
            }).catch(() => ({ data: { results: [] }, error: null }))
          ]);

          const hotelsList: any[] = hotelsRes.data?.results || [];

          const packageResults = [
            ...hotelsList.slice(0, 3).map((r: any) => ({ ...r, packageType: 'hotel' })),
            ...(flightsRes.data?.results || []).slice(0, 3).map((r: any) => ({ ...r, packageType: 'flight' })),
            ...(restaurantsRes.data?.results || []).slice(0, 3).map((r: any) => ({ ...r, packageType: 'restaurant' }))
          ];
          setResults(packageResults);
          setFilteredResults(packageResults);
        } else if (searchType === "transportation") {
          // Search transportation - both Uber and custom vendors
          const pickupLat = searchParams.get('pickupLat');
          const pickupLng = searchParams.get('pickupLng');
          const dropoffLat = searchParams.get('dropoffLat');
          const dropoffLng = searchParams.get('dropoffLng');

          if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            // Fetch Uber products
            try {
              const { data: uberData, error: uberError } = await supabase.functions.invoke('uber-get-products', {
                body: {
                  pickupLatitude: parseFloat(pickupLat),
                  pickupLongitude: parseFloat(pickupLng),
                  dropoffLatitude: parseFloat(dropoffLat),
                  dropoffLongitude: parseFloat(dropoffLng),
                },
              });

              if (!uberError && uberData?.success) {
                setUberProducts(uberData.products || []);
              }
            } catch (e) {
              console.error('Failed to fetch Uber products:', e);
            }
          }
          setResults([]);
          setFilteredResults([]);
        } else {
          setResults([]);
          setFilteredResults([]);
        }
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err.message || 'Failed to search');
      } finally {
        setLoading(false);
      }
    };

    if (searchType === "cars" ? !!pickup : !!(location || origin)) {
      performSearch();
    } else {
      setLoading(false);
      setResults([]);
      setFilteredResults([]);
      setSearchPerformed(false); // No search was performed
    }
  }, [searchType, location, origin, destination, departureDate, returnDate, checkIn, checkOut, guests, adults, children, infants, cabinClass, pickup, dropoff, pickupDateCar, returnDateCar, carTripType, rankingSort]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...results];

    // Apply price filter
    if (searchType === "restaurants") {
      // For restaurants, only apply price filter if user adjusted it from the default wide range
      const userAdjusted = priceRange[1] <= 1000; // default is very high for non-restaurants
      if (userAdjusted) {
        const toEstimate = (level: any) => {
          const val = (level || '').toString().trim();
          switch (val) {
            case '$': return 25;
            case '$$': return 50;
            case '$$-$$$': return 75;
            case '$$$': return 100;
            case '$$$$': return 200;
            default: return 50;
          }
        };
        filtered = filtered.filter((item) => {
          const price = toEstimate(item.price_level);
          return price >= priceRange[0] && price <= priceRange[1];
        });
      }
    } else {
      filtered = filtered.filter((item) => {
        const price = searchType === "flights"
          ? Number(item.price?.grandTotal ?? item.price?.total ?? 0)
          : searchType === "cars"
            ? Number(item.price?.total ?? 0)
            : (item.price || item.estimated_price || item.priceBreakdown?.grossPrice?.value || 0);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

// Apply rating filter (skip for restaurants to avoid over-filtering by preferences)
if (minRating && searchType !== "restaurants") {
  filtered = filtered.filter((item) => {
    // Handle different rating formats across search types
    let rating = 0;
    rating = (item.property?.reviewScore ?? (item.rating ? Number(item.rating) * 2 : 0));
    return rating >= minRating;
  });
}

    // Apply property type filter
    if (selectedPropertyTypes.length > 0) {
      filtered = filtered.filter((item) => {
        const propertyType = item.hotel?.type || item.property?.propertyType || item.type || '';
        return selectedPropertyTypes.some(type => 
          propertyType.toLowerCase().includes(type.toLowerCase())
        );
      });
    }

    // Apply star rating filter
    if (selectedStarRatings.length > 0) {
      filtered = filtered.filter((item) => {
        const starRating = item.hotel?.rating || item.property?.starRating || item.rating || 0;
        return selectedStarRatings.includes(Math.floor(Number(starRating)));
      });
    }

    // Apply amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((item) => {
        const itemAmenities = item.hotel?.amenities || item.property?.amenities || item.amenities || [];
        return selectedAmenities.some(amenity => 
          itemAmenities.some((a: string) => a.toLowerCase().includes(amenity.toLowerCase()))
        );
      });
    }

    // Apply cuisine filter for restaurants
    if (searchType === "restaurants" && selectedCuisines.length > 0) {
      filtered = filtered.filter((item) => {
        const cuisineTypes = item.cuisine?.map((c: any) => c.name || c).join(' ').toLowerCase() || '';
        return selectedCuisines.some(cuisine => 
          cuisineTypes.includes(cuisine.toLowerCase())
        );
      });
    }

    // Apply dietary filter for restaurants
    if (searchType === "restaurants" && selectedDietary.length > 0) {
      filtered = filtered.filter((item) => {
        const dietaryOptions = item.dietary_restrictions?.join(' ').toLowerCase() || '';
        return selectedDietary.some(diet => 
          dietaryOptions.includes(diet.toLowerCase())
        );
      });
    }

    // Apply event category filter
    if (searchType === "events" && selectedEventCategories.length > 0) {
      filtered = filtered.filter((item) => {
        const categories = item.classifications?.map((c: any) => 
          c.segment?.name || c.genre?.name || ''
        ).join(' ').toLowerCase() || '';
        return selectedEventCategories.some(cat => 
          categories.includes(cat.toLowerCase())
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "price":
        filtered.sort((a, b) => {
          const ap = searchType === "flights"
            ? Number(a.price?.grandTotal ?? a.price?.total ?? 0)
            : searchType === "cars"
              ? Number(a.price?.total ?? 0)
              : (a.price || a.estimated_price || a.priceBreakdown?.grossPrice?.value || 0);
          const bp = searchType === "flights"
            ? Number(b.price?.grandTotal ?? b.price?.total ?? 0)
            : searchType === "cars"
              ? Number(b.price?.total ?? 0)
              : (b.price || b.estimated_price || b.priceBreakdown?.grossPrice?.value || 0);
          return ap - bp;
        });
        break;
      case "price_desc":
        filtered.sort((a, b) => {
          const ap = searchType === "flights"
            ? Number(a.price?.grandTotal ?? a.price?.total ?? 0)
            : searchType === "cars"
              ? Number(a.price?.total ?? 0)
              : (a.price || a.estimated_price || a.priceBreakdown?.grossPrice?.value || 0);
          const bp = searchType === "flights"
            ? Number(b.price?.grandTotal ?? b.price?.total ?? 0)
            : searchType === "cars"
              ? Number(b.price?.total ?? 0)
              : (b.price || b.estimated_price || b.priceBreakdown?.grossPrice?.value || 0);
          return bp - ap;
        });
        break;
      case "review_score":
        filtered.sort((a, b) => {
          let ra = 0;
          let rb = 0;
          if (searchType === "restaurants") {
            ra = Number(a.rating) || 0;
            rb = Number(b.rating) || 0;
          } else {
            ra = a.property?.reviewScore ?? (a.rating ? Number(a.rating) * 2 : 0);
            rb = b.property?.reviewScore ?? (b.rating ? Number(b.rating) * 2 : 0);
          }
          return rb - ra;
        });
        break;
      default:
        // Keep recommended order (popularity)
        break;
    }

    setFilteredResults(filtered);
  }, [results, priceRange, minRating, sortBy, selectedAmenities, selectedPropertyTypes, selectedStarRatings, selectedCuisines, selectedDietary, selectedEventCategories]);

  const getRankingIcon = (type: string) => {
    switch(type) {
      case 'best_value': return <Trophy className="h-4 w-4" />;
      case 'cheapest': return <DollarSign className="h-4 w-4" />;
      case 'highest_rated': return <Star className="h-4 w-4" />;
      case 'closest': return <MapPin className="h-4 w-4" />;
      case 'fastest': return <Zap className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getRankingLabel = (type: string) => {
    switch(type) {
      case 'best_value': return 'Best Value';
      case 'cheapest': return 'Cheapest';
      case 'highest_rated': return 'Highest Rated';
      case 'closest': return 'Closest';
      case 'fastest': return 'Fastest';
      default: return 'Best Value';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          {/* Mobile: Show/Hide search bar toggle */}
          <Button
            variant="outline"
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="md:hidden gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showSearchBar ? 'Hide Search' : 'Modify Search'}
          </Button>
        </div>
        
        {/* Search bar - hidden on mobile by default, always visible on desktop */}
        <div className={`mb-6 ${showSearchBar ? 'block' : 'hidden md:block'}`}>
          <EnhancedSearchBar />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : results.length === 0 && searchPerformed ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found. Try a different search.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Enter your search details above to find {searchType}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Header with Filters and Sorting */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {filteredResults.length} {searchType === "hotels" ? "properties" : searchType === "packages" ? "package options" : searchType === "flights" ? "flights" : searchType === "cars" ? "cars" : "destinations"} {searchType === "flights" ? `from ${origin.split(' - ')[0]} to ${destination.split(' - ')[0]}` : searchType === "cars" ? `from ${pickupCode}${dropoffCode && pickupCode !== dropoffCode ? ` to ${dropoffCode}` : ''}` : `in ${location}`}
                </h2>
                {searchType === "hotels" && checkIn && (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {checkIn} to {checkOut} • {guests} guests
                    </p>
                    {userPreferences && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs font-medium text-primary">
                          Filtering with your saved preferences (${userPreferences.price_range_min || 20}-${userPreferences.price_range_max || 1000}/night, {userPreferences.preferred_hotel_rating || 'any'} stars min)
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {searchType === "cars" && pickupDateCar && (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {pickupDateCar} to {returnDateCar} • {pickupCode}{dropoffCode && pickupCode !== dropoffCode ? ` → ${dropoffCode}` : ''}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Ranking Pills - show for all search types */}
              <div className="flex flex-wrap gap-2 pb-2">
                <Button
                  variant={rankingSort === 'best_value' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRankingSort('best_value')}
                  className="flex items-center gap-1"
                >
                  <Trophy className="h-3 w-3" />
                  Best Value
                </Button>
                <Button
                  variant={rankingSort === 'cheapest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRankingSort('cheapest')}
                  className="flex items-center gap-1"
                >
                  <DollarSign className="h-3 w-3" />
                  Cheapest
                </Button>
                <Button
                  variant={rankingSort === 'highest_rated' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRankingSort('highest_rated')}
                  className="flex items-center gap-1"
                >
                  <Star className="h-3 w-3" />
                  Highest Rated
                </Button>
                {(searchType === 'hotels' || searchType === 'restaurants') && (
                  <Button
                    variant={rankingSort === 'closest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRankingSort('closest')}
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Closest
                  </Button>
                )}
                {searchType === 'flights' && (
                  <Button
                    variant={rankingSort === 'fastest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRankingSort('fastest')}
                    className="flex items-center gap-1"
                  >
                    <Zap className="h-3 w-3" />
                    Fastest
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mobile Filters */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="sm:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      {searchType === "hotels" || searchType === "packages" ? (
                        <HotelFilters
                          onSortChange={setSortBy}
                          onMinRatingChange={setMinRating}
                          onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                          onAmenitiesChange={setSelectedAmenities}
                          currentSort={sortBy}
                          currentMinRating={minRating || undefined}
                          currentPriceRange={priceRange}
                          resultsCount={filteredResults.length}
                        />
                      ) : searchType === "restaurants" ? (
                        <RestaurantFilters
                          onSortChange={setSortBy}
                          onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                          onCuisineChange={setSelectedCuisines}
                          onDietaryChange={setSelectedDietary}
                          currentSort={sortBy}
                          currentPriceRange={priceRange}
                          resultsCount={filteredResults.length}
                        />
                      ) : searchType === "events" ? (
                        <AdvancedEventFilters
                          onSortChange={setSortBy}
                          onFilterChange={(filters) => {
                            setPriceRange(filters.priceRange);
                            setSelectedEventCategories(filters.categories);
                          }}
                          currentSort={sortBy}
                          resultsCount={filteredResults.length}
                        />
                      ) : searchType === "flights" ? (
                        <AdvancedFlightFilters
                          onSortChange={setSortBy}
                          onFilterChange={(filters) => {
                            setPriceRange(filters.priceRange);
                          }}
                          currentSort={sortBy}
                          resultsCount={filteredResults.length}
                          availableAirlines={[]}
                        />
                      ) : null}
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown - Desktop */}
                <Select value={sortBy} onValueChange={setSortBy} >
                  <SelectTrigger className="w-[180px] hidden sm:flex">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Recommended</SelectItem>
                    <SelectItem value="price">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="review_score">Guest Rating</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden sm:flex border rounded-lg">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="rounded-l-none"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Filters Sidebar - Desktop */}
              <aside className="hidden sm:block lg:col-span-3">
                <div className="sticky top-4">
                  {searchType === "hotels" || searchType === "packages" ? (
                    <HotelFilters
                      onSortChange={setSortBy}
                      onMinRatingChange={setMinRating}
                      onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                      onAmenitiesChange={setSelectedAmenities}
                      onPropertyTypesChange={setSelectedPropertyTypes}
                      onStarRatingsChange={setSelectedStarRatings}
                      currentSort={sortBy}
                      currentMinRating={minRating || undefined}
                      currentPriceRange={priceRange}
                      resultsCount={filteredResults.length}
                    />
                  ) : searchType === "restaurants" ? (
                    <RestaurantFilters
                      onSortChange={setSortBy}
                      onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                      onCuisineChange={setSelectedCuisines}
                      onDietaryChange={setSelectedDietary}
                      currentSort={sortBy}
                      currentPriceRange={priceRange}
                      resultsCount={filteredResults.length}
                    />
                  ) : searchType === "events" ? (
                    <AdvancedEventFilters
                      onSortChange={setSortBy}
                      onFilterChange={(filters) => {
                        setPriceRange(filters.priceRange);
                        setSelectedEventCategories(filters.categories);
                      }}
                      currentSort={sortBy}
                      resultsCount={filteredResults.length}
                    />
                  ) : searchType === "flights" ? (
                    <AdvancedFlightFilters
                      onSortChange={setSortBy}
                      onFilterChange={(filters) => {
                        setPriceRange(filters.priceRange);
                      }}
                      currentSort={sortBy}
                      resultsCount={filteredResults.length}
                      availableAirlines={[]}
                    />
                  ) : null}
                </div>
              </aside>

              {/* Results List */}
              <main className="lg:col-span-9">
                {/* Promoted Transportation Vendors */}
                <div className="mb-6">
                  <VendorPromotionFeed displayContext="search" limit={2} />
                </div>

                {/* Map View at Top for hotels, restaurants, and events */}
                {(searchType === "hotels" || searchType === "restaurants" || searchType === "events") && (
                  <ResultsMapView 
                    location={location || ''} 
                    results={filteredResults}
                    type={searchType}
                  />
                )}

                {viewMode === "list" ? (
                  <div className="space-y-2">
                    {filteredResults.map((result, index) => {
                      if (searchType === "hotels") {
                        return (
                          <CompactHotelCard
                            key={`${result.hotel_id || result.dest_id || 'hotel'}-${index}`}
                            property={result}
                          />
                        );
                      } else if (searchType === "flights") {
                        return (
                          <CompactFlightCard
                            key={`${result.id || 'flight'}-${index}`}
                            flight={result}
                            dictionaries={flightDictionaries}
                          />
                        );
                      } else if (searchType === "cars") {
                        return (
                          <CarCard
                            key={`${result.id || result.offerId || 'car'}-${index}`}
                            car={result}
                          />
                        );
                      } else if (searchType === "restaurants") {
                        return (
                          <CompactRestaurantCard
                            key={`${result.id || 'restaurant'}-${index}`}
                            restaurant={result}
                          />
                        );
                      } else if (searchType === "transportation") {
                        // Transportation search shows Uber products instead of filtered results
                        return null;
                      } else {
                        return (
                          <CompactHotelCard
                            key={`${result.hotel_id || result.dest_id || 'pkg'}-${index}`}
                            property={result}
                          />
                        );
                      }
                    })}
                    
                    {searchType === "transportation" && uberProducts.length > 0 && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Instant Uber Options</h3>
                            <Badge variant="secondary">{uberProducts.length} available</Badge>
                          </div>
                          <div className="grid gap-4">
                            {uberProducts.map((product: any) => (
                              <UberProductCard
                                key={product.product_id}
                                product={product}
                                onBook={() => {
                                  setSelectedUberProduct(product);
                                  setIsUberModalOpen(true);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[calc(100vh-300px)] rounded-lg border bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Map view coming soon</p>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}
      </div>

      {selectedUberProduct && (
        <UberBookingModal
          isOpen={isUberModalOpen}
          onClose={() => setIsUberModalOpen(false)}
          productId={selectedUberProduct.product_id}
          productName={selectedUberProduct.display_name}
          pickupLat={searchParams.get('pickupLat') || undefined}
          pickupLng={searchParams.get('pickupLng') || undefined}
          dropoffLat={searchParams.get('dropoffLat') || undefined}
          dropoffLng={searchParams.get('dropoffLng') || undefined}
        />
      )}
    </div>
  );
};

export default SearchResults;