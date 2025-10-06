import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Briefcase } from "lucide-react";
import { useState } from "react";
import { BookingModal } from "./BookingModal";

interface CarCardProps {
  car: any;
}

export const CarCard = ({ car }: CarCardProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  const vehicle = car.vehicle;
  const price = parseFloat(car.price.total);
  const currency = car.price.currency;

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Car className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-lg line-clamp-2 sm:line-clamp-1">
                  {vehicle.make} {vehicle.model}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {vehicle.category || 'Standard'} • {vehicle.transmission || 'Automatic'}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg">
              {currency} {price.toFixed(2)}
            </Badge>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {vehicle.seats || 'N/A'} passengers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {vehicle.baggageCapacity || 'N/A'} bags
              </span>
            </div>
          </div>

          {/* Provider */}
          {car.providerInfo && (
            <p className="text-sm text-muted-foreground">
              Provider: {car.providerInfo.name}
            </p>
          )}

          {/* Actions */}
          <Button 
            onClick={() => setShowBookingModal(true)}
            className="w-full"
          >
            Book Car
          </Button>
        </div>
      </Card>

      <BookingModal
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        bookingType="car"
        bookingData={car}
        totalPrice={price}
        currency={currency}
      />
    </>
  );
};
