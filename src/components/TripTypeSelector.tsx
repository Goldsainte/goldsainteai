import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, X } from "lucide-react";

interface TripTypeSelectorProps {
  onSelect: (tripType: "one-way" | "round-trip") => void;
  onCancel: () => void;
}

export const TripTypeSelector = ({ onSelect, onCancel }: TripTypeSelectorProps) => {
  return (
    <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          Select Trip Type
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full h-auto py-4 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/5"
          onClick={() => onSelect("one-way")}
        >
          <span className="font-semibold">One-way</span>
          <span className="text-sm text-muted-foreground">Single flight to your destination</span>
        </Button>
        <Button
          variant="outline"
          className="w-full h-auto py-4 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/5"
          onClick={() => onSelect("round-trip")}
        >
          <span className="font-semibold">Round-trip</span>
          <span className="text-sm text-muted-foreground">Return flight included</span>
        </Button>
      </div>
    </Card>
  );
};
