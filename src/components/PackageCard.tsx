import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel, Car, Calendar, Users, Sparkles, Star, MapPin, Wifi, Coffee, Utensils, ParkingCircle, Wind, Dumbbell, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { getCurrencyFromLocation } from "@/lib/currencyHelpers";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  
  const [hotelDetails, setHotelDetails] = useState<any>(null);
  const [loadingHotelDetails, setLoadingHotelDetails] = useState(false);
  
// Extract prices - ensure we're getting valid numbers and support multiple hotel data shapes
const flightPrice = cheapestFlight?.price?.total ? parseFloat(String(cheapestFlight.price.total)) : 0;
const hotelPrice = (() => {
  // Amadeus shape
  if (cheapestHotel?.offers?.[0]?.price?.total) return parseFloat(String(cheapestHotel.offers[0].price.total));
  // Unified hotels shape
  if (cheapestHotel?.priceBreakdown?.totalPrice?.value) return parseFloat(String(cheapestHotel.priceBreakdown.totalPrice.value));
  // Fallback
  if (cheapestHotel?.price?.total) return parseFloat(String(cheapestHotel.price.total));
  return 0;
})();
const carPrice = cheapestCar?.price?.total ? parseFloat(String(cheapestCar.price.total)) : 0;

const flightCurrency = cheapestFlight?.price?.currency || 'USD';
const hotelCurrency = cheapestHotel?.offers?.[0]?.price?.currency 
  || cheapestHotel?.priceBreakdown?.totalPrice?.currency 
  || 'USD';
const carCurrency = cheapestCar?.price?.currency || 'USD';


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

// Fetch detailed hotel information
useEffect(() => {
  const fetchHotelDetails = async () => {
    const selectedHotelId = cheapestHotel?.hotel?.hotelId 
      || cheapestHotel?.amadeusData?.hotelId 
      || cheapestHotel?.hotel_id 
      || cheapestHotel?.id;
    if (!selectedHotelId) return;
    
    setLoadingHotelDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-hotel-details', {
        body: { hotelId: selectedHotelId }
      });
      
      if (!error && data?.data) {
        setHotelDetails(data.data);
      }
    } catch (err) {
      console.error('Error fetching hotel details:', err);
    } finally {
      setLoadingHotelDetails(false);
    }
  };
  
  fetchHotelDetails();
}, [cheapestHotel?.hotel?.hotelId, cheapestHotel?.amadeusData?.hotelId, cheapestHotel?.hotel_id, cheapestHotel?.id]);

// Total is sum of all converted prices (flight is total for all travelers, hotel is total, car is total)
const total = useMemo(() => {
  const sum = converted.flight + converted.hotel + converted.car;
    return sum;
}, [converted]);

const packageSavings = useMemo(() => Math.floor(total * 0.1), [total]); // 10% package discount
const finalPrice = useMemo(() => total - packageSavings, [total, packageSavings]);

