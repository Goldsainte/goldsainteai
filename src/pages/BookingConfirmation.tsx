import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import logomark from "@/assets/logomark-gold.png";

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    if (sessionId && bookingId) {
      verifyPayment();
    }
  }, [sessionId, bookingId]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId, bookingId }
      });

      if (error) throw error;

      setPaymentStatus(data.paymentStatus);
      setBooking(data.booking);
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSuccess = paymentStatus === 'paid';

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <img src={logomark} alt="Sainté Voyage AI" className="h-16 w-16" />
          
          {isSuccess ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h1 className="text-3xl font-bold text-foreground">Booking Confirmed!</h1>
              <p className="text-muted-foreground">
                Your booking has been successfully confirmed and payment received.
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <h1 className="text-3xl font-bold text-foreground">Payment Failed</h1>
              <p className="text-muted-foreground">
                Unfortunately, your payment could not be processed. Please try again.
              </p>
            </>
          )}
        </div>

        {booking && isSuccess && (
          <div className="space-y-4 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Booking Reference</p>
                <p className="font-semibold text-lg">{booking.booking_reference}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking Type</p>
                <p className="font-semibold capitalize">{booking.booking_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-semibold">{booking.currency} {booking.total_price}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold text-green-600 capitalize">{booking.status}</p>
              </div>
            </div>

            {booking.guests && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Guest Information</p>
                <p className="font-medium">
                  {booking.guests.first_name} {booking.guests.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{booking.guests.email}</p>
              </div>
            )}

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to your email address with all the booking details.
              </p>
            </div>
          </div>
        )}

        <div className="pt-6 space-y-3">
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
            variant={isSuccess ? "default" : "destructive"}
          >
            {isSuccess ? 'Back to Home' : 'Try Again'}
          </Button>
        </div>
      </Card>
    </main>
  );
};

export default BookingConfirmation;
