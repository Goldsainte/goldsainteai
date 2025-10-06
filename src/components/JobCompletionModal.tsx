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
import { Loader2 } from "lucide-react";

interface JobCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  agentId: string;
  onSuccess?: () => void;
}

export function JobCompletionModal({
  open,
  onOpenChange,
  jobId,
  agentId,
  onSuccess,
}: JobCompletionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [deliverables, setDeliverables] = useState("");

  const handleSubmit = async () => {
    if (!completionNotes.trim()) {
      toast({
        title: "Required field",
        description: "Please provide completion notes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("job_completion_submissions")
        .insert({
          job_id: jobId,
          agent_id: agentId,
          completion_notes: completionNotes,
          deliverables_description: deliverables,
          status: "pending",
        });

      if (error) throw error;

      const { error: jobError } = await supabase
        .from("marketplace_jobs")
        .update({ status: "pending_approval" })
        .eq("id", jobId);

      if (jobError) throw jobError;

      // Get submission ID
      const { data: submission } = await supabase
        .from("job_completion_submissions")
        .select("id")
        .eq("job_id", jobId)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Send notification
      if (submission) {
        await supabase.functions.invoke('notify-job-completed', {
          body: { jobId, submissionId: submission.id }
        }).catch(err => console.error('Notification error:', err));
      }

      toast({
        title: "Success",
        description: "Job completion submitted for review",
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
          <DialogTitle>Submit Job Completion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="completion-notes">
              Completion Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="completion-notes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Describe what was completed and any important details..."
              className="min-h-[120px]"
            />
          </div>

          <div>
            <Label htmlFor="deliverables">Deliverables Summary</Label>
            <Textarea
              id="deliverables"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="List the deliverables provided (bookings, itineraries, etc.)..."
              className="min-h-[100px]"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Once submitted, the client will review your work and either approve
            or request changes.
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
