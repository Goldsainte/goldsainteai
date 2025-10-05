import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  reportedAgentId?: string;
}

const reportTypes = [
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "fraud", label: "Fraud or Scam" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "other", label: "Other" },
];

const reportCategories = [
  { value: "user_behavior", label: "User Behavior" },
  { value: "service_quality", label: "Service Quality" },
  { value: "payment", label: "Payment" },
  { value: "safety", label: "Safety" },
  { value: "other", label: "Other" },
];

export function ReportUserModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  reportedAgentId,
}: ReportUserModalProps) {
  const [reportType, setReportType] = useState<string>("");
  const [reportCategory, setReportCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reportType || !reportCategory || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_reports").insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reported_agent_id: reportedAgentId || null,
        report_type: reportType,
        report_category: reportCategory,
        description: description.trim(),
        severity: reportType === "fraud" || reportType === "harassment" ? "high" : "medium",
      });

      if (error) throw error;

      toast.success("Report submitted successfully");
      onClose();
      setReportType("");
      setReportCategory("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report User: {reportedUserName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="report-category">Category</Label>
            <Select value={reportCategory} onValueChange={setReportCategory}>
              <SelectTrigger id="report-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {reportCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about your report..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 20 characters
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !reportType || !reportCategory || description.trim().length < 20}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
