import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, Plane, Mail, Calendar, User } from "lucide-react";
import logomark from "@/assets/logomark-gold.png";
import { format } from "date-fns";

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId, bookingId]);

  const verifyPayment = async () => {
    try {
      // Unified verification - works for both standard UI and AI chat bookings
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { 
          sessionId, 
          ...(bookingId && { bookingId }) // Include bookingId only if present
        }
      });

      if (error) throw error;

      setPaymentStatus(data.paymentStatus);
      setBooking(data.booking);
      
      // Check for add-on follow-ups
      const addonsStr = localStorage.getItem('booking_addons');
      if (addonsStr && data.paymentStatus === 'paid') {
        try {
          const addons = JSON.parse(addonsStr);
          localStorage.setItem('pending_addons', addonsStr);
          localStorage.removeItem('booking_addons');
        } catch (e) {
          console.error('Failed to process addons:', e);
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={logomark} alt="Logo" className="h-20 w-20 mx-auto animate-pulse" />
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Confirming your booking...</p>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus === 'paid' && booking?.status !== 'cancelled';
  const flightData = booking?.booking_data;
  
  // Check for pending add-ons
  const [addons, setAddons] = useState<any>(null);
  
  useEffect(() => {
    const addonsStr = localStorage.getItem('pending_addons');
    if (addonsStr && isSuccess) {
      try {
        setAddons(JSON.parse(addonsStr));
      } catch (e) {
        console.error('Failed to parse addons:', e);
      }
    }
  }, [isSuccess]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <img src={logomark} alt="Logo" className="h-24 w-24 mx-auto mb-6" />
          {isSuccess ? (
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">
                Booking Confirmed
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your luxury travel experience is confirmed. Prepare for an unforgettable journey.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">
                Booking Unsuccessful
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We encountered an issue processing your booking. Please try again or contact our concierge team.
              </p>
            </div>
          )}
        </div>

        {booking && isSuccess && (
          <Card className="border-accent/20 shadow-xl bg-card/50 backdrop-blur">
            <div className="p-8 space-y-8">
              {/* Booking Reference */}
              <div className="text-center pb-6 border-b border-accent/20">
                <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                  Confirmation Number
                </p>
                <p className="text-3xl font-serif text-primary tracking-wider">
                  {booking.booking_reference || bookingId?.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Flight Details */}
              {booking.booking_type === 'flight' && flightData?.flight_offer && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Plane className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-serif">Flight Information</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {flightData.flight_offer.itineraries?.map((itinerary: any, idx: number) => (
                      <div key={idx} className="p-6 rounded-lg bg-accent/5 border border-accent/20">
                        <p className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
                          {idx === 0 ? 'Departure' : 'Return'}
                        </p>
                        {itinerary.segments?.map((segment: any, segIdx: number) => (
                          <div key={segIdx} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-semibold text-foreground">
                                  {segment.departure.iataCode}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {segment.departure.at ? format(new Date(segment.departure.at), 'MMM dd, HH:mm') : ''}
                                </p>
                              </div>
                              <div className="flex-1 px-4">
                                <div className="border-t-2 border-dashed border-accent/30" />
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-semibold text-foreground">
                                  {segment.arrival.iataCode}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {segment.arrival.at ? format(new Date(segment.arrival.at), 'MMM dd, HH:mm') : ''}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {segment.carrierCode} {segment.number} • {segment.aircraft?.code}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passenger Information */}
              {flightData?.passengers && flightData.passengers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="p-3 rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-serif">Passenger Details</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {flightData.passengers.map((passenger: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                        <p className="font-semibold text-foreground">
                          {passenger.firstName} {passenger.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Passenger {idx + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="space-y-4 pt-6 border-t border-accent/20">
                <div className="flex items-center gap-3 text-foreground mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-serif">Payment Summary</h2>
                </div>
                <div className="space-y-3 p-6 rounded-lg bg-accent/5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Booking Type</span>
                    <span className="capitalize font-medium text-foreground">{booking.booking_type}</span>
                  </div>
                  {flightData?.fees?.baggage > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Baggage Fees</span>
                      <span className="font-medium text-foreground">{booking.currency} {flightData.fees.baggage}</span>
                    </div>
                  )}
                  {flightData?.fees?.seats > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Seat Selection</span>
                      <span className="font-medium text-foreground">{booking.currency} {flightData.fees.seats}</span>
                    </div>
                  )}
                  <div className="border-t border-accent/20 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Total Paid</span>
                      <span className="text-2xl font-bold text-primary">
                        {booking.currency} {Number(booking.total_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Email Notice */}
              <div className="flex items-start gap-4 p-6 rounded-lg bg-primary/5 border border-primary/20">
                <Mail className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground mb-1">Confirmation Email Sent</p>
                  <p className="text-sm text-muted-foreground">
                    A detailed confirmation with your complete itinerary has been sent to your email address. 
                    Please check your inbox and spam folder.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Add-on Follow-ups Banner */}
        {isSuccess && addons && (addons.needFlight || addons.needCarTransfer) && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Complete Your Travel Plans</h3>
              <p className="text-sm text-muted-foreground">
                You indicated you need additional services. Continue booking:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {addons.needFlight && (
                  <Button
                    onClick={() => {
                      const params = new URLSearchParams({
                        type: 'flights',
                        destination: addons.destination || '',
                        departureDate: addons.checkIn || '',
                        returnDate: addons.checkOut || ''
                      });
                      localStorage.removeItem('pending_addons');
                      navigate(`/search-results?${params.toString()}`);
                    }}
                    variant="default"
                    className="flex-1"
                  >
                    Book Flights
                  </Button>
                )}
                {addons.needCarTransfer && (
                  <Button
                    onClick={() => {
                      const params = new URLSearchParams({
                        type: 'cars',
                        location: addons.destination || '',
                        pickupDate: addons.checkIn || '',
                        returnDate: addons.checkOut || ''
                      });
                      localStorage.removeItem('pending_addons');
                      navigate(`/search-results?${params.toString()}`);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Arrange Car Transfer
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/my-bookings')} 
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            View My Bookings
          </Button>
          <Button 
            onClick={() => navigate('/home')} 
            size="lg"
            className="min-w-[200px]"
          >
            Return Home
          </Button>
        </div>
      </div>
    </main>
  );
};

export default BookingConfirmation;
