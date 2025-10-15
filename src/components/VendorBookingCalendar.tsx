import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorBookingCalendar() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await (supabase as any)
        .from('transportation_vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendor) return;

      const { data, error } = await (supabase as any)
        .from('transportation_bookings')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('pickup_datetime', { ascending: true });

      if (error) throw error;

      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      in_progress: "bg-green-500",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const selectedDayBookings = bookings.filter((booking) => {
    if (!selectedDate) return false;
    const bookingDate = new Date(booking.pickup_datetime);
    return bookingDate.toDateString() === selectedDate.toDateString();
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Booking Calendar</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Bookings for {selectedDate?.toLocaleDateString() || "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDayBookings.map((booking) => (
                <div key={booking.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {new Date(booking.pickup_datetime).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.pickup_location.address} → {booking.dropoff_location.address}
                      </p>
                    </div>
                    <Badge className={getStatusColor(booking.booking_status)}>
                      {booking.booking_status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{booking.passenger_count} passengers</span>
                    <span>{booking.luggage_count} luggage</span>
                  </div>
                </div>
              ))}
              {selectedDayBookings.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No bookings for this day
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
