import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="sticky top-0 z-10 bg-[#FDF9F0]/95 backdrop-blur border-b border-[#E5DFC6]">
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
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center px-4">
        <div className="bg-white border border-[#E5DFC6] rounded-2xl p-10 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-[#C7A962] mx-auto mb-4" />
          <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Unable to load hotel</h2>
          <p className="text-sm text-[#6B7280] mb-6">{error || 'Hotel not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Back to search
          </button>
        </div>
      </div>
    );
  }

  const photos = hotelData.photos || [];
  const facilities = hotelData.facilities || [];
  const policies = hotelData.policies || {};
  const coordinates = hotelData.coordinates || {};

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24 text-[#0a2225]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FDF9F0]/95 backdrop-blur border-b border-[#E5DFC6]">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-[#0a2225] hover:text-[#0c4d47] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          {checkIn && checkOut && (
            <div className="text-sm text-[#6B7280]">
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
              <h1 className="font-secondary text-4xl text-[#0a2225] mb-2">{hotelData.name}</h1>
              <div className="flex items-center gap-4 text-sm text-[#6B7280] flex-wrap">
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
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#F5F0E0] border border-[#E5DFC6] rounded-full">
                    <Star className="h-4 w-4 fill-[#C7A962] text-[#C7A962]" />
                    <span className="font-medium text-[#0a2225]">{hotelData.reviewScore}/10</span>
                    {hotelData.reviewCount > 0 && (
                      <span className="text-[#7A7151]">({hotelData.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="w-full justify-start bg-transparent border-b border-[#E5DFC6] rounded-none p-0 h-auto">
            {[
              { v: 'overview', l: 'Overview' },
              { v: 'rooms', l: 'Rooms & Prices' },
              { v: 'amenities', l: 'Amenities' },
              { v: 'policies', l: 'Policies' },
              { v: 'location', l: 'Location' },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0c4d47] data-[state=active]:bg-transparent data-[state=active]:text-[#0a2225] data-[state=active]:shadow-none text-[#6B7280] px-4 py-3 text-sm"
              >
                {t.l}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
              <h3 className="font-secondary text-xl text-[#0a2225] mb-4">About</h3>
              <p className="text-[#5c5c52] whitespace-pre-line leading-relaxed">
                {hotelData.description || 'No description available.'}
              </p>
            </div>

            {facilities.length > 0 && (
              <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
                <h3 className="font-secondary text-xl text-[#0a2225] mb-4">Popular amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {facilities.slice(0, 9).map((facility: any, idx: number) => {
                    const IconComponent = facility.icon ? facilityIcons[facility.icon] : CheckCircle2;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-[#C7A962] flex-shrink-0" />
                        <span className="text-sm text-[#0a2225]">{facility.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4 mt-6">
            {!checkIn || !checkOut ? (
              <div className="bg-white border border-[#E5DFC6] rounded-2xl p-10 text-center">
                <AlertCircle className="h-10 w-10 text-[#C7A962] mx-auto mb-4" />
                <h3 className="font-secondary text-xl text-[#0a2225] mb-2">Select dates to see prices</h3>
                <p className="text-sm text-[#6B7280] mb-6 max-w-sm mx-auto">
                  Choose your check-in and check-out dates to view available rooms and pricing.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white px-6 py-2.5 text-sm font-medium transition-colors"
                >
                  Search with dates
                </button>
              </div>
            ) : loadingRooms ? (
              <div className="bg-white border border-[#E5DFC6] rounded-2xl p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#0c4d47] mr-3" />
                <span className="text-sm text-[#6B7280]">Loading room availability…</span>
              </div>
            ) : offers.length > 0 ? (
              offers.map((offer) => (
                <div key={offer.roomTypeId} className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="font-secondary text-xl text-[#0a2225] mb-2">{offer.name}</h3>
                      <p className="text-sm text-[#6B7280] mb-3">{offer.description}</p>
                      
                      {offer.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {offer.amenities.slice(0, 4).map((amenity, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-[#FDF9F0] border border-[#E5DFC6] px-2.5 py-0.5 text-[11px] text-[#0a2225]"
                            >
                              {amenity.label}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-1 text-sm">
                        {offer.mealPlan && (
                          <div className="flex items-center gap-2 text-[#0c4d47]">
                            <Coffee className="h-4 w-4" />
                            {offer.mealPlan}
                          </div>
                        )}
                        <div className={offer.refundable ? 'text-[#0c4d47]' : 'text-[#6B7280]'}>
                          {offer.refundable ? '✓ Free cancellation' : 'Non-refundable'}
                        </div>
                        {offer.cancellationPolicy && (
                          <p className="text-xs text-[#7A7151]">{offer.cancellationPolicy}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between min-w-[180px]">
                      <div className="text-right">
                        <div className="font-secondary text-2xl text-[#0a2225]">
                          {offer.total.displayText}
                        </div>
                        {offer.total.taxesAndFees > 0 && (
                          <div className="text-xs text-[#7A7151]">
                            +{offer.total.currency} {offer.total.taxesAndFees.toFixed(2)} taxes & fees
                          </div>
                        )}
                        {offer.remaining && offer.remaining < 5 && (
                          <div className="text-xs text-red-700 font-medium mt-1">
                            Only {offer.remaining} left!
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleBookRoom(offer)}
                        className="w-full mt-4 rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white py-2.5 text-sm font-medium transition-colors inline-flex items-center justify-center"
                      >
                        Request a Trip
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-[#E5DFC6] rounded-2xl p-10 text-center">
                <AlertCircle className="h-10 w-10 text-[#C7A962] mx-auto mb-4" />
                <h3 className="font-secondary text-xl text-[#0a2225] mb-2">No rooms available</h3>
                <p className="text-sm text-[#6B7280] mb-6 max-w-sm mx-auto">
                  No rooms are available for your selected dates. Try different dates or view on Booking.com.
                </p>
                <button
                  onClick={() => handleBookRoom()}
                  className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white px-6 py-2.5 text-sm font-medium transition-colors inline-flex items-center"
                >
                  View on Booking.com
                  <ExternalLink className="h-4 w-4 ml-2" />
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="amenities" className="mt-6">
            <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
              <h3 className="font-secondary text-xl text-[#0a2225] mb-4">All amenities</h3>
              {facilities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {facilities.map((facility: any, idx: number) => {
                    const IconComponent = facility.icon ? facilityIcons[facility.icon] : CheckCircle2;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-[#C7A962] flex-shrink-0" />
                        <span className="text-sm text-[#0a2225]">{facility.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#6B7280]">No amenities information available.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="policies" className="mt-6">
            <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="font-secondary text-lg text-[#0a2225] mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#C7A962]" />
                  Check-in / check-out
                </h3>
                <div className="text-sm text-[#6B7280] space-y-0.5">
                  <p>Check-in: {policies.checkInFrom || 'Not specified'}</p>
                  <p>Check-out: {policies.checkOutTo || 'Not specified'}</p>
                </div>
              </div>

              {policies.importantNotes && policies.importantNotes.length > 0 && (
                <div>
                  <h3 className="font-secondary text-lg text-[#0a2225] mb-2">Important information</h3>
                  <ul className="text-sm text-[#6B7280] space-y-1">
                    {policies.importantNotes.map((note: string, idx: number) => (
                      <li key={idx}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="location" className="mt-6">
            <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
              <h3 className="font-secondary text-xl text-[#0a2225] mb-4">Location</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 text-[#C7A962] flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[#0a2225]">{hotelData.name}</p>
                    <p className="text-sm text-[#6B7280]">
                      {hotelData.address}<br />
                      {hotelData.city}, {hotelData.zip}<br />
                      {hotelData.country}
                    </p>
                  </div>
                </div>
                
                {coordinates.lat && coordinates.lng && (
                  <div className="h-64 bg-[#FDF9F0] border border-[#E5DFC6] rounded-xl flex items-center justify-center">
                    <p className="text-sm text-[#7A7151]">
                      Coordinates: {coordinates.lat}, {coordinates.lng}
                    </p>
                  </div>
                )}

                {hotelData.nearbyPOIs && hotelData.nearbyPOIs.length > 0 && (
                  <div>
                    <h4 className="font-secondary text-base text-[#0a2225] mb-2">Nearby</h4>
                    <ul className="space-y-1 text-sm text-[#6B7280]">
                      {hotelData.nearbyPOIs.slice(0, 5).map((poi: any, idx: number) => (
                        <li key={idx}>• {poi.name || poi}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Booking Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FDF9F0]/95 backdrop-blur border-t border-[#E5DFC6] p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-[#6B7280]">
            {checkIn && checkOut ? (
              `${checkIn} - ${checkOut}`
            ) : (
              'Select dates to see prices'
            )}
          </div>
          <button
            onClick={() => handleBookRoom()}
            className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white px-6 py-3 text-sm font-medium transition-colors inline-flex items-center"
          >
            Request a Trip
            <ExternalLink className="h-4 w-4 ml-2" />
          </button>
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
