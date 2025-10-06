import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RestaurantReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: {
    id: string;
    name: string;
    address: string;
    photoUrl?: string | null;
  };
}

export const RestaurantReservationModal = ({
  isOpen,
  onClose,
  restaurant
}: RestaurantReservationModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState(2);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a reservation date",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create guest record
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone
        })
        .select()
        .single();

      if (guestError) throw guestError;

      // Generate booking reference
      const bookingReference = `REST-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // Create booking record
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          guest_id: guestData.id,
          booking_type: 'restaurant',
          booking_reference: bookingReference,
          booking_data: {
            restaurant_id: restaurant.id,
            restaurant_name: restaurant.name,
            restaurant_address: restaurant.address,
            date: format(date, 'yyyy-MM-dd'),
            time: time,
            guests: guests
          },
          total_price: 0,
          status: 'confirmed'
        });

      if (bookingError) throw bookingError;

      // Send confirmation email
      try {
        const [h, m] = time.split(':').map((n) => parseInt(n, 10));
        const time12 = new Date(Date.UTC(2000,0,1,h,m)).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'});
        await supabase.functions.invoke('send-confirmation-email', {
          body: {
            guestInfo: {
              firstName,
              lastName,
              email,
              phone
            },
            bookingType: 'restaurant',
            bookingData: {
              restaurantName: restaurant.name,
              restaurantAddress: restaurant.address,
              date: format(date, 'PPP'),
              time: time12,
              guests: guests
            },
            bookingReference,
            totalPrice: 0,
            currency: 'USD'
          }
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the booking if email fails
      }

      const [h, m] = time.split(':').map((n) => parseInt(n, 10));
      const time12 = new Date(Date.UTC(2000,0,1,h,m)).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'});
      toast({
        title: "Reservation confirmed!",
        description: `Your table for ${guests} at ${restaurant.name} on ${format(date, 'PPP')} at ${time12} has been confirmed. Check your email for details.`
      });

      onClose();
      
      // Reset form
      setDate(undefined);
      setTime("19:00");
      setGuests(2);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: "There was an error creating your reservation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Reserve a Table</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {restaurant.photoUrl && (
            <img 
              src={restaurant.photoUrl} 
              alt={restaurant.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          <div>
            <h3 className="text-xl font-semibold">{restaurant.name}</h3>
            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests">Number of Guests</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirming..." : "Confirm Reservation"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
