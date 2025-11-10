import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Users, 
  Wifi, 
  Car, 
  Coffee,
  Utensils,
  Dumbbell,
  Wind,
  Shield,
  Clock,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { HotelImageGallery } from "@/components/HotelImageGallery";

const facilityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  restaurant: Utensils,
  gym: Dumbbell,
  'air conditioning': Wind,
  pool: Users,
  spa: Shield
};

export default function HotelDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [hotelData, setHotelData] = useState<any>(null);
  const [roomsData, setRoomsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // Get search params
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '2');
  const currency = searchParams.get('currency') || 'USD';
  const rooms = parseInt(searchParams.get('rooms') || '1');

  useEffect(() => {
    fetchHotelDetails();
    fetchRoomAvailability();
  }, [id]);

  const fetchHotelDetails = async () => {
    try {
      console.log('🔍 Fetching hotel details for:', id);
      
      const { data, error } = await supabase.functions.invoke('get-hotel-details', {
        body: {
          hotelId: id,
          arrival_date: checkIn,
          departure_date: checkOut,
          currency,
          guests
        }
      });

      if (error) throw error;

      console.log('✅ Hotel details received:', data);
      setHotelData(data.data);
    } catch (error) {
      console.error('❌ Error fetching hotel details:', error);
      toast.error('Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomAvailability = async () => {
    try {
      console.log('🛏️ Fetching room availability for:', id);
      
      const { data, error } = await supabase.functions.invoke('get-room-availability', {
        body: {
          hotelId: id,
          checkIn,
          checkOut,
          guests,
          rooms,
          currency
        }
      });

      if (error) throw error;

      console.log('✅ Room availability received:', data);
      setRoomsData(data);
    } catch (error) {
      console.error('❌ Error fetching room availability:', error);
    }
  };

  const handleBookRoom = (room?: any) => {
    const bookingUrl = roomsData?.bookingUrl || hotelData?.url || hotelData?.deeplink_url;
    
    if (bookingUrl) {
      console.log('🔗 Opening booking URL:', bookingUrl);
      window.open(bookingUrl, '_blank');
      
      // Log booking click event
      console.log('📊 Booking event:', {
        hotelId: id,
        hotelName: hotelData?.name,
        roomId: room?.roomId,
        roomName: room?.name,
        checkIn,
        checkOut,
        guests,
        price: room?.price?.total
      });
    } else {
      toast.error('Booking link not available');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Hotel not found</h2>
          <Button onClick={() => navigate('/')}>Back to Search</Button>
        </div>
      </div>
    );
  }

  const photos = hotelData.photos || [];
  const facilities = hotelData.facilities || [];
  const policies = hotelData.policies || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
          <div className="text-sm text-muted-foreground">
            {checkIn && checkOut && `${checkIn} - ${checkOut} · ${guests} guests`}
          </div>
        </div>
      </div>

      {/* Hero Section with Photos */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-4 gap-2 h-96 mb-6">
          {photos.length > 0 && (
            <>
              <div 
                className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-lg"
                onClick={() => setShowGallery(true)}
              >
                <img 
                  src={typeof photos[0] === 'string' ? photos[0] : photos[0]?.url_max1280 || photos[0]?.url}
                  alt={hotelData.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
              {photos.slice(1, 5).map((photo: any, idx: number) => (
                <div 
                  key={idx}
                  className="relative cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => setShowGallery(true)}
                >
                  <img 
                    src={typeof photo === 'string' ? photo : photo?.url_max300 || photo?.url}
                    alt={`${hotelData.name} ${idx + 2}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </>
          )}
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

        {/* Hotel Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold mb-2">{hotelData.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {hotelData.address}, {hotelData.city}
                </div>
                {hotelData.stars && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: hotelData.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                )}
                {hotelData.rating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{hotelData.rating}</span>
                    <span className="text-muted-foreground">({hotelData.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Details */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rooms">Rooms & Prices</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">About this property</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {hotelData.description || 'Property description not available.'}
              </p>
            </Card>

            {facilities.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Popular Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {facilities.slice(0, 9).map((facility: any, idx: number) => {
                    const facilityName = typeof facility === 'string' ? facility : facility.name;
                    const IconComponent = Object.entries(facilityIcons).find(([key]) => 
                      facilityName?.toLowerCase().includes(key)
                    )?.[1] || CheckCircle2;

                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span className="text-sm">{facilityName}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            {roomsData?.availabilityNotSupported || roomsData?.fallbackMode ? (
              <Card className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">View Rooms & Book</h3>
                <p className="text-muted-foreground mb-4">
                  Click below to view available rooms, rates, and complete your booking on Booking.com
                </p>
                <Button size="lg" onClick={() => handleBookRoom()}>
                  View Rooms & Book Now
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            ) : roomsData?.rooms?.length > 0 ? (
              roomsData.rooms.map((room: any) => (
                <Card key={room.roomId} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{room.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {room.facilities?.slice(0, 4).map((fac: string, idx: number) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                            {fac}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {room.price?.currency} {room.price?.total}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {room.price?.taxesIncluded ? 'Taxes included' : 'Taxes extra'}
                      </div>
                      <Button onClick={() => handleBookRoom(room)}>
                        Book Now
                      </Button>
                    </div>
                  </div>
                  {room.cancellationPolicy && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {room.refundable ? '✓ Free cancellation' : 'Non-refundable'}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground mb-4">Loading room availability...</p>
                <Button variant="outline" onClick={() => handleBookRoom()}>
                  View on Booking.com
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="amenities">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">All Amenities & Facilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {facilities.map((facility: any, idx: number) => {
                  const facilityName = typeof facility === 'string' ? facility : facility.name;
                  const IconComponent = Object.entries(facilityIcons).find(([key]) => 
                    facilityName?.toLowerCase().includes(key)
                  )?.[1] || CheckCircle2;

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-primary" />
                      <span className="text-sm">{facilityName}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Check-in / Check-out
                </h3>
                <div className="text-sm text-muted-foreground">
                  <p>Check-in: {policies.checkIn || 'Not specified'}</p>
                  <p>Check-out: {policies.checkOut || 'Not specified'}</p>
                </div>
              </div>

              {policies.cancellationPolicy && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Cancellation Policy</h3>
                  <p className="text-sm text-muted-foreground">{policies.cancellationPolicy}</p>
                </div>
              )}

              {policies.childrenPolicy && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Children & Extra Beds</h3>
                  <p className="text-sm text-muted-foreground">{policies.childrenPolicy}</p>
                </div>
              )}

              {policies.petsPolicy && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Pets</h3>
                  <p className="text-sm text-muted-foreground">{policies.petsPolicy}</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="location">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Location</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">{hotelData.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hotelData.address}<br />
                      {hotelData.city}, {hotelData.zip}<br />
                      {hotelData.country}
                    </p>
                  </div>
                </div>
                
                {hotelData.latitude && hotelData.longitude && (
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Map: {hotelData.latitude}, {hotelData.longitude}
                    </p>
                  </div>
                )}

                {hotelData.nearbyPOIs?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Nearby Points of Interest</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {hotelData.nearbyPOIs.map((poi: any, idx: number) => (
                        <li key={idx}>• {poi.name || poi} - {poi.distance}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sticky Booking Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                {checkIn && checkOut ? `${checkIn} - ${checkOut}` : 'Select dates to see prices'}
              </div>
            </div>
            <Button size="lg" onClick={() => handleBookRoom()}>
              View Rooms & Book
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showGallery && photos.length > 0 && (
        <HotelImageGallery
          images={photos.map((p: any) => typeof p === 'string' ? p : p?.url_max1280 || p?.url).filter(Boolean)}
          open={showGallery}
          onOpenChange={setShowGallery}
          hotelName={hotelData.name}
        />
      )}
    </div>
  );
}
