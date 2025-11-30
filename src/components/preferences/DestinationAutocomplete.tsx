import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DestinationAutocompleteProps = {
  label?: string;
  placeholder?: string;
  helperText?: string;
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
  className?: string;
};

type Suggestion = {
  placeId: string;
  description: string;
};

// Declare google types
declare global {
  interface Window {
    google: typeof google;
    initGoogleMapsCallback?: () => void;
  }
}

export const DestinationAutocomplete: React.FC<DestinationAutocompleteProps> = ({
  label = "Favorite destinations",
  placeholder = "Start typing a city or region…",
  helperText = "We'll prioritize storyboards and itineraries that feature these places.",
  value,
  onChange,
  maxSelections = 10,
  className,
}) => {
  const [googleReady, setGoogleReady] = useState(false);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load Google Maps JS API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError("Google Maps API key not configured");
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      autocompleteServiceRef.current = autocompleteService;
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      setGoogleReady(true);
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Wait for it to load
      const checkReady = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkReady);
          const autocompleteService = new window.google.maps.places.AutocompleteService();
          autocompleteServiceRef.current = autocompleteService;
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
          setGoogleReady(true);
        }
      }, 100);
      
      setTimeout(() => clearInterval(checkReady), 10000);
      return;
    }

    // Load script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google?.maps?.places) {
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        autocompleteServiceRef.current = autocompleteService;
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        setGoogleReady(true);
      }
    };

    script.onerror = () => {
      setError("We couldn't connect to our destination catalog. Please try again.");
    };

    document.head.appendChild(script);
  }, []);

  // Debounce input
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
        types: ["(cities)"],
        sessionToken: sessionTokenRef.current || undefined,
      },
      (predictions, status) => {
        setLoadingSuggestions(false);
        if (
          status !== window.google.maps.places.PlacesServiceStatus.OK ||
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

  const handleAddDestination = useCallback((suggestion: Suggestion) => {
    if (value.includes(suggestion.description)) return;
    if (value.length >= maxSelections) return;

    const newValue = [...value, suggestion.description];
    onChange(newValue);
    setInput("");
    setSuggestions([]);

    // restart session for billing accuracy
    if (window.google?.maps?.places) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  }, [value, maxSelections, onChange]);

  const handleRemoveDestination = useCallback((destination: string) => {
    const newValue = value.filter((v) => v !== destination);
    onChange(newValue);
  }, [value, onChange]);

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
          placeholder={googleReady ? placeholder : "Loading destinations…"}
          value={input}
          disabled={!googleReady || value.length >= maxSelections}
          onChange={(e) => setInput(e.target.value)}
          className="h-11"
        />

        {error && (
          <p className="text-xs text-destructive mt-1">
            {error}
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full border rounded-lg bg-background shadow-lg max-h-64 overflow-y-auto text-sm">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 text-left transition-colors"
                onClick={() => handleAddDestination(s)}
              >
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
            <Badge
              key={destination}
              variant="secondary"
              className="rounded-full px-3 py-1 text-[11px] flex items-center gap-1"
            >
              {destination}
              <button
                type="button"
                className="ml-1 hover:text-destructive transition-colors"
                onClick={() => handleRemoveDestination(destination)}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default DestinationAutocomplete;
