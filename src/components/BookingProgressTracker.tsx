import { MapPin, Calendar, Users, DollarSign, CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BookingInfo {
  destination?: string;
  dates?: string;
  guests?: number;
  budget?: string;
}

interface BookingProgressTrackerProps {
  bookingInfo: BookingInfo;
}

export const BookingProgressTracker = ({ bookingInfo }: BookingProgressTrackerProps) => {
  const hasDestination = !!bookingInfo.destination;
  const hasDates = !!bookingInfo.dates;
  const hasGuests = !!bookingInfo.guests;
  const hasBudget = !!bookingInfo.budget;

  const progressItems = [
    {
      icon: MapPin,
      label: "Destination",
      value: bookingInfo.destination,
      completed: hasDestination,
    },
    {
      icon: Calendar,
      label: "Dates",
      value: bookingInfo.dates,
      completed: hasDates,
    },
    {
      icon: Users,
      label: "Guests",
      value: bookingInfo.guests ? `${bookingInfo.guests} ${bookingInfo.guests === 1 ? 'person' : 'people'}` : undefined,
      completed: hasGuests,
    },
    {
      icon: DollarSign,
      label: "Budget",
      value: bookingInfo.budget,
      completed: hasBudget,
    },
  ];

  const completedCount = [hasDestination, hasDates, hasGuests, hasBudget].filter(Boolean).length;
  const totalCount = 4;

  // Don't show if no information collected
  if (completedCount === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 mb-3">
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
              <div
                key={item.label}
                className={`flex items-start gap-1.5 p-2 rounded-md transition-all ${
                  item.completed 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-muted/30 border border-border/50'
                }`}
              >
                <Icon 
                  className={`h-3 w-3 mt-0.5 flex-shrink-0 ${
                    item.completed ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                    {item.label}
                  </p>
                  <p className={`text-[11px] font-semibold truncate ${
                    item.completed ? 'text-foreground' : 'text-muted-foreground/50'
                  }`}>
                    {item.value || 'Not set'}
                  </p>
                </div>
                <StatusIcon 
                  className={`h-3 w-3 flex-shrink-0 ${
                    item.completed ? 'text-primary' : 'text-muted-foreground/30'
                  }`}
                />
              </div>
            );
          })}
        </div>
        
        {completedCount === totalCount && (
          <div className="flex items-center gap-1 justify-center pt-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <p className="text-[10px] text-green-600 font-medium">All information collected!</p>
          </div>
        )}
      </div>
    </Card>
  );
};
