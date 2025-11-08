import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { HotelPriceFilter } from "./HotelPriceFilter";
import { HotelGrid } from "./HotelGrid";
import { HotelSkeletonGrid } from "./HotelSkeletonGrid";
import { HotelEmptyState } from "./HotelEmptyState";
import { HotelFilterSidebar, HotelFilters } from "./HotelFilterSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HotelQuery {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  maxPrice: number;
  currency: string;
  sortBy?: string;
}

interface HotelSearchWithFiltersProps {
  initialQuery: HotelQuery;
  onQueryChange?: (query: HotelQuery) => void;
  hidePriceFilter?: boolean;
}

export const HotelSearchWithFilters = ({ initialQuery, onQueryChange, hidePriceFilter = false }: HotelSearchWithFiltersProps) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [query, setQuery] = useState<HotelQuery>(initialQuery);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HotelFilters>({
    minStarRating: 0,
    maxDistance: 50,
    amenities: []
  });
  const reqSeq = useRef(0); // monotonic sequence to drop stale responses
  const ctrlRef = useRef<AbortController | null>(null);

  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Notify parent of query changes
  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  // Debounced fetch when query changes
  useEffect(() => {
    const id = ++reqSeq.current;
    setLoading(true);
    setError(null);

    // Cancel previous request
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    const timeoutId = setTimeout(async () => {
      try {
        console.log('Fetching hotels with query:', query);
        
        const { data: hotelData, error: hotelError } = await supabase.functions.invoke('unified-search-hotels', {
          body: {
            location: query.location,
            checkIn: query.checkIn,
            checkOut: query.checkOut,
            guests: query.guests,
            max_total_price: query.maxPrice,
            currency: query.currency,
            sortBy: query.sortBy || 'best_value',
            filter: 'all'
          },
          signal: ctrl.signal
        });

        if (hotelError) throw hotelError;

        // Drop stale responses
        if (id !== reqSeq.current) {
          console.log('Dropping stale response, request id:', id, 'current:', reqSeq.current);
          return;
        }

        const results = hotelData?.results || [];
        console.log(`Received ${results.length} hotels (request ${id})`);
        setData(results);
        
        if (results.length === 0) {
          setError(`No hotels found under ${query.currency}${query.maxPrice}/night`);
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          console.log('Request aborted');
          return;
        }
        
        // Drop stale error responses
        if (id !== reqSeq.current) return;
        
        console.error('Hotel search error:', e);
        const errorMessage = e.message || 'Search failed';
        setError(errorMessage);
        
        toast({
          title: "Search Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        // Only update loading state if this is still the latest request
        if (id === reqSeq.current) {
          setLoading(false);
        }
      }
    }, 300); // 300ms debounce for smooth slider dragging

    return () => {
      clearTimeout(timeoutId);
      ctrl.abort();
    };
  }, [
    query.location,
    query.checkIn,
    query.checkOut,
    query.guests,
    query.maxPrice,
    query.currency,
    query.sortBy,
    toast
  ]);

  const handlePriceChange = (value: number) => {
    setQuery(q => ({ ...q, maxPrice: value }));
  };

  const handleCurrencyChange = (currency: string) => {
    setQuery(q => ({ ...q, currency }));
  };

  const handleIncreaseBudget = () => {
    setQuery(q => ({ ...q, maxPrice: q.maxPrice + 50 }));
  };

  // Client-side filtering
  const filteredHotels = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(hotel => {
      // Star rating filter
      if (filters.minStarRating > 0) {
        const hotelRating = hotel.rating || hotel.property?.reviewScore || 0;
        // Convert rating to 5-star scale if needed (some APIs use 10-point scale)
        const normalizedRating = hotelRating > 5 ? hotelRating / 2 : hotelRating;
        if (normalizedRating < filters.minStarRating) return false;
      }

      // Distance filter
      if (filters.maxDistance < 50) {
        const distance = hotel.distance || hotel.distanceFromCenter || 0;
        if (distance > filters.maxDistance) return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hotelAmenities = (hotel.amenities || []).map((a: string) => a.toLowerCase());
        const hasAllAmenities = filters.amenities.every(requiredAmenity => {
          // Check for common amenity name variations
          return hotelAmenities.some((hotelAmenity: string) => {
            if (requiredAmenity === 'wifi') return hotelAmenity.includes('wifi') || hotelAmenity.includes('internet');
            if (requiredAmenity === 'parking') return hotelAmenity.includes('park');
            if (requiredAmenity === 'breakfast') return hotelAmenity.includes('breakfast');
            if (requiredAmenity === 'gym') return hotelAmenity.includes('gym') || hotelAmenity.includes('fitness');
            if (requiredAmenity === 'pool') return hotelAmenity.includes('pool') || hotelAmenity.includes('swimming');
            return false;
          });
        });
        if (!hasAllAmenities) return false;
      }

      return true;
    });
  }, [data, filters]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <HotelFilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={filteredHotels.length}
        />

        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center gap-3">
            <SidebarTrigger className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
            </SidebarTrigger>
            
            {!hidePriceFilter && !loading && data.length > 0 && (
              <div className="flex-1">
                <HotelPriceFilter
                  maxPrice={query.maxPrice}
                  currency={query.currency}
                  onPriceChange={handlePriceChange}
                  onCurrencyChange={handleCurrencyChange}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          <div className="p-4">
            {/* Loading state */}
            {loading && <HotelSkeletonGrid count={8} />}

            {/* Error/Empty state - no results from API */}
            {!loading && error && (
              <HotelEmptyState
                title="No hotels within your budget"
                description={error}
                actions={[
                  {
                    label: `Increase budget +${query.currency}50`,
                    onClick: handleIncreaseBudget
                  }
                ]}
              />
            )}

            {/* Empty state - all filtered out */}
            {!loading && !error && filteredHotels.length === 0 && data.length > 0 && (
              <HotelEmptyState
                title="No Hotels Match Filters"
                description="Try adjusting your filters to see more results."
                actions={[
                  {
                    label: "Clear All Filters",
                    onClick: () => setFilters({ minStarRating: 0, maxDistance: 50, amenities: [] })
                  }
                ]}
              />
            )}

            {/* Results */}
            {!loading && !error && filteredHotels.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredHotels.length} of {data.length} hotel{data.length !== 1 ? 's' : ''} under {query.currency}{query.maxPrice}/night
                </div>
                <HotelGrid hotels={filteredHotels} searchDates={{ checkIn: query.checkIn, checkOut: query.checkOut }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
