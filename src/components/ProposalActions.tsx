import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProposalActionsProps {
  proposalId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

export function ProposalActions({ proposalId, currentStatus, onStatusChange }: ProposalActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("trip_proposals")
        .update({ status: "accepted" })
        .eq("id", proposalId);

      if (error) throw error;

      toast.success("Proposal accepted successfully!");
      onStatusChange?.();
    } catch (error: any) {
      console.error("Error accepting proposal:", error);
      toast.error("Failed to accept proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("trip_proposals")
        .update({ status: "declined" })
        .eq("id", proposalId);

      if (error) throw error;

      toast.success("Proposal declined.");
      onStatusChange?.();
    } catch (error: any) {
      console.error("Error declining proposal:", error);
      toast.error("Failed to decline proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "accepted") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Accepted</span>
      </div>
    );
  }

  if (currentStatus === "declined") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <XCircle className="h-4 w-4" />
        <span>Declined</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle className="mr-1 h-4 w-4" />
            Accept
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDecline}
        disabled={loading}
        className="border-red-600 text-red-600 hover:bg-red-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <XCircle className="mr-1 h-4 w-4" />
            Decline
          </>
        )}
      </Button>
    </div>
  );
}
