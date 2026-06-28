/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// NOTE: this is the GOOGLE Places single-value city field (uses
// VITE_GOOGLE_MAPS_API_KEY). For the free OpenStreetMap/Nominatim multi-purpose
// version used by the marketplace search bars, see ./CityAutocomplete.tsx.

interface GoogleCityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  /** wrapper classes (positioning / spacing) */
  className?: string;
  /** classes for the input itself, to match the surrounding form */
  inputClassName?: string;
}

type Suggestion = { placeId: string; description: string };

// Google Maps options only need to be set once per page load.
let optionsSet = false;

export function GoogleCityAutocomplete({
  value,
  onChange,
  placeholder = "City, Country",
  id,
  className,
  inputClassName,
}: GoogleCityAutocompleteProps) {
  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Google Places once. No key → stay a plain input (graceful fallback).
  useEffect(() => {
    let mounted = true;
    (async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;
      try {
        if (!optionsSet) {
          setOptions({ key: apiKey, v: "weekly" });
          optionsSet = true;
        }
        await importLibrary("places");
        if (!mounted) return;
        serviceRef.current = new google.maps.places.AutocompleteService();
        tokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setReady(true);
      } catch (err) {
        console.error("GoogleCityAutocomplete: failed to load Google Places", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const fetchSuggestions = (q: string) => {
    if (!ready || !serviceRef.current || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    serviceRef.current.getPlacePredictions(
      { input: q, types: ["(cities)"], sessionToken: tokenRef.current || undefined },
      (preds, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !preds) {
          setSuggestions([]);
          return;
        }
        setSuggestions(preds.map((p) => ({ placeId: p.place_id!, description: p.description! })));
        setOpen(true);
      },
    );
  };

  const handleInput = (v: string) => {
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 250);
  };

  const handleSelect = (description: string) => {
    onChange(description);
    setSuggestions([]);
    setOpen(false);
    // Restart the billing session after a selection.
    if (ready) tokenRef.current = new google.maps.places.AutocompleteSessionToken();
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Input
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className={inputClassName}
      />

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto overflow-hidden rounded-xl border border-[#E5DFC6] bg-white shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => handleSelect(s.description)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#0a2225] hover:bg-[#FDF9F0]"
            >
              <MapPin className="h-4 w-4 shrink-0 text-[#C7A962]" />
              <span className="truncate">{s.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
