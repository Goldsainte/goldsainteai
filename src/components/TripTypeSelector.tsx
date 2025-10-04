import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, X } from "lucide-react";

interface TripTypeSelectorProps {
  onSelect: (tripType: "one-way" | "round-trip") => void;
  onCancel: () => void;
}

export const TripTypeSelector = ({ onSelect, onCancel }: TripTypeSelectorProps) => {
  return (
    <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4" role="dialog" aria-labelledby="trip-type-title" aria-describedby="trip-type-desc">
      <div className="flex items-center justify-between">
        <h3 id="trip-type-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          Select Trip Type
        </h3>
        <Button aria-label="Close" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p id="trip-type-desc" className="sr-only">Choose whether this rental is one-way or round-trip.</p>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full h-auto py-2.5 flex flex-col items-start gap-0.5 hover:border-primary hover:bg-primary/5"
          onClick={() => onSelect("round-trip")}
        >
          <span className="font-semibold">Round Trip</span>
          <span className="text-sm text-muted-foreground">Return to the pickup location</span>
        </Button>
        <Button
          variant="outline"
          className="w-full h-auto py-2.5 flex flex-col items-start gap-0.5 hover:border-primary hover:bg-primary/5"
          onClick={() => onSelect("one-way")}
        >
          <span className="font-semibold">One Way</span>
          <span className="text-sm text-muted-foreground">Drop off at a different location</span>
        </Button>
      </div>
    </Card>
  );
};
