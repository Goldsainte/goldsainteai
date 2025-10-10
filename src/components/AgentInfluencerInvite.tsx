import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AgentInfluencerInviteProps {
  influencer: {
    id: string;
    username: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface Package {
  id: string;
  package_name: string;
  destination: string;
  retail_price: number;
}

export const AgentInfluencerInvite = ({
  influencer,
  onClose,
  onSuccess,
}: AgentInfluencerInviteProps) => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgentPackages();
  }, [user]);

  const fetchAgentPackages = async () => {
    if (!user) return;

    try {
      const { data: agentData } = await supabase
        .from('travel_agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!agentData) return;

      const { data, error } = await supabase
        .from('agent_packages')
        .select('id, package_name, destination, retail_price')
        .eq('agent_id', agentData.id)
        .eq('is_active', true)
        .eq('status', 'active');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to load your packages");
    }
  };

  const handleInvite = async () => {
    if (!selectedPackage || !user) {
      toast.error("Please select a package");
      return;
    }

    setLoading(true);
    try {
      // Generate promo code
      const promoCode = `${influencer.username.toUpperCase().slice(0, 8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { error } = await supabase
        .from('influencer_promotions')
        .insert({
          package_id: selectedPackage,
          influencer_id: influencer.id,
          promo_code: promoCode,
          status: 'pending',
          initiated_by: 'agent',
        });

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite @{influencer.username} to Promote</DialogTitle>
          <DialogDescription>
            Select a package for this influencer to promote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Package</label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a package..." />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.package_name} - {pkg.destination} (${pkg.retail_price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message (Optional)</label>
            <Textarea
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={loading || !selectedPackage}
              className="flex-1"
            >
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
