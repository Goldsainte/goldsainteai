import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, MapPin, Wifi, Car, ParkingCircle, Utensils, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getHotelImage } from "@/lib/imageHelpers";

const bookingFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  country: z.string().min(1, "Country/Region is required"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phone: z.string().trim().min(1, "Phone number is required").max(20),
  paperlessConfirmation: z.boolean().default(false),
  bookingFor: z.enum(["self", "someone_else"]),
  specialRequests: z.string().max(1000).optional(),
});

export default function HotelBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Parse booking data from URL params
  const bookingDataParam = searchParams.get('data');
  const bookingData = bookingDataParam ? JSON.parse(decodeURIComponent(bookingDataParam)) : null;

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: 'United States',
      phoneCountryCode: 'US +1',
      phone: '',
      paperlessConfirmation: true,
      bookingFor: 'self',
      specialRequests: '',
    },
  });

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

  // Calculate pricing
  const subtotal = bookingData.totalPrice || 0;
  const tax = subtotal * 0.10;
  const serviceFee = subtotal * 0.05;
  const total = subtotal + tax + serviceFee;

  const onSubmit = async (values: z.infer<typeof bookingFormSchema>) => {
    setLoading(true);

    try {
      const { data: bookingResult, error: bookingError } = await supabase.functions.invoke('create-booking', {
        body: {
          bookingType: 'hotel',
          bookingData,
          totalPrice: total,
          currency: bookingData.currency || 'USD',
          guestInfo: values
        }
      });

      if (bookingError) throw bookingError;

      const { data: checkoutResult, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          bookingId: bookingResult.booking.id,
          amount: total,
          currency: bookingData.currency || 'USD',
          guestEmail: values.email
        }
      });

      if (checkoutError) throw checkoutError;

      if (checkoutResult.url) {
        window.open(checkoutResult.url, '_blank');
        toast({
          title: "Redirecting to payment",
          description: `Booking reference: ${bookingResult.bookingReference}`,
        });
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[400px_1fr] gap-8 max-w-7xl mx-auto">
          {/* Left Sidebar - Hotel Details */}
          <div className="space-y-4">
            {/* Hotel Image */}
            <Card className="overflow-hidden border-accent/20">
              <img
                src={getHotelImage(
                  bookingData.hotel?.image || bookingData.hotelImage,
                  bookingData.hotel?.hotelId || bookingData.hotel?.name || bookingData.hotelName
                )}
                alt={bookingData.hotel?.name || bookingData.hotelName || 'Hotel'}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.src = getHotelImage(
                    undefined,
                    bookingData.hotel?.hotelId || bookingData.hotel?.name || bookingData.hotelName
                  );
                }}
              />
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-semibold">
                      {bookingData.hotel?.rating || '4.0'}
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold">
                    {bookingData.hotel?.name || bookingData.hotelName || 'Hotel Name'}
                  </h2>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{bookingData.hotel?.address || bookingData.hotelAddress || 'Hotel Address'}</span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Wifi className="h-4 w-4" />
                    <span>Free WiFi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Car className="h-4 w-4" />
                    <span>Airport shuttle</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ParkingCircle className="h-4 w-4" />
                    <span>Parking</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Utensils className="h-4 w-4" />
                    <span>Restaurant</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Booking Details Card */}
            <Card className="p-4 space-y-4 border-accent/20">
              <h3 className="font-semibold text-lg">Your booking details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Check-in</div>
                  <div className="text-lg font-semibold">
                    {bookingData.checkIn ? formatDate(bookingData.checkIn) : 'Date TBD'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bookingData.checkIn ? formatTime(bookingData.checkIn) : '3:00 PM – 12:00 AM'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Check-out</div>
                  <div className="text-lg font-semibold">
                    {bookingData.checkOut ? formatDate(bookingData.checkOut) : 'Date TBD'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bookingData.checkOut ? formatTime(bookingData.checkOut) : '6:00 AM – 12:00 PM'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Total length of stay:</div>
                <div className="text-lg font-semibold">{bookingData.nights || 1} nights</div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-1">You selected</div>
                <div className="font-semibold">
                  {bookingData.rooms || 1} room for {bookingData.guests || 2} adults
                </div>
                {bookingData.selectedRoom && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {bookingData.selectedRoom.name || 'Standard Room'}
                  </div>
                )}
              </div>
            </Card>

            {/* Price Summary Card */}
            <Card className="p-4 space-y-3 border-accent/20">
              <h3 className="font-semibold text-lg">Your price summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{bookingData.currency || 'USD'} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (10%)</span>
                  <span>{bookingData.currency || 'USD'} {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service fee (5%)</span>
                  <span>{bookingData.currency || 'USD'} {serviceFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">{bookingData.currency || 'USD'} {total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Form Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Enter your details</h1>
              
              <Alert className="border-accent/20">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Almost done! Just fill in the <span className="text-destructive">*</span> required info
                </AlertDescription>
              </Alert>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="p-6 space-y-6 border-accent/20">
                  {/* Name Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            First name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Last name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email address <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Confirmation email sent to this address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Country/Region */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Country/Region <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="India">India</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone Number */}
                  <div className="grid grid-cols-[140px_1fr] gap-4">
                    <FormField
                      control={form.control}
                      name="phoneCountryCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Phone number <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US +1">US +1</SelectItem>
                              <SelectItem value="UK +44">UK +44</SelectItem>
                              <SelectItem value="CA +1">CA +1</SelectItem>
                              <SelectItem value="FR +33">FR +33</SelectItem>
                              <SelectItem value="DE +49">DE +49</SelectItem>
                              <SelectItem value="IN +91">IN +91</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="invisible">Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            To verify your booking, and for the property to connect if needed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Paperless Confirmation */}
                  <FormField
                    control={form.control}
                    name="paperlessConfirmation"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="font-normal">
                            Yes, I want free paperless confirmation (recommended)
                          </FormLabel>
                          <FormDescription className="text-xs">
                            We'll text you a link to download our app
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Who are you booking for */}
                  <FormField
                    control={form.control}
                    name="bookingFor"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Who are you booking for? (optional)</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="self" id="self" />
                              <label htmlFor="self" className="font-normal cursor-pointer">
                                I'm the main guest
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="someone_else" id="someone_else" />
                              <label htmlFor="someone_else" className="font-normal cursor-pointer">
                                I'm booking for someone else
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Special Requests */}
                  <FormField
                    control={form.control}
                    name="specialRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special requests (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Any special requests or notes..."
                            className="h-24"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={loading}
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Booking'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
