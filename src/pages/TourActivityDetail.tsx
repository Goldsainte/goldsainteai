import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Star, Calendar, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";

export default function TourActivityDetail() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourDetails = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await invokeEdgeFunction('amadeus-get-tour-details', {
          body: { activityId: tourId }
        });

        if (error) {
          if (error.message?.includes('Rate limit')) {
            toast.error('Too many requests. Please try again in a moment.');
          } else if (error.message?.includes('not found')) {
            toast.error('Tour not found');
          } else {
            toast.error('Failed to load tour details');
          }
          setTour(null);
          return;
        }

        setTour(data);
      } catch (error) {
        console.error('Error loading tour:', error);
        toast.error('Failed to load tour details');
        setTour(null);
      } finally {
        setLoading(false);
      }
    };

    if (tourId) {
      loadTourDetails();
    }
  }, [tourId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
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
            <Button onClick={() => navigate('/post-trip')}>
              Back to Tours
            </Button>
          </Card>
        </main>
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
                loading="lazy"/>
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
                <p>{tour.description || tour.shortDescription || 'No description available.'}</p>
                
                {tour.included && tour.included.length > 0 && (
                  <>
                    <h2>What's included</h2>
                    <ul>
                      {tour.included.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {tour.excluded && tour.excluded.length > 0 && (
                  <>
                    <h2>What's not included</h2>
                    <ul>
                      {tour.excluded.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {tour.meetingPoint && (
                  <>
                    <h2>Meeting point</h2>
                    <p>{tour.meetingPoint.address || 'Meeting point details available upon booking.'}</p>
                  </>
                )}

                {tour.cancellationPolicy && (
                  <>
                    <h2>Cancellation policy</h2>
                    <p>{tour.cancellationPolicy.description || 'Cancellation policy available upon booking.'}</p>
                  </>
                )}
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
                  onClick={() => navigate("/marketplace")}
                >
                  Find a Specialist for This Activity
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Browse Goldsainte travel specialists who can book this for you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

    </div>
  );
}
