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
import { fetchAmadeusTourDetails, AmadeusActivity } from "@/lib/amadeusHelpers";
import DOMPurify from "dompurify";

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
  const [addingToTrip, setAddingToTrip] = useState(false);

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

    setBookingLoading(true);
    try {
      // Create booking record in database
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_type: 'tour',
          booking_data: {
            packageId,
            packageName: packageData.name,
            travelers,
            promoCode: promoCode || null
          },
          total_price: finalPrice,
          currency: packageData.price.currencyCode,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      toast.success('Redirecting to Amadeus booking...');
      
      // Redirect to Amadeus booking link
      if (packageData.bookingLink) {
        window.open(packageData.bookingLink, '_blank');
      }
      
      navigate('/bookings');
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAddToCoCuratedTrip = async () => {
    if (!user) {
      toast.error('Please sign in to create a custom trip');
      navigate('/auth');
      return;
    }

    setAddingToTrip(true);
    try {
      // Check for existing pending trip request
      const { data: existingRequest, error: fetchError } = await supabase
        .from('cocurated_trip_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const tripItem = {
        id: packageId,
        name: packageData.name,
        type: 'amadeus_tour',
        price: packageData.price.amount,
        currency: packageData.price.currencyCode,
        travelers: travelers,
        description: packageData.shortDescription,
        image: packageData.pictures?.[0] || null
      };

      if (existingRequest) {
        // Add to existing trip request
        const existingItems = Array.isArray(existingRequest.trip_items) ? existingRequest.trip_items : [];
        const updatedItems = [...existingItems, tripItem];
        const { error } = await supabase
          .from('cocurated_trip_requests')
          .update({ 
            trip_items: updatedItems,
            total_travelers: travelers,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRequest.id);

        if (error) throw error;
        toast.success('Added to your custom trip! An agent will contact you soon.');
      } else {
        // Create new trip request
        const { error } = await supabase
          .from('cocurated_trip_requests')
          .insert({
            user_id: user.id,
            trip_items: [tripItem],
            total_travelers: travelers,
            status: 'pending'
          });

        if (error) throw error;
        toast.success('Trip request created! An agent will reach out to build your custom itinerary.');
      }

      navigate('/my-trips');
    } catch (error: any) {
      console.error('Error adding to trip:', error);
      toast.error('Failed to add to custom trip');
    } finally {
      setAddingToTrip(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-8">Loading...</div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-8">Package not found</div>
      </div>
    );
  }

  const basePrice = parseFloat(packageData.price.amount);
  const finalPrice = (basePrice - discount) * travelers;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-4 pb-8 px-4">
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
                <div 
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(
                      packageData.description || packageData.shortDescription || "Explore this amazing tour and create unforgettable memories.",
                      {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4', 'h5', 'h6', 'a', 'span', 'div'],
                        ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
                      }
                    )
                  }}
                />
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
                <CardTitle>Book This Trip</CardTitle>
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

                {/* Book Buttons */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBooking}
                    disabled={bookingLoading || !packageData.bookingLink}
                  >
                    {bookingLoading ? 'Processing...' : 'Book Now via Amadeus'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    You'll be redirected to complete booking via Amadeus
                  </p>
                </div>

                <div className="w-full text-center text-sm text-muted-foreground my-2">
                  — OR —
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={handleAddToCoCuratedTrip}
                    disabled={addingToTrip}
                  >
                    {addingToTrip ? 'Adding...' : 'Add to CoCurated Trip'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Work with a Goldsainte agent to build a custom package
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
