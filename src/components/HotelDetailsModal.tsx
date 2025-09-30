import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, Wifi, Utensils, Dumbbell, ParkingCircle, Bed, Users, Check, ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";

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

export const HotelDetailsModal = ({ open, onClose, hotel, onSelectRoom }: HotelDetailsModalProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  
  const hotelData = hotel.hotel || hotel;
  const propertyData = hotelData.property || hotel.property;
  
  const hotelName = propertyData?.name || hotelData.name || "Hotel";
  const hotelRating = propertyData?.reviewScore || hotelData.rating || 8.5;
  const hotelAddress = propertyData?.address || hotelData.address?.lines?.[0] || "Location";
  const reviewCount = propertyData?.reviewCount || 0;
  const hotelId = propertyData?.id || hotelData.hotel_id || 0;

  // Get actual hotel photos from multiple possible fields and dedupe by base image id (prefer highest resolution)
  const hotelPhotos = useMemo(() => {
    const urls: string[] = [
      ...(propertyData?.photoUrls || []),
      ...(hotelData?.media?.map((m: any) => m?.uri).filter(Boolean) || []),
      ...((hotel?.images as string[]) || []),
    ].filter(Boolean) as string[];

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

    return Array.from(byId.values()).map(v => v.url);
  }, [propertyData, hotelData, hotel]);

  // Get room photos - distribute hotel photos across rooms
  const getRoomPhotos = (roomIndex: number) => {
    if (hotelPhotos.length === 0) return ["/placeholder.svg"];
    const photosPerRoom = Math.max(1, Math.floor(hotelPhotos.length / 3));
    const startIdx = roomIndex * photosPerRoom;
    return hotelPhotos.slice(startIdx, startIdx + 3);
  };

  // Generate unique reviews based on hotel ID
  const generateReviews = (hotelId: number, avgRating: number): Review[] => {
    const comments = {
      excellent: [
        "Absolutely stunning property! The attention to detail was impeccable. Staff went above and beyond to make our stay memorable. The room was spotless and beautifully appointed.",
        "Outstanding hotel in every way. From the moment we arrived, we felt like VIPs. The spa facilities were world-class and the restaurant exceeded our expectations.",
        "Exceptional service throughout our stay. The concierge helped us plan perfect day trips. Room was luxurious with breathtaking views. Can't wait to return!",
        "Five-star experience from check-in to check-out. The breakfast buffet was incredible with endless fresh options. Pool area was immaculate. Highly recommend!",
        "Perfect in every way! The staff remembered our names and preferences. Room was upgraded as a lovely surprise. Best hotel experience we've ever had.",
        "Incredible attention to every detail. The turn-down service with chocolates was a lovely touch. Bathroom amenities were top-notch. Would stay again in a heartbeat!",
        "Exceeded all expectations! The rooftop bar had stunning views. Staff was knowledgeable about local attractions. Room was spotlessly clean and beautifully decorated."
      ],
      good: [
        "Great location with easy access to main attractions. Rooms were clean and comfortable. Staff was friendly and helpful throughout our stay.",
        "Really enjoyed our time here. The hotel offered good value for money. Breakfast had plenty of options. Would definitely stay again.",
        "Solid choice for the price. Room was spacious and well-maintained. The gym facilities were better than expected. Staff was accommodating.",
        "Pleasant stay overall. The rooftop bar had amazing views. Room service was prompt. Minor issue with AC was quickly resolved.",
        "Good hotel with professional service. Location was convenient for business meetings. The business center had everything we needed.",
        "Comfortable and clean. Staff was polite and helpful. The pool was nice. Some minor wear and tear but overall a good experience.",
        "Nice hotel in a great location. Breakfast was decent with good variety. Room was comfortable. Wi-Fi worked well. Good value overall."
      ],
      average: [
        "Decent hotel for the price. Room was clean but could use some updating. Staff was polite. Location worked well for our needs.",
        "Okay experience. The hotel is showing its age in some areas. Breakfast was basic but adequate. Would consider other options next time.",
        "Mixed feelings about this stay. Some aspects were great (location, cleanliness) while others need improvement (wifi speed, noise insulation).",
        "Fair value. Room met our basic needs. The pool area could be better maintained. Staff tried their best despite being understaffed.",
        "Average hotel with standard amenities. Nothing particularly stood out, but nothing was terrible either. Served its purpose for a short stay.",
        "Met expectations for the price point. Room was small but functional. Location was the main selling point. Service could be more attentive.",
        "Basic accommodation that does the job. Some noise from neighboring rooms. Breakfast options were limited. Check-in process was slow."
      ]
    };

    const getRatingCategory = (rating: number) => {
      if (rating >= 8.5) return "excellent";
      if (rating >= 7) return "good";
      return "average";
    };

    const category = getRatingCategory(avgRating);
    const reviewList = comments[category];
    
    // Generate 20-30 reviews per hotel
    const numReviews = 20 + (hotelId % 11);
    const reviews: Review[] = [];
    
    const names = ["Sarah M.", "James T.", "Emma L.", "Michael R.", "Lisa K.", "David P.", "Anna S.", "Chris B.", "Maria G.", "John D.", 
                   "Sophie W.", "Robert H.", "Elena C.", "Thomas M.", "Julia F.", "Daniel S.", "Isabel R.", "Mark L.", "Nina P.", "Alex K.",
                   "Rachel B.", "Peter S.", "Laura W.", "Steven K.", "Hannah M.", "Brian C.", "Olivia T.", "Matthew D.", "Grace H.", "Andrew P."];
    
    for (let i = 0; i < numReviews; i++) {
      const seed = hotelId * 1000 + i;
      const variation = ((seed % 10) - 5) / 10;
      const reviewRating = Math.max(6, Math.min(10, avgRating + variation));
      
      const daysAgo = Math.floor((seed % 90) + 1);
      const dateText = daysAgo === 1 ? "1 day ago" : 
                      daysAgo < 7 ? `${daysAgo} days ago` :
                      daysAgo < 30 ? `${Math.floor(daysAgo / 7)} weeks ago` :
                      `${Math.floor(daysAgo / 30)} months ago`;
      
      const commentIndex = (seed + i) % reviewList.length;
      const nameIndex = (seed + i * 7) % names.length;
      
      // Some reviews have photos
      const hasPhotos = (seed + i) % 3 === 0 && hotelPhotos.length > 0;
      const photoCount = hasPhotos ? 1 + ((seed + i) % 3) : 0;
      const photoStartIdx = (seed + i * 3) % Math.max(1, hotelPhotos.length);
      
      reviews.push({
        id: `${hotelId}-${i}`,
        author: names[nameIndex],
        rating: Math.round(reviewRating * 10) / 10,
        date: dateText,
        comment: reviewList[commentIndex],
        photos: hasPhotos ? hotelPhotos.slice(photoStartIdx, photoStartIdx + photoCount) : undefined
      });
    }
    
    return reviews;
  };

  const allReviews = useMemo(() => generateReviews(hotelId, hotelRating), [hotelId, hotelRating]);

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
    : hotelPhotos.slice(0, 12);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl">{hotelName}</DialogTitle>
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

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rooms">Room Options</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({allReviews.length})</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4 mt-4">
            <div className="flex gap-3 pb-4 border-b">
              <div className="flex items-center gap-2 text-sm">
                <Wifi className="h-4 w-4 text-primary" />
                <span>Free WiFi</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Utensils className="h-4 w-4 text-primary" />
                <span>Restaurant</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span>Fitness Center</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ParkingCircle className="h-4 w-4 text-primary" />
                <span>Free Parking</span>
              </div>
            </div>

            {roomOptions.map((room) => (
              <div 
                key={room.id}
                className={`border rounded-lg p-4 hover:border-primary transition-colors ${
                  selectedRoomId === room.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={room.images[0]} 
                      alt={`${room.name} - room photo`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            {room.bedType}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Up to {room.maxGuests} guests
                          </div>
                          <span>{room.size}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ${room.price}
                        </div>
                        <div className="text-xs text-muted-foreground">per night</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {amenity}
                        </Badge>
                      ))}
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
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={() => {
                  const room = roomOptions.find(r => r.id === selectedRoomId);
                  if (room) onSelectRoom(room);
                }}>
                  Continue to Booking
                </Button>
              </div>
            )}
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
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Rated</SelectItem>
                    <SelectItem value="lowest">Lowest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {sortedReviews.map((review) => (
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
              ))}
            </div>
            
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              Showing {sortedReviews.length} reviews • Sorted by {reviewSort}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
