import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  bookingType: 'hotel' | 'flight' | 'car';
  bookingData: any;
  totalPrice: number;
  currency: string;
}

export const BookingModal = ({ 
  open, 
  onClose, 
  bookingType, 
  bookingData, 
  totalPrice, 
  currency 
}: BookingModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create booking
      const { data: bookingResult, error: bookingError } = await supabase.functions.invoke('create-booking', {
        body: {
          bookingType,
          bookingData,
          totalPrice,
          currency,
          guestInfo: formData
        }
      });

      if (bookingError) throw bookingError;

      console.log('Booking created:', bookingResult.booking);

      // Create checkout session
      const { data: checkoutResult, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          bookingId: bookingResult.booking.id,
          amount: totalPrice,
          currency,
          guestEmail: formData.email
        }
      });

      if (checkoutError) throw checkoutError;

      // Redirect to Stripe checkout
      if (checkoutResult.url) {
        window.open(checkoutResult.url, '_blank');
        onClose();
        toast({
          title: "Redirecting to payment",
          description: `Booking reference: ${bookingResult.bookingReference}`,
        });
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking",
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
          <DialogTitle>Guest Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="text-2xl font-bold">{currency} {totalPrice.toFixed(2)}</span>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
