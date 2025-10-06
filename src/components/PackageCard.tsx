import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel, Car, Calendar, Users, Sparkles } from "lucide-react";
import { getCurrencyFromLocation } from "@/lib/currencyHelpers";
import { useEffect, useMemo, useState } from "react";
// Simple FX cache and conversion with better error handling
const rateCache = new Map<string, number>();
async function getRate(from: string, to: string): Promise<number> {
  if (!from || !to || from === to) return 1;
  const key = `${from}_${to}`;
  const cached = rateCache.get(key);
  if (cached) return cached;
  try {
    // Use exchangerate-api.com which is more reliable
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(from)}`);
    if (!res.ok) throw new Error('Rate fetch failed');
    const json = await res.json();
    const rate = json?.rates?.[to];
    if (typeof rate === 'number' && rate > 0) {
      rateCache.set(key, rate);
      return rate;
    }
  } catch (e) {
    console.error('FX rate fetch failed, using 1:1', e);
  }
  return 1; // Fallback to 1:1 if fetch fails
}
async function convertAmount(amount: number, from: string, to: string): Promise<number> {
  if (!amount || amount === 0) return 0;
  if (from === to) return amount;
  const rate = await getRate(from, to);
  const converted = amount * rate;
  console.log(`Converting ${amount} ${from} to ${to}: rate=${rate}, result=${converted}`);
  return converted;
}

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
  userCountry?: string;
  onBook?: (packageData: any) => void;
}

export const PackageCard = ({ packageData, userCountry = 'US', onBook }: PackageCardProps) => {
  const { flights, hotels, cars, origin, destination, departureDate, returnDate, travelers, estimatedTotal, savings } = packageData;
  
  // Use detected user country for currency (where user is located)
  const currencyInfo = getCurrencyFromLocation(userCountry);
  const currencySymbol = currencyInfo.symbol;
  
  const cheapestFlight = flights[0];
  const cheapestHotel = hotels[0];
  const cheapestCar = cars[0];
  
// Extract prices - ensure we're getting valid numbers
const flightPrice = cheapestFlight?.price?.total ? parseFloat(String(cheapestFlight.price.total)) : 0;
const hotelPrice = cheapestHotel?.offers?.[0]?.price?.total ? parseFloat(String(cheapestHotel.offers[0].price.total)) : 0;
const carPrice = cheapestCar?.price?.total ? parseFloat(String(cheapestCar.price.total)) : 0;

const flightCurrency = cheapestFlight?.price?.currency || 'USD';
const hotelCurrency = cheapestHotel?.offers?.[0]?.price?.currency || 'USD';
const carCurrency = cheapestCar?.price?.currency || 'USD';

console.log('Package prices:', { 
  flight: { price: flightPrice, currency: flightCurrency },
  hotel: { price: hotelPrice, currency: hotelCurrency },
  car: { price: carPrice, currency: carCurrency },
  targetCurrency: currencyInfo.code
});

const [converted, setConverted] = useState({ flight: flightPrice, hotel: hotelPrice, car: carPrice });

useEffect(() => {
  let active = true;
  (async () => {
    const f = await convertAmount(flightPrice, flightCurrency, currencyInfo.code);
    const h = await convertAmount(hotelPrice, hotelCurrency, currencyInfo.code);
    const c = await convertAmount(carPrice, carCurrency, currencyInfo.code);
    if (active) setConverted({ flight: f, hotel: h, car: c });
  })();
  return () => { active = false; };
}, [flightPrice, hotelPrice, carPrice, flightCurrency, hotelCurrency, carCurrency, currencyInfo.code]);

// Total is sum of all converted prices (flight is total for all travelers, hotel is total, car is total)
const total = useMemo(() => {
  const sum = converted.flight + converted.hotel + converted.car;
  console.log('Total calculation:', { converted, sum });
  return sum;
}, [converted]);

const packageSavings = useMemo(() => Math.floor(total * 0.1), [total]); // 10% package discount
const finalPrice = useMemo(() => total - packageSavings, [total, packageSavings]);

// Per person price - divide total by number of travelers
const perPerson = useMemo(() => {
  const pp = travelers > 0 ? finalPrice / travelers : finalPrice;
  console.log('Per person calculation:', { finalPrice, travelers, perPerson: pp });
  return pp;
}, [finalPrice, travelers]);

const hasConversion = useMemo(() => [flightCurrency, hotelCurrency, carCurrency].some(c => c && c !== currencyInfo.code), [flightCurrency, hotelCurrency, carCurrency, currencyInfo.code]);
  
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
              <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                Save {currencySymbol}{packageSavings.toFixed(2)}
              </Badge>
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
              {currencySymbol}{(total / Math.max(travelers,1)).toFixed(2)}
            </p>
            <p className="text-3xl font-bold text-primary">
              {currencySymbol}{perPerson.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
        </div>
      </div>

      {/* Package Contents */}
      <div className="p-6 space-y-4">
        {/* Flight Info */}
        {cheapestFlight && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plane className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold">Round-trip Flight</p>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>
                  <span className="font-medium">
                    {cheapestFlight.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Airline'} 
                    {cheapestFlight.itineraries?.[0]?.segments?.[0]?.number && ` ${cheapestFlight.itineraries[0].segments[0].number}`}
                  </span>
                </p>
                <div className="pt-1">
                  <p className="font-medium">Outbound</p>
                  <p>
                    Depart: {cheapestFlight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || origin} 
                    {cheapestFlight.itineraries?.[0]?.segments?.[0]?.departure?.at && 
                      ` at ${new Date(cheapestFlight.itineraries[0].segments[0].departure.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                  </p>
                  <p>
                    Arrive: {cheapestFlight.itineraries?.[0]?.segments?.[cheapestFlight.itineraries[0].segments.length - 1]?.arrival?.iataCode || destination}
                    {cheapestFlight.itineraries?.[0]?.segments?.[cheapestFlight.itineraries[0].segments.length - 1]?.arrival?.at && 
                      ` at ${new Date(cheapestFlight.itineraries[0].segments[cheapestFlight.itineraries[0].segments.length - 1].arrival.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                  </p>
                  <p>{cheapestFlight.itineraries?.[0]?.segments?.length === 1 ? 'Nonstop' : `${cheapestFlight.itineraries[0].segments.length - 1} stop(s)`}</p>
                </div>
                {cheapestFlight.itineraries?.[1] && (
                  <div className="pt-1 border-t mt-1">
                    <p className="font-medium">Return</p>
                    <p>
                      Depart: {cheapestFlight.itineraries[1].segments?.[0]?.departure?.iataCode || destination}
                      {cheapestFlight.itineraries[1].segments?.[0]?.departure?.at && 
                        ` at ${new Date(cheapestFlight.itineraries[1].segments[0].departure.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                    </p>
                    <p>
                      Arrive: {cheapestFlight.itineraries[1].segments?.[cheapestFlight.itineraries[1].segments.length - 1]?.arrival?.iataCode || origin}
                      {cheapestFlight.itineraries[1].segments?.[cheapestFlight.itineraries[1].segments.length - 1]?.arrival?.at && 
                        ` at ${new Date(cheapestFlight.itineraries[1].segments[cheapestFlight.itineraries[1].segments.length - 1].arrival.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                    </p>
                  </div>
                )}
                {flightCurrency !== currencyInfo.code && hasConversion && (
                  <p className="text-xs italic opacity-75">Converted from {flightCurrency}</p>
                )}
              </div>
            </div>
            <p className="font-semibold text-right">{currencySymbol}{converted.flight.toFixed(2)}</p>
          </div>
        )}

        {/* Hotel Info */}
        {cheapestHotel && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="p-2 rounded-lg bg-primary/10">
              <Hotel className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold">{cheapestHotel.hotel?.name || 'Hotel Accommodation'}</p>
              <div className="text-sm text-muted-foreground space-y-0.5">
                {cheapestHotel.hotel?.cityCode && <p>Location: {cheapestHotel.hotel.cityCode}</p>}
                {cheapestHotel.hotel?.address?.lines?.[0] && <p>{cheapestHotel.hotel.address.lines[0]}</p>}
                <p>{nights} nights • {cheapestHotel.hotel?.rating ? `${cheapestHotel.hotel.rating} stars` : 'Rating N/A'}</p>
                {cheapestHotel.offers?.[0]?.room?.description?.text && (
                  <p className="line-clamp-1">Room: {cheapestHotel.offers[0].room.description.text}</p>
                )}
                {cheapestHotel.offers?.[0]?.room?.typeEstimated?.category && (
                  <p>Category: {cheapestHotel.offers[0].room.typeEstimated.category}</p>
                )}
                <p>Check-in: {formatDate(departureDate)} • Check-out: {formatDate(returnDate)}</p>
                {hotelCurrency !== currencyInfo.code && hasConversion && (
                  <p className="text-xs italic opacity-75">Converted from {hotelCurrency}</p>
                )}
              </div>
            </div>
            <p className="font-semibold text-right">{currencySymbol}{converted.hotel.toFixed(2)}</p>
          </div>
        )}

        {/* Car Info */}
        {cheapestCar && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="p-2 rounded-lg bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold">Car Rental</p>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>{cheapestCar.vehicle?.make || ''} {cheapestCar.vehicle?.model || cheapestCar.vehicle?.category || 'Standard'}</p>
                <p>Pickup: {cheapestCar.pickupLocation?.address?.cityName || destination}</p>
                {cheapestCar.provider?.name && <p>Provider: {cheapestCar.provider.name}</p>}
                <p>{nights} days rental</p>
              </div>
            </div>
            <p className="font-semibold text-right">{currencySymbol}{converted.car.toFixed(2)}</p>
          </div>
        )}

        <div className="pt-4 space-y-2">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => {
              if (onBook) {
                onBook({
                  ...packageData,
                  finalPrice: perPerson,
                  currencySymbol,
                  currencyCode: currencyInfo.code,
                  packageSavings
                });
              }
            }}
          >
            Book Complete Package - {currencySymbol}{perPerson.toFixed(2)}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {currencySymbol}{perPerson.toFixed(2)} per person • Total {currencySymbol}{finalPrice.toFixed(2)} for {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
          </p>
          <p className="text-xs text-center text-green-600 dark:text-green-400 font-medium">
            💰 Save {currencySymbol}{packageSavings.toFixed(2)} vs booking separately
          </p>
        </div>
      </div>
    </Card>
  );
};
