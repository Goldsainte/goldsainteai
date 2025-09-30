import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onAvailabilityConfirmed: (hotelOffer: any, checkIn: string, checkOut: string, adults: number) => void;
  cityCode: string;
  hotelName: string;
}

export const DateSelectionModal = ({ 
  open, 
  onClose, 
  onAvailabilityConfirmed,
  cityCode,
  hotelName
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your Dates</DialogTitle>
          <p className="text-sm text-muted-foreground">{hotelName}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Check-in Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkInDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkInDate}
                  onSelect={setCheckInDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Check-out Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkOutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOutDate ? format(checkOutDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOutDate}
                  onSelect={setCheckOutDate}
                  disabled={(date) => date < new Date() || (checkInDate ? date <= checkInDate : false)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adults">Number of Adults</Label>
            <Input
              id="adults"
              type="number"
              min="1"
              max="10"
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
            />
          </div>

          <Button 
            onClick={handleCheckAvailability} 
            className="w-full"
            disabled={loading || !checkInDate || !checkOutDate}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
