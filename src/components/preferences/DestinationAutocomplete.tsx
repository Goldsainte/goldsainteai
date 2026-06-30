/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DestinationAutocompleteProps = {
  label?: string;
  placeholder?: string;
  helperText?: string;
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
  className?: string;
  /** classes for the text input, to match the surrounding form */
  inputClassName?: string;
  /**
   * Google Places autocomplete type collection. Default `["(cities)"]` (cities only).
   * Use `["(regions)"]` to also include countries + regions/states.
   */
  types?: string[];
};

type Suggestion = {
  placeId: string;
  description: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Initialize Google Maps options once
let optionsSet = false;

export const DestinationAutocomplete: React.FC<DestinationAutocompleteProps> = ({
  label = "Where do you dream of traveling?",
  placeholder = "Start typing a city or region…",
  helperText = "We'll prioritize collections and storyboards featuring these places.",
  value,
  onChange,
  maxSelections = 12,
  className,
  inputClassName,
  types = ["(cities)"],
}) => {
  const [googleReady, setGoogleReady] = useState(false);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Keep the latest `types` readable inside the fetch effect without making it a
  // dependency (callers may pass an inline array → would otherwise refetch every render).
  const typesRef = useRef(types);
  typesRef.current = types;

  // Load Google Maps JS API once
  useEffect(() => {
    let isMounted = true;

    const loadGoogleMaps = async () => {
      try {
        const apiKey =
          import.meta.env.VITE_GOOGLE_PLACES_API_KEY ||
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        // Validate API key exists
        if (!apiKey) {
          console.error("VITE_GOOGLE_PLACES_API_KEY is not configured");
          setError("Destination search is not configured. Please add VITE_GOOGLE_PLACES_API_KEY.");
          return;
        }
        
        // Set options only once
        if (!optionsSet) {
          setOptions({
            key: apiKey,
            v: "weekly",
          });
          optionsSet = true;
        }

        // Import the places library
        await importLibrary("places");

        if (!isMounted) return;

        const autocompleteService = new google.maps.places.AutocompleteService();
        autocompleteServiceRef.current = autocompleteService;
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

        setGoogleReady(true);
      } catch (err) {
        console.error("Error loading Google Maps JS API", err);
        setError("We couldn't connect to our destination catalog. Please try again.");
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  // Simple debounce
  const debouncedInput = useDebounce(input, 250);

  // Fetch suggestions when debounced input changes
  useEffect(() => {
    if (!googleReady || !debouncedInput || debouncedInput.length < 2) {
      setSuggestions([]);
      return;
    }
    if (!autocompleteServiceRef.current) return;

    setLoadingSuggestions(true);
    setError(null);

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: debouncedInput,
        types: typesRef.current,
        sessionToken: sessionTokenRef.current || undefined,
      },
      (predictions, status) => {
        setLoadingSuggestions(false);
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions
        ) {
          setSuggestions([]);
          return;
        }
        const mapped: Suggestion[] = predictions.map((p) => ({
          placeId: p.place_id!,
          description: p.description!,
        }));
        setSuggestions(mapped);
      }
    );
  }, [googleReady, debouncedInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, []);

  const handleAddDestination = (suggestion: Suggestion) => {
    if (value.includes(suggestion.description)) return;
    if (value.length >= maxSelections) return;

    onChange([...value, suggestion.description]);
    setInput("");
    setSuggestions([]);

    // restart session for billing accuracy
    if ((window as any).google?.maps?.places) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  };

  const handleRemoveDestination = (destination: string) => {
    onChange(value.filter((v) => v !== destination));
  };

  return (
    <div className={cn("space-y-3", className)} ref={containerRef}>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            {label}
          </label>
          <span className="text-[11px] text-muted-foreground">
            {value.length}/{maxSelections} selected
          </span>
        </div>
        {helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>

      <div className="space-y-2 relative">
        <Input
          type="text"
          placeholder={
            googleReady ? placeholder : "Loading destination search…"
          }
          value={input}
          disabled={!googleReady || value.length >= maxSelections}
          onChange={(e) => setInput(e.target.value)}
          className={cn("h-11", inputClassName)}
        />

        {error && (
          <p className="text-xs text-destructive mt-1">
            {error}
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full border rounded-lg bg-background shadow-md max-h-64 overflow-y-auto text-sm">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 text-left transition-colors"
                onClick={() => handleAddDestination(s)}
              >
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{s.description}</span>
              </button>
            ))}
          </div>
        )}

        {loadingSuggestions && (
          <p className="text-[11px] text-muted-foreground">
            Searching cities…
          </p>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((destination) => (
            <span
              key={destination}
              className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-[#F6F0E4] py-1 pl-3 pr-1.5 text-[13px] font-medium leading-none text-[#0a2225]"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#C7A962]" />
              {destination}
              <button
                type="button"
                aria-label={`Remove ${destination}`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#E5DFC6] hover:text-[#0a2225]"
                onClick={() => handleRemoveDestination(destination)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
