import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plane, Hotel, Car, MapPin, Calendar, Users, Sparkles } from "lucide-react";

interface TravelPackageCardProps {
  packageData: {
    id?: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    travelers: number;
    flight?: {
      airline: string;
      departure: string;
      arrival: string;
      price: number;
    };
    hotel?: {
      name: string;
      nights: number;
      price: number;
    };
    car?: {
      type: string;
      days: number;
      price: number;
    };
    totalPrice: number;
    bundledPrice: number;
    savings: number;
    currency?: string;
  };
  onBook?: () => void;
  onRequestAgent?: () => void;
}

export const TravelPackageCard = ({ 
  packageData, 
  onBook, 
  onRequestAgent 
}: TravelPackageCardProps) => {
  const { 
    destination, 
    departureDate, 
    returnDate, 
    travelers,
    flight, 
    hotel, 
    car,
    totalPrice,
    bundledPrice,
    savings,
    currency = 'USD'
  } = packageData;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency 
    }).format(price);
  };

  const savingsPercent = Math.round((savings / totalPrice) * 100);

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {destination} Travel Package
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(departureDate)} - {formatDate(returnDate)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
            Save {savingsPercent}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Package Items */}
        <div className="space-y-3">
          {flight && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background">
                  <Plane className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{flight.airline}</p>
                  <p className="text-sm text-muted-foreground">
                    {flight.departure} → {flight.arrival}
                  </p>
                </div>
              </div>
              <p className="font-medium">{formatPrice(flight.price)}</p>
            </div>
          )}

          {hotel && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background">
                  <Hotel className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{hotel.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {hotel.nights} {hotel.nights === 1 ? 'night' : 'nights'}
                  </p>
                </div>
              </div>
              <p className="font-medium">{formatPrice(hotel.price)}</p>
            </div>
          )}

          {car && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{car.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {car.days} {car.days === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>
              <p className="font-medium">{formatPrice(car.price)}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Pricing Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total if booked separately</span>
            <span className="line-through">{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Bundled Package Price</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatPrice(bundledPrice)}</p>
              <p className="text-sm text-green-600 font-medium">
                You save {formatPrice(savings)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        {onBook && (
          <Button onClick={onBook} className="flex-1" size="lg">
            Book Package
          </Button>
        )}
        {onRequestAgent && (
          <Button onClick={onRequestAgent} variant="outline" className="flex-1" size="lg">
            Request Agent
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
