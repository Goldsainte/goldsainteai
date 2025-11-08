import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HotelPriceFilter } from "./HotelPriceFilter";
import { HotelGrid } from "./HotelGrid";
import { HotelSkeletonGrid } from "./HotelSkeletonGrid";
import { HotelEmptyState } from "./HotelEmptyState";
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

  return (
    <div className="space-y-6">
      {/* Filters above results - hide when coming from chat */}
      {!hidePriceFilter && (
        <HotelPriceFilter
          maxPrice={query.maxPrice}
          currency={query.currency}
          onPriceChange={handlePriceChange}
          onCurrencyChange={handleCurrencyChange}
          disabled={loading}
        />
      )}

      {/* Loading state */}
      {loading && <HotelSkeletonGrid count={8} />}

      {/* Error/Empty state */}
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

      {/* Results */}
      {!loading && !error && data.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Found {data.length} hotel{data.length !== 1 ? 's' : ''} under {query.currency}{query.maxPrice}/night
          </div>
          <HotelGrid hotels={data} searchDates={{ checkIn: query.checkIn, checkOut: query.checkOut }} />
        </div>
      )}
    </div>
  );
};
