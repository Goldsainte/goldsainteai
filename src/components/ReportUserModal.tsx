import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  reportedUserId?: string;
  reportedUserName?: string;
  contentType?: 'user' | 'post' | 'comment' | 'story' | 'message';
  contentId?: string;
}

export function ReportUserModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  contentType = 'user',
  contentId,
}: ReportUserModalProps) {
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reportCategories = contentType === 'user' ? [
    { value: 'spam', label: 'Spam or scam' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'other', label: 'Other' },
  ] : [
    { value: 'nudity', label: 'Nudity or sexual content' },
    { value: 'hate_speech', label: 'Hate speech or harassment' },
    { value: 'violence', label: 'Violence or graphic content' },
    { value: 'spam', label: 'Spam or scam' },
    { value: 'misinformation', label: 'False information' },
    { value: 'bullying', label: 'Bullying or harassment' },
    { value: 'self_harm', label: 'Self-harm or suicide' },
    { value: 'minor_safety', label: 'Child safety concern' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async () => {
    if (!category || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to report");
        return;
      }

      // Determine severity based on category
      const highSeverityCategories = ['violence', 'hate_speech', 'self_harm', 'minor_safety'];
      const severity = highSeverityCategories.includes(category) ? 'high' : 'medium';

      if (contentType === 'user') {
        const { error } = await supabase.from('user_reports').insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          report_type: 'user',
          report_category: category,
          description,
          severity,
        });
        if (error) throw error;
      } else {
        // Report content (post, comment, story, message)
        const { error } = await supabase.from('content_moderation_flags').insert({
          content_type: contentType,
          content_id: contentId!,
          flagged_by_user_id: user.id,
          flag_source: 'user',
          violation_type: category,
          severity,
          ai_analysis: { user_description: description },
        });
        if (error) throw error;
      }

      toast.success("Report submitted. Our team will review it shortly.");
      onClose();
      setCategory('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
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
            Report {contentType === 'user' ? (reportedUserName || 'User') : contentType}
          </DialogTitle>
          <DialogDescription>
            Help us understand what's happening. Your report is anonymous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Why are you reporting this?</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a reason" />
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
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !category}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