// Per person price - divide total by number of travelers
const perPerson = useMemo(() => {
  const pp = travelers > 0 ? finalPrice / travelers : finalPrice;
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
        {/* Flight Info - Enhanced */}
        {cheapestFlight && (
          <div className="rounded-lg bg-muted/50 border border-border overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Plane className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-lg">Round-trip Flight</h4>
                    <Badge variant="outline" className="text-xs">
                      {cheapestFlight.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Airline'}
                      {cheapestFlight.itineraries?.[0]?.segments?.[0]?.number && ` ${cheapestFlight.itineraries[0].segments[0].number}`}
                    </Badge>
                  </div>
                  
                  {/* Outbound Journey */}
                  <div className="space-y-3 mb-4 p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs">Outbound</Badge>
                      <span className="text-xs text-muted-foreground">
                        {cheapestFlight.itineraries?.[0]?.duration && 
                          `Total Duration: ${cheapestFlight.itineraries[0].duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}`
                        }
                      </span>
                    </div>
                    
                    {cheapestFlight.itineraries?.[0]?.segments?.map((segment: any, idx: number) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{segment.departure?.iataCode}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(segment.departure?.at).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(segment.departure?.at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          
                          <div className="flex-1 text-center px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-px bg-border flex-1" />
                              <Plane className="h-4 w-4 text-muted-foreground" />
                              <div className="h-px bg-border flex-1" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {segment.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {segment.carrierCode} {segment.number}
                            </p>
                            {segment.aircraft?.code && (
                              <p className="text-xs text-muted-foreground">{segment.aircraft.code}</p>
                            )}
                          </div>
                          
                          <div className="flex-1 text-right">
                            <div className="flex items-center justify-end gap-2 mb-1">
                              <span className="text-sm text-muted-foreground">
                                {new Date(segment.arrival?.at).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                              <span className="font-semibold">{segment.arrival?.iataCode}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(segment.arrival?.at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {/* Layover time between segments */}
                        {idx < cheapestFlight.itineraries[0].segments.length - 1 && (
                          <div className="my-2 py-2 border-t border-dashed flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Layover in {segment.arrival?.iataCode}: {
                                (() => {
                                  const nextSegment = cheapestFlight.itineraries[0].segments[idx + 1];
                                  const layoverMs = new Date(nextSegment.departure.at).getTime() - new Date(segment.arrival.at).getTime();
                                  const layoverHours = Math.floor(layoverMs / (1000 * 60 * 60));
                                  const layoverMinutes = Math.floor((layoverMs % (1000 * 60 * 60)) / (1000 * 60));
                                  return `${layoverHours}h ${layoverMinutes}m`;
                                })()
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Return Journey */}
                  {cheapestFlight.itineraries?.[1] && (
                    <div className="space-y-3 p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs">Return</Badge>
                        <span className="text-xs text-muted-foreground">
                          {cheapestFlight.itineraries[1].duration && 
                            `Total Duration: ${cheapestFlight.itineraries[1].duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}`
                          }
                        </span>
                      </div>
                      
                      {cheapestFlight.itineraries[1].segments?.map((segment: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{segment.departure?.iataCode}</span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(segment.departure?.at).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(segment.departure?.at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            
                            <div className="flex-1 text-center px-4">
                              <div className="flex items-center justify-center gap-2">
                                <div className="h-px bg-border flex-1" />
                                <Plane className="h-4 w-4 text-muted-foreground rotate-180" />
                                <div className="h-px bg-border flex-1" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {segment.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {segment.carrierCode} {segment.number}
                              </p>
                              {segment.aircraft?.code && (
                                <p className="text-xs text-muted-foreground">{segment.aircraft.code}</p>
                              )}
                            </div>
                            
                            <div className="flex-1 text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="text-sm text-muted-foreground">
                                  {new Date(segment.arrival?.at).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </span>
                                <span className="font-semibold">{segment.arrival?.iataCode}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(segment.arrival?.at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {/* Layover time between segments */}
                          {idx < cheapestFlight.itineraries[1].segments.length - 1 && (
                            <div className="my-2 py-2 border-t border-dashed flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Layover in {segment.arrival?.iataCode}: {
                                  (() => {
                                    const nextSegment = cheapestFlight.itineraries[1].segments[idx + 1];
                                    const layoverMs = new Date(nextSegment.departure.at).getTime() - new Date(segment.arrival.at).getTime();
                                    const layoverHours = Math.floor(layoverMs / (1000 * 60 * 60));
                                    const layoverMinutes = Math.floor((layoverMs % (1000 * 60 * 60)) / (1000 * 60));
                                    return `${layoverHours}h ${layoverMinutes}m`;
                                  })()
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Additional Flight Info */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {cheapestFlight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin && (
                      <Badge variant="outline" className="text-xs">
                        {cheapestFlight.travelerPricings[0].fareDetailsBySegment[0].cabin}
                      </Badge>
                    )}
                    {cheapestFlight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags && (
                      <Badge variant="outline" className="text-xs">
                        {cheapestFlight.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity || 0} checked bag(s)
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {cheapestFlight.itineraries?.[0]?.segments?.length === 1 ? 'Nonstop' : `${cheapestFlight.itineraries[0].segments.length - 1} stop(s)`}
                    </Badge>
                  </div>
                  
                  {flightCurrency !== currencyInfo.code && hasConversion && (
                    <p className="text-xs italic opacity-75 mt-2">Converted from {flightCurrency}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold">{currencySymbol}{converted.flight.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">for {travelers} {travelers === 1 ? 'traveler' : 'travelers'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hotel Info - Enhanced */}
        {cheapestHotel && (
          <div className="rounded-lg bg-muted/50 border border-border overflow-hidden">
            {/* Hotel Photo Carousel */}
            {(cheapestHotel?.photos?.length > 0 || (hotelDetails?.photos && hotelDetails.photos.length > 0)) && (
              <div className="relative">
                <Carousel className="w-full">
                  <CarouselContent>
                    {((cheapestHotel?.photos || []).concat(
                      (hotelDetails?.photos || []).map((p: any) => p.url_max || p)
                    ).filter((url: any) => !!url).slice(0, 12)).map((photoUrl: string, idx: number) => (
                      <CarouselItem key={idx}>
                        <div className="relative h-64 bg-gray-200">
                          <img 
                            src={photoUrl}
                            alt={`${cheapestHotel.hotel?.name || cheapestHotel?.name || 'Hotel'} - Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          loading="lazy"/>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
                <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                  {((cheapestHotel?.photos?.length || 0) + (hotelDetails?.photos?.length || 0))} photos
                </Badge>
              </div>
            )}
            
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Hotel className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-lg">{cheapestHotel.hotel?.name || cheapestHotel?.name || hotelDetails?.hotel_name || 'Hotel Accommodation'}</h4>
                  </div>
                  
                  {/* Location */}
                  {(cheapestHotel.hotel?.address?.lines?.[0] || cheapestHotel?.address || cheapestHotel?.city || hotelDetails?.address) && (
                    <div className="flex items-start gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{cheapestHotel.hotel?.address?.lines?.[0] || cheapestHotel?.address || `${cheapestHotel?.city || ''}` || hotelDetails?.address}</span>
                    </div>
                  )}
                  
                  {/* Star Rating & Reviews */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < (cheapestHotel?.rating || cheapestHotel.hotel?.rating || hotelDetails?.star_rating || 0)
                              ? 'fill-[#C7A962] text-[#C7A962]'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {(hotelDetails?.review_score || cheapestHotel?.num_reviews) && (
                      <div className="flex items-center gap-2">
                        {hotelDetails?.review_score && (
                          <Badge variant="secondary" className="text-xs">{hotelDetails.review_score}/10</Badge>
                        )}
                        {typeof cheapestHotel?.rating === 'number' && (
                          <Badge variant="secondary" className="text-xs">{cheapestHotel.rating.toFixed(1)}/5</Badge>
                        )}
                        {(hotelDetails?.review_nr || cheapestHotel?.num_reviews) && (
                          <span className="text-xs text-muted-foreground">
                            ({hotelDetails?.review_nr || cheapestHotel?.num_reviews} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Reviews Drawer Button */}
                  {((cheapestHotel?.reviews && cheapestHotel.reviews.length > 0) || (cheapestHotel?.property?.reviews && cheapestHotel.property.reviews.length > 0)) && (
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 mb-2">
                          <MessageSquare className="h-4 w-4" />
                          Read Reviews
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>{cheapestHotel.hotel?.name || cheapestHotel?.name} Reviews</DrawerTitle>
                          <DrawerDescription>
                            Guest reviews and ratings
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto space-y-4">
                          {(cheapestHotel?.reviews || cheapestHotel?.property?.reviews || []).map((review: any, idx: number) => (
                            <div key={idx} className="border-b pb-3 last:border-b-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{review.author || review.authorAttribution?.displayName || 'Guest'}</span>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < (review.rating || 0)
                                            ? 'fill-[#C7A962] text-[#C7A962]'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {(review.date || review.relativeTime) && (
                                  <span className="text-xs text-muted-foreground">
                                    {review.relativeTime || new Date(review.date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{review.text || review.comment || 'No review text'}</p>
                            </div>
                          ))}
                        </div>
                        <DrawerFooter>
                          <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  )}
                  
                  {/* Room Type */}
                  <p className="text-sm mb-2">
                    <span className="font-medium">{nights} nights</span>
                    {(cheapestHotel?.description || cheapestHotel?.offers?.[0]?.room?.description?.text) && (
                      <span className="text-muted-foreground"> • {cheapestHotel?.description || cheapestHotel?.offers?.[0]?.room?.description?.text}</span>
                    )}
                  </p>
                  
                  {/* Dates */}
                  <p className="text-xs text-muted-foreground">
                    Check-in: {formatDate(departureDate)} • Check-out: {formatDate(returnDate)}
                  </p>
                  
                  {/* Top Amenities */}
                  {( (hotelDetails?.facilities && hotelDetails.facilities.length > 0) || (Array.isArray(cheapestHotel?.amenities) && cheapestHotel.amenities.length > 0) ) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(hotelDetails?.facilities || cheapestHotel?.amenities || []).slice(0, 6).map((facility: any, idx: number) => {
                        const label = typeof facility === 'string' ? facility : String(facility?.name || facility);
                        const getIcon = (name: string) => {
                          const lower = name.toLowerCase();
                          if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="h-3 w-3" />;
                          if (lower.includes('parking')) return <ParkingCircle className="h-3 w-3" />;
                          if (lower.includes('breakfast') || lower.includes('restaurant')) return <Utensils className="h-3 w-3" />;
                          if (lower.includes('pool') || lower.includes('spa')) return <Wind className="h-3 w-3" />;
                          if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell className="h-3 w-3" />;
                          if (lower.includes('coffee') || lower.includes('bar')) return <Coffee className="h-3 w-3" />;
                          return null;
                        };
                        
                        return (
                          <Badge key={idx} variant="outline" className="text-xs gap-1">
                            {getIcon(label)}
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Guest Reviews Summary */}
                  {hotelDetails?.review_score_word && (
                    <div className="mt-2 p-2 bg-primary/5 rounded text-sm">
                      <p className="font-medium text-primary">{hotelDetails.review_score_word}</p>
                      {hotelDetails?.review_summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{hotelDetails.review_summary}</p>
                      )}
                    </div>
                  )}
                  
                  {hotelCurrency !== currencyInfo.code && hasConversion && (
                    <p className="text-xs italic opacity-75 mt-2">Converted from {hotelCurrency}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold">{currencySymbol}{converted.hotel.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
              </div>
            </div>
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
