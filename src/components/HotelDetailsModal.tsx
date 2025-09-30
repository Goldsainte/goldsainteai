import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Wifi, Utensils, Dumbbell, ParkingCircle, Bed, Users, Check } from "lucide-react";
import { useState } from "react";

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
  
  const hotelData = hotel.hotel || hotel;
  const hotelName = hotelData.name || "Hotel";
  const hotelRating = hotelData.rating || 8.5;
  const hotelAddress = hotelData.address?.lines?.[0] || "Location";

  // Sample room options (in production, this would come from the API)
  const roomOptions: RoomOption[] = [
    {
      id: "deluxe-king",
      name: "Deluxe King Suite",
      bedType: "1 King Bed",
      maxGuests: 2,
      size: "450 sq ft",
      price: 299,
      amenities: ["City View", "Mini Bar", "Bathtub", "Work Desk", "Coffee Maker"],
      images: ["/placeholder.svg"]
    },
    {
      id: "superior-double",
      name: "Superior Double Room",
      bedType: "2 Double Beds",
      maxGuests: 4,
      size: "380 sq ft",
      price: 259,
      amenities: ["Garden View", "Mini Fridge", "Shower", "Seating Area"],
      images: ["/placeholder.svg"]
    },
    {
      id: "executive-suite",
      name: "Executive Suite",
      bedType: "1 King Bed + Sofa Bed",
      maxGuests: 3,
      size: "650 sq ft",
      price: 399,
      amenities: ["Panoramic View", "Separate Living Room", "Jacuzzi", "Premium Toiletries", "Nespresso Machine"],
      images: ["/placeholder.svg"]
    }
  ];

  // Sample reviews (in production, this would come from the API or database)
  const reviews: Review[] = [
    {
      id: "1",
      author: "Sarah M.",
      rating: 9.5,
      date: "3 days ago",
      comment: "Absolutely stunning property! The attention to detail was impeccable. Staff went above and beyond to make our stay memorable. The room was spotless and beautifully appointed.",
      photos: ["/placeholder.svg", "/placeholder.svg"]
    },
    {
      id: "2",
      author: "James T.",
      rating: 9.0,
      date: "1 week ago",
      comment: "Great location, luxurious rooms, and exceptional service. The breakfast was outstanding with plenty of options. Would definitely stay here again!",
      photos: ["/placeholder.svg"]
    },
    {
      id: "3",
      author: "Emma L.",
      rating: 8.5,
      date: "2 weeks ago",
      comment: "Beautiful hotel with elegant decor. The spa facilities were amazing. Only minor issue was the wifi speed, but everything else was perfect.",
    }
  ];

  // Sample customer photos
  const customerPhotos = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg"
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl">{hotelName}</DialogTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold">{hotelRating}</span>
                <span className="text-muted-foreground">({reviews.length} reviews)</span>
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
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="photos">Guest Photos</TabsTrigger>
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
                      alt={room.name}
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
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="text-4xl font-bold text-primary">{hotelRating}</div>
              <div>
                <div className="font-semibold text-lg">Exceptional</div>
                <div className="text-sm text-muted-foreground">Based on {reviews.length} verified reviews</div>
              </div>
            </div>

            {reviews.map((review) => (
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
                        <img src={photo} alt="Review photo" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              {customerPhotos.map((photo, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={photo} 
                    alt={`Guest photo ${idx + 1}`}
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
