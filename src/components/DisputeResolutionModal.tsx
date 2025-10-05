import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const disputeSchema = z.object({
  dispute_type: z.enum(['quality', 'delivery', 'communication', 'refund', 'other']),
  description: z.string().trim().min(20, "Please provide at least 20 characters").max(2000)
});

interface DisputeResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onDisputeRaised: () => void;
}

export const DisputeResolutionModal = ({ 
  open, 
  onOpenChange, 
  jobId,
  onDisputeRaised 
}: DisputeResolutionModalProps) => {
  const { user } = useAuth();
  const [disputeType, setDisputeType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    try {
      const validation = disputeSchema.safeParse({ 
        dispute_type: disputeType,
        description 
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setSubmitting(true);

      // Create dispute record
      const { error: disputeError } = await supabase
        .from('marketplace_disputes')
        .insert({
          job_id: jobId,
          raised_by: user.id,
          dispute_type: validation.data.dispute_type,
          description: validation.data.description,
          status: 'open'
        });

      if (disputeError) throw disputeError;

      // Update job status to disputed
      const { error: jobError } = await supabase
        .from('marketplace_jobs')
        .update({
          status: 'disputed',
          dispute_reason: validation.data.description,
          dispute_opened_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      toast.success("Dispute raised successfully. Our team will review it shortly.");
      onDisputeRaised();
      onOpenChange(false);
      
      // Reset form
      setDisputeType("");
      setDescription("");
    } catch (error: any) {
      console.error('Error raising dispute:', error);
      toast.error('Failed to raise dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Raise a Dispute
          </DialogTitle>
          <DialogDescription>
            If you're experiencing issues with this job, please provide details below. 
            Our support team will review and mediate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Dispute Type</Label>
            <Select value={disputeType} onValueChange={setDisputeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select dispute type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quality">Quality Issues</SelectItem>
                <SelectItem value="delivery">Late/Non-Delivery</SelectItem>
                <SelectItem value="communication">Communication Problems</SelectItem>
                <SelectItem value="refund">Refund Request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Please describe the issue in detail (minimum 20 characters)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/2000 characters
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">What happens next?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your dispute will be reviewed by our support team within 24-48 hours</li>
              <li>• Both parties will be contacted for additional information if needed</li>
              <li>• Funds will remain in escrow until resolution</li>
              <li>• You'll receive email updates on the dispute status</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !disputeType || description.length < 20}
              variant="destructive"
            >
              {submitting ? "Submitting..." : "Raise Dispute"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};