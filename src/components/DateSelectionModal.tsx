import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Users, Minus, Plus, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onAvailabilityConfirmed: (params: { checkIn: string; checkOut: string; adults: number }) => void;
  cityCode: string;
  hotelName: string;
  propertyId?: string;
  currency?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

export const DateSelectionModal = ({ 
  open, 
  onClose, 
  onAvailabilityConfirmed,
  cityCode,
  hotelName,
  propertyId,
  currency = 'USD',
  initialCheckIn,
  initialCheckOut
}: DateSelectionModalProps) => {
  const { toast } = useToast();
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);

  // Initialize dates from props or URL params - NO defaults
  useEffect(() => {
    if (open) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCheckIn = searchParams.get('checkIn');
      const urlCheckOut = searchParams.get('checkOut');
      const urlAdults = searchParams.get('adults');

      // Priority: props > URL > no default (require user selection)
      if (initialCheckIn && initialCheckOut) {
        setCheckInDate(new Date(initialCheckIn));
        setCheckOutDate(new Date(initialCheckOut));
      } else if (urlCheckIn && urlCheckOut) {
        setCheckInDate(new Date(urlCheckIn));
        setCheckOutDate(new Date(urlCheckOut));
      } else {
        // Don't set default dates - require user to select
        setCheckInDate(undefined);
        setCheckOutDate(undefined);
      }

      if (urlAdults) {
        setAdults(parseInt(urlAdults));
      }
    }
  }, [open, initialCheckIn, initialCheckOut]);

  const handleCheckAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Select Dates",
        description: "Please select check-in and check-out dates to continue",
        variant: "destructive",
      });
      return;
    }

    if (checkInDate >= checkOutDate) {
      toast({
        title: "Invalid Dates",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const formattedCheckIn = format(checkInDate, 'yyyy-MM-dd');
      const formattedCheckOut = format(checkOutDate, 'yyyy-MM-dd');

      toast({
        title: "Dates Confirmed",
        description: `${formattedCheckIn} to ${formattedCheckOut} • ${adults} guest${adults > 1 ? 's' : ''}`,
      });

      await onAvailabilityConfirmed({
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        adults,
      });

      onClose();
    } catch (error) {
      console.error('Error confirming dates:', error);
      toast({
        title: "Error",
        description: "Failed to confirm dates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nights = checkInDate && checkOutDate ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-secondary">Select Your Stay</DialogTitle>
          <p className="text-sm text-muted-foreground">{hotelName}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-6">
            {/* Date Selection with Calendar */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkInDate ? format(checkInDate, 'PPP') : 'Select check-in date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={setCheckInDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Check-out Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOutDate ? format(checkOutDate, 'PPP') : 'Select check-out date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50">
                    <Calendar
                      mode="single"
                      selected={checkOutDate}
                      onSelect={setCheckOutDate}
                      disabled={(date) => !checkInDate || date <= checkInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {checkInDate && checkOutDate && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-semibold text-primary">{nights} night{nights !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Guests Selection */}
            <div className="p-4 border rounded-lg space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Guests
              </Label>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Adults</div>
                  <div className="text-sm text-muted-foreground">Age 18+</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    disabled={adults <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg">{adults}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAdults(Math.min(10, adults + 1))}
                    disabled={adults >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCheckAvailability}
              disabled={loading || !checkInDate || !checkOutDate}
              className="w-full"
              size="lg"
            >
              {loading ? "Processing..." : !checkInDate || !checkOutDate ? "Select Dates First" : "Continue to Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};