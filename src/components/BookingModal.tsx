import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/lib/currencyHelpers";
import { useNavigate, Link } from "react-router-dom";
import { BookingPolicyBanner } from "./BookingPolicyBanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrustSafetyModal } from "@/components/trust/TrustSafetyModal";
import { Checkbox } from "@/components/ui/checkbox";

const bookingFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(1, "Phone number is required"),
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [ackGoldsaintePolicies, setAckGoldsaintePolicies] = useState(false);
  const [ackAgentTerms, setAckAgentTerms] = useState(false);

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: '',
      phoneCountryCode: '+1',
      phone: '',
    },
  });

  // Auto-populate user details from account
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
          
          const nameParts = profile.username?.split(' ') || [];
          form.setValue('firstName', nameParts[0] || '');
          form.setValue('lastName', nameParts.slice(1).join(' ') || '');
          form.setValue('email', user.email || '');
          
          if (profile.country) form.setValue('country', profile.country);
          if (profile.phone) form.setValue('phone', profile.phone);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (open) {
      loadUserProfile();
    }
  }, [user, open, form]);
  
  const currencySymbol = getCurrencySymbol(currency);

  const handleDirectBooking = () => {
    if (!ackGoldsaintePolicies || !ackAgentTerms) {
      toast({
        title: "Please review policies",
        description: "You must acknowledge the trip and platform policies before completing your booking.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Direct booking unavailable",
      description: "Please use our Agent Marketplace to complete your booking",
      variant: "default",
    });
    handleAgentContact();
  };

  const handleAgentContact = () => {
    if (!ackGoldsaintePolicies || !ackAgentTerms) {
      toast({
        title: "Please review policies",
        description: "You must acknowledge the trip and platform policies before proceeding.",
        variant: "destructive",
      });
      return;
    }

    navigate('/marketplace');
    onClose();
    toast({
      title: "Agent Marketplace",
      description: "Browse our certified travel agents who can handle your booking.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>Choose how you'd like to proceed with your reservation</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] p-4 text-sm text-[#4a4a4a] space-y-2 mb-4">
          <p className="text-sm font-semibold text-[#0a2225]">Before you confirm</p>
          <p>
            Please make sure you're comfortable with the itinerary, total price, and cancellation terms. All payments and important
            updates should stay inside Goldsainte so we can help if anything needs to be reviewed.
          </p>
          <button
            type="button"
            onClick={() => setSafetyModalOpen(true)}
            className="text-sm font-semibold text-[#0c4d47] underline-offset-4 hover:underline"
          >
            Review safety &amp; liability details
          </button>
        </div>

        <BookingPolicyBanner bookingType={bookingType} />

        {/* Traveler Policy Acknowledgements */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 px-3 py-3 text-xs">
          <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Checkbox
              checked={ackGoldsaintePolicies}
              onCheckedChange={(checked) => setAckGoldsaintePolicies(Boolean(checked))}
            />
            <span>
              I understand that Goldsainte is a marketplace and that my trip is fulfilled by
              the travel professional or supplier named in this booking. I have reviewed the{" "}
              <Link
                to="/cancellation-refund-policy"
                className="underline underline-offset-2"
                target="_blank"
              >
                Cancellation & Refund Policy
              </Link>{" "}
              and agree to these terms for this booking.
            </span>
          </label>

          <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Checkbox
              checked={ackAgentTerms}
              onCheckedChange={(checked) => setAckAgentTerms(Boolean(checked))}
            />
            <span>
              I understand that the travel professional's own cancellation, refund, and
              deposit terms apply in addition to Goldsainte's marketplace policies, and I
              have reviewed them before proceeding.
            </span>
          </label>
        </div>

        {/* Booking Options */}
        <div className="space-y-4">
          {/* Room/Booking Details */}
          {bookingType === 'hotel' && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">Selected {bookingType === 'hotel' ? 'Hotel' : 'Booking'}</h3>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {bookingData.name}</p>
                {bookingData.checkIn && <p><strong>Check-in:</strong> {bookingData.checkIn}</p>}
                {bookingData.checkOut && <p><strong>Check-out:</strong> {bookingData.checkOut}</p>}
                <p><strong>Guests:</strong> {bookingData.adults || bookingData.guests || 2} adults{bookingData.children ? `, ${bookingData.children} children` : ''}</p>
                <p className="text-lg font-semibold text-primary mt-2">
                  Estimated: {currencySymbol}{totalPrice?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Connect with Agent */}
          <Alert className="border-primary/20">
            <Users className="h-4 w-4" />
            <AlertDescription className="space-y-3 mt-2">
              <div>
                <p className="font-semibold text-foreground mb-1">Connect with a Travel Agent</p>
                <p className="text-sm text-muted-foreground">
                  Let one of our certified Goldsainte travel agents handle everything for you. They'll manage your booking and provide personalized service.
                </p>
              </div>
              <Button 
                onClick={handleAgentContact} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Users className="mr-2 h-4 w-4" />
                Browse Travel Agents
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Goldsainte connects you with the best booking options. We don't process payments directly.
        </div>

        <TrustSafetyModal
          open={safetyModalOpen}
          onClose={() => setSafetyModalOpen(false)}
          context="booking"
        />
      </DialogContent>
    </Dialog>
  );
};
