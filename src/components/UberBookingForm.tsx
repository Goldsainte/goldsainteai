import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Navigation } from "lucide-react";

interface UberBookingFormProps {
  productId: string;
  onSuccess?: () => void;
}

export default function UberBookingForm({ productId, onSuccess }: UberBookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [dropoffLat, setDropoffLat] = useState("");
  const [dropoffLng, setDropoffLng] = useState("");
  const { toast } = useToast();

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickupLat(position.coords.latitude.toString());
          setPickupLng(position.coords.longitude.toString());
          toast({
            title: "Location set",
            description: "Current location set as pickup",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not get your current location",
            variant: "destructive",
          });
          console.error("Geolocation error:", error);
        }
      );
    } else {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        throw new Error("Please provide all location coordinates");
      }

      const { data, error } = await supabase.functions.invoke("uber-request-ride", {
        body: {
          pickupLatitude: parseFloat(pickupLat),
          pickupLongitude: parseFloat(pickupLng),
          dropoffLatitude: parseFloat(dropoffLat),
          dropoffLongitude: parseFloat(dropoffLng),
          pickupAddress,
          dropoffAddress,
          productId,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Ride requested!",
          description: "Your Uber ride has been requested successfully",
        });
        onSuccess?.();
      } else {
        throw new Error(data.error || "Failed to request ride");
      }
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
      console.error("Uber booking error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Pickup Location</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupAddress">
              <MapPin className="h-4 w-4 inline mr-2" />
              Pickup Address (Optional)
            </Label>
            <Input
              id="pickupAddress"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="123 Main St, City"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="pickupLat">Latitude *</Label>
              <Input
                id="pickupLat"
                type="number"
                step="any"
                value={pickupLat}
                onChange={(e) => setPickupLat(e.target.value)}
                placeholder="37.7749"
                required
              />
            </div>
            <div>
              <Label htmlFor="pickupLng">Longitude *</Label>
              <Input
                id="pickupLng"
                type="number"
                step="any"
                value={pickupLng}
                onChange={(e) => setPickupLng(e.target.value)}
                placeholder="-122.4194"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-semibold">Dropoff Location</Label>

          <div className="space-y-2">
            <Label htmlFor="dropoffAddress">
              <MapPin className="h-4 w-4 inline mr-2" />
              Dropoff Address (Optional)
            </Label>
            <Input
              id="dropoffAddress"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="456 Market St, City"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="dropoffLat">Latitude *</Label>
              <Input
                id="dropoffLat"
                type="number"
                step="any"
                value={dropoffLat}
                onChange={(e) => setDropoffLat(e.target.value)}
                placeholder="37.7849"
                required
              />
            </div>
            <div>
              <Label htmlFor="dropoffLng">Longitude *</Label>
              <Input
                id="dropoffLng"
                type="number"
                step="any"
                value={dropoffLng}
                onChange={(e) => setDropoffLng(e.target.value)}
                placeholder="-122.4094"
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Requesting Ride..." : "Request Uber Ride"}
        </Button>
      </form>
    </Card>
  );
}