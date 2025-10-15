import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Users, Luggage } from "lucide-react";

interface BookingFormProps {
  vendorId: string;
  vehicleId: string;
  onSuccess?: () => void;
}

export default function TransportationBookingForm({ vendorId, vehicleId, onSuccess }: BookingFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickup_location: { address: "", lat: 0, lng: 0 },
    dropoff_location: { address: "", lat: 0, lng: 0 },
    pickup_datetime: "",
    passenger_count: 1,
    luggage_count: 0,
    special_requirements: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: vendor } = await supabase
        .from('transportation_vendors')
        .select('base_price_per_hour')
        .eq('id', vendorId)
        .single();

      if (!vendor) throw new Error('Vendor not found');

      const bookingData = {
        vendor_id: vendorId,
        vehicle_id: vehicleId,
        ...formData,
        total_price: vendor.base_price_per_hour * 2, // Simplified pricing
      };

      const { data, error } = await supabase.functions.invoke('create-transportation-booking', {
        body: bookingData,
      });

      if (error) throw error;

      toast({
        title: "Booking Created",
        description: "Your transportation booking has been created successfully.",
      });

      if (onSuccess) onSuccess();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Transportation</CardTitle>
        <CardDescription>Fill in your trip details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickup">
              <MapPin className="inline h-4 w-4 mr-2" />
              Pickup Location
            </Label>
            <Input
              id="pickup"
              value={formData.pickup_location.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pickup_location: { ...formData.pickup_location, address: e.target.value },
                })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropoff">
              <MapPin className="inline h-4 w-4 mr-2" />
              Drop-off Location
            </Label>
            <Input
              id="dropoff"
              value={formData.dropoff_location.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dropoff_location: { ...formData.dropoff_location, address: e.target.value },
                })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup_datetime">
              <Calendar className="inline h-4 w-4 mr-2" />
              Pickup Date & Time
            </Label>
            <Input
              id="pickup_datetime"
              type="datetime-local"
              value={formData.pickup_datetime}
              onChange={(e) => setFormData({ ...formData, pickup_datetime: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="passengers">
                <Users className="inline h-4 w-4 mr-2" />
                Passengers
              </Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                value={formData.passenger_count}
                onChange={(e) =>
                  setFormData({ ...formData, passenger_count: parseInt(e.target.value) })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="luggage">
                <Luggage className="inline h-4 w-4 mr-2" />
                Luggage
              </Label>
              <Input
                id="luggage"
                type="number"
                min="0"
                value={formData.luggage_count}
                onChange={(e) =>
                  setFormData({ ...formData, luggage_count: parseInt(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Special Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Processing..." : "Confirm Booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}