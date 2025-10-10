import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

interface CreatorPartnershipRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
}

export const CreatorPartnershipRequest = ({ 
  open, 
  onOpenChange, 
  brandId
}: CreatorPartnershipRequestProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pitch: "",
    sample_content_url: "",
    rate: "",
    deliverables: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('brand_partnerships')
        .insert({
          brand_id: brandId,
          creator_id: user.id,
          campaign_name: `Partnership Request from ${formData.pitch.substring(0, 50)}`,
          campaign_details: formData.pitch,
          payment_amount: parseFloat(formData.rate),
          deliverables: formData.deliverables,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Partnership Request Sent! ✨",
        description: "The brand will review your proposal",
      });

      setFormData({
        pitch: "",
        sample_content_url: "",
        rate: "",
        deliverables: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending partnership request:', error);
      toast({
        title: "Error",
        description: "Failed to send partnership request",
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
            <Sparkles className="h-5 w-5 text-primary" />
            Request Brand Partnership
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="pitch">Your Pitch *</Label>
            <Textarea
              id="pitch"
              value={formData.pitch}
              onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
              placeholder="Tell the brand why you'd be a great partner..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sample_content_url">Portfolio/Sample Content URL</Label>
            <Input
              id="sample_content_url"
              value={formData.sample_content_url}
              onChange={(e) => setFormData({ ...formData, sample_content_url: e.target.value })}
              placeholder="https://your-portfolio.com or link to best content"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Your Rate (USD) *</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              placeholder="500.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliverables">What You'll Deliver *</Label>
            <Textarea
              id="deliverables"
              value={formData.deliverables}
              onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
              placeholder="e.g., 2 Instagram posts, 1 reel, story mentions..."
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
