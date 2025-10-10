import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, DollarSign } from "lucide-react";

interface BrandPartnershipProposalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId?: string;
  postId?: string;
}

export const BrandPartnershipProposal = ({ 
  open, 
  onOpenChange, 
  creatorId,
  postId 
}: BrandPartnershipProposalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_details: "",
    payment_amount: "",
    deliverables: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!creatorId) {
      toast({
        title: "Error",
        description: "Please select a creator to partner with",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('brand_partnerships')
        .insert({
          brand_id: user.id,
          creator_id: creatorId,
          post_id: postId || null,
          campaign_name: formData.campaign_name,
          campaign_details: formData.campaign_details,
          payment_amount: parseFloat(formData.payment_amount),
          deliverables: formData.deliverables,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Partnership Proposal Sent! 🤝",
        description: "The creator will review your proposal",
      });

      setFormData({
        campaign_name: "",
        campaign_details: "",
        payment_amount: "",
        deliverables: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating partnership:', error);
      toast({
        title: "Error",
        description: "Failed to send partnership proposal",
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
            <Briefcase className="h-5 w-5 text-primary" />
            Brand Partnership Proposal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="campaign_name">Campaign Name *</Label>
            <Input
              id="campaign_name"
              value={formData.campaign_name}
              onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
              placeholder="e.g., Summer Travel Campaign 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_amount">Payment Amount (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="payment_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.payment_amount}
                onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                placeholder="500.00"
                className="pl-8"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign_details">Campaign Details *</Label>
            <Textarea
              id="campaign_details"
              value={formData.campaign_details}
              onChange={(e) => setFormData({ ...formData, campaign_details: e.target.value })}
              placeholder="Describe your campaign objectives, target audience, and key messages..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliverables">Deliverables *</Label>
            <Textarea
              id="deliverables"
              value={formData.deliverables}
              onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
              placeholder="e.g., 3 Instagram posts, 1 YouTube video, usage rights for 6 months..."
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
              {loading ? "Sending..." : "Send Proposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
