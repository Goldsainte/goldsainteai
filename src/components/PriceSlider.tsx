import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface PriceSliderProps {
  onPriceSelected: (price: number) => void;
  onCancel: () => void;
  min?: number;
  max?: number;
  defaultValue?: number;
  type?: "hotel" | "flight" | "restaurant" | "car";
}

export const PriceSlider = ({ 
  onPriceSelected, 
  onCancel,
  min = 50,
  max = 1000,
  defaultValue = 200,
  type = "hotel"
}: PriceSliderProps) => {
  const [price, setPrice] = useState<number>(defaultValue);

  const getLabel = () => {
    switch(type) {
      case "hotel": return "per night";
      case "flight": return "for the flight";
      case "restaurant": return "per person";
      case "car": return "per day";
      default: return "";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Budget {getLabel()}</span>
            <div className="flex items-center gap-1 text-lg font-semibold">
              <DollarSign className="h-4 w-4" />
              {price}
            </div>
          </div>
          <Slider
            value={[price]}
            onValueChange={(values) => setPrice(values[0])}
            min={min}
            max={max}
            step={type === "restaurant" ? 5 : 10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${min}</span>
            <span>${max}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onPriceSelected(price)}
            className="flex-1"
          >
            Confirm Budget
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
