import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCancellation } from "@/components/BookingCancellation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, MapPin, DollarSign, XCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function BookingHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancellationOpen, setCancellationOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          booking_cancellations (
            id,
            status,
            refund_amount,
            refund_percentage,
            cancellation_date
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setCancellationOpen(true);
  };

  const getStatusBadge = (booking: any) => {
    const status = booking.cancellation_status || booking.status;
    
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      active: { label: "Active", variant: "default", icon: CheckCircle },
      confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle },
      pending: { label: "Pending", variant: "secondary", icon: Clock },
      cancellation_requested: { label: "Cancellation Pending", variant: "secondary", icon: Clock },
      cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
      refunded: { label: "Refunded", variant: "outline", icon: CheckCircle },
    };

    const config = statusConfig[status] || { label: status, variant: "outline", icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const canCancel = (booking: any) => {
    const status = booking.cancellation_status || booking.status;
    return status === "active" || status === "confirmed";
  };

  const activeBookings = bookings.filter(
    (b) => b.cancellation_status === "active" || b.status === "confirmed"
  );
  const cancelledBookings = bookings.filter(
    (b) => b.cancellation_status === "cancelled" || b.cancellation_status === "refunded"
  );
  const pendingBookings = bookings.filter(
    (b) => b.cancellation_status === "cancellation_requested"
  );

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              {booking.booking_type === "hotel" && "Hotel Booking"}
              {booking.booking_type === "flight" && "Flight Booking"}
              {booking.booking_type === "car" && "Car Rental"}
            </CardTitle>
            <CardDescription>
              Booking #{booking.booking_reference || booking.id.slice(0, 8).toUpperCase()}
            </CardDescription>
          </div>
          {getStatusBadge(booking)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {booking.destination && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{booking.destination}</span>
            </div>
          )}
          
          {(booking.check_in_date || booking.departure_date) && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(booking.check_in_date || booking.departure_date), "MMM dd, yyyy")}
                {booking.check_out_date && ` - ${format(new Date(booking.check_out_date), "MMM dd, yyyy")}`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {booking.currency} {booking.total_price?.toFixed(2)}
            </span>
          </div>
        </div>

        {booking.booking_cancellations?.[0] && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium">Cancellation Details</p>
            <p className="text-sm text-muted-foreground">
              Requested: {format(new Date(booking.booking_cancellations[0].cancellation_date), "MMM dd, yyyy")}
            </p>
            {booking.booking_cancellations[0].refund_amount > 0 && (
              <p className="text-sm text-muted-foreground">
                Refund: {booking.currency} {booking.booking_cancellations[0].refund_amount.toFixed(2)} (
                {booking.booking_cancellations[0].refund_percentage}%)
              </p>
            )}
          </div>
        )}

        {canCancel(booking) && (
          <Button
            variant="destructive"
            onClick={() => handleCancelClick(booking)}
            className="w-full"
          >
            Cancel Booking
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your travel bookings</p>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeBookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Cancellation ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeBookings.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No active bookings</p>
                </CardContent>
              </Card>
            ) : (
              activeBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No pending cancellations</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No cancelled bookings</p>
                </CardContent>
              </Card>
            ) : (
              cancelledBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No bookings yet</p>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedBooking && (
        <BookingCancellation
          open={cancellationOpen}
          onClose={() => {
            setCancellationOpen(false);
            setSelectedBooking(null);
          }}
          bookingId={selectedBooking.id}
          bookingType={selectedBooking.booking_type}
          checkInDate={selectedBooking.check_in_date || selectedBooking.departure_date}
          totalPrice={selectedBooking.total_price}
          currency={selectedBooking.currency}
          onCancellationComplete={loadBookings}
        />
      )}
    </div>
  );
}
