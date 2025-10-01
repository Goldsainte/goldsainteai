import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { SearchBar } from "@/components/SearchBar";
import { SimplePropertyCard } from "@/components/SimplePropertyCard";
import { HotelFilters } from "@/components/HotelFilters";
import { Button } from "@/components/ui/button";
import { Loader2, SlidersHorizontal, Map, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSearchHistory } from "@/hooks/useSearchHistory";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addSearch } = useSearchHistory();
  const [results, setResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const searchType = searchParams.get("type") || "hotels";
  const location = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "2";

  useEffect(() => {
    const performSearch = async () => {
      // Save search to history when performing a search
      if (location) {
        addSearch({
          type: searchType,
          location,
          ...(searchType === "hotels" && checkIn && checkOut && { checkIn, checkOut, guests }),
          ...(searchType === "flights" && checkIn && { checkIn }),
          ...(searchType === "events" && checkIn && { checkIn })
        });
      }
      setLoading(true);
      setError(null);
      setResults([]); // Clear previous results immediately

      try {
        if (searchType === "hotels") {
          const { data, error } = await supabase.functions.invoke('tripadvisor-search-hotels', {
            body: { location, checkIn, checkOut, guests: parseInt(guests) }
          });

          if (error) throw error;
          const hotelResults = data.results || [];
          setResults(hotelResults);
          setFilteredResults(hotelResults);
        } else if (searchType === "destinations") {
          const { data, error } = await supabase.functions.invoke('search-destinations', {
            body: { query: location }
          });

          if (error) throw error;
          const destResults = data.results || [];
          setResults(destResults);
          setFilteredResults(destResults);
        } else if (searchType === "restaurants") {
          const { data, error } = await supabase.functions.invoke('tripadvisor-search-restaurants', {
            body: { location }
          });

          if (error) throw error;
          const restaurantResults = data.results || [];
          setResults(restaurantResults);
          setFilteredResults(restaurantResults);
        } else if (searchType === "packages") {
          // Fetch hotels, flights, and restaurants in parallel
          const [hotelsRes, flightsRes, restaurantsRes] = await Promise.all([
            supabase.functions.invoke('tripadvisor-search-hotels', {
              body: { location, checkIn, checkOut, guests: parseInt(guests) }
            }),
            supabase.functions.invoke('amadeus-search-flights', {
              body: { origin: 'JFK', destination: location, departureDate: checkIn, adults: parseInt(guests) }
            }).catch(() => ({ data: { results: [] }, error: null })),
            supabase.functions.invoke('tripadvisor-search-restaurants', {
              body: { location }
            }).catch(() => ({ data: { results: [] }, error: null }))
          ]);

          const packageResults = [
            ...(hotelsRes.data?.results || []).slice(0, 3).map((r: any) => ({ ...r, packageType: 'hotel' })),
            ...(flightsRes.data?.results || []).slice(0, 3).map((r: any) => ({ ...r, packageType: 'flight' })),
            ...(restaurantsRes.data?.results || []).slice(0, 3).map((r: any) => ({ ...r, packageType: 'restaurant' }))
          ];
          setResults(packageResults);
          setFilteredResults(packageResults);
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

    if (location) {
      performSearch();
    } else {
      setLoading(false);
      setResults([]);
      setFilteredResults([]);
    }
  }, [searchType, location, checkIn, checkOut, guests]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...results];

    // Apply price filter
    filtered = filtered.filter((item) => {
      const price = item.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply rating filter
    if (minRating) {
      filtered = filtered.filter((item) => {
        const rating = item.property?.reviewScore || 0;
        return rating >= minRating;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "price":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "review_score":
        filtered.sort((a, b) => (b.property?.reviewScore || 0) - (a.property?.reviewScore || 0));
        break;
      default:
        // Keep recommended order (popularity)
        break;
    }

    setFilteredResults(filtered);
  }, [results, priceRange, minRating, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <SearchBar />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found. Try a different search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Header with Filters and Sorting */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {filteredResults.length} {searchType === "hotels" ? "properties" : searchType === "packages" ? "package options" : "destinations"} in {location}
                </h2>
                {searchType === "hotels" && checkIn && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {checkIn} to {checkOut} • {guests} guests
                  </p>
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
                </div>
              </aside>

              {/* Results List */}
              <main className="lg:col-span-9">
                {viewMode === "list" ? (
                  <div className="space-y-4">
                    {filteredResults.map((result, index) => (
                      <SimplePropertyCard
                        key={result.hotel_id || result.dest_id || index}
                        property={result}
                        type={searchType}
                      />
                    ))}
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
    </div>
  );
};

export default SearchResults;