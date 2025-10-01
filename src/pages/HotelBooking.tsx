import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Check, MapPin, Wifi, Car, ParkingCircle, Utensils, Dumbbell, Wind, Coffee, Waves, Clock, Bed } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHotelImage, getRoomImage, getHotelImages } from "@/lib/imageHelpers";
import { decodeData } from "@/lib/utils";
import { BookingModal } from "@/components/BookingModal";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ReviewsSection } from "@/components/ReviewsSection";
import { ExploreArea } from "@/components/ExploreArea";
import { PriceCalendar } from "@/components/PriceCalendar";

export default function HotelBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // Parse booking data from URL params using safe base64 decoding
  const bookingDataParam = searchParams.get('data');
  const bookingData = bookingDataParam ? decodeData(bookingDataParam) : null;

  useEffect(() => {
    if (!bookingData) {
      toast({
        title: "No booking data",
        description: "Please select a hotel to continue",
        variant: "destructive",
      });
      navigate('/search');
    }
  }, [bookingData, navigate, toast]);

  if (!bookingData) {
    return null;
  }

  const hotelName = bookingData.hotel?.name || bookingData.hotelName || 'Hotel';
  const hotelAddress = bookingData.hotel?.address || bookingData.hotelAddress || 'Address';
  const rating = bookingData.hotel?.property?.reviewScore || bookingData.hotel?.rating || 8.5;
  const reviewCount = bookingData.hotel?.property?.reviewCount || 1043;
  const checkIn = bookingData.checkIn;
  const checkOut = bookingData.checkOut;
  const nights = bookingData.nights || 1;
  const guests = bookingData.guests || 2;

  // Generate comprehensive image gallery
  const galleryImages = getHotelImages(
    bookingData.hotel?.property?.photoUrls || [
      bookingData.hotel?.image,
      bookingData.hotelImage
    ].filter(Boolean),
    bookingData.hotel?.hotelId || hotelName,
    20 // Get 20 images for full gallery
  );

  const amenities = [
    { icon: Waves, label: "Outdoor pool" },
    { icon: Wifi, label: "Free WiFi" },
    { icon: ParkingCircle, label: "Free parking" },
    { icon: Dumbbell, label: "Fitness center" },
    { icon: Utensils, label: "Restaurant" },
    { icon: Coffee, label: "Breakfast available" },
    { icon: Wind, label: "Air conditioning" },
    { icon: Car, label: "Airport shuttle" },
  ];

  const getRatingText = (score: number) => {
    if (score >= 9) return "Wonderful";
    if (score >= 8.5) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    return "Pleasant";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSelectRoom = (room: any) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  // Generate available rooms
  const availableRooms = bookingData.offers?.map((offer: any, index: number) => ({
    id: offer.id || `room-${index}`,
    name: offer.roomInformation?.typeEstimated?.category || offer.room?.typeEstimated?.category || 'Standard Room',
    description: offer.roomInformation?.description || offer.room?.description?.text || 'Comfortable room with modern amenities',
    beds: offer.roomInformation?.typeEstimated?.beds || offer.room?.typeEstimated?.beds || 2,
    bedType: offer.roomInformation?.typeEstimated?.bedType || offer.room?.typeEstimated?.bedType || 'Queen',
    price: parseFloat(offer.price?.total || bookingData.totalPrice || 200),
    currency: offer.price?.currency || bookingData.currency || 'USD',
    image: getRoomImage(undefined, `room-${index}`),
    amenities: ['Free WiFi', 'Air conditioning', 'TV', 'Private bathroom'],
    cancellation: offer.policies?.refundable?.cancellationRefund === 'REFUNDABLE_UP_TO_DEADLINE' ? 'Free cancellation' : 'Non-refundable',
  })) || [
    {
      id: 'default-room',
      name: 'Standard Room',
      description: 'Comfortable room with modern amenities',
      beds: 2,
      bedType: 'Queen',
      price: bookingData.totalPrice || 200,
      currency: bookingData.currency || 'USD',
      image: getRoomImage(undefined, 'default-room'),
      amenities: ['Free WiFi', 'Air conditioning', 'TV', 'Private bathroom'],
      cancellation: 'Free cancellation',
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with search bar */}
      <div className="border-b sticky top-0 bg-background z-40">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            See all properties
          </Button>
          
          {/* Search modification bar */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{hotelAddress}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>{formatDate(checkIn)} - {formatDate(checkOut)}</span>
            </div>
            <div className="text-sm">
              <span>{guests} travelers, 1 room</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Photo Gallery */}
            <PhotoGallery images={galleryImages} hotelName={hotelName} />

            {/* Tabs Navigation */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="rooms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Rooms
                </TabsTrigger>
                <TabsTrigger value="amenities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Amenities
                </TabsTrigger>
                <TabsTrigger value="policies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Policies
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Reviews ({reviewCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Hotel Header */}
                <div>
                  <h1 className="text-3xl font-bold mb-2">{hotelName}</h1>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Fully refundable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Reserve now, pay later</span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <Card className="p-4 inline-block">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground px-3 py-2 rounded font-bold text-lg">
                      {rating.toFixed(1)}
                    </div>
                    <div>
                      <div className="font-semibold">{getRatingText(rating)}</div>
                      <button className="text-sm text-primary hover:underline">
                        See all {reviewCount.toLocaleString()} reviews
                      </button>
                    </div>
                  </div>
                </Card>

                {/* About */}
                <div>
                  <h2 className="text-2xl font-semibold mb-4">About this property</h2>
                  <p className="text-muted-foreground mb-4">
                    Experience luxury and comfort at {hotelName}. Located in the heart of the destination, 
                    this property offers world-class amenities and exceptional service to make your stay memorable.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities.slice(0, 6).map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <amenity.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="link" className="mt-4 px-0">
                    See all about this property →
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="rooms" className="space-y-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Choose your room</h2>
                  <div className="text-sm text-muted-foreground">
                    {availableRooms.length} room type{availableRooms.length > 1 ? 's' : ''} available
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {availableRooms.map((room) => (
                    <Card key={room.id} className="overflow-hidden group hover:shadow-lg transition-all">
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={room.image} 
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {room.cancellation.includes('Free') && (
                          <Badge className="absolute top-3 right-3 bg-green-600">
                            Free cancellation
                          </Badge>
                        )}
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {room.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Bed className="h-3 w-3" />
                            {room.beds} {room.bedType}
                          </Badge>
                          {room.amenities.slice(0, 2).map((amenity, idx) => (
                            <Badge key={idx} variant="secondary">{amenity}</Badge>
                          ))}
                        </div>

                        <div className="pt-4 border-t space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <div className="text-sm text-muted-foreground">
                                {nights} night{nights > 1 ? 's' : ''}
                              </div>
                              <div className="text-2xl font-bold">
                                {room.currency} {room.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                +taxes & fees
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleSelectRoom(room)}
                            className="w-full"
                            size="lg"
                          >
                            Reserve this room
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="amenities" className="space-y-6 mt-6">
                <h2 className="text-2xl font-semibold mb-4">Property amenities</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <amenity.icon className="h-6 w-6 text-primary" />
                      <span>{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="policies" className="space-y-6 mt-6">
                <h2 className="text-2xl font-semibold mb-4">Policies</h2>
                
                <Card className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Check-in</h3>
                      <p className="text-muted-foreground">4:00 PM - 12:00 AM</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Check-out</h3>
                      <p className="text-muted-foreground">11:00 AM</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Cancellation policy</h3>
                    <p className="text-muted-foreground text-sm">
                      Free cancellation before {checkIn ? formatDate(checkIn) : 'check-in date'}. 
                      Cancel before this date and get a full refund. Times are based on the property's local time.
                    </p>
                  </div>
                  
                  <Button variant="link" className="px-0">
                    See all policies →
                  </Button>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6 mt-6">
                <ReviewsSection 
                  hotelId={bookingData.hotel?.hotelId || hotelName}
                  hotelName={hotelName}
                  averageRating={rating}
                  totalReviews={reviewCount}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Booking Summary Card */}
            <Card className="p-6 sticky top-24">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Member Prices available</div>
                  <div className="text-3xl font-bold">
                    {bookingData.currency || 'USD'} {(bookingData.totalPrice || 200).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">per night</div>
                </div>

                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">{checkIn ? formatDate(checkIn) : 'Select date'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">{checkOut ? formatDate(checkOut) : 'Select date'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium">{guests} travelers, 1 room</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    if (availableRooms.length > 0) {
                      handleSelectRoom(availableRooms[0]);
                    }
                  }}
                >
                  Select a room
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You won't be charged yet
                </p>
              </div>
            </Card>

            {/* Price Calendar */}
            <PriceCalendar 
              basePrice={bookingData.totalPrice || 200}
              currency={bookingData.currency || 'USD'}
              checkIn={checkIn}
              checkOut={checkOut}
            />

            {/* Explore Area */}
            <ExploreArea 
              cityName={hotelAddress}
              latitude={bookingData.hotel?.latitude || bookingData.amadeusOffer?.hotel?.latitude}
              longitude={bookingData.hotel?.longitude || bookingData.amadeusOffer?.hotel?.longitude}
            />
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        bookingData={{
          ...bookingData,
          selectedRoom,
          hotelName,
          checkIn,
          checkOut,
          nights,
          guests,
        }}
        bookingType="hotel"
        totalPrice={selectedRoom?.price || bookingData.totalPrice || 200}
        currency={selectedRoom?.currency || bookingData.currency || 'USD'}
      />
    </div>
  );
}
