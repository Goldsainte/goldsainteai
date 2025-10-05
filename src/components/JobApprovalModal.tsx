import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface JobApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  jobId: string;
  completionNotes: string;
  deliverables?: string;
  onSuccess?: () => void;
}

export function JobApprovalModal({
  open,
  onOpenChange,
  submissionId,
  jobId,
  completionNotes,
  deliverables,
  onSuccess,
}: JobApprovalModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleDecision = async (approved: boolean) => {
    setLoading(true);
    try {
      const { error: submissionError } = await supabase
        .from("job_completion_submissions")
        .update({
          status: approved ? "approved" : "rejected",
          customer_response: response || null,
          customer_response_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      if (submissionError) throw submissionError;

      const { error: jobError } = await supabase
        .from("marketplace_jobs")
        .update({
          status: approved ? "completed" : "in_progress",
          completed_at: approved ? new Date().toISOString() : null,
        })
        .eq("id", jobId);

      if (jobError) throw jobError;

      toast({
        title: approved ? "Job Approved" : "Changes Requested",
        description: approved
          ? "The job has been marked as completed"
          : "The agent has been notified of your feedback",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Action failed",
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
          <DialogTitle>Review Job Completion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Agent's Completion Notes</Label>
            <div className="mt-2 p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{completionNotes}</p>
            </div>
          </div>

          {deliverables && (
            <div>
              <Label>Deliverables</Label>
              <div className="mt-2 p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{deliverables}</p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="response">Your Feedback (Optional)</Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Provide feedback or request changes..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleDecision(false)}
              variant="destructive"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Request Changes
            </Button>
            <Button
              onClick={() => handleDecision(true)}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Approve & Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
