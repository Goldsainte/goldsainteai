import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

interface PaymentDisputeModalProps {
  paymentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentDisputeModal({ paymentId, open, onOpenChange }: PaymentDisputeModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the dispute",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('payment_disputes')
        .insert({
          payment_id: paymentId,
          raised_by: 'vendor',
          dispute_reason: reason,
          evidence: { description: evidence },
          resolution_status: 'open',
        });

      if (error) throw error;

      toast({
        title: "Dispute Filed",
        description: "Your payment dispute has been submitted for review",
      });

      onOpenChange(false);
      setReason("");
      setEvidence("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            File Payment Dispute
          </DialogTitle>
          <DialogDescription>
            Describe the issue with this payment. Our team will review your dispute.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Dispute Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Why are you disputing this payment?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence">Additional Evidence</Label>
            <Textarea
              id="evidence"
              placeholder="Provide any supporting details or documentation references"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit Dispute"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
