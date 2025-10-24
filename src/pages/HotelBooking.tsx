import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Check, MapPin, Wifi, Car, ParkingCircle, Utensils, Dumbbell, Wind, Coffee, Waves, Clock, Bed } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHotelImage, getRoomImage, getHotelImages } from "@/lib/imageHelpers";
import { getCurrencyFromLocation, getCurrencySymbol } from "@/lib/currencyHelpers";
import { decodeData } from "@/lib/utils";
import { BookingModal } from "@/components/BookingModal";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ReviewsSection } from "@/components/ReviewsSection";
import { ExploreArea } from "@/components/ExploreArea";


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
  const rating = Number(bookingData.hotel?.property?.reviewScore ?? bookingData.hotel?.rating ?? 8.5);
  const reviewCount = Number(bookingData.hotel?.property?.reviewCount ?? 1043);
  const checkIn = bookingData.checkIn;
  const checkOut = bookingData.checkOut;
  const nights = bookingData.nights || 1;
  const guests = bookingData.guests || 2;

// Generate comprehensive image gallery - use real photos from Google Places
  const hotelPhotos = bookingData.hotel?.property?.photoUrls || 
                      bookingData.property?.photoUrls || 
                      [];
  
  console.log('Hotel photos available:', hotelPhotos.length, hotelPhotos);
  
  const galleryImages = hotelPhotos.length > 0 
    ? hotelPhotos 
    : getHotelImages(
        [bookingData.hotel?.image, bookingData.hotelImage].filter(Boolean),
        bookingData.hotel?.hotelId || hotelName,
        20
      );

  // Currency symbol based on hotel location
  const currencyInfo = getCurrencyFromLocation(
    bookingData.hotel?.address?.cityName || bookingData.hotel?.address?.countryCode || bookingData.hotelAddress || ""
  );
  const currencySymbol = currencyInfo.symbol;

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
  const availableRooms = bookingData.offers?.map((offer: any, index: number) => {
    const displayPrice = parseFloat(offer.price?.total || bookingData.totalPrice || 200);
    const basePrice = parseFloat(offer.price?.base || bookingData.basePrice || displayPrice / 1.15);
    
    // Use hotel photos for room images if no specific room images
    const roomImage = offer.room?.images?.[0] || 
                      (galleryImages.length > index ? galleryImages[index] : galleryImages[0]) || 
                      '';
    
    return {
      id: offer.id || `room-${index}`,
      name: offer.roomInformation?.typeEstimated?.category || offer.room?.typeEstimated?.category || 'Standard Room',
      description: offer.roomInformation?.description || offer.room?.description?.text || 'Comfortable room with modern amenities',
      beds: offer.roomInformation?.typeEstimated?.beds || offer.room?.typeEstimated?.beds || 2,
      bedType: offer.roomInformation?.typeEstimated?.bedType || offer.room?.typeEstimated?.bedType || 'Queen',
      price: displayPrice, // Customer-facing price with markup
      basePrice: basePrice, // Original price for backend
      currency: offer.price?.currency || bookingData.currency || 'USD',
      image: roomImage,
      amenities: ['Free WiFi', 'Air conditioning', 'TV', 'Private bathroom'],
      cancellation: offer.policies?.refundable?.cancellationRefund === 'REFUNDABLE_UP_TO_DEADLINE' ? 'Free cancellation' : 'Non-refundable',
    };
  }) || [
    {
      id: 'default-room',
      name: 'Standard Room',
      description: 'Comfortable room with modern amenities',
      beds: 2,
      bedType: 'Queen',
      price: bookingData.totalPrice || 200,
      basePrice: bookingData.basePrice || (bookingData.totalPrice ? bookingData.totalPrice / 1.15 : 200 / 1.15),
      currency: bookingData.currency || 'USD',
      image: galleryImages[0] || '',
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
            Back to search results
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
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Hotel Header with Photo Gallery */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{hotelName}</h1>
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <div className="flex items-center gap-4 flex-wrap mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{hotelAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded font-bold text-sm">
                      {rating.toFixed(1)}
                    </div>
                    <span className="text-sm">{getRatingText(rating)}</span>
                    <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()} reviews)</span>
                  </div>
                </div>
              </div>
              
              <PhotoGallery images={galleryImages} hotelName={hotelName} />
            </div>

            {/* PRIORITY: Room Selection (Expedia/Hotels.com style) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Choose your room</h2>
                <div className="text-sm text-muted-foreground">
                  {availableRooms.length} room type{availableRooms.length > 1 ? 's' : ''} available
                </div>
              </div>
              
              <div className="space-y-4">
                {availableRooms.map((room) => (
                  <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <div className="grid md:grid-cols-[280px_1fr] gap-6 p-6">
                      {/* Room Image */}
                      <div className="aspect-[4/3] relative overflow-hidden rounded-lg bg-muted">
                        {room.image ? (
                          <img 
                            src={room.image}
                            alt={room.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails, show placeholder with icon
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                    <p class="text-xs mt-2">Photo unavailable</p>
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Bed className="h-12 w-12 mb-2" />
                            <p className="text-xs">No photo available</p>
                          </div>
                        )}
                        {room.cancellation.includes('Free') && (
                          <Badge className="absolute top-3 left-3 bg-green-600">
                            Free cancellation
                          </Badge>
                        )}
                      </div>

                      {/* Room Details */}
                      <div className="flex flex-col justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{room.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {room.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="gap-1">
                              <Bed className="h-3 w-3" />
                              {room.beds} {room.bedType}
                            </Badge>
                            {room.amenities.slice(0, 3).map((amenity, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{amenity}</Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium">{room.cancellation}</span>
                          </div>
                        </div>

                        {/* Price and Reserve Button */}
                        <div className="flex items-end justify-between pt-4 border-t mt-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">
                              {nights} night{nights > 1 ? 's' : ''} total
                            </div>
                            <div className="text-3xl font-bold text-primary">
                              {getCurrencySymbol(room.currency)}{(room.price * nights).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getCurrencySymbol(room.currency)}{room.price.toFixed(2)} per night
                            </div>
                            <div className="text-xs text-muted-foreground">
                              +taxes & fees
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleSelectRoom(room)}
                            size="lg"
                            className="min-w-[140px]"
                          >
                            Reserve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Secondary Info Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Overview
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
                <div>
                  <h2 className="text-2xl font-semibold mb-4">About this property</h2>
                  <p className="text-muted-foreground mb-4">
                    {bookingData.hotel?.description || bookingData.description || 
                    `Experience luxury and comfort at ${hotelName}. Located in the heart of the destination, 
                    this property offers world-class amenities and exceptional service to make your stay memorable.`}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    {amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <amenity.icon className="h-5 w-5 text-primary" />
                        <span className="text-sm">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
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
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Free cancellation before {checkIn ? formatDate(checkIn) : 'check-in date'}. 
                        Cancel before this date and get a full refund. Times are based on the property's local time.
                      </p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary"
                        onClick={() => window.open('/cancellation-refund-policy', '_blank')}
                      >
                        View full cancellation & refund policy →
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6 mt-6">
                <ReviewsSection 
                  hotelId={bookingData.hotel?.hotelId || hotelName}
                  hotelName={hotelName}
                  averageRating={rating}
                  totalReviews={reviewCount}
                  realReviews={bookingData.property?.reviews || bookingData.hotel?.property?.reviews}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Sidebar - Expedia/Hotels.com Style */}
          <div className="space-y-4">
            <Card className="p-6 sticky top-24">
              <div className="space-y-4">
                {/* Selected Room Display */}
                {selectedRoom ? (
                  <div className="space-y-3 pb-4 border-b">
                    <div className="text-sm font-medium text-muted-foreground">Selected Room</div>
                    <div className="font-semibold">{selectedRoom.name}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Bed className="h-3 w-3" />
                        {selectedRoom.beds} {selectedRoom.bedType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {selectedRoom.cancellation}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground pb-4 border-b">
                    Select a room below to see pricing
                  </div>
                )}

                {/* Trip Summary */}
                <div className="space-y-2 text-sm pb-4 border-b">
                  <div className="font-medium mb-2">Trip summary</div>
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
                    <span className="font-medium">{guests} travelers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rooms</span>
                    <span className="font-medium">1 room</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="font-medium">Price details</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {getCurrencySymbol(selectedRoom ? selectedRoom.currency : bookingData.currency || 'USD')}{selectedRoom ? selectedRoom.price.toFixed(2) : Number(bookingData.totalPrice || 200).toFixed(2)} x {nights} night{nights > 1 ? 's' : ''}
                      </span>
                      <span className="font-medium">
                        {getCurrencySymbol(selectedRoom ? selectedRoom.currency : bookingData.currency || 'USD')}{selectedRoom ? (selectedRoom.price * nights).toFixed(2) : (Number(bookingData.totalPrice || 200) * nights).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes & fees</span>
                      <span className="font-medium">
                        {getCurrencySymbol(selectedRoom ? selectedRoom.currency : bookingData.currency || 'USD')}{selectedRoom ? ((selectedRoom.price * nights) * 0.15).toFixed(2) : ((Number(bookingData.totalPrice || 200) * nights) * 0.15).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold">Total</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {getCurrencySymbol(selectedRoom ? selectedRoom.currency : bookingData.currency || 'USD')}{selectedRoom ? ((selectedRoom.price * nights) * 1.15).toFixed(2) : ((Number(bookingData.totalPrice || 200) * nights) * 1.15).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total includes taxes & fees
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    if (selectedRoom) {
                      setShowBookingModal(true);
                    } else if (availableRooms.length > 0) {
                      handleSelectRoom(availableRooms[0]);
                    }
                  }}
                  disabled={!selectedRoom}
                >
                  {selectedRoom ? 'Continue to Book' : 'Select a room to continue'}
                </Button>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-green-600" />
                    <span>You won't be charged yet</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-green-600" />
                    <span>Free cancellation before {checkIn ? formatDate(checkIn) : 'check-in'}</span>
                  </div>
                </div>
              </div>
            </Card>


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
