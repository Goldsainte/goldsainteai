import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarketplaceDisclaimer } from "@/components/policies/MarketplaceDisclaimer";

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

      // Get auth token for Edge Function calls
      const { data: sessionData } = await supabase.auth.getSession();
      const authHeaders = { Authorization: `Bearer ${sessionData.session?.access_token}` };

      const { data, error } = await supabase.functions.invoke('process-marketplace-payment', {
        body: { jobId, bidId },
        headers: authHeaders
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.clientSecret) {
        // Create checkout session and redirect
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
          body: { 
            jobId, 
            bidId,
            amount,
            currency
          },
          headers: authHeaders
        });

        if (checkoutError) throw checkoutError;
        
        if (checkoutData?.url) {
          // Same-tab navigation to avoid popup blockers
          window.location.href = checkoutData.url;
          toast.success('Redirecting to secure payment...');
          onSuccess();
          onClose();
        }
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
          <Alert className="bg-muted/50 border-border">
            <AlertDescription className="text-xs">
              <p className="font-semibold mb-2">About this payment</p>
              <p className="mb-2">
                Goldsainte operates as a marketplace platform. Your trip is fulfilled by the 
                travel professional named in this booking — your seller of record. Payment is 
                processed securely by Stripe directly to their account.
              </p>
              <ul className="space-y-1">
                <li>• Platform service fee: Included in total</li>
                <li>• <strong>Direct payment:</strong> Processed securely by Stripe to your professional</li>
                <li>• Goldsainte support mediates if anything falls short</li>
              </ul>
            </AlertDescription>
          </Alert>

          <MarketplaceDisclaimer size="sm" />

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-xs">
              <strong className="block mb-1">Total Payment:</strong>
              <div className="text-lg font-semibold">
                {currency} {amount.toFixed(2)}
              </div>
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
              <strong>Secure payment:</strong> Your payment is processed by Stripe directly to the professional 
              fulfilling this booking — your seller of record. Goldsainte vets every professional and our support 
              team mediates disputes to protect both parties.
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
