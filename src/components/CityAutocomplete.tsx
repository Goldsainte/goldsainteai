import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitySuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  class: string;
  type: string;
  name?: string;
  importance?: number;
  addresstype?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    locality?: string;
    state?: string;
    country?: string;
  };
  extratags?: {
    admin_level?: string;
  };
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CityAutocomplete = ({
  value,
  onChange,
  placeholder = "City (e.g., Paris, France)",
  className,
}: CityAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Build a user-friendly label
  const getLabel = (s: CitySuggestion) => {
    const cityField = s.address?.city || s.address?.town || s.address?.village || s.address?.municipality || s.address?.locality;
    
    // For islands/archipelagos, use the name directly
    const city = (s.type === "island" || s.type === "archipelago") ? s.name :
                 (cityField || (s.display_name ? s.display_name.split(",")[0] : ""));
    
    const state = s.address?.state;
    const country = s.address?.country;
    return [city, state, country].filter(Boolean).join(", ");
  };

const isCityLike = (r: CitySuggestion) => {
  // Exclude specific POI classes that are too granular for city search
  const excludedClasses = ["natural", "tourism", "amenity", "landuse", "building"];
  if (excludedClasses.includes(r.class)) return false;
  
  const placeTypes = [
    "city", "town", "village", "municipality", "locality", "hamlet", "suburb",
    "island", "archipelago", "region", "state", "county", "district"
  ];
  if (r.class === "place" && placeTypes.includes(r.type)) return true;
  // Accept administrative boundaries that represent city-like areas (common in Nominatim responses)
  if (r.class === "boundary") {
    if (r.type === "administrative" && ["4", "5", "6", "7", "8", "9", "10"].includes(r.extratags?.admin_level || "")) return true;
    if (r.addresstype && placeTypes.includes(r.addresstype)) return true;
  }
  return false;
};

  useEffect(() => {
    // Debounce queries to avoid spamming the API
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (!value || value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        controllerRef.current?.abort();
        controllerRef.current = new AbortController();
        setLoading(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&extratags=1&dedupe=1&limit=15&q=${encodeURIComponent(
          value.trim()
        )}`;
        const res = await fetch(url, {
          headers: {
            // Nominatim requires a valid Referer; the browser sets it automatically. We add Accept-Language for better results.
            "Accept-Language": "en",
          },
          signal: controllerRef.current.signal,
        });
        if (!res.ok) throw new Error("Geocoding failed");
        const data: CitySuggestion[] = await res.json();
        const filteredData = data.filter(isCityLike);
        
        // Deduplicate by label to avoid showing identical entries
        const uniqueData = filteredData.reduce((acc: CitySuggestion[], curr) => {
          const label = getLabel(curr);
          const exists = acc.some(item => getLabel(item) === label);
          if (!exists) acc.push(curr);
          return acc;
        }, []);
        
        // Prioritize travel destinations (islands, cities, regions)
        const sortedData = uniqueData.sort((a, b) => {
          // Primary: Prioritize islands and major cities
          const aPriority = ["island", "archipelago", "city", "town"].includes(a.type) ? 2 : 
                            ["region", "state"].includes(a.type) ? 1 : 0;
          const bPriority = ["island", "archipelago", "city", "town"].includes(b.type) ? 2 : 
                            ["region", "state"].includes(b.type) ? 1 : 0;
          
          if (aPriority !== bPriority) return bPriority - aPriority;
          
          // Secondary: For same priority, prefer higher importance score
          return (b.importance || 0) - (a.importance || 0);
        });
        
        setResults(sortedData);
        setOpen(isFocused && uniqueData.length > 0);
      } catch (e) {
        if ((e as any).name !== "AbortError") {
          console.warn("City autocomplete error", e);
          setResults([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      controllerRef.current?.abort();
    };
  }, [value, isFocused]);

  const handleSelect = (s: CitySuggestion) => {
    const label = getLabel(s) || s.display_name;
    onChange(label);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              placeholder={placeholder}
              className={cn("pl-10 h-12 border-border text-base w-full truncate", className)}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => { setIsFocused(true); if (results.length > 0) setOpen(true); }}
              onBlur={() => { setTimeout(() => { setIsFocused(false); setOpen(false); }, 150); }}
              autoComplete="off"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[min(92vw,420px)]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
          <Command>
            <CommandList>
              {loading ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : results.length === 0 ? (
                <CommandEmpty>No locations found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {results.map((s) => {
                    const label = getLabel(s) || s.display_name;
                    return (
                      <CommandItem key={s.place_id} value={label} onSelect={() => handleSelect(s)} className="cursor-pointer">
                        <div className="flex items-start gap-3 w-full">
                          <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold line-clamp-2 md:truncate">{label}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 md:truncate">{s.display_name}</div>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};