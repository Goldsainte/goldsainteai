import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Info } from "lucide-react";

interface BookingCancellationProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  bookingType: string;
  checkInDate: string;
  totalPrice: number;
  currency: string;
  onCancellationComplete: () => void;
}

export const BookingCancellation = ({
  open,
  onClose,
  bookingId,
  bookingType,
  checkInDate,
  totalPrice,
  currency,
  onCancellationComplete,
}: BookingCancellationProps) => {
  const { toast } = useToast();
  const [cancellationReason, setCancellationReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [estimatedRefund, setEstimatedRefund] = useState<{
    percentage: number;
    amount: number;
  } | null>(null);

  // Calculate hours until check-in and estimated refund
  useEffect(() => {
    const fetchPolicies = async () => {
      const { data } = await supabase
        .from("booking_cancellation_policies")
        .select("*")
        .eq("booking_type", bookingType)
        .eq("is_active", true)
        .order("hours_before_checkin", { ascending: false });

      if (data) {
        setPolicies(data);

        // Calculate which policy applies
        const checkIn = new Date(checkInDate);
        const now = new Date();
        const hoursUntil = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

        let applicablePolicy = null;
        for (const policy of data) {
          if (hoursUntil >= policy.hours_before_checkin) {
            applicablePolicy = policy;
            break;
          }
        }

        if (!applicablePolicy && data.length > 0) {
          applicablePolicy = data[data.length - 1];
        }

        if (applicablePolicy) {
          setEstimatedRefund({
            percentage: applicablePolicy.refund_percentage,
            amount: (totalPrice * applicablePolicy.refund_percentage) / 100,
          });
        }
      }
    };

    if (open) {
      fetchPolicies();
    }
  }, [open, bookingType, checkInDate, totalPrice]);

  const handleCancellation = async () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("request-booking-cancellation", {
        body: {
          bookingId,
          cancellationReason: cancellationReason.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: "Cancellation Requested",
        description: data.message,
      });

      onCancellationComplete();
      onClose();
    } catch (error: any) {
      console.error("Cancellation error:", error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to process cancellation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Review the cancellation policy and provide a reason for cancellation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cancellation Policy Info */}
          {estimatedRefund && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">
                    Estimated Refund: {estimatedRefund.percentage}%
                  </p>
                  <p>
                    You will receive approximately {currency}{" "}
                    {estimatedRefund.amount.toFixed(2)} back to your payment method.
                  </p>
                  {estimatedRefund.percentage < 100 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Refunds typically process within 5-10 business days.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Full Policy Details */}
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">Cancellation Policy</h4>
            {policies.map((policy, index) => (
              <div key={policy.id} className="text-sm space-y-1">
                <p className="font-medium">{policy.policy_name}</p>
                <p className="text-muted-foreground">{policy.description}</p>
                {index < policies.length - 1 && <div className="border-t my-2" />}
              </div>
            ))}
          </div>

          {estimatedRefund?.percentage === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No refund will be issued for cancellations at this time. Please
                review the policy above before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Cancellation *</label>
            <Textarea
              placeholder="Please tell us why you're cancelling..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancellation}
            disabled={loading || !cancellationReason.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {estimatedRefund?.percentage === 0
              ? "Cancel Without Refund"
              : "Request Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
