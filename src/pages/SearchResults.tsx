import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";
import { CompactHotelCard } from "@/components/CompactHotelCard";
import { CompactFlightCard } from "@/components/CompactFlightCard";
import { CompactRestaurantCard } from "@/components/CompactRestaurantCard";
import { CarCard } from "@/components/CarCard";
import { TransferCard } from "@/components/TransferCard";
import { UberProductCard } from "@/components/UberProductCard";
import { UberBookingModal } from "@/components/UberBookingModal";
import { ResultsMapView } from "@/components/ResultsMapView";
import { HotelFilters } from "@/components/HotelFilters";
import { RestaurantFilters } from "@/components/RestaurantFilters";
import { AdvancedEventFilters } from "@/components/AdvancedEventFilters";
import { AdvancedFlightFilters } from "@/components/AdvancedFlightFilters";
import { HotelSearchWithFilters } from "@/components/hotels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, SlidersHorizontal, Map, List, ArrowLeft, Trophy, DollarSign, Star, MapPin, Zap, ArrowUp } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";
import { getUserLocation } from "@/lib/locationMapping";
import { fetchUberFallback } from "@/lib/simpleCarSearchFallback";
import { cn } from "@/lib/utils";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addSearch } = useSearchHistory();
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [selectedPickupLat, setSelectedPickupLat] = useState<string | undefined>();
  const [selectedPickupLng, setSelectedPickupLng] = useState<string | undefined>();
  const [selectedDropoffLat, setSelectedDropoffLat] = useState<string | undefined>();
  const [selectedDropoffLng, setSelectedDropoffLng] = useState<string | undefined>();
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<string | undefined>();
  const [selectedDropoffAddress, setSelectedDropoffAddress] = useState<string | undefined>();
  const [uberFallbackMode, setUberFallbackMode] = useState(false);
  const [isSearchBarCompact, setIsSearchBarCompact] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchType = searchParams.get("type") || "hotels";
  const location = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "2";
  
  // Parse AI chat navigation parameters
  const fromChat = searchParams.get('from_chat') === 'true';
  const suppressUI = JSON.parse(searchParams.get('suppress_ui') || '[]') as string[];
  const hideDatePicker = suppressUI.includes('date_picker');
  const hideBudgetSlider = suppressUI.includes('budget_slider');
  const chatMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const chatCurrency = searchParams.get('currency') || 'USD';
  
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

  // Scroll detection for compact search bar and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setIsSearchBarCompact(window.scrollY > 100);
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Polling for Uber updates when in transportation or fallback mode
  useEffect(() => {
    if (searchType !== "transportation" && !uberFallbackMode) return;
    
    const pollUberUpdates = async () => {
      const pickupLat = searchParams.get('pickupLat');
      const pickupLng = searchParams.get('pickupLng');
      const dropoffLat = searchParams.get('dropoffLat');
      const dropoffLng = searchParams.get('dropoffLng');

      if (searchType === "transportation" && pickupLat && pickupLng && dropoffLat && dropoffLng) {
        try {
          const { data: uberData } = await supabase.functions.invoke('uber-get-products', {
            body: {
              pickupLatitude: parseFloat(pickupLat),
              pickupLongitude: parseFloat(pickupLng),
              dropoffLatitude: parseFloat(dropoffLat),
              dropoffLongitude: parseFloat(dropoffLng),
            }
          });
          if (uberData?.products) {
            setUberProducts(uberData.products);
          }
        } catch (err) {
          console.error('Uber polling error:', err);
        }
      } else if (uberFallbackMode && location) {
        const { products } = await fetchUberFallback(location);
        if (products) {
          setUberProducts(products);
        }
      }
    };

    const intervalId = setInterval(pollUberUpdates, 15000); // Poll every 15 seconds
    return () => clearInterval(intervalId);
  }, [searchType, uberFallbackMode, location, searchParams]);

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
      setUberProducts([]); // Clear previous Uber products

      try {
        if (searchType === "hotels") {
          const { data, error } = await invokeEdgeFunction('unified-search-hotels', {
            body: {
              location,
              checkIn,
              checkOut,
              guests: parseInt(guests),
              currency: chatCurrency,
              ...(chatMaxPrice && { max_total_price: chatMaxPrice })
            },
            timeout: 30000,
            showToastOnError: true,
          });

          if (error) {
            if (error.type === 'RATE_LIMIT') {
              setError('Too many requests. Please wait a moment and try again.');
              return;
            }
            if (error.type === 'PAYMENT_REQUIRED') {
              setError('Service temporarily unavailable. Please try again later.');
              return;
            }
            throw error;
          }

          let hotelResults = data?.results || [];

          // Fallback to HotelBeds if no results from unified search
          if (hotelResults.length === 0) {
            const { getHotelBedsDestinationCode } = await import('@/lib/hotelbedsHelpers');
            const destinationCode = getHotelBedsDestinationCode(location);
            
            const { data: fallbackData, error: fallbackError } = await invokeEdgeFunction('hotelbeds-search-hotels', {
              body: {
                destination: destinationCode,
                checkIn,
                checkOut,
                adults: parseInt(guests),
                children: 0,
                rooms: 1
              },
              timeout: 30000,
              showToastOnError: false,
            });
            
            if (!fallbackError && fallbackData?.hotels) {
              hotelResults = fallbackData.hotels;
            }
          }

          // Clean out test/dummy hotels
          const cleanedHotels = hotelResults.filter((h: any) => {
            const name = (h?.name || '').toString().trim();
            if (!name) return false;
            const lower = name.toLowerCase();
            return !(
              lower.includes('test') ||
              lower.includes('do not use') ||
              lower.includes('dummy') ||
              lower.includes('sample') ||
              lower.includes('qa') ||
              lower.includes('dev')
            );
          });

          // Enrich select hotels with virtual tours for demo
          const { enrichHotelsWithVirtualTours } = await import('@/lib/virtualTourHelpers');
          const enrichedHotels = enrichHotelsWithVirtualTours(cleanedHotels);

          setResults(enrichedHotels);
          setFilteredResults(enrichedHotels);
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
          const restaurantResults = data?.results || [];
          setResults(restaurantResults);
          setFilteredResults(restaurantResults);
        } else if (searchType === "cars") {
          // Cars section now includes both car rentals and transfers (via HotelBeds)
          const { getDestinationFromAirportCode } = await import('@/lib/hotelbedsHelpers');
          
          if (pickup && pickupDateCar && returnDateCar) {
            // Car rental search - API integration removed
            setError('Car rental search is temporarily unavailable. Please check back later.');
            setResults([]);
            setFilteredResults([]);
          } else if (location && !pickup) {
            // Location-only search: show Uber instant rides
            setResults([]);
            setFilteredResults([]);
            setError(null);
            setUberFallbackMode(true);
            
            const { products, error: uberError } = await fetchUberFallback(location);
            if (uberError) {
              setError(uberError);
            } else {
              setUberProducts(products);
            }
          } else {
            setError('Enter pickup location and dates for rentals, or just a location for instant rides');
            setResults([]);
            setFilteredResults([]);
          }
        } else if (searchType === "packages") {
          // Fetch hotels via HotelBeds, plus flights and restaurants in parallel
          const { getHotelBedsDestinationCode } = await import('@/lib/hotelbedsHelpers');
          const destinationCode = getHotelBedsDestinationCode(location);
          
          const [hotelsRes, flightsRes, restaurantsRes] = await Promise.all([
            supabase.functions.invoke('hotelbeds-search-hotels', {
              body: { destination: destinationCode, checkIn, checkOut, adults: parseInt(guests), children: 0, rooms: 1 }
            }).catch(() => ({ data: { hotels: [] }, error: null })),
            supabase.functions.invoke('unified-search-flights', {
              body: { origin: 'JFK', destination: location, departureDate: checkIn, adults: parseInt(guests) }
            }).catch(() => ({ data: { results: [] }, error: null })),
            supabase.functions.invoke('tripadvisor-search-restaurants', {
              body: { location }
            }).catch(() => ({ data: { results: [] }, error: null }))
          ]);

          const hotelsList: any[] = hotelsRes.data?.hotels || [];

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

    if (searchType === "cars" ? (!!pickup || !!location) : !!(location || origin)) {
      performSearch();
    } else {
      setLoading(false);
      setResults([]);
      setFilteredResults([]);
      setSearchPerformed(false); // No search was performed
    }
  }, [searchType, location, origin, destination, departureDate, returnDate, checkIn, checkOut, guests, adults, children, infants, cabinClass, pickup, dropoff, pickupDateCar, returnDateCar, carTripType, rankingSort]);

  // Uber live polling
  useEffect(() => {
    const shouldPoll = searchType === "transportation" || (searchType === "cars" && location && !pickup);
    if (!shouldPoll || uberProducts.length === 0) return;
    
    const interval = setInterval(async () => {
      if (location && searchType === "cars" && !pickup) {
        const { products } = await fetchUberFallback(location);
        if (products && products.length > 0) {
          setUberProducts(products);
        }
      }
    }, 15000); // Every 15 seconds
    
    return () => clearInterval(interval);
  }, [searchType, location, pickup, uberProducts.length]);

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
          ? (item.numericPrice ?? Number(item.price?.grandTotal ?? item.price?.total ?? item.price ?? 0))
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
            ? (a.numericPrice ?? Number(a.price?.grandTotal ?? a.price?.total ?? a.price ?? 0))
            : searchType === "cars"
              ? Number(a.price?.total ?? 0)
              : (a.price || a.estimated_price || a.priceBreakdown?.grossPrice?.value || 0);
          const bp = searchType === "flights"
            ? (b.numericPrice ?? Number(b.price?.grandTotal ?? b.price?.total ?? b.price ?? 0))
            : searchType === "cars"
              ? Number(b.price?.total ?? 0)
              : (b.price || b.estimated_price || b.priceBreakdown?.grossPrice?.value || 0);
          return ap - bp;
        });
        break;
      case "price_desc":
        filtered.sort((a, b) => {
          const ap = searchType === "flights"
            ? (a.numericPrice ?? Number(a.price?.grandTotal ?? a.price?.total ?? a.price ?? 0))
            : searchType === "cars"
              ? Number(a.price?.total ?? 0)
              : (a.price || a.estimated_price || a.priceBreakdown?.grossPrice?.value || 0);
          const bp = searchType === "flights"
            ? (b.numericPrice ?? Number(b.price?.grandTotal ?? b.price?.total ?? b.price ?? 0))
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
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
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
        
        {/* Search bar - sticky with compact mode */}
        <div className={cn(
          "sticky top-0 z-50 bg-background/95 backdrop-blur-sm transition-all duration-300 -mx-4 px-4 mb-4",
          isSearchBarCompact ? "py-2 shadow-md" : "py-4"
        )}>
          <EnhancedSearchBar 
            isCompact={isSearchBarCompact}
            hideDatePickers={fromChat && hideDatePicker}
          />
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
              
              {/* Ranking Pills - mobile-friendly with horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
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
                          hidePriceRange={fromChat && hideBudgetSlider}
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

                {/* Map view temporarily disabled — list view only */}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Filters Sidebar - Desktop */}
              <aside className="hidden sm:block lg:col-span-2">
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
                      hidePriceRange={fromChat && hideBudgetSlider}
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
              <main className="lg:col-span-10">
                {/* Map View at Top for restaurants and events (hotels handled in HotelSearchWithFilters) */}
                {(searchType === "restaurants" || searchType === "events") && (
                  <ResultsMapView 
                    location={location || ''} 
                    results={filteredResults}
                    type={searchType}
                  />
                )}

                {/* Hotel search with slider-gated filtering and race condition handling */}
                {searchType === "hotels" && location && checkIn && checkOut ? (
                  <HotelSearchWithFilters
                    initialQuery={{
                      location,
                      checkIn,
                      checkOut,
                      guests: parseInt(guests) || 2,
                      maxPrice: chatMaxPrice || priceRange[1] || 500,
                      currency: chatCurrency || 'USD',
                      sortBy: rankingSort
                    }}
                    onQueryChange={(query) => {
                      // Update price range state to keep filters in sync
                      setPriceRange([priceRange[0], query.maxPrice || 500]);
                    }}
                    hidePriceFilter={true}
                  />
                ) : searchType === "hotels" ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Please enter hotel search details using the search bar above</p>
                  </div>
                ) : null}

                {viewMode === "list" && searchType !== "hotels" ? (
                  <div className="space-y-2">
                    {filteredResults.map((result, index) => {
                      if (searchType === "flights") {
                        return (
                          <CompactFlightCard
                            key={`${result.id || 'flight'}-${index}`}
                            flight={result}
                            dictionaries={flightDictionaries}
                            origin={origin}
                            destination={destination}
                            departureDate={departureDate}
                            returnDate={returnDate}
                            adults={parseInt(adults)}
                            cabinClass={cabinClass}
                          />
                        );
                      } else if (searchType === "cars") {
                        // Handle both car rentals and transfers
                        if (result.resultType === 'transfer') {
                          return (
                            <TransferCard
                              key={`transfer-${result.code || index}`}
                              transfer={result}
                              onBook={() => {
                                navigate("/marketplace");
                              }}
                            />
                          );
                        }
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
                            searchDates={{
                              checkIn: checkIn,
                              checkOut: checkOut
                            }}
                          />
                        );
                      }
                    })}
                    
                    {/* Show Uber products for transportation OR cars (when only location provided) */}
                    {((searchType === "transportation") || (searchType === "cars" && !pickup && location)) && uberProducts.length > 0 && (
                      <div className="space-y-6">
                        {searchType === "cars" && !pickup && location && (
                          <div className="mb-4 p-4 bg-accent/50 rounded-lg border border-border">
                            <p className="text-sm text-muted-foreground">
                              Showing instant ride options for <span className="font-semibold text-foreground">{location}</span>. 
                              For traditional car rentals, use the search bar above to specify pickup/return dates and airport code (e.g., LAX, JFK).
                            </p>
                          </div>
                        )}
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
                                  setSelectedPickupLat(searchParams.get('pickupLat') || undefined);
                                  setSelectedPickupLng(searchParams.get('pickupLng') || undefined);
                                  setSelectedDropoffLat(searchParams.get('dropoffLat') || undefined);
                                  setSelectedDropoffLng(searchParams.get('dropoffLng') || undefined);
                                  setSelectedPickupAddress(searchParams.get('pickupAddress') || undefined);
                                  setSelectedDropoffAddress(searchParams.get('dropoffAddress') || undefined);
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
          pickupLat={selectedPickupLat}
          pickupLng={selectedPickupLng}
          dropoffLat={selectedDropoffLat}
          dropoffLng={selectedDropoffLng}
          pickupAddress={selectedPickupAddress}
          dropoffAddress={selectedDropoffAddress}
        />
      )}

      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 rounded-full w-12 h-12 shadow-lg"
          size="icon"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default SearchResults;
