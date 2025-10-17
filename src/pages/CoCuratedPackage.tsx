import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, DollarSign, Tag, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { fetchAmadeusTourDetails, AmadeusActivity } from "@/lib/amadeusHelpers";

export default function CoCuratedPackage() {
  const { packageId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [packageData, setPackageData] = useState<AmadeusActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [travelers, setTravelers] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchPackage();
    // Check for promo code in URL
    const urlPromo = searchParams.get('promo');
    if (urlPromo) {
      setPromoCode(urlPromo.toUpperCase());
    }
  }, [packageId]);

  const fetchPackage = async () => {
    if (!packageId) return;
    
    try {
      const activity = await fetchAmadeusTourDetails(packageId);
      if (activity) {
        setPackageData(activity);
      } else {
        toast.error("Package not found");
        navigate('/cocurated-journeys');
      }
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error("Failed to load package details");
      navigate('/cocurated-journeys');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book');
      navigate('/auth');
      return;
    }

    if (!packageData?.bookingLink) {
      toast.error('Booking link not available');
      return;
    }

    setBookingLoading(true);
    try {
      if (user) {
        // Create booking record
        const { error } = await supabase
          .from('bookings')
          .insert({
            booking_type: 'event',
            booking_reference: packageId,
            status: 'pending',
            total_price: finalPrice,
            currency: packageData.price.currencyCode,
            user_id: user.id,
            booking_data: {
              activity_id: packageId,
              activity_name: packageData.name,
              travelers_count: travelers
            }
          });

        if (error) throw error;
      }

      // Open Amadeus booking link
      window.open(packageData.bookingLink, '_blank');
      toast.success('Redirecting to booking page...');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to initiate booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto py-8">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto py-8">Package not found</div>
        <Footer />
      </div>
    );
  }

  const basePrice = parseFloat(packageData.price.amount);
  const finalPrice = (basePrice - discount) * travelers;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="mb-8">
          {packageData.pictures && packageData.pictures.length > 0 && (
            <div className="w-full h-96 rounded-lg overflow-hidden mb-6">
              <img 
                src={packageData.pictures[0]} 
                alt={packageData.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-4xl font-bold">{packageData.name}</h1>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground mt-2">
                {packageData.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span>{packageData.rating} ({packageData.numberOfRatings || 0} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            <Badge className="text-lg px-4 py-2">
              ${packageData.price.amount} {packageData.price.currencyCode}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">
                  {packageData.description || packageData.shortDescription || "Explore this amazing tour and create unforgettable memories."}
                </p>
              </CardContent>
            </Card>

            {/* Categories */}
            {packageData.categories && packageData.categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {packageData.categories.map((category: string, index: number) => (
                      <Badge key={index} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Book This Trip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Display */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-muted-foreground">Price per person</span>
                    <div className="text-right">
                      {discount > 0 && (
                        <p className="text-sm line-through text-muted-foreground">
                          ${basePrice.toFixed(0)}
                        </p>
                      )}
                      <p className="text-2xl font-bold">
                        ${(basePrice - discount).toFixed(0)}
                      </p>
                    </div>
                  </div>
                  {discount > 0 && (
                    <p className="text-xs text-primary">You save ${discount.toFixed(0)}</p>
                  )}
                </div>

                {/* Travelers */}
                <div>
                  <Label>Number of Travelers</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={travelers}
                    onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                  />
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>${finalPrice.toFixed(0)}</span>
                </div>

                {/* Book Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBooking}
                  disabled={bookingLoading || !packageData.bookingLink}
                >
                  {bookingLoading ? 'Processing...' : 'Book Now'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You'll be redirected to complete booking via Amadeus.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
