import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CuisineSelectorProps {
  onCuisineSelected: (cuisine: string) => void;
  onCancel: () => void;
}

const CUISINE_OPTIONS = [
  "Italian",
  "French",
  "Japanese",
  "Chinese",
  "Mexican",
  "Indian",
  "Thai",
  "Mediterranean",
  "American",
  "Korean",
  "Vietnamese",
  "Spanish",
  "Greek",
  "Middle Eastern",
  "Seafood",
  "Steakhouse",
  "Vegetarian",
  "Vegan",
  "Any"
];

export const CuisineSelector = ({ 
  onCuisineSelected, 
  onCancel
}: CuisineSelectorProps) => {
  const [selectedCuisine, setSelectedCuisine] = useState<string>("Any");

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">What type of cuisine are you in the mood for?</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((cuisine) => (
              <Badge
                key={cuisine}
                variant={selectedCuisine === cuisine ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedCuisine(cuisine)}
              >
                {cuisine}
              </Badge>
            ))}
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
            onClick={() => onCuisineSelected(selectedCuisine)}
            className="flex-1"
          >
            Confirm Cuisine
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
