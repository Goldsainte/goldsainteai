import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const SearchFilters = () => {
  return (
    <aside className="w-full md:w-64 space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-4">Filter by:</h3>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Your budget (per night)</h4>
        <Slider defaultValue={[150]} max={500} step={10} className="mb-2" />
        <p className="text-sm text-muted-foreground">Up to $150</p>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Property type</h4>
        <div className="space-y-3">
          {["Hotels", "Apartments", "Resorts", "Villas", "Hostels"].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox id={type} />
              <Label htmlFor={type} className="text-sm cursor-pointer">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Facilities</h4>
        <div className="space-y-3">
          {["Free WiFi", "Pool", "Parking", "Restaurant", "Spa", "Gym"].map((facility) => (
            <div key={facility} className="flex items-center space-x-2">
              <Checkbox id={facility} />
              <Label htmlFor={facility} className="text-sm cursor-pointer">
                {facility}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Review score</h4>
        <div className="space-y-3">
          {["Wonderful: 9+", "Very good: 8+", "Good: 7+", "Pleasant: 6+"].map((score) => (
            <div key={score} className="flex items-center space-x-2">
              <Checkbox id={score} />
              <Label htmlFor={score} className="text-sm cursor-pointer">
                {score}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
