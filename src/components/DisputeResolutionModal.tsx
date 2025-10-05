import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DisputeResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onSuccess?: () => void;
}

export function DisputeResolutionModal({
  open,
  onOpenChange,
  jobId,
  onSuccess,
}: DisputeResolutionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [disputeType, setDisputeType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!disputeType || !description.trim() || !user) {
      toast({
        title: "Required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("marketplace_disputes").insert({
        job_id: jobId,
        raised_by: user.id,
        dispute_type: disputeType,
        description: description,
        status: "open",
      });

      if (error) throw error;

      toast({
        title: "Dispute Raised",
        description:
          "Your dispute has been submitted and will be reviewed by our team",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Disputes should only be raised for serious issues. Our mediation
              team will review and help resolve the matter fairly.
            </p>
          </div>

          <div>
            <Label htmlFor="dispute-type">
              Dispute Type <span className="text-destructive">*</span>
            </Label>
            <Select value={disputeType} onValueChange={setDisputeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select dispute type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quality">Quality of Service</SelectItem>
                <SelectItem value="delivery">
                  Delayed or Missing Delivery
                </SelectItem>
                <SelectItem value="payment">Payment Issue</SelectItem>
                <SelectItem value="communication">
                  Communication Problem
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">
              Detailed Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide a detailed explanation of the issue..."
              className="min-h-[150px]"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Our mediation team typically responds within 24-48 hours. Both
            parties will be notified and have an opportunity to provide their
            perspective.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} variant="destructive">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
