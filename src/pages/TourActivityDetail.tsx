import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Star, Calendar, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TourActivityDetail() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you would fetch the tour details from Amadeus API
    // For now, showing a placeholder
    const loadTourDetails = async () => {
      try {
        setLoading(true);
        // Placeholder data - in production, fetch from Amadeus API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setTour({
          id: tourId,
          name: "Sample Tour Activity",
          description: "This is a placeholder for the tour details page. In production, this would fetch complete tour information from the Amadeus Tours & Activities API including full description, included/excluded items, meeting point, cancellation policy, and booking options.",
          rating: "4.8",
          pictures: [],
          price: {
            currencyCode: "USD",
            amount: "99.00"
          },
          minimumDuration: "PT4H"
        });
      } catch (error) {
        console.error('Error loading tour:', error);
        toast.error('Failed to load tour details');
      } finally {
        setLoading(false);
      }
    };

    loadTourDetails();
  }, [tourId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Tour Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The tour you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/cocurated-journeys')}>
              Back to Tours
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tours
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tour Images */}
            {tour.pictures && tour.pictures.length > 0 && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={tour.pictures[0]}
                  alt={tour.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Tour Info */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl font-bold">{tour.name}</h1>
                {tour.rating && (
                  <Badge variant="secondary" className="text-lg">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    {tour.rating}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                {tour.minimumDuration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{tour.minimumDuration.replace('PT', '').toLowerCase()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Meet on location</span>
                </div>
              </div>

              <div className="prose max-w-none">
                <h2>About this activity</h2>
                <p>{tour.description}</p>
                
                <h2>What's included</h2>
                <p>Detailed information about inclusions would be shown here from the Amadeus API response.</p>

                <h2>Meeting point</h2>
                <p>Detailed meeting point information would be shown here from the Amadeus API response.</p>

                <h2>Cancellation policy</h2>
                <p>Cancellation policy details would be shown here from the Amadeus API response.</p>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book this activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold mb-2">
                    {tour.price.currencyCode} {tour.price.amount}
                  </div>
                  <p className="text-sm text-muted-foreground">per person</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Select date</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Select participants</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => toast.info('Booking functionality coming soon!')}
                >
                  Check Availability
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  You won't be charged yet
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
