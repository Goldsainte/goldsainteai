import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { CityAutocomplete } from "./CityAutocomplete";

interface LocationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: string;
  onLocationChange: (location: string) => void;
}

export const LocationDrawer = ({
  open,
  onOpenChange,
  location,
  onLocationChange,
}: LocationDrawerProps) => {
  const [tempLocation, setTempLocation] = useState(location);

  useEffect(() => {
    setTempLocation(location);
  }, [location]);

  const handleSave = () => {
    onLocationChange(tempLocation);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Add Location
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <CityAutocomplete
              value={tempLocation}
              onChange={setTempLocation}
              placeholder="Search for a city..."
            />
            <p className="text-xs text-muted-foreground">
              {tempLocation.length}/100
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
