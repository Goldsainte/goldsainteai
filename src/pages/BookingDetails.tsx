import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plane, Calendar, Clock, MapPin, User, CreditCard, ArrowLeft, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function BookingDetails() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [user, bookingId, navigate]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
      navigate('/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    
    try {
      setCancelling(true);
      
      const functionName = booking.booking_type === 'flight' 
        ? 'amadeus-cancel-flight' 
        : 'amadeus-cancel-hotel';
      
      // Call appropriate cancel function
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          bookingId,
          reason: 'Customer requested cancellation'
        }
      });

      if (error) throw error;

      if (data.refundAmount) {
        toast.success(`Booking cancelled! Refund of ${booking.currency} $${data.refundAmount.toFixed(2)} processed.`);
      } else {
        toast.success('Booking cancelled successfully');
      }
      
      fetchBookingDetails();
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const isFlightBooking = booking.booking_type === 'flight';
  const canModify = booking.status !== 'cancelled' && isFlightBooking;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/my-bookings')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Bookings
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
              <p className="text-muted-foreground">
                Confirmation: {booking.booking_reference}
              </p>
            </div>
            <Badge className={booking.status === 'confirmed' ? 'bg-green-500' : booking.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'}>
              {booking.status}
            </Badge>
          </div>

          {/* Flight Information Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">From</p>
                  <p className="text-lg font-semibold">{booking.booking_data?.origin || 'N/A'}</p>
                  <p className="text-sm">{booking.booking_data?.originAirport}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">To</p>
                  <p className="text-lg font-semibold">{booking.booking_data?.destination || 'N/A'}</p>
                  <p className="text-sm">{booking.booking_data?.destinationAirport}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {booking.booking_data?.departureDate ? 
                        format(new Date(booking.booking_data.departureDate), 'MMM dd, yyyy') : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{booking.booking_data?.departureTime || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Passengers</p>
                    <p className="font-medium">{booking.booking_data?.passengers?.length || 1}</p>
                  </div>
                </div>
              </div>

              {booking.booking_data?.flightNumber && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Flight Number</p>
                    <p className="font-medium">{booking.booking_data.flightNumber}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Information Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold text-lg">
                  {booking.currency} ${Number(booking.total_price).toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booked on</span>
                <span>{format(new Date(booking.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Policy Card */}
          <Card className="mb-6 bg-muted/50 border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5" />
                Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.booking_type === 'flight' ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    US Department of Transportation 24-Hour Rule:
                  </p>
                  <p>
                    Free cancellation within 24 hours of booking for flights to, from, 
                    or within the United States.
                  </p>
                  <p className="text-muted-foreground">
                    After 24 hours, a $50 cancellation fee will be deducted from your refund.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    Hotel Cancellation Policy:
                  </p>
                  <p>
                    Cancellation policies vary by property. Many properties offer free cancellation 
                    within 24 hours of booking if the booking terms include a flexible cancellation policy.
                  </p>
                  <p className="text-muted-foreground">
                    If the property does not offer free cancellation or you cancel outside the grace period, 
                    a $75 cancellation fee may be deducted from your refund.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {canModify && (
            <div className="flex gap-4">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/modify-flight/${bookingId}`)}
              >
                Modify Flight
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowCancelDialog(true)}
                disabled={cancelling}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Booking
              </Button>
            </div>
          )}

          {booking.status !== 'cancelled' && booking.booking_type === 'hotel' && (
            <div className="flex gap-4">
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => setShowCancelDialog(true)}
                disabled={cancelling}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Hotel Booking
              </Button>
            </div>
          )}

          {booking.status === 'cancelled' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-red-800">
                  This booking has been cancelled. Refund processing may take 5-10 business days.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
              {booking.booking_type === 'flight' ? (
                <p className="text-sm">
                  <strong>Note:</strong> US flights booked within the last 24 hours qualify for free 
                  cancellation. Otherwise, a $50 cancellation fee will apply.
                </p>
              ) : (
                <p className="text-sm">
                  <strong>Note:</strong> Free cancellation depends on the property's policy. 
                  A $75 fee may apply if outside the free cancellation window.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}