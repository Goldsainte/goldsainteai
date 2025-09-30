import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface VisaServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromCountry: string;
  toCountry: string;
  visaInformation: any;
}

export const VisaServiceModal = ({
  open,
  onOpenChange,
  fromCountry,
  toCountry,
  visaInformation
}: VisaServiceModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userEmail: "",
    userName: "",
    userPhone: "",
    departureDate: "",
    returnDate: "",
    additionalNotes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-visa-request', {
        body: {
          userEmail: formData.userEmail,
          userName: formData.userName,
          userPhone: formData.userPhone,
          fromCountry,
          toCountry,
          visaInformation,
          travelDates: {
            departure: formData.departureDate,
            return: formData.returnDate
          },
          additionalNotes: formData.additionalNotes
        }
      });

      if (error) throw error;

      toast({
        title: "Request Submitted!",
        description: "Our team will contact you within 24 hours to assist with your visa application.",
      });

      // Reset form and close modal
      setFormData({
        userEmail: "",
        userName: "",
        userPhone: "",
        departureDate: "",
        returnDate: "",
        additionalNotes: ""
      });
      onOpenChange(false);

    } catch (error) {
      console.error('Error submitting visa request:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-chiffon">Goldsainte Visa Assistance</DialogTitle>
          <DialogDescription>
            Let our expert team handle your visa application for travel from {fromCountry} to {toCountry}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Full Name *</Label>
            <Input
              id="userName"
              placeholder="John Doe"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userEmail">Email Address *</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="john@example.com"
              value={formData.userEmail}
              onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userPhone">Phone Number</Label>
            <Input
              id="userPhone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.userPhone}
              onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureDate">Departure Date</Label>
              <Input
                id="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate">Return Date</Label>
              <Input
                id="returnDate"
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any special requirements or questions..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
