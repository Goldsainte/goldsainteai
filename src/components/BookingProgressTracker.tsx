import { MapPin, Calendar, Users, DollarSign, CheckCircle2, Circle, Edit2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface BookingInfo {
  destination?: string;
  dates?: string;
  guests?: number;
  budget?: string;
}

interface BookingProgressTrackerProps {
  bookingInfo: BookingInfo;
  onEdit: (field: keyof BookingInfo, value: string) => void;
  onQuickStart?: () => void;
}

export const BookingProgressTracker = ({ bookingInfo, onEdit, onQuickStart }: BookingProgressTrackerProps) => {
  const [editingField, setEditingField] = useState<keyof BookingInfo | null>(null);
  const [editValue, setEditValue] = useState("");

  const hasDestination = !!bookingInfo.destination;
  const hasDates = !!bookingInfo.dates;
  const hasGuests = !!bookingInfo.guests;
  const hasBudget = !!bookingInfo.budget;

  const handleOpenEdit = (field: keyof BookingInfo) => {
    setEditingField(field);
    const currentValue = bookingInfo[field];
    setEditValue(currentValue ? String(currentValue) : "");
  };

  const handleSaveEdit = () => {
    if (editingField && editValue.trim()) {
      onEdit(editingField, editValue.trim());
      setEditingField(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const progressItems = [
    {
      icon: MapPin,
      label: "Destination",
      field: 'destination' as keyof BookingInfo,
      value: bookingInfo.destination,
      completed: hasDestination,
      placeholder: "e.g., Paris, Tokyo, New York",
      inputType: "text" as const,
    },
    {
      icon: Calendar,
      label: "Dates",
      field: 'dates' as keyof BookingInfo,
      value: bookingInfo.dates,
      completed: hasDates,
      placeholder: "e.g., Jan 15 - Jan 22, 2024",
      inputType: "text" as const,
    },
    {
      icon: Users,
      label: "Guests",
      field: 'guests' as keyof BookingInfo,
      value: bookingInfo.guests ? `${bookingInfo.guests} ${bookingInfo.guests === 1 ? 'person' : 'people'}` : undefined,
      completed: hasGuests,
      placeholder: "e.g., 2",
      inputType: "number" as const,
    },
    {
      icon: DollarSign,
      label: "Budget",
      field: 'budget' as keyof BookingInfo,
      value: bookingInfo.budget,
      completed: hasBudget,
      placeholder: "e.g., $2000 per person",
      inputType: "text" as const,
    },
  ];

  const completedCount = [hasDestination, hasDates, hasGuests, hasBudget].filter(Boolean).length;
  const totalCount = 4;

  // Show Quick Start button if no information collected
  if (completedCount === 0) {
    return onQuickStart ? (
      <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20 mb-3 animate-fade-in">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-accent" />
            <p className="text-xs font-semibold text-foreground">Quick Start Demo</p>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
            Try the booking flow with example information to see how it works
          </p>
          <Button
            onClick={onQuickStart}
            size="sm"
            className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
          >
            <Zap className="h-3 w-3 mr-1" />
            Fill Example Info
          </Button>
        </div>
      </Card>
    ) : null;
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 mb-3 animate-fade-in">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground">Booking Information</p>
            <span className="text-[10px] text-muted-foreground">
              {completedCount}/{totalCount} collected
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {progressItems.map((item) => {
              const Icon = item.icon;
              const StatusIcon = item.completed ? CheckCircle2 : Circle;
              
              return (
                <button
                  key={item.label}
                  onClick={() => handleOpenEdit(item.field)}
                  className={`flex items-start gap-1.5 p-2 rounded-md transition-all group cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    item.completed 
                      ? 'bg-primary/10 border border-primary/20 hover:bg-primary/15' 
                      : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                  }`}
                >
                  <Icon 
                    className={`h-3 w-3 mt-0.5 flex-shrink-0 transition-colors ${
                      item.completed ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                      {item.label}
                    </p>
                    <p className={`text-[11px] font-semibold truncate ${
                      item.completed ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}>
                      {item.value || 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Edit2 className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    <StatusIcon 
                      className={`h-3 w-3 flex-shrink-0 ${
                        item.completed ? 'text-primary' : 'text-muted-foreground/30'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          
          {completedCount === totalCount && (
            <div className="flex items-center gap-1 justify-center pt-1 animate-fade-in">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <p className="text-[10px] text-green-600 font-medium">All information collected!</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!editingField} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingField && progressItems.find(i => i.field === editingField)?.label}</DialogTitle>
            <DialogDescription>
              Update your {editingField && progressItems.find(i => i.field === editingField)?.label.toLowerCase()} information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">
                {editingField && progressItems.find(i => i.field === editingField)?.label}
              </Label>
              <Input
                id="edit-value"
                type={editingField && progressItems.find(i => i.field === editingField)?.inputType}
                placeholder={editingField && progressItems.find(i => i.field === editingField)?.placeholder}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
