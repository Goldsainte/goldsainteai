import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
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

interface Partnership {
  id: string;
  post_id: string;
  creator_id: string;
  status: string;
  created_at: string;
  creator: {
    username: string;
    avatar_url: string | null;
  };
  post: {
    caption: string;
    media_url: string;
  };
}

export const PartnershipApprovals = () => {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (user) {
      fetchPendingPartnerships();
    }
  }, [user]);

  const fetchPendingPartnerships = async () => {
    try {
      const { data, error } = await supabase
        .from("paid_partnerships")
        .select(`
          id,
          post_id,
          creator_id,
          status,
          created_at,
          creator:profiles!paid_partnerships_creator_id_fkey(username, avatar_url),
          post:travel_posts(caption, media_url)
        `)
        .eq("brand_id", user?.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPartnerships(data as any || []);
    } catch (error) {
      console.error("Error fetching partnerships:", error);
      toast.error("Failed to load partnership requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (partnershipId: string) => {
    try {
      const { error } = await supabase
        .from("paid_partnerships")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", partnershipId);

      if (error) throw error;

      toast.success("Partnership approved!");
      fetchPendingPartnerships();
    } catch (error) {
      console.error("Error approving partnership:", error);
      toast.error("Failed to approve partnership");
    }
  };

  const handleReject = async () => {
    if (!selectedPartnership) return;

    try {
      const { error } = await supabase
        .from("paid_partnerships")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || "No reason provided",
        })
        .eq("id", selectedPartnership.id);

      if (error) throw error;

      toast.success("Partnership declined");
      setSelectedPartnership(null);
      setRejectionReason("");
      fetchPendingPartnerships();
    } catch (error) {
      console.error("Error rejecting partnership:", error);
      toast.error("Failed to decline partnership");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (partnerships.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No pending partnership requests</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {partnerships.map((partnership) => (
          <Card key={partnership.id} className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={partnership.creator.avatar_url || ""} />
                <AvatarFallback>
                  {partnership.creator.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-medium">@{partnership.creator.username}</p>
                  <p className="text-sm text-muted-foreground">
                    wants to tag you in a paid partnership
                  </p>
                </div>

                {partnership.post.media_url && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                    {partnership.post.media_url.includes("video") ? (
                      <video
                        src={partnership.post.media_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={partnership.post.media_url}
                        alt="Post preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}

                {partnership.post.caption && (
                  <p className="text-sm line-clamp-2">{partnership.post.caption}</p>
                )}

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

      <Dialog
        open={!!selectedPartnership}
        onOpenChange={() => setSelectedPartnership(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Partnership</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for declining this partnership request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for declining (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedPartnership(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleReject} className="flex-1">
                Confirm Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
