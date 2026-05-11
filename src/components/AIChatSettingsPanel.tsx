import { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export interface ChatPreferences {
  general: {
    voiceEnabled: boolean;
    autoSaveConversation: boolean;
    voiceLanguage: string;
  };
  hotels: {
    filter: 'all' | 'amadeus' | 'curated';
    sortBy: 'best_value' | 'price_low_to_high' | 'price_high_to_low' | 'rating';
    minRating: number;
    maxPrice: number;
    searchRadius: number;
  };
  flights: {
    sortBy: 'best_value' | 'price_low_to_high' | 'duration' | 'departure_time';
    cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    maxStops: number;
    flexibleDates: boolean;
  };
  cars: {
    sortBy: 'best_value' | 'price_low_to_high' | 'rating';
    carType: 'any' | 'economy' | 'compact' | 'midsize' | 'suv' | 'luxury';
    transmission: 'any' | 'automatic' | 'manual';
  };
}

const DEFAULT_PREFERENCES: ChatPreferences = {
  general: {
    voiceEnabled: true,
    autoSaveConversation: true,
    voiceLanguage: 'en',
  },
  hotels: {
    filter: 'all',
    sortBy: 'best_value',
    minRating: 0,
    maxPrice: 1000,
    searchRadius: 50,
  },
  flights: {
    sortBy: 'best_value',
    cabinClass: 'ECONOMY',
    maxStops: 2,
    flexibleDates: false,
  },
  cars: {
    sortBy: 'best_value',
    carType: 'any',
    transmission: 'any',
  },
};

interface AIChatSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  preferences: ChatPreferences;
  onPreferencesChange: (preferences: ChatPreferences) => void;
}

