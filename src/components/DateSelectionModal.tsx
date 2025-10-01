import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Loader2, Users, Minus, Plus } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface DateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onAvailabilityConfirmed: (hotelOffer: any, checkIn: string, checkOut: string, adults: number) => void;
  cityCode: string;
  hotelName: string;
  currency?: string;
}

export const DateSelectionModal = ({ 
  open, 
  onClose, 
  onAvailabilityConfirmed,
  cityCode,
  hotelName,
  currency = 'USD'
}: DateSelectionModalProps) => {
  const { toast } = useToast();
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);

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
      const { data, error } = await supabase.functions.invoke('amadeus-search-hotels', {
        body: {
          cityCode,
          checkInDate: format(checkInDate, 'yyyy-MM-dd'),
          checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
          adults,
          currency,
        }
      });

      if (error) throw error;

      if (!data.results || data.results.length === 0) {
        toast({
          title: "No availability",
          description: "No rooms available for these dates. Please try different dates.",
          variant: "destructive",
        });
        return;
      }

      // Find the best offer for this hotel
      const hotelOffer = data.results[0];
      
      toast({
        title: "Availability confirmed!",
        description: `Found available rooms for ${format(checkInDate, 'MMM dd')} - ${format(checkOutDate, 'MMM dd')}`,
      });

      onAvailabilityConfirmed(
        hotelOffer,
        format(checkInDate, 'yyyy-MM-dd'),
        format(checkOutDate, 'yyyy-MM-dd'),
        adults
      );
      onClose();
    } catch (error: any) {
      console.error('Availability check error:', error);
      toast({
        title: "Availability check failed",
        description: error.message || "Failed to check availability",
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
          <DialogTitle className="text-2xl">Select Your Stay</DialogTitle>
          <DialogDescription className="text-base">{hotelName}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Date Range Selection */}
          <Card className="p-4 border-accent/20">
            <Label className="text-sm font-medium mb-3 block">Select Dates</Label>
            <Calendar
              mode="range"
              selected={{
                from: checkInDate,
                to: checkOutDate,
              }}
              onSelect={(range) => {
                setCheckInDate(range?.from);
                setCheckOutDate(range?.to);
              }}
              disabled={(date) => date < new Date()}
              numberOfMonths={2}
              className="pointer-events-auto rounded-md border"
            />
            
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
                Checking Availability...
              </>
            ) : (
              'Check Availability'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
