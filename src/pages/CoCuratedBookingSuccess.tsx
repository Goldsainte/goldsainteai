import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trackPurchaseConversionOnce } from "@/lib/analytics/conversions";

export default function CoCuratedBookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast.error('Invalid booking session');
      navigate('/cocurated-marketplace');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-cocurated-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data.success) {
        setBookingId(data.bookingId);
        toast.success('Booking confirmed!');
        // Fire Google Ads purchase conversion (deduped per session_id)
        const value = Number(data.amount ?? data.value ?? 0);
        if (value > 0 || data.bookingId) {
          trackPurchaseConversionOnce(sessionId, {
            value: value || 0,
            currency: (data.currency as string) || 'USD',
            transactionId: data.bookingId || sessionId,
            productType: 'trip_booking',
          });
        }
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to verify booking');
      navigate('/cocurated-marketplace');
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-lg font-medium">Verifying your booking...</p>
            <p className="text-sm text-muted-foreground mt-2">This will only take a moment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            Booking Confirmed!
            <Sparkles className="h-6 w-6 text-primary" />
          </CardTitle>
          <CardDescription>
            Your CoCurated<span className="text-xs align-super">™</span> travel package booking has been confirmed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm">
              ✅ Payment processed successfully
            </p>
            <p className="text-sm">
              ✅ Booking confirmation sent to your email
            </p>
            <p className="text-sm">
              ✅ Travel agent will contact you within 24 hours
            </p>
            {bookingId && (
              <p className="text-xs text-muted-foreground mt-4">
                Booking ID: {bookingId}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/my-bookings')}
            >
              View My Bookings
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate('/cocurated-marketplace')}
            >
              Browse More Packages
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}