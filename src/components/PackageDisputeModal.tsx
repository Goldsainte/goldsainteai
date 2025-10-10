import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

interface PackageDisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  packageType: 'cocurated' | 'creator_package';
  bookingId?: string;
  creatorId?: string;
  onSuccess?: () => void;
}

export function PackageDisputeModal({
  open,
  onOpenChange,
  packageId,
  packageType,
  bookingId,
  creatorId,
  onSuccess,
}: PackageDisputeModalProps) {
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
      const { error } = await supabase.from("package_disputes").insert({
        package_id: packageId,
        package_type: packageType,
        booking_id: bookingId,
        raised_by: user.id,
        creator_id: creatorId,
        dispute_type: disputeType,
        description: description,
        status: "open",
      });

      if (error) throw error;

      toast({
        title: "Dispute Raised",
        description:
          "Your dispute has been submitted and will be reviewed by our team within 24-48 hours",
      });

      setDisputeType("");
      setDescription("");
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

  const packageTypeLabel = packageType === 'cocurated' ? 'CoCurated™' : 'Creator';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Raise a Dispute - {packageTypeLabel} Package
          </DialogTitle>
          <DialogDescription>
            File a dispute if you've experienced issues with this package booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Disputes should only be raised for serious issues. Our mediation
              team will review both sides and help resolve the matter fairly. Both
              you and the package creator will be notified.
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
                  Delayed or Missing Service
                </SelectItem>
                <SelectItem value="payment">Payment Issue</SelectItem>
                <SelectItem value="refund">Refund Request</SelectItem>
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
              placeholder="Please provide a detailed explanation of the issue, including dates, specific problems, and what resolution you're seeking..."
              className="min-h-[150px]"
            />
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>What happens next:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Our mediation team typically responds within 24-48 hours</li>
              <li>Both parties will be notified and can provide their perspective</li>
              <li>We'll work towards a fair resolution for everyone involved</li>
              <li>You'll receive updates on the dispute status via notifications</li>
            </ul>
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
