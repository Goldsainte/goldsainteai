import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { SearchBar } from "@/components/SearchBar";
import { SimplePropertyCard } from "@/components/SimplePropertyCard";
import { Loader2 } from "lucide-react";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchType = searchParams.get("type") || "hotels";
  const location = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "2";

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      setError(null);
      setResults([]); // Clear previous results immediately

      try {
        if (searchType === "hotels") {
          const { data, error } = await supabase.functions.invoke('search-hotels', {
            body: { location, checkIn, checkOut, guests: parseInt(guests) }
          });

          if (error) throw error;
          setResults(data.results || []);
        } else if (searchType === "destinations") {
          const { data, error } = await supabase.functions.invoke('search-destinations', {
            body: { query: location }
          });

          if (error) throw error;
          setResults(data.results || []);
        } else {
          setResults([]);
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
    }
  }, [searchType, location, checkIn, checkOut, guests]);

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-primary font-semibold text-foreground">
                {results.length} {searchType === "hotels" ? "properties" : "destinations"} in {location}
                {searchType === "hotels" && checkIn && ` • ${checkIn} to ${checkOut}`}
              </h2>
            </div>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <SimplePropertyCard
                  key={result.hotel_id || result.dest_id || index}
                  property={result}
                  type={searchType}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;