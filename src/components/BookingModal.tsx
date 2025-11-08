import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/lib/currencyHelpers";
import { useNavigate } from "react-router-dom";
import { BookingPolicyBanner } from "./BookingPolicyBanner";
import { useActivityLogger } from "@/hooks/useActivityLogger";

const bookingFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  region: z.string().optional(),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(1, "Phone number is required"),
  paperlessConfirmation: z.boolean().default(false),
  confirmByEmail: z.boolean().default(true),
  confirmByText: z.boolean().default(false),
  bookingFor: z.enum(["self", "someone_else"]),
  guestName: z.string().optional(),
  travelingForWork: z.boolean().default(false),
  needFlight: z.boolean().default(false),
  needCarTransfer: z.boolean().default(false),
  specialRequests: z.string().optional(),
  estimatedArrivalTime: z.string().optional(),
  needCrib: z.boolean().default(false),
}).refine((data) => {
  if (data.bookingFor === "someone_else") {
    return data.guestName && data.guestName.trim().length > 0;
  }
  return true;
}, {
  message: "Guest name is required when booking for someone else",
  path: ["guestName"],
});

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  bookingType: 'hotel' | 'flight' | 'car';
  bookingData: any;
  totalPrice: number;
  currency: string;
}

export const BookingModal = ({ 
  open, 
  onClose, 
  bookingType, 
  bookingData, 
  totalPrice, 
  currency 
}: BookingModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: '',
      region: '',
      phoneCountryCode: '+1',
      phone: '',
      paperlessConfirmation: false,
      confirmByEmail: true,
      confirmByText: false,
      bookingFor: 'self',
      travelingForWork: false,
      needFlight: false,
      needCarTransfer: false,
      needCrib: false,
    },
  });

  // Auto-populate user details from account and restore draft
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          
          // Auto-populate form with user data
          const nameParts = profile.username?.split(' ') || [];
          form.setValue('firstName', nameParts[0] || '');
          form.setValue('lastName', nameParts.slice(1).join(' ') || '');
          form.setValue('email', user.email || '');
          
          // Auto-fill country if available
          if (profile.country) form.setValue('country', profile.country);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    // Restore draft booking if returning from auth
    const restoreDraft = () => {
      try {
        const draftStr = localStorage.getItem('booking_draft');
        if (!draftStr) return;
        
        const draft = JSON.parse(draftStr);
        const draftAge = Date.now() - new Date(draft.timestamp).getTime();
        
        // Only restore if < 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000 && draft.formData) {
          console.log('Restoring booking draft');
          Object.keys(draft.formData).forEach(key => {
            form.setValue(key as any, draft.formData[key]);
          });
          localStorage.removeItem('booking_draft');
        }
      } catch (e) {
        console.error('Failed to restore draft:', e);
        localStorage.removeItem('booking_draft');
      }
    };

    if (open) {
      loadUserProfile();
      restoreDraft();
    }
  }, [user, open, form]);

  const bookingFor = form.watch('bookingFor');
  
  // Calculate tax and fees (assuming 10% tax and 5% service fee)
  const subtotal = totalPrice || 0;
  const tax = subtotal * 0.10;
  const serviceFee = subtotal * 0.05;
  const total = subtotal + tax + serviceFee;
  
  console.log('[BookingModal] Price breakdown:', {
    subtotal,
    tax,
    serviceFee,
    total,
    currency
  });
  
  // Get currency symbol from currency code
  const currencySymbol = getCurrencySymbol(currency);

  const onSubmit = async (values: z.infer<typeof bookingFormSchema>) => {
    if (!user) {
      // Save draft before redirecting to auth
      const draft = {
        bookingType,
        bookingData,
        totalPrice: total,
        currency,
        formData: values,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('booking_draft', JSON.stringify(draft));
      localStorage.setItem('reopen_booking_modal', 'true');
      
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your booking. Your details will be saved.",
        variant: "destructive",
      });
      navigate('/auth?redirect=checkout');
      return;
    }

    setLoading(true);

    try {
      // CRITICAL: Standardize date fields and guest count before sending to backend
      console.log('🔍 [BOOKING DEBUG] Pre-submission validation:', {
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        guests: bookingData.guests,
        adults: bookingData.adults,
        children: bookingData.children,
        bookingType
      });

      // Validate dates exist for hotel bookings
      if (bookingType === 'hotel' && (!bookingData.checkIn && !bookingData.checkInDate)) {
        throw new Error('Check-in and check-out dates are required for hotel bookings');
      }

      const { data: bookingResult, error: bookingError } = await supabase.functions.invoke('create-booking', {
        body: {
          bookingType,
          bookingData: {
            ...bookingData,
            // Standardize date fields - ensure both formats are present
            checkIn: bookingData.checkIn || bookingData.checkInDate,
            checkOut: bookingData.checkOut || bookingData.checkOutDate,
            checkInDate: bookingData.checkInDate || bookingData.checkIn,
            checkOutDate: bookingData.checkOutDate || bookingData.checkOut,
            // Standardize guest count
            guests: bookingData.guests || bookingData.adults || 2,
            adults: bookingData.adults || bookingData.guests || 2,
            children: bookingData.children || 0,
            // Include source for tracking
            source: bookingData.source || 'manual_search'
          },
          totalPrice: total,
          currency,
          guestInfo: values,
          source: bookingData.source || 'manual_search'
        }
      });

      console.log('create-booking response:', { bookingResult, bookingError });

      if (bookingError) throw bookingError;

      // Log booking creation
      await logActivity({
        action: 'booking_created',
        entity_type: 'booking',
        entity_id: bookingResult.booking.id,
        details: { 
          bookingType, 
          totalPrice: total, 
          currency,
          bookingReference: bookingResult.bookingReference,
          needFlight: values.needFlight,
          needCarTransfer: values.needCarTransfer
        }
      });

      const { data: checkoutResult, error: checkoutError } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          bookingData,
          totalPrice: total,
          currency
        }
      });

      console.log('create-checkout response:', { checkoutResult, checkoutError });

      if (checkoutError) {
        if (checkoutError.message?.includes('429') || checkoutError.message?.includes('rate limit')) {
          throw new Error('Too many payment requests. Please wait a moment and try again.');
        }
        if (checkoutError.message?.includes('402') || checkoutError.message?.includes('credits')) {
          throw new Error('Service temporarily unavailable. Please contact support.');
        }
        throw checkoutError;
      }

      if (!checkoutResult?.url) {
        toast({
          title: "Payment Error",
          description: "Payment couldn't be started. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (checkoutResult.url) {
        const isInIframe = window.top && window.top !== window;
        console.log('[BookingModal] Redirecting to Stripe checkout:', checkoutResult.url);
        console.log('[BookingModal] Running in iframe:', isInIframe);
        
        // Store add-on requests for post-payment follow-up
        if (values.needFlight || values.needCarTransfer) {
          localStorage.setItem('booking_addons', JSON.stringify({
            needFlight: values.needFlight,
            needCarTransfer: values.needCarTransfer,
            bookingId: checkoutResult.bookingId || 'pending'
          }));
        }

        toast({
          title: "Redirecting to Payment",
          description: "Opening secure payment page...",
        });
        
        // Open payment in new tab (works in all contexts including iframes)
        const paymentWindow = window.open(checkoutResult.url, '_blank', 'noopener,noreferrer');
        
        // If popup was blocked, show fallback toast with manual button
        if (!paymentWindow) {
          setTimeout(() => {
            toast({
              title: "Payment Window Blocked",
              description: "Please allow popups and click to open payment",
              action: (
                <button 
                  onClick={() => window.open(checkoutResult.url, '_blank', 'noopener,noreferrer')}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded"
                >
                  Open Payment
                </button>
              ),
            });
          }, 500);
        }
        
        onClose();
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>Please provide your information to complete the reservation</DialogDescription>
        </DialogHeader>

        <BookingPolicyBanner bookingType={bookingType} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Room Details */}
            {bookingType === 'hotel' && (
              <div className="space-y-2">
                <h3 className="font-semibold">Room Details</h3>
                <div className="text-sm space-y-1">
                  {bookingData?.selectedRoom ? (
                    <>
                      <p><strong>Room Type:</strong> {bookingData.selectedRoom.name}</p>
                      <p><strong>Beds:</strong> {bookingData.selectedRoom.bedType}</p>
                      <p><strong>Max Guests:</strong> {bookingData.selectedRoom.maxGuests}</p>
                      <p><strong>Size:</strong> {bookingData.selectedRoom.size}</p>
                      <p><strong>Amenities:</strong> {bookingData.selectedRoom.amenities.join(', ')}</p>
                    </>
                  ) : bookingData?.room ? (
                    <>
                      <p><strong>Room Type:</strong> {bookingData.room.description?.text || 'Standard Room'}</p>
                      <p><strong>Beds:</strong> {bookingData.room.typeEstimated?.bedType || 'Not specified'}</p>
                      {bookingData.room.description?.text && (
                        <p><strong>Features:</strong> {bookingData.room.description.text}</p>
                      )}
                    </>
                  ) : (
                    <p>Room details will be confirmed upon availability</p>
                  )}
                </div>
                <Separator />
              </div>
            )}

            {/* Guest Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Guest Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region/State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="phoneCountryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="+1">+1 (US/CA)</SelectItem>
                          <SelectItem value="+44">+44 (UK)</SelectItem>
                          <SelectItem value="+33">+33 (FR)</SelectItem>
                          <SelectItem value="+49">+49 (DE)</SelectItem>
                          <SelectItem value="+91">+91 (IN)</SelectItem>
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
                    <FormItem className="col-span-2">
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Booking Details</h3>
              
              <FormField
                control={form.control}
                name="bookingFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who is this booking for?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="self">I'm the main guest</SelectItem>
                        <SelectItem value="someone_else">Booking for someone else</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {bookingFor === 'someone_else' && (
                <FormField
                  control={form.control}
                  name="guestName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter guest's full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="travelingForWork"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 font-normal">I'm traveling for work</FormLabel>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Check this if you're booking for business purposes. This helps us prioritize business-friendly amenities and may be needed for expense reporting.
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedArrivalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Arrival Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Special Requests */}
            <div className="space-y-4">
              <h3 className="font-semibold">Special Requests & Add-ons</h3>
              
              <FormField
                control={form.control}
                name="needCrib"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0 py-3 px-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal cursor-pointer flex-1">I need a crib</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="needFlight"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0 py-3 px-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal cursor-pointer flex-1">I need to book a flight</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="needCarTransfer"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0 py-3 px-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal cursor-pointer flex-1">I need a car transfer</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requests (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Any special requests or notes..."
                        className="h-24 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Confirmation Preferences */}
            <div className="space-y-4">
              <h3 className="font-semibold">Confirmation Preferences</h3>
              
              <FormField
                control={form.control}
                name="paperlessConfirmation"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0 py-3 px-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal cursor-pointer flex-1">I prefer paperless confirmation</FormLabel>
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Send confirmation by:</Label>
                <FormField
                  control={form.control}
                  name="confirmByEmail"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 font-normal">Email</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmByText"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 font-normal">Text Message</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2 bg-muted p-4 rounded-lg">
              <h3 className="font-semibold">Price Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currencySymbol} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>{currencySymbol} {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee (5%):</span>
                  <span>{currencySymbol} {serviceFee.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{currencySymbol} {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
