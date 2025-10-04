import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface JobCompletionModalProps {
  jobId: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JobCompletionModal = ({
  jobId,
  jobTitle,
  isOpen,
  onClose,
  onSuccess
}: JobCompletionModalProps) => {
  const [completionNotes, setCompletionNotes] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!completionNotes.trim()) {
      toast.error("Please provide completion notes");
      return;
    }

    try {
      setSubmitting(true);

      const { data, error } = await supabase.functions.invoke('submit-job-completion', {
        body: { 
          jobId,
          completionNotes: completionNotes.trim(),
          deliverablesDescription: deliverables.trim()
        }
      });

      if (error) throw error;

      toast.success('Job completion submitted for customer review');
      onSuccess();
      onClose();
      setCompletionNotes("");
      setDeliverables("");
    } catch (error: any) {
      console.error('Completion submission error:', error);
      toast.error(error.message || 'Failed to submit completion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Submit Job Completion
          </DialogTitle>
          <DialogDescription>
            Mark "{jobTitle}" as complete and notify the customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Once submitted, the customer will review your work. Payment will be released upon approval.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completionNotes">Completion Summary *</Label>
            <Textarea
              id="completionNotes"
              placeholder="Describe what you've completed and any important details..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Explain what you've delivered and any next steps for the customer
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliverables">Deliverables / Booking Details</Label>
            <Textarea
              id="deliverables"
              placeholder="List booking confirmations, tickets, vouchers, or other deliverables..."
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Include confirmation numbers, links, or document details
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !completionNotes.trim()}
            className="flex-1"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
