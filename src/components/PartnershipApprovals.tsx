import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Partnership {
  id: string;
  package_id: string;
  influencer_id: string;
  status: string;
  created_at: string;
  promo_code: string;
  influencer: {
    username: string;
    avatar_url: string | null;
  };
  package: {
    package_name: string;
    destination: string;
    duration_days: number;
    retail_price: number;
    cover_image_url: string | null;
  };
}

export const PartnershipApprovals = () => {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPendingPartnerships();
    }
  }, [user]);

  const fetchPendingPartnerships = async () => {
    try {
      // Get agent's packages first
      const { data: agentData } = await supabase
        .from('travel_agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!agentData) {
        setPartnerships([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("influencer_promotions")
        .select(`
          id,
          package_id,
          influencer_id,
          status,
          created_at,
          promo_code,
          influencer:profiles!influencer_promotions_influencer_id_fkey(username, avatar_url),
          package:agent_packages!influencer_promotions_package_id_fkey(package_name, destination, duration_days, retail_price, cover_image_url)
        `)
        .in("package_id", [agentData.id])
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPartnerships(data as any || []);
    } catch (error) {
      console.error("Error fetching partnerships:", error);
      toast.error("Failed to load promotion requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (partnershipId: string) => {
    try {
      const { error } = await supabase
        .from("influencer_promotions")
        .update({
          status: "active"
        })
        .eq("id", partnershipId);

      if (error) throw error;

      toast.success("Promotion approved! Influencer can now share their promo code.");
      fetchPendingPartnerships();
    } catch (error) {
      console.error("Error approving promotion:", error);
      toast.error("Failed to approve promotion");
    }
  };

  const handleReject = async () => {
    if (!selectedPartnership) return;

    try {
      const { error } = await supabase
        .from("influencer_promotions")
        .update({
          status: "rejected"
        })
        .eq("id", selectedPartnership.id);

      if (error) throw error;

      toast.success("Promotion declined");
      setSelectedPartnership(null);
      setRejectionReason("");
      fetchPendingPartnerships();
    } catch (error) {
      console.error("Error rejecting promotion:", error);
      toast.error("Failed to decline promotion");
    }
  };

  if (loading) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors text-primary">
          <span className="text-sm font-medium">Promotion Requests</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (partnerships.length === 0) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors text-primary">
          <span className="text-sm font-medium">Promotion Requests</span>
          <Badge variant="secondary" className="ml-2">0</Badge>
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending promotion requests</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors text-primary">
          <span className="text-sm font-medium">Promotion Requests</span>
          <Badge variant="destructive" className="ml-2">{partnerships.length}</Badge>
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-4">
        {partnerships.map((partnership) => (
          <Card key={partnership.id} className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={partnership.influencer.avatar_url || ""} />
                <AvatarFallback>
                  {partnership.influencer.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-medium">@{partnership.influencer.username}</p>
                  <p className="text-sm text-muted-foreground">
                    wants to promote your package
                  </p>
                </div>

                {partnership.package.cover_image_url && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={partnership.package.cover_image_url}
                      alt={partnership.package.package_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <p className="font-medium">{partnership.package.package_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {partnership.package.destination} • {partnership.package.duration_days} days • ${partnership.package.retail_price}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Promo: {partnership.promo_code}</Badge>
                    <span className="text-muted-foreground">5% discount for customers</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(partnership.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPartnership(partnership)}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          </Card>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog
        open={!!selectedPartnership}
        onOpenChange={() => setSelectedPartnership(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Promotion Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this promotion request from @{selectedPartnership?.influencer.username}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedPartnership(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleReject} variant="destructive" className="flex-1">
                Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
