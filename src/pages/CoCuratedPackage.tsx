import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, DollarSign, Check, Clock, Tag, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function CoCuratedPackage() {
  const { packageId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [travelers, setTravelers] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchPackage();
  }, [packageId]);

  const fetchPackage = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_packages')
        .select(`
          *,
          travel_agents!inner(
            agency_name,
            rating,
            profile_image_url
          )
        `)
        .eq('id', packageId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setPackageData(data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Package not found');
      navigate('/cocurated-marketplace');
    } finally {
      setLoading(false);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      const { data, error } = await supabase
        .from('influencer_promotions')
        .select('*')
        .eq('promo_code', promoCode.toUpperCase())
        .eq('package_id', packageId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        toast.error('Invalid promo code');
        return;
      }

      setDiscount(packageData.retail_price * 0.05); // 5% discount
      toast.success('Promo code applied! 5% discount');

      // Track the click
      await supabase.from('promo_code_usage').insert({
        promo_code: promoCode.toUpperCase(),
        package_id: packageId,
        user_id: user?.id || null,
        session_id: crypto.randomUUID()
      });
    } catch (error: any) {
      console.error('Error applying promo:', error);
      toast.error('Failed to apply promo code');
    }
  };

  const handleBooking = async () => {
    setBookingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-cocurated-checkout', {
        body: {
          packageId,
          promoCode: discount > 0 ? promoCode.toUpperCase() : null,
          travelers
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to initiate booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!packageData) {
    return <div className="container mx-auto py-8">Package not found</div>;
  }

  const finalPrice = (packageData.retail_price - discount) * travelers;
  const margin = packageData.retail_price - packageData.wholesale_cost;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="mb-8">
          {packageData.cover_image_url && (
            <div className="w-full h-96 rounded-lg overflow-hidden mb-6">
              <img 
                src={packageData.cover_image_url} 
                alt={packageData.package_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-4xl font-bold">{packageData.package_name}</h1>
              </div>
              <p className="text-muted-foreground">
                by {packageData.travel_agents?.agency_name}
              </p>
            </div>
            <Badge className="text-lg px-4 py-2">
              CoCurated<span className="text-xs align-super">™</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Details */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Destination</p>
                    <p className="text-sm text-muted-foreground">{packageData.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">{packageData.duration_days} days</p>
                  </div>
                </div>
                {packageData.max_participants && (
                  <div className="flex items-center gap-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Group Size</p>
                      <p className="text-sm text-muted-foreground">
                        Up to {packageData.max_participants} travelers
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {packageData.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About This Trip</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{packageData.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Inclusions */}
            {packageData.inclusions && packageData.inclusions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>What's Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {packageData.inclusions.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Exclusions */}
            {packageData.exclusions && packageData.exclusions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>What's Not Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {packageData.exclusions.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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
                          ${packageData.retail_price.toFixed(0)}
                        </p>
                      )}
                      <p className="text-2xl font-bold">
                        ${(packageData.retail_price - discount).toFixed(0)}
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
                    max={packageData.max_participants || 20}
                    value={travelers}
                    onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                  />
                </div>

                {/* Promo Code */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Promo Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={discount > 0}
                    />
                    <Button
                      variant="outline"
                      onClick={applyPromoCode}
                      disabled={discount > 0 || !promoCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
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
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Processing...' : 'Book Now'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment via Stripe. You'll be redirected to complete booking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}