export const AIChatSettingsPanel = ({ open, onClose, preferences, onPreferencesChange }: AIChatSettingsPanelProps) => {
  const { toast } = useToast();
  const [localPrefs, setLocalPrefs] = useState<ChatPreferences>(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = () => {
    onPreferencesChange(localPrefs);
    localStorage.setItem('aiChatPreferences', JSON.stringify(localPrefs));
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
    onClose();
  };

  const handleReset = () => {
    setLocalPrefs(DEFAULT_PREFERENCES);
    toast({
      title: "Settings Reset",
      description: "All preferences have been reset to defaults.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Chat Preferences
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="flights">Flights</TabsTrigger>
            <TabsTrigger value="cars">Cars</TabsTrigger>
          </TabsList>

          {/* General Preferences */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable voice chat functionality</p>
                </div>
                <Checkbox
                  checked={localPrefs.general.voiceEnabled}
                  onCheckedChange={(checked) => (checked) =>
                    setLocalPrefs({
                      ...localPrefs,
                      general: { ...localPrefs.general, voiceEnabled: checked},
                    })
                  }
                />
              </div>


              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Save Conversations</Label>
                  <p className="text-sm text-muted-foreground">Automatically save chat history</p>
                </div>
                <Checkbox
                  checked={localPrefs.general.autoSaveConversation}
                  onCheckedChange={(checked) => (checked) =>
                    setLocalPrefs({
                      ...localPrefs,
                      general: { ...localPrefs.general, autoSaveConversation: checked},
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Voice Transcription Language</Label>
                <Select
                  value={localPrefs.general.voiceLanguage}
                  onValueChange={(value) =>
                    setLocalPrefs({
                      ...localPrefs,
                      general: { ...localPrefs.general, voiceLanguage: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-background z-50">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese (Mandarin)</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="nl">Dutch</SelectItem>
                    <SelectItem value="pl">Polish</SelectItem>
                    <SelectItem value="tr">Turkish</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Language for voice input transcription</p>
              </div>
            </div>
          </TabsContent>

          {/* Hotel Preferences */}
          <TabsContent value="hotels" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hotel Source Filter</Label>
                <Select
                  value={localPrefs.hotels.filter}
                  onValueChange={(value: 'all' | 'amadeus' | 'curated') =>
                    setLocalPrefs({
                      ...localPrefs,
                      hotels: { ...localPrefs.hotels, filter: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hotels (Real-time + Curated)</SelectItem>
                    <SelectItem value="amadeus">Real-time Availability Only</SelectItem>
                    <SelectItem value="curated">Curated Recommendations Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Sort Order</Label>
                <Select
                  value={localPrefs.hotels.sortBy}
                  onValueChange={(value: any) =>
                    setLocalPrefs({
                      ...localPrefs,
                      hotels: { ...localPrefs.hotels, sortBy: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_value">Best Value</SelectItem>
                    <SelectItem value="price_low_to_high">Price: Low to High</SelectItem>
                    <SelectItem value="price_high_to_low">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Minimum Rating: {localPrefs.hotels.minRating.toFixed(1)} ⭐</Label>
                <Slider
                  value={[localPrefs.hotels.minRating]}
                  onValueChange={([value]) =>
                    setLocalPrefs({
                      ...localPrefs,
                      hotels: { ...localPrefs.hotels, minRating: value },
                    })
                  }
                  min={0}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Price: ${localPrefs.hotels.maxPrice}/night</Label>
                <Slider
                  value={[localPrefs.hotels.maxPrice]}
                  onValueChange={([value]) =>
                    setLocalPrefs({
                      ...localPrefs,
                      hotels: { ...localPrefs.hotels, maxPrice: value },
                    })
                  }
                  min={50}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Search Radius: {localPrefs.hotels.searchRadius} km</Label>
                <Slider
                  value={[localPrefs.hotels.searchRadius]}
                  onValueChange={([value]) =>
                    setLocalPrefs({
                      ...localPrefs,
                      hotels: { ...localPrefs.hotels, searchRadius: value },
                    })
                  }
                  min={5}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>

          {/* Flight Preferences */}
          <TabsContent value="flights" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Sort Order</Label>
                <Select
                  value={localPrefs.flights.sortBy}
                  onValueChange={(value: any) =>
                    setLocalPrefs({
                      ...localPrefs,
                      flights: { ...localPrefs.flights, sortBy: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_value">Best Value</SelectItem>
                    <SelectItem value="price_low_to_high">Price: Low to High</SelectItem>
                    <SelectItem value="duration">Shortest Duration</SelectItem>
                    <SelectItem value="departure_time">Earliest Departure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Cabin Class</Label>
                <Select
                  value={localPrefs.flights.cabinClass}
                  onValueChange={(value: any) =>
                    setLocalPrefs({
                      ...localPrefs,
                      flights: { ...localPrefs.flights, cabinClass: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ECONOMY">Economy</SelectItem>
                    <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                    <SelectItem value="BUSINESS">Business Class</SelectItem>
                    <SelectItem value="FIRST">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Maximum Stops: {localPrefs.flights.maxStops === 0 ? 'Non-stop only' : localPrefs.flights.maxStops === 1 ? '1 stop' : `${localPrefs.flights.maxStops} stops`}</Label>
                <Slider
                  value={[localPrefs.flights.maxStops]}
                  onValueChange={([value]) =>
                    setLocalPrefs({
                      ...localPrefs,
                      flights: { ...localPrefs.flights, maxStops: value },
                    })
                  }
                  min={0}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Flexible Dates</Label>
                  <p className="text-sm text-muted-foreground">Search ±3 days from selected dates</p>
                </div>
                <Checkbox
                  checked={localPrefs.flights.flexibleDates}
                  onCheckedChange={(checked) => (checked) =>
                    setLocalPrefs({
                      ...localPrefs,
                      flights: { ...localPrefs.flights, flexibleDates: checked},
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Car Rental Preferences */}
          <TabsContent value="cars" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Sort Order</Label>
                <Select
                  value={localPrefs.cars.sortBy}
                  onValueChange={(value: any) =>
                    setLocalPrefs({
                      ...localPrefs,
                      cars: { ...localPrefs.cars, sortBy: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_value">Best Value</SelectItem>
                    <SelectItem value="price_low_to_high">Price: Low to High</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Car Type</Label>
                <Select
                  value={localPrefs.cars.carType}
                  onValueChange={(value: any) =>
                    setLocalPrefs({
                      ...localPrefs,
                      cars: { ...localPrefs.cars, carType: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Type</SelectItem>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="midsize">Midsize</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Transmission Preference</Label>
                <Select
                  value={localPrefs.cars.transmission}
                  onValueChange={(value: any) =>
                    setLocalPrefs({
                      ...localPrefs,
                      cars: { ...localPrefs.cars, transmission: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Transmission</SelectItem>
                    <SelectItem value="automatic">Automatic Only</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Count how many preferences differ from defaults
export const countNonDefaultPreferences = (preferences: ChatPreferences): number => {
  let count = 0;
  
  // General preferences
  if (preferences.general.voiceEnabled !== DEFAULT_PREFERENCES.general.voiceEnabled) count++;
  
  if (preferences.general.autoSaveConversation !== DEFAULT_PREFERENCES.general.autoSaveConversation) count++;
  if (preferences.general.voiceLanguage !== DEFAULT_PREFERENCES.general.voiceLanguage) count++;
  
  // Hotel preferences
  if (preferences.hotels.filter !== DEFAULT_PREFERENCES.hotels.filter) count++;
  if (preferences.hotels.sortBy !== DEFAULT_PREFERENCES.hotels.sortBy) count++;
  if (preferences.hotels.minRating !== DEFAULT_PREFERENCES.hotels.minRating) count++;
  if (preferences.hotels.maxPrice !== DEFAULT_PREFERENCES.hotels.maxPrice) count++;
  if (preferences.hotels.searchRadius !== DEFAULT_PREFERENCES.hotels.searchRadius) count++;
  
  // Flight preferences
  if (preferences.flights.sortBy !== DEFAULT_PREFERENCES.flights.sortBy) count++;
  if (preferences.flights.cabinClass !== DEFAULT_PREFERENCES.flights.cabinClass) count++;
  if (preferences.flights.maxStops !== DEFAULT_PREFERENCES.flights.maxStops) count++;
  if (preferences.flights.flexibleDates !== DEFAULT_PREFERENCES.flights.flexibleDates) count++;
  
  // Car preferences
  if (preferences.cars.sortBy !== DEFAULT_PREFERENCES.cars.sortBy) count++;
  if (preferences.cars.carType !== DEFAULT_PREFERENCES.cars.carType) count++;
  if (preferences.cars.transmission !== DEFAULT_PREFERENCES.cars.transmission) count++;
  
  return count;
};

export { DEFAULT_PREFERENCES };
