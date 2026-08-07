import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, MapPin, Wifi, Utensils, Dumbbell, ParkingCircle, Bed, Users, Check, ArrowUpDown, Clock, CreditCard, Calendar, Shield, Baby, Accessibility, Wind, Coffee, Tv, Bath, Phone, Ruler, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { LazyHotelMap } from "./LazyHotelMap";
import { getHotelImages, getRoomImages } from "@/lib/imageHelpers";
import { getCurrencyFromLocation } from "@/lib/currencyHelpers";
import { BookingPolicyBanner } from "./BookingPolicyBanner";

interface RoomOption {
  id: string;
  name: string;
  bedType: string;
  maxGuests: number;
  size: string;
  price: number;
  amenities: string[];
  images: string[];
}

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  photos?: string[];
}

interface HotelDetailsModalProps {
  open: boolean;
  onClose: () => void;
  hotel: any;
  onSelectRoom: (room: RoomOption) => void;
}

export const HotelDetailsModal = ({
  open, onClose, hotel, onSelectRoom }: HotelDetailsModalProps) => {
  const { t } = useTranslation();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  
  const hotelData = hotel.hotel || hotel;
  const propertyData = hotelData.property || hotel.property;
  
  const hotelName = propertyData?.name || hotelData.name || "Hotel";
  const hotelRating = Number(propertyData?.reviewScore ?? hotelData.rating ?? 8.5);
  const hotelAddress = propertyData?.address || hotelData.address?.lines?.[0] || hotelData.address || "Location";
  const reviewCount = Number(propertyData?.reviewCount ?? 0);
  const hotelId = propertyData?.id || hotelData.hotel_id || 0;

  // Currency based on hotel city or country
  const hotelCityOrCountry = hotelData.address?.cityName || hotelData.address?.countryCode || "United States";
  const currencyInfo = getCurrencyFromLocation(hotelCityOrCountry);
  const currencySymbol = currencyInfo.symbol;
  const currencyCode = currencyInfo.code;

  // Extract coordinates from all possible locations
  const hotelLatitude = propertyData?.latitude || hotelData.latitude || hotel.latitude;
  const hotelLongitude = propertyData?.longitude || hotelData.longitude || hotel.longitude;

  // Get actual hotel photos from multiple possible fields and dedupe by base image id (prefer highest resolution)
  const hotelPhotos = useMemo(() => {
    const urls: string[] = [
      ...(propertyData?.photoUrls || []),
      ...(hotelData?.media?.map((m: any) => m?.uri).filter(Boolean) || []),
      ...((hotel?.photos as string[]) || []),
      ...((hotel?.images as string[]) || []),
    ].filter(Boolean).filter(u => typeof u === 'string') as string[];

    // Group by image id in URL (e.g., .../square500/581512145.jpg -> id 581512145)
    const byId = new Map<string, { url: string; size: number }>();
    for (const u of urls) {
      const idMatch = u.match(/\/(\d+)\.jpg/);
      const id = idMatch?.[1] || u; // fallback to full URL if no id
      const sizeMatch = u.match(/square(\d+)/);
      const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;
      const existing = byId.get(id);
      if (!existing || size > existing.size) {
        byId.set(id, { url: u, size });
      }
    }

    const uniqueUrls = Array.from(byId.values()).map(v => v.url);
    
    // Use image helper to add fallbacks if needed
    return getHotelImages(uniqueUrls, hotelId?.toString(), 60);
  }, [propertyData, hotelData, hotel, hotelId]);

  // Get room photos - use helper with fallbacks
  const getRoomPhotos = (roomIndex: number) => {
    const photosPerRoom = Math.max(1, Math.floor(hotelPhotos.length / 3));
    const startIdx = roomIndex * photosPerRoom;
    const roomPhotos = hotelPhotos.slice(startIdx, startIdx + 3);
    return getRoomImages(roomPhotos, `room-${roomIndex}`, 3);
  };

  // STRICT RULE: Only use real reviews from API, never generate fallback content
  const allReviews = useMemo(() => {
    // Use reviews from property.reviews if available (real Google Places reviews)
    if (propertyData?.reviews && propertyData.reviews.length > 0) {
      return propertyData.reviews.map((review: any, i: number) => ({
        id: review.id || `review-${i}`,
        author: review.author || 'Guest',
        rating: Number(review.rating || 0),
        date: review.date || new Date().toISOString(),
        comment: review.text || '',
        photos: []
      }));
    }
    // If no real reviews available, return empty array
    return [];
  }, [propertyData]);

  // Sort reviews based on selected filter
  const sortedReviews = useMemo(() => {
    const reviews = [...allReviews];
    const getDays = (str: string) => {
      const match = str.match(/(\d+)/);
      if (!match) return 0;
      const num = parseInt(match[1]);
      if (str.includes("day")) return num;
      if (str.includes("week")) return num * 7;
      if (str.includes("month")) return num * 30;
      return num;
    };

    switch (reviewSort) {
      case "newest":
        return reviews.sort((a, b) => getDays(a.date) - getDays(b.date));
      case "oldest":
        return reviews.sort((a, b) => getDays(b.date) - getDays(a.date));
      case "highest":
        return reviews.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return reviews.sort((a, b) => a.rating - b.rating);
      default:
        return reviews;
    }
  }, [allReviews, reviewSort]);

  const getRatingText = (score: number) => {
    if (score >= 9) return "Exceptional";
    if (score >= 8.5) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    return "Pleasant";
  };

  // Room options
  const roomOptions: RoomOption[] = [
    {
      id: "deluxe-king",
      name: "Deluxe King Suite",
      bedType: "1 King Bed",
      maxGuests: 2,
      size: "450 sq ft",
      price: 299,
      amenities: ["City View", "Mini Bar", "Bathtub", "Work Desk", "Coffee Maker"],
      images: getRoomPhotos(0)
    },
    {
      id: "superior-double",
      name: "Superior Double Room",
      bedType: "2 Double Beds",
      maxGuests: 4,
      size: "380 sq ft",
      price: 259,
      amenities: ["Garden View", "Mini Fridge", "Shower", "Seating Area"],
      images: getRoomPhotos(1)
    },
    {
      id: "executive-suite",
      name: "Executive Suite",
      bedType: "1 King Bed + Sofa Bed",
      maxGuests: 3,
      size: "650 sq ft",
      price: 399,
      amenities: ["Panoramic View", "Separate Living Room", "Jacuzzi", "Premium Toiletries", "Nespresso Machine"],
      images: getRoomPhotos(2)
    }
  ];

  // Photos tab: prefer dedicated guest photos if available; otherwise use property photos
  const customerPhotos = (propertyData?.guestPhotoUrls && propertyData.guestPhotoUrls.length > 0)
    ? propertyData.guestPhotoUrls
    : hotelPhotos.slice(0, 60);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-5xl sm:w-auto max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-secondary">{hotelName}</DialogTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold">{hotelRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewCount > 0 ? reviewCount.toLocaleString() : allReviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{hotelAddress}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <BookingPolicyBanner bookingType="hotel" />

        <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 overflow-x-auto scrollbar-hide">
          <TabsTrigger value="overview" className="whitespace-nowrap">{t("hdm.overview", "Overview")}</TabsTrigger>
          <TabsTrigger value="rooms" className="whitespace-nowrap">{t("hdm.rooms", "Rooms")}</TabsTrigger>
          <TabsTrigger value="amenities" className="whitespace-nowrap">{t("hdm.amenities", "Amenities")}</TabsTrigger>
          <TabsTrigger value="location" className="whitespace-nowrap">{t("hdm.location", "Location")}</TabsTrigger>
          <TabsTrigger value="reviews" className="whitespace-nowrap">Reviews ({allReviews.length})</TabsTrigger>
          <TabsTrigger value="photos" className="whitespace-nowrap">{t("hdm.photos", "Photos")}</TabsTrigger>
        </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Hotel Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("hdm.about_this_hotel", "About This Hotel")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                Experience luxury and comfort at {hotelName}. Our property offers world-class amenities, 
                exceptional service, and perfectly appointed rooms designed for the modern traveler. 
                Whether you're visiting for business or leisure, you'll find everything you need for a 
                memorable stay. Located in the heart of {hotelAddress}, our hotel provides easy access 
                to the city's top attractions, dining, and entertainment venues.
              </p>
            </div>

            <Separator />

            {/* Quick Facts */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("hdm.quick_facts", "Quick Facts")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{t("hdm.check_in_check_out", "Check-in / Check-out")}</div>
                    <div className="text-sm text-muted-foreground">3:00 PM / 11:00 AM</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Bed className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{t("hdm.room_types", "Room Types")}</div>
                    <div className="text-sm text-muted-foreground">{roomOptions.length} options available</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{t("hdm.payment_options", "Payment Options")}</div>
                    <div className="text-sm text-muted-foreground">{t("hdm.visa_mastercard_amex_accepted", "Visa, Mastercard, Amex accepted")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{t("hdm.cancellation", "Cancellation")}</div>
                    <div className="text-sm text-muted-foreground">{t("hdm.free_cancellation_up_to_24h_before", "Free cancellation up to 24h before")}</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Popular Amenities */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("hdm.popular_amenities", "Popular Amenities")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Wifi className="h-4 w-4 text-primary" />
                  <span>{t("hdm.free_wifi", "Free WiFi")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Utensils className="h-4 w-4 text-primary" />
                  <span>{t("hdm.restaurant", "Restaurant")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <span>{t("hdm.fitness_center", "Fitness Center")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ParkingCircle className="h-4 w-4 text-primary" />
                  <span>{t("hdm.free_parking", "Free Parking")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Coffee className="h-4 w-4 text-primary" />
                  <span>{t("hdm.breakfast_available", "Breakfast Available")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wind className="h-4 w-4 text-primary" />
                  <span>{t("hdm.air_conditioning", "Air Conditioning")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="h-4 w-4 text-primary" />
                  <span>{t("hdm.spa_services", "Spa Services")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>24/7 Front Desk</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Policies */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("hdm.hotel_policies", "Hotel Policies")}</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="checkin">
                  <AccordionTrigger>{t("hdm.check_in_check_out2", "Check-in & Check-out")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>{t("hdm.check_in", "Check-in:")}</strong> 3:00 PM onwards</div>
                      <div><strong>{t("hdm.check_out", "Check-out:")}</strong> 11:00 AM</div>
                      <div><strong>{t("hdm.early_check_in", "Early Check-in:")}</strong> Subject to availability, may incur additional charges</div>
                      <div><strong>{t("hdm.late_check_out", "Late Check-out:")}</strong> Available upon request, additional fees may apply</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="cancellation">
                  <AccordionTrigger>{t("hdm.cancellation_policy", "Cancellation Policy")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div>{t("hdm.free_cancellation_up_to_24_hours_before_", "Free cancellation up to 24 hours before check-in")}</div>
                      <div>{t("hdm.cancellations_within_24_hours_will_be_ch", "Cancellations within 24 hours will be charged one night's stay")}</div>
                      <div>{t("hdm.no_shows_will_be_charged_the_full_amount", "No-shows will be charged the full amount of the reservation")}</div>
                      <div>{t("hdm.non_refundable_rates_are_not_eligible_fo", "Non-refundable rates are not eligible for cancellation")}</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="payment">
                  <AccordionTrigger>{t("hdm.payment_deposits", "Payment & Deposits")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>{t("hdm.accepted", "Accepted:")}</strong> Visa, Mastercard, American Express, Discover</div>
                      <div><strong>{t("hdm.deposit", "Deposit:")}</strong> Credit card hold of {currencySymbol}100 per night required at check-in</div>
                      <div><strong>{t("hdm.incidentals", "Incidentals:")}</strong> Additional charges for room service, minibar, etc.</div>
                      <div><strong>{t("hdm.currency", "Currency:")}</strong> {currencyCode} accepted, other currencies subject to conversion fees</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="pets">
                  <AccordionTrigger>{t("hdm.pets_children", "Pets & Children")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>{t("hdm.pets", "Pets:")}</strong> Small pets allowed with {currencySymbol}50/night fee (max 2 pets, 25 lbs each)</div>
                      <div><strong>{t("hdm.children", "Children:")}</strong> Children of all ages welcome</div>
                      <div><strong>{t("hdm.cribs", "Cribs:")}</strong> Available upon request, complimentary</div>
                      <div><strong>{t("hdm.extra_beds", "Extra Beds:")}</strong> {currencySymbol}30 per night for guests over 12 years old</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4 mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{t("hdm.choose_your_room", "Choose Your Room")}</h3>
              <p className="text-sm text-muted-foreground">{t("hdm.all_rooms_include_complimentary_wifi_dai", "All rooms include complimentary WiFi, daily housekeeping, and access to hotel amenities")}</p>
            </div>

            {roomOptions.map((room) => (
              <div 
                key={room.id}
                className={`border rounded-lg p-4 hover:border-primary transition-colors ${
                  selectedRoomId === room.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex gap-4 min-w-0">
                  <div className="w-32 sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={room.images[0] || hotelPhotos[0]}
                      alt={`${room.name} - room photo`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            {room.bedType}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Up to {room.maxGuests} guests
                          </div>
                          <div className="flex items-center gap-1">
                            <Ruler className="h-4 w-4" />
                            {room.size}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {currencySymbol}{room.price}
                        </div>
                        <div className="text-xs text-muted-foreground">per night</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">{t("hdm.room_amenities", "Room Amenities:")}</div>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary" />
                          <span>{t("hdm.free_cancellation_up_to_24_hours_before_", "Free cancellation up to 24 hours before check-in")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary" />
                          <span>{t("hdm.no_prepayment_needed_pay_at_the_property", "No prepayment needed - pay at the property")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant={selectedRoomId === room.id ? "default" : "outline"}
                        onClick={() => setSelectedRoomId(room.id)}
                        className="flex-1"
                      >
                        {selectedRoomId === room.id ? "Selected" : "Select Room"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {selectedRoomId && (
              <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>{t("hdm.cancel", "Cancel")}</Button>
                <Button onClick={() => {
                  const room = roomOptions.find(r => r.id === selectedRoomId);
                  if (room) onSelectRoom(room);
                }}>
                  Continue to Booking
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="amenities" className="space-y-6 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("hdm.all_amenities", "All Amenities")}</h3>
              
              <div className="space-y-6">
                {/* Room Features */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    Room Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.air_conditioning", "Air Conditioning")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.flat_screen_tv", "Flat-screen TV")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.mini_refrigerator", "Mini Refrigerator")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.safe_deposit_box", "Safe Deposit Box")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.coffee_tea_maker", "Coffee/Tea Maker")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.iron_ironing_board", "Iron & Ironing Board")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.work_desk", "Work Desk")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.blackout_curtains", "Blackout Curtains")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Bathroom */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bath className="h-5 w-5 text-primary" />
                    Bathroom
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.private_bathroom", "Private Bathroom")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.bathtub_or_shower", "Bathtub or Shower")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.hairdryer", "Hairdryer")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.free_toiletries", "Free Toiletries")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.bathrobes_slippers", "Bathrobes & Slippers")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.hot_water", "Hot Water")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Services & Facilities */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Services & Facilities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>24-hour Front Desk</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.concierge_service", "Concierge Service")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.room_service", "Room Service")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.laundry_service", "Laundry Service")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.luggage_storage", "Luggage Storage")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.express_check_in_out", "Express Check-in/out")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.currency_exchange", "Currency Exchange")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.tour_desk", "Tour Desk")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dining & Entertainment */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    Dining & Entertainment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.on_site_restaurant", "On-site Restaurant")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.bar_lounge", "Bar/Lounge")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.breakfast_available", "Breakfast Available")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.room_service", "Room Service")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.coffee_shop", "Coffee Shop")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.vending_machines", "Vending Machines")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Recreation */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    Recreation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.fitness_center", "Fitness Center")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.swimming_pool", "Swimming Pool")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.spa_wellness_center", "Spa & Wellness Center")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.sauna", "Sauna")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.hot_tub", "Hot Tub")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.massage_services", "Massage Services")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Connectivity */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-primary" />
                    Connectivity
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.free_wifi_all_areas", "Free WiFi (all areas)")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.business_center", "Business Center")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.meeting_rooms", "Meeting Rooms")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.fax_photocopying", "Fax/Photocopying")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Parking & Transportation */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ParkingCircle className="h-5 w-5 text-primary" />
                    Parking & Transportation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.free_on_site_parking", "Free On-site Parking")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.valet_parking", "Valet Parking")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.electric_vehicle_charging", "Electric Vehicle Charging")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.airport_shuttle_surcharge", "Airport Shuttle (surcharge)")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Accessibility */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Accessibility className="h-5 w-5 text-primary" />
                    Accessibility
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.wheelchair_accessible", "Wheelchair Accessible")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.elevator", "Elevator")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.accessible_parking", "Accessible Parking")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.lowered_sinks", "Lowered Sinks")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Family Friendly */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Baby className="h-5 w-5 text-primary" />
                    Family Friendly
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pl-7">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.cribs_available", "Cribs Available")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.children_s_menu", "Children's Menu")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.babysitting_service", "Babysitting Service")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{t("hdm.family_rooms", "Family Rooms")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-6 mt-4">
            {/* Map */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("hdm.location_map", "Location & Map")}</h3>
              <LazyHotelMap
                latitude={hotelLatitude}
                longitude={hotelLongitude}
                hotelName={hotelName}
                landmarks={hotelLatitude && hotelLongitude ? [
                  { name: "City Center", lat: hotelLatitude + 0.01, lng: hotelLongitude + 0.01, distance: "0.5 mi" },
                  { name: "Main Station", lat: hotelLatitude - 0.015, lng: hotelLongitude + 0.02, distance: "0.8 mi" },
                  { name: "Museum District", lat: hotelLatitude + 0.02, lng: hotelLongitude - 0.01, distance: "1.2 mi" },
                ] : []}
              />
              <p className="text-sm text-muted-foreground mt-2">{hotelAddress}</p>
            </div>

            <Separator />

            {/* Nearby Attractions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("hdm.nearby_landmarks_attractions", "Nearby Landmarks & Attractions")}</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{t("hdm.city_center", "City Center")}</div>
                    <div className="text-sm text-muted-foreground">0.5 miles • 10 min walk</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{t("hdm.main_train_station", "Main Train Station")}</div>
                    <div className="text-sm text-muted-foreground">0.8 miles • 5 min drive</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{t("hdm.museum_district", "Museum District")}</div>
                    <div className="text-sm text-muted-foreground">1.2 miles • 15 min walk</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{t("hdm.shopping_district", "Shopping District")}</div>
                    <div className="text-sm text-muted-foreground">1.5 miles • 10 min drive</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{t("hdm.international_airport", "International Airport")}</div>
                    <div className="text-sm text-muted-foreground">12 miles • 25 min drive</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Neighborhood Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("hdm.about_the_neighborhood", "About the Neighborhood")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Located in the vibrant heart of the city, this hotel offers unparalleled access to the area's 
                best attractions, restaurants, and entertainment venues. The neighborhood is known for its 
                charming streets, rich cultural heritage, and diverse dining scene. Within walking distance, 
                you'll find trendy cafes, boutique shops, and world-class museums.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Public transportation is readily available, with the nearest metro station just a 5-minute walk away. 
                The area is safe and well-lit, making it perfect for evening strolls. Local markets, parks, and 
                historic landmarks are all easily accessible, ensuring you'll never run out of things to explore.
              </p>
            </div>

            <Separator />

            {/* Getting Around */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("hdm.getting_around", "Getting Around")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <div className="font-medium mb-2">{t("hdm.public_transportation", "Public Transportation")}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{t("hdm.metro_station_0_3_mi", "Metro Station - 0.3 mi")}</div>
                    <div>{t("hdm.bus_stop_0_1_mi", "Bus Stop - 0.1 mi")}</div>
                    <div>{t("hdm.tram_station_0_4_mi", "Tram Station - 0.4 mi")}</div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="font-medium mb-2">{t("hdm.transportation_services", "Transportation Services")}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{t("hdm.airport_shuttle_available", "Airport Shuttle Available")}</div>
                    <div>{t("hdm.taxi_stand_nearby", "Taxi Stand Nearby")}</div>
                    <div>{t("hdm.bike_rental_0_2_mi", "Bike Rental - 0.2 mi")}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{hotelRating.toFixed(1)}</div>
                <div>
                  <div className="font-semibold text-lg">{getRatingText(hotelRating)}</div>
                  <div className="text-sm text-muted-foreground">
                    Based on {reviewCount > 0 ? reviewCount.toLocaleString() : allReviews.length} verified reviews
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={reviewSort} onValueChange={(value: any) => setReviewSort(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("hdm.newest_first", "Newest First")}</SelectItem>
                    <SelectItem value="oldest">{t("hdm.oldest_first", "Oldest First")}</SelectItem>
                    <SelectItem value="highest">{t("hdm.highest_rated", "Highest Rated")}</SelectItem>
                    <SelectItem value="lowest">{t("hdm.lowest_rated", "Lowest Rated")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {allReviews.length === 0 ? (
                <div className="py-12 text-center">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">{t("hdm.no_reviews_available", "No reviews available")}</h3>
                  <p className="text-sm text-muted-foreground">
                    This property doesn't have verified reviews yet.
                  </p>
                </div>
              ) : (
                sortedReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{review.author}</div>
                        <div className="text-xs text-muted-foreground">{review.date}</div>
                      </div>
                      <Badge className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        {review.rating}
                      </Badge>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{review.comment}</p>
                    
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2">
                        {review.photos.map((photo, idx) => (
                          <div key={idx} className="w-20 h-20 rounded overflow-hidden">
                            <img src={photo} alt={`Guest photo of ${hotelName}`} loading="lazy" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {allReviews.length > 0 && (
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                Showing {sortedReviews.length} reviews • Sorted by {reviewSort}
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            {customerPhotos.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{t("hdm.no_verified_photos_available_for_this_pr", "No verified photos available for this property yet.")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {customerPhotos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`${hotelName} photo ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {customerPhotos.length} photos from verified guests
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Mobile spacer to prevent bottom nav overlap */}
        <div className="h-16 md:hidden" aria-hidden="true" />
      </DialogContent>
    </Dialog>
  );
};
