import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JobApprovalModalProps {
  submission: any;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JobApprovalModal = ({
  submission,
  jobTitle,
  isOpen,
  onClose,
  onSuccess
}: JobApprovalModalProps) => {
  const [feedback, setFeedback] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const handleApprove = async () => {
    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('approve-job-completion', {
        body: { 
          submissionId: submission.id,
          feedback: feedback.trim()
        }
      });

      if (error) throw error;

      toast.success('Job approved! Funds released to agent.');
      onSuccess();
      onClose();
      setFeedback("");
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve completion');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestRevision: boolean) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('reject-job-completion', {
        body: { 
          submissionId: submission.id,
          rejectionReason: rejectionReason.trim(),
          requestRevision
        }
      });

      if (error) throw error;

      const message = requestRevision 
        ? 'Revision requested. Agent has been notified.'
        : 'Completion rejected. This will be escalated for review.';
      
      toast.success(message);
      onSuccess();
      onClose();
      setRejectionReason("");
      setShowReject(false);
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast.error(error.message || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  if (showReject) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Review Completion Issues
            </DialogTitle>
            <DialogDescription>
              Explain what needs to be addressed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Issue Description *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explain what's missing or needs to be corrected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReject(false)}
              disabled={processing}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReject(true)}
              disabled={processing || !rejectionReason.trim()}
              className="flex-1"
            >
              Request Revision
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReject(false)}
              disabled={processing || !rejectionReason.trim()}
              className="flex-1"
            >
              Reject & Dispute
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review Job Completion</DialogTitle>
          <DialogDescription>
            "{jobTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              <strong>Agent's Completion Notes:</strong>
              <p className="mt-2 whitespace-pre-wrap">{submission.completion_notes}</p>
            </AlertDescription>
          </Alert>

          {submission.deliverables_description && (
            <Alert>
              <AlertDescription>
                <strong>Deliverables:</strong>
                <p className="mt-2 whitespace-pre-wrap">{submission.deliverables_description}</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-900 dark:text-green-100">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Approving will release payment to the agent. This action cannot be undone.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Leave feedback for the agent..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowReject(true)}
            disabled={processing}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Issues Found
          </Button>
          <Button
            onClick={handleApprove}
            disabled={processing}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {processing ? 'Processing...' : 'Approve & Release Funds'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
