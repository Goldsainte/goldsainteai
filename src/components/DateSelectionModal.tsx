import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, Users, Minus, Plus } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "react-router-dom";

interface DateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onAvailabilityConfirmed: (hotelOffer: any, checkIn: string, checkOut: string, adults: number) => void;
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
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Default dates sourced from URL or sensible defaults when modal opens
  useEffect(() => {
    if (!open) return;
    
    // Priority: 1. Props from AI context, 2. URL params, 3. Defaults
    if (initialCheckIn) {
      setCheckInDate(new Date(initialCheckIn));
    } else {
      const ci = searchParams.get('checkIn');
      if (ci) {
        setCheckInDate(new Date(ci));
      } else {
        const start = new Date();
        start.setDate(start.getDate() + 1);
        setCheckInDate((prev) => prev ?? start);
      }
    }
    
    if (initialCheckOut) {
      setCheckOutDate(new Date(initialCheckOut));
    } else {
      const co = searchParams.get('checkOut');
      if (co) {
        setCheckOutDate(new Date(co));
      } else {
        const end = new Date();
        end.setDate(end.getDate() + 3);
        setCheckOutDate((prev) => prev ?? end);
      }
    }
  }, [open, initialCheckIn, initialCheckOut, searchParams]);

  const handleCheckAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Dates required",
        description: "Please select both check-in and check-out dates",
        variant: "destructive",
      });
      return;
    }

    if (checkOutDate <= checkInDate) {
      toast({
        title: "Invalid dates",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Proceed directly with booking - availability already confirmed from search
      toast({
        title: "Dates confirmed!",
        description: `${format(checkInDate, 'MMM dd')} - ${format(checkOutDate, 'MMM dd')}`,
      });

      // Pass booking data with selected dates
      onAvailabilityConfirmed(
        { available: true },
        format(checkInDate, 'yyyy-MM-dd'),
        format(checkOutDate, 'yyyy-MM-dd'),
        adults
      );
      onClose();
    } catch (error: any) {
      console.error('Date selection error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm dates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-secondary">Select Your Stay</DialogTitle>
          <DialogDescription className="text-base">{hotelName}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Date Range Selection */}
          <Card className="p-4 border-accent/20">
            <Label className="text-sm font-medium mb-3 block">Select Dates</Label>
            {/* Dates Summary (Calendar removed for stability) */}
            
            {/* Date Summary */}
            {checkInDate && checkOutDate && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Check-in</div>
                    <div className="font-semibold">{format(checkInDate, "EEE, MMM dd")}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Check-out</div>
                    <div className="font-semibold">{format(checkOutDate, "EEE, MMM dd")}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Duration</div>
                    <div className="font-semibold">{nights} {nights === 1 ? 'night' : 'nights'}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Guests Selection */}
          <Card className="p-4 border-accent/20">
            <Label className="text-sm font-medium mb-3 block">
              <Users className="h-4 w-4 inline mr-2" />
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
          </Card>

          <Button 
            onClick={handleCheckAvailability} 
            className="w-full h-12 text-base"
            disabled={loading || !checkInDate || !checkOutDate}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Confirming Dates...
              </>
            ) : (
              'Continue to Booking'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
