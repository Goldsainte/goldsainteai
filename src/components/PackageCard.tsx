import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel, Car, Calendar, Users, Sparkles } from "lucide-react";
import { getCurrencyFromLocation } from "@/lib/currencyHelpers";

interface PackageCardProps {
  packageData: {
    flights: any[];
    hotels: any[];
    cars: any[];
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    travelers: number;
    estimatedTotal?: number;
    savings?: number;
  };
}

export const PackageCard = ({ packageData }: PackageCardProps) => {
  const { flights, hotels, cars, origin, destination, departureDate, returnDate, travelers, estimatedTotal, savings } = packageData;
  
  const currencyInfo = getCurrencyFromLocation(destination);
  const currencySymbol = currencyInfo.symbol;
  
  const cheapestFlight = flights[0];
  const cheapestHotel = hotels[0];
  const cheapestCar = cars[0];
  
  const flightPrice = cheapestFlight ? parseFloat(cheapestFlight.price?.total || 0) : 0;
  const hotelPrice = cheapestHotel ? parseFloat(cheapestHotel.offers?.[0]?.price?.total || 0) : 0;
  const carPrice = cheapestCar ? parseFloat(cheapestCar.price?.total || 0) : 0;
  
  const total = flightPrice + hotelPrice + carPrice;
  const packageSavings = Math.floor(total * 0.1); // 10% package discount
  const finalPrice = total - packageSavings;
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const nights = Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all border-2 border-primary/20">
      {/* Package Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Complete Package
              </Badge>
              {savings && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  Save {currencySymbol}{packageSavings}
                </Badge>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {origin} → {destination}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(departureDate)} - {formatDate(returnDate)} ({nights} nights)
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground line-through">
              {currencySymbol}{total.toFixed(2)}
            </p>
            <p className="text-3xl font-bold text-primary">
              {currencySymbol}{finalPrice.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
        </div>
      </div>

      {/* Package Contents */}
      <div className="p-6 space-y-4">
        {/* Flight Info */}
        {cheapestFlight && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plane className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Round-trip Flight</p>
              <p className="text-sm text-muted-foreground">
                {cheapestFlight.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Airline'} • 
                {cheapestFlight.itineraries?.[0]?.segments?.length || 1} {cheapestFlight.itineraries?.[0]?.segments?.length === 1 ? 'stop' : 'stops'}
              </p>
            </div>
            <p className="font-semibold">{currencySymbol}{flightPrice.toFixed(2)}</p>
          </div>
        )}

        {/* Hotel Info */}
        {cheapestHotel && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-primary/10">
              <Hotel className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{cheapestHotel.hotel?.name || 'Hotel Accommodation'}</p>
              <p className="text-sm text-muted-foreground">
                {nights} nights • {cheapestHotel.hotel?.rating || 'Rated'} stars
              </p>
            </div>
            <p className="font-semibold">{currencySymbol}{hotelPrice.toFixed(2)}</p>
          </div>
        )}

        {/* Car Info */}
        {cheapestCar && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Car Rental</p>
              <p className="text-sm text-muted-foreground">
                {cheapestCar.vehicle?.category || 'Compact'} • {nights} days
              </p>
            </div>
            <p className="font-semibold">{currencySymbol}{carPrice.toFixed(2)}</p>
          </div>
        )}

        <div className="pt-4 space-y-2">
          <Button className="w-full" size="lg">
            Book Complete Package - {currencySymbol}{finalPrice.toFixed(2)}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            All components can be customized before booking
          </p>
        </div>
      </div>
    </Card>
  );
};
