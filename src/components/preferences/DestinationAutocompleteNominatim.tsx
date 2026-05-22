import React, { useState, useCallback, useRef, useEffect } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
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
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  type: string;
  class: string;
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

export const DestinationAutocompleteNominatim: React.FC<DestinationAutocompleteProps> = ({
  placeholder = "Start typing, then choose from the list…",
  value,
  onChange,
  maxSelections = 10,
  className,
}) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const debouncedInput = useDebounce(input, 300);

  // Fetch suggestions from Nominatim
  useEffect(() => {
    if (!debouncedInput || debouncedInput.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      setFetchFailed(false);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedInput)}&limit=8&addressdetails=1&featuretype=city`,
          {
            headers: {
              'Accept': 'application/json',
              'Accept-Language': 'en',
            }
          }
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const data: NominatimResult[] = await response.json();
        
        const formatItem = (item: NominatimResult) =>
          item.display_name.split(',').map(p => p.trim()).slice(0, 3).join(', ');

        const preferred = data.filter(item =>
          ['city', 'town', 'village', 'island', 'administrative', 'municipality'].includes(item.type) ||
          ['place', 'boundary', 'administrative'].includes(item.class)
        );

        // Fallback: if strict filter discards everything but API returned items, show them all
        const source = preferred.length > 0 ? preferred : data;
        const filtered = source
          .map(formatItem)
          .filter((name, index, self) => name && self.indexOf(name) === index);

        setSuggestions(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (error) {
        console.error('Nominatim search error:', error);
        setSuggestions([]);
        setFetchFailed(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedInput]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddDestination = useCallback((destination: string) => {
    const trimmed = destination.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    if (value.length >= maxSelections) return;

    onChange([...value, trimmed]);
    setInput("");
    setSuggestions([]);
    setShowDropdown(false);
  }, [value, maxSelections, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleAddDestination(suggestions[0]);
      } else if (input.trim().length >= 2) {
        // Free-text fallback so users are never blocked by Nominatim
        handleAddDestination(input);
      }
    }
  };

  const handleRemoveDestination = useCallback((destination: string) => {
    onChange(value.filter((v) => v !== destination));
  }, [value, onChange]);

  return (
    <div className={cn("space-y-3", className)} ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9079]" />
          <Input
            type="text"
            placeholder={placeholder}
            value={input}
            disabled={value.length >= maxSelections}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.length >= 2) setShowDropdown(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 h-12 rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20 text-[#0a2225] placeholder:text-[#9A9079]"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9079] animate-spin" />
          )}
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 border border-[#E5DFC6] rounded-xl bg-white shadow-lg max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5EFE1] text-left transition-colors first:rounded-t-xl last:rounded-b-xl"
                onClick={() => handleAddDestination(suggestion)}
              >
                <MapPin className="w-4 h-4 text-[#C7B892] flex-shrink-0" />
                <span className="text-sm text-[#0a2225] truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-[#7A7151]">
        {fetchFailed
          ? "Can't reach suggestions — press Enter to add it manually."
          : "Type a place and pick a suggestion, or press Enter to add it manually."}
        {" "}{value.length}/{maxSelections} selected.
      </p>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((destination) => (
            <div
              key={destination}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-[#0a2225]/15 text-sm text-[#0a2225] hover:border-[#0a2225]/30 transition-colors"
            >
              <MapPin className="w-3 h-3 text-[#0c4d47]" />
              <span className="truncate max-w-[240px]">{destination}</span>
              <button
                type="button"
                aria-label={`Remove ${destination}`}
                className="ml-0.5 text-[#7A7151] hover:text-[#0a2225] transition-colors"
                onClick={() => handleRemoveDestination(destination)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DestinationAutocompleteNominatim;
