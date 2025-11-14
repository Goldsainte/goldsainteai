import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowLeft,
  Video,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with real API calls
const MOCK_TRIP = {
  id: "trip-1",
  title: "Luxury Paris Weekend: From Eiffel Tower to Hidden Gems",
  creator: {
    name: "Sarah Chen",
    tiktokHandle: "@sarahgoesglobal",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    followers: 450000,
  },
  coverImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
  tiktokVideoUrl: "https://www.tiktok.com/@example/video/12345",
  price: 2499,
  currency: "USD",
  duration: "3 days / 2 nights",
  maxGuests: 8,
  location: "Paris, France",
  startDates: ["May 15, 2025", "June 5, 2025", "July 10, 2025"],
  description:
    "Experience Paris like never before! Join me for an exclusive 3-day luxury adventure featuring 5-star accommodations, private tours of iconic landmarks, and authentic Parisian dining experiences. As seen in my viral TikTok series with 2M+ views!",
  highlights: [
    "Private Eiffel Tower sunset tour",
    "5-star hotel in Le Marais",
    "Michelin-starred dinner experience",
    "Seine river cruise with champagne",
    "Personal photographer for Instagram content",
    "Hidden local cafés and boutiques",
    "Airport transfers included",
  ],
  itinerary: [
    {
      day: 1,
      title: "Arrival & Parisian Welcome",
      activities: [
        "Private airport transfer to 5-star hotel",
        "Welcome lunch at historic bistro",
        "Afternoon: Explore Le Marais neighborhood",
        "Evening: Seine river cruise with champagne",
      ],
    },
    {
      day: 2,
      title: "Iconic Paris",
      activities: [
        "Morning: Private Louvre tour (skip the line)",
        "Lunch: Michelin-starred restaurant",
        "Afternoon: Eiffel Tower sunset experience",
        "Evening: Traditional French dinner in Montmartre",
      ],
    },
    {
      day: 3,
      title: "Hidden Gems & Farewell",
      activities: [
        "Morning: Secret local cafés and boutiques",
        "Brunch: Trendy Parisian hotspot",
        "Private photoshoot session",
        "Airport transfer",
      ],
    },
  ],
  included: [
    "2 nights luxury accommodation",
    "All meals mentioned in itinerary",
    "Private transportation",
    "Skip-the-line tickets to attractions",
    "Personal photographer",
    "Travel insurance",
  ],
  notIncluded: ["Flights to/from Paris", "Personal expenses", "Tips (optional)"],
};

export default function CreatorTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleBookTrip = () => {
    if (!selectedDate) {
      toast({
        title: "Select a date",
        description: "Please choose a departure date to continue",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Booking initiated",
      description: "Redirecting to secure checkout...",
    });

    // In production: navigate to booking flow
    console.log("Booking trip:", { tripId: id, date: selectedDate });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px]">
        <img
          src={MOCK_TRIP.coverImage}
          alt={MOCK_TRIP.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-white hover:text-white hover:bg-white/20"
              onClick={() => navigate("/browse-creators")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Creators
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {MOCK_TRIP.title}
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <Avatar className="h-12 w-12 border-2 border-white">
                <AvatarImage src={MOCK_TRIP.creator.avatarUrl} />
                <AvatarFallback>{MOCK_TRIP.creator.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{MOCK_TRIP.creator.name}</p>
                <p className="text-sm">{MOCK_TRIP.creator.tiktokHandle}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                <Users className="h-3 w-3 mr-1" />
                {(MOCK_TRIP.creator.followers / 1000).toFixed(0)}K followers
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{MOCK_TRIP.description}</p>
                
                {/* Key Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium text-sm">{MOCK_TRIP.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium text-sm">{MOCK_TRIP.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Group Size</p>
                      <p className="font-medium text-sm">Max {MOCK_TRIP.maxGuests}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">TikTok Views</p>
                      <p className="font-medium text-sm">2M+</p>
                    </div>
                  </div>
                </div>

                {/* TikTok Video Link */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(MOCK_TRIP.tiktokVideoUrl, "_blank")}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Watch Original TikTok Series
                </Button>
              </CardContent>
            </Card>

            {/* Highlights */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {MOCK_TRIP.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Itinerary */}
            <Card>
              <CardHeader>
                <CardTitle>Day-by-Day Itinerary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {MOCK_TRIP.itinerary.map((day) => (
                  <div key={day.day} className="border-l-2 border-primary pl-4">
                    <h3 className="font-semibold mb-2">
                      Day {day.day}: {day.title}
                    </h3>
                    <ul className="space-y-1">
                      {day.activities.map((activity, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">Included:</h4>
                  <ul className="space-y-1">
                    {MOCK_TRIP.included.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm">Not Included:</h4>
                  <ul className="space-y-1">
                    {MOCK_TRIP.notIncluded.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    ${MOCK_TRIP.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">per person</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Select Departure Date
                  </label>
                  <div className="space-y-2">
                    {MOCK_TRIP.startDates.map((date) => (
                      <Button
                        key={date}
                        variant={selectedDate === date ? "default" : "outline"}
                        className="w-full"
                        onClick={() => setSelectedDate(date)}
                      >
                        {date}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Book Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBookTrip}
                  disabled={!selectedDate}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Book This Trip
                </Button>

                {/* Share Button */}
                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Trip
                </Button>

                {/* Trust Signals */}
                <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Verified Creator
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Secure Payment
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Free Cancellation (48hrs)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
