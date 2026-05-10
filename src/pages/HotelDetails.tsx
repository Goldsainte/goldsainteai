import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee,
  Utensils,
  Dumbbell,
  Wind,
  Users,
  Shield,
  Clock,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2
} from "lucide-react";
import { HotelImageGallery } from "@/components/HotelImageGallery";

const facilityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  restaurant: Utensils,
  gym: Dumbbell,
  'air-conditioning': Wind,
  pool: Users,
  spa: Shield
};

interface Offer {
  roomTypeId: string;
  name: string;
  description: string;
  photos: { url: string }[];
  amenities: { label: string }[];
  mealPlan?: string;
  refundable: boolean;
  cancellationPolicy: string;
  total: {
    currency: string;
    amount: number;
    taxesAndFees: number;
    displayText: string;
  };
  remaining?: number;
}

export default function HotelDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [hotelData, setHotelData] = useState<any>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookingUrl, setBookingUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get search params
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '2');
  const currency = searchParams.get('currency') || 'USD';
  const rooms = parseInt(searchParams.get('rooms') || '1');

  useEffect(() => {
    if (id) {
      fetchHotelDetails();
      if (checkIn && checkOut) {
        fetchRoomAvailability();
      }
    }
  }, [id, checkIn, checkOut]);

  const fetchHotelDetails = async () => {
    try {
      
      const { data, error } = await supabase.functions.invoke('get-hotel-details', {
        body: {
          hotelId: id,
          arrival_date: checkIn,
          departure_date: checkOut,
          currency,
          guests,
          locale: 'en-us'
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error?.message || 'Failed to load hotel');

      setHotelData(data.data);
      setError(null);
    } catch (error) {
      console.error('❌ [HotelDetails] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load hotel details');
      toast.error('Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomAvailability = async () => {
    if (!checkIn || !checkOut) {
      setLoadingRooms(false);
      return;
    }

    try {
      
      const { data, error } = await supabase.functions.invoke('get-room-availability', {
        body: {
          hotelId: id,
          checkIn,
          checkOut,
          guests,
          rooms,
          currency,
          locale: 'en-us'
        }
      });

      if (error) throw error;

      
      if (data.availabilityNotSupported || data.fallbackMode) {
        setBookingUrl(data.bookingUrl);
      } else if (data.offers) {
        setOffers(data.offers);
        setBookingUrl(data.bookingUrl);
      }
    } catch (error) {
      console.error('❌ [HotelDetails] Availability error:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleBookRoom = (offer?: Offer) => {
    const url = bookingUrl || hotelData?.bookingUrl;
    
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Booking link not available');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !hotelData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Hotel</h2>
          <p className="text-muted-foreground mb-4">{error || 'Hotel not found'}</p>
          <Button onClick={() => navigate('/')}>Back to Search</Button>
        </Card>
      </div>
    );
  }

  const photos = hotelData.photos || [];
  const facilities = hotelData.facilities || [];
  const policies = hotelData.policies || {};
  const coordinates = hotelData.coordinates || {};

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {checkIn && checkOut && (
            <div className="text-sm text-muted-foreground">
              {checkIn} - {checkOut} · {guests} guest{guests > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Hero Photos */}
      <div className="max-w-7xl mx-auto p-4">
        {photos.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 h-96 mb-6 relative">
            <div 
              className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-lg group"
              onClick={() => setShowGallery(true)}
            >
              <img 
                src={photos[0].url}
                alt={hotelData.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"/>
            </div>
            {photos.slice(1, 5).map((photo: any, idx: number) => (
              <div 
                key={idx}
                className="relative cursor-pointer overflow-hidden rounded-lg group"
                onClick={() => setShowGallery(true)}
              >
                <img 
                  src={photo.url}
                  alt={`${hotelData.name} ${idx + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"/>
              </div>
            ))}
            {photos.length > 5 && (
              <Button 
                variant="secondary" 
                className="absolute bottom-4 right-4"
                onClick={() => setShowGallery(true)}
              >
                View All {photos.length} Photos
              </Button>
            )}
          </div>
        ) : (
          <div className="h-96 bg-muted rounded-lg flex items-center justify-center mb-6">
            <p className="text-muted-foreground">No photos available</p>
          </div>
        )}

        {/* Hotel Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold mb-2">{hotelData.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {hotelData.address}, {hotelData.city}
                </div>
                {hotelData.starRating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: hotelData.starRating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#C7A962] text-[#C7A962]" />
                    ))}
                  </div>
                )}
                {hotelData.reviewScore && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{hotelData.reviewScore}/10</span>
                    {hotelData.reviewCount > 0 && (
                      <span className="text-muted-foreground">({hotelData.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rooms">Rooms & Prices</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">About</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {hotelData.description || 'No description available.'}
              </p>
            </Card>

            {facilities.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Popular Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {facilities.slice(0, 9).map((facility: any, idx: number) => {
                    const IconComponent = facility.icon ? facilityIcons[facility.icon] : CheckCircle2;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{facility.label}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4 mt-6">
            {!checkIn || !checkOut ? (
              <Card className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select Dates to See Prices</h3>
                <p className="text-muted-foreground mb-4">
                  Choose your check-in and check-out dates to view available rooms and pricing.
                </p>
                <Button onClick={() => navigate('/')}>Search with Dates</Button>
              </Card>
            ) : loadingRooms ? (
              <Card className="p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span>Loading room availability...</span>
              </Card>
            ) : offers.length > 0 ? (
              offers.map((offer) => (
                <Card key={offer.roomTypeId} className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{offer.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{offer.description}</p>
                      
                      {offer.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {offer.amenities.slice(0, 4).map((amenity, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {amenity.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-1 text-sm">
                        {offer.mealPlan && (
                          <div className="flex items-center gap-2 text-primary">
                            <Coffee className="h-4 w-4" />
                            {offer.mealPlan}
                          </div>
                        )}
                        <div className={offer.refundable ? 'text-green-600' : 'text-muted-foreground'}>
                          {offer.refundable ? '✓ Free cancellation' : 'Non-refundable'}
                        </div>
                        {offer.cancellationPolicy && (
                          <p className="text-xs text-muted-foreground">{offer.cancellationPolicy}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between min-w-[180px]">
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {offer.total.displayText}
                        </div>
                        {offer.total.taxesAndFees > 0 && (
                          <div className="text-xs text-muted-foreground">
                            +{offer.total.currency} {offer.total.taxesAndFees.toFixed(2)} taxes & fees
                          </div>
                        )}
                        {offer.remaining && offer.remaining < 5 && (
                          <div className="text-xs text-destructive font-medium mt-1">
                            Only {offer.remaining} left!
                          </div>
                        )}
                      </div>
                      <Button onClick={() => handleBookRoom(offer)} className="w-full mt-4">
                        Book Now
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Rooms Available</h3>
                <p className="text-muted-foreground mb-4">
                  No rooms are available for your selected dates. Try different dates or view on Booking.com.
                </p>
                <Button onClick={() => handleBookRoom()}>
                  View on Booking.com
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="amenities" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">All Amenities</h3>
              {facilities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {facilities.map((facility: any, idx: number) => {
                    const IconComponent = facility.icon ? facilityIcons[facility.icon] : CheckCircle2;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{facility.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No amenities information available.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="mt-6">
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Check-in / Check-out
                </h3>
                <div className="text-sm text-muted-foreground">
                  <p>Check-in: {policies.checkInFrom || 'Not specified'}</p>
                  <p>Check-out: {policies.checkOutTo || 'Not specified'}</p>
                </div>
              </div>

              {policies.importantNotes && policies.importantNotes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Important Information</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {policies.importantNotes.map((note: string, idx: number) => (
                      <li key={idx}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="location" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Location</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">{hotelData.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hotelData.address}<br />
                      {hotelData.city}, {hotelData.zip}<br />
                      {hotelData.country}
                    </p>
                  </div>
                </div>
                
                {coordinates.lat && coordinates.lng && (
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Coordinates: {coordinates.lat}, {coordinates.lng}
                    </p>
                  </div>
                )}

                {hotelData.nearbyPOIs && hotelData.nearbyPOIs.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Nearby</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {hotelData.nearbyPOIs.slice(0, 5).map((poi: any, idx: number) => (
                        <li key={idx}>• {poi.name || poi}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Booking Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {checkIn && checkOut ? (
              `${checkIn} - ${checkOut}`
            ) : (
              'Select dates to see prices'
            )}
          </div>
          <Button size="lg" onClick={() => handleBookRoom()}>
            View Rooms & Book
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {showGallery && photos.length > 0 && (
        <HotelImageGallery
          images={photos.map((p: any) => p.url).filter(Boolean)}
          open={showGallery}
          onOpenChange={setShowGallery}
          hotelName={hotelData.name}
        />
      )}
    </div>
  );
}
