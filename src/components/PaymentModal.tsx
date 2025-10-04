import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentModalProps {
  jobId: string;
  bidId: string;
  amount: number;
  currency: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal = ({
  jobId,
  bidId,
  amount,
  currency,
  agentName,
  isOpen,
  onClose,
  onSuccess
}: PaymentModalProps) => {
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('process-marketplace-payment', {
        body: { jobId, bidId }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.clientSecret) {
        // In a real implementation, you'd use Stripe Elements here
        // For now, we'll show a success message
        toast.success('Payment processing initiated');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Payment
          </DialogTitle>
          <DialogDescription>
            Complete your payment to {agentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Payment Breakdown:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Service Fee: Included in total</li>
                <li>• Secure Payment: Powered by Stripe</li>
                <li>• Agent receives payment after job completion</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold">
                {currency} {amount.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Includes 3% platform service fee
            </p>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              <strong>Protection:</strong> Your payment is held securely until the job is completed. 
              Agent receives funds only after successful delivery.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {processing ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Powered by Stripe • Secure SSL encryption
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
