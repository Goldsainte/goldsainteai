import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Plane } from "lucide-react";
import { searchAirportsWithNearby, type Airport } from "@/lib/airportData";
import { cn } from "@/lib/utils";

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const AirportAutocomplete = ({
  value,
  onChange,
  placeholder = "From (e.g., JFK, New York)",
  className
}: AirportAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const results = searchAirportsWithNearby(value, 75);
      setSearchResults(results);
      if (results.length > 0) {
        setOpen(true);
      }
    } else {
      setSearchResults([]);
      setOpen(false);
    }
  }, [value]);

  const handleSelect = (airport: Airport) => {
    const formatted = `${airport.code} - ${airport.city}`;
    onChange(formatted);
    setOpen(false);
    // Blur input to close keyboard on mobile
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              ref={inputRef}
              placeholder={placeholder}
              className={cn("pl-10 h-12 border-border text-base w-full truncate", className)}
              value={value}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              autoComplete="off"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-[min(92vw,420px)]" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              {searchResults.length === 0 ? (
                <CommandEmpty>No airports found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {searchResults.map((airport, index) => (
                    <CommandItem
                      key={`${airport.code}-${index}`}
                      value={airport.code}
                      onSelect={() => handleSelect(airport)}
                      onClick={() => handleSelect(airport)}
                      onPointerDown={(e) => e.preventDefault()}
                      className="cursor-pointer touch-manipulation active:bg-accent"
                    >
                      <div className="flex items-start gap-3 w-full pointer-events-none">
                        <Plane className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{airport.code}</span>
                            <span className="text-sm text-muted-foreground truncate">
                              {airport.city}, {airport.country}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {airport.name}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
