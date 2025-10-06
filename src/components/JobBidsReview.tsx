import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PaymentModal } from "@/components/PaymentModal";

interface JobBidsReviewProps {
  jobId: string;
  bids: any[];
  jobStatus: string;
  onBidAccepted: () => void;
}

export const JobBidsReview = ({ jobId, bids, jobStatus, onBidAccepted }: JobBidsReviewProps) => {
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleAcceptBid = async () => {
    if (!selectedBid) return;

    try {
      setProcessing(true);

      // Update job with winning bid and change status to assigned
      const { error: jobError } = await supabase
        .from('marketplace_jobs')
        .update({
          winning_bid_id: selectedBid.id,
          assigned_agent_id: selectedBid.agent_id,
          status: 'assigned'
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Update the accepted bid status
      const { error: bidError } = await supabase
        .from('agent_bids')
        .update({ status: 'accepted' })
        .eq('id', selectedBid.id);

      if (bidError) throw bidError;

      // Reject all other bids
      const { error: rejectError } = await supabase
        .from('agent_bids')
        .update({ status: 'rejected' })
        .eq('job_id', jobId)
        .neq('id', selectedBid.id);

      if (rejectError) throw rejectError;

      // Send notifications
      await supabase.functions.invoke('notify-bid-accepted', {
        body: { 
          bidId: selectedBid.id, 
          jobId, 
          customerId: selectedBid.travel_agents?.user_id,
          agentId: selectedBid.agent_id 
        }
      }).catch(err => console.error('Notification error:', err));

      toast.success('Bid accepted successfully!');
      setShowAcceptDialog(false);
      setShowPaymentModal(true);
      onBidAccepted();
    } catch (error: any) {
      console.error('Error accepting bid:', error);
      toast.error('Failed to accept bid');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectBid = async () => {
    if (!selectedBid) return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('agent_bids')
        .update({ status: 'rejected' })
        .eq('id', selectedBid.id);

      if (error) throw error;

      toast.success('Bid rejected');
      setShowRejectDialog(false);
      onBidAccepted();
    } catch (error: any) {
      console.error('Error rejecting bid:', error);
      toast.error('Failed to reject bid');
    } finally {
      setProcessing(false);
    }
  };

  if (bids.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
          <p className="text-muted-foreground text-center">
            Agents will place their bids here. You'll be notified when bids come in.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Received Bids ({bids.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bids.map((bid) => (
            <div key={bid.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{bid.travel_agents?.agency_name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Rating: {bid.travel_agents?.rating || 0}/5</span>
                      <span>•</span>
                      <span>{bid.travel_agents?.total_reviews || 0} reviews</span>
                    </div>
                  </div>
                  <Badge variant={
                    bid.status === 'accepted' ? 'default' : 
                    bid.status === 'rejected' ? 'destructive' : 
                    'secondary'
                  }>
                    {bid.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Price</p>
                      <p className="font-semibold">{bid.currency} {(bid.customer_facing_price || bid.proposed_price).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Includes 3% platform service fee</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Time</p>
                      <p className="font-semibold">{bid.estimated_completion_days} days</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Proposal</p>
                  <p className="text-sm">{bid.proposal_details}</p>
                </div>

                {bid.status === 'pending' && jobStatus === 'open' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedBid(bid);
                        setShowAcceptDialog(true);
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Bid
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedBid(bid);
                        setShowRejectDialog(true);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
              {bid !== bids[bids.length - 1] && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this bid?</AlertDialogTitle>
            <AlertDialogDescription>
              By accepting this bid, you'll assign this job to {selectedBid?.travel_agents?.agency_name}. 
              All other bids will be automatically rejected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptBid} disabled={processing}>
              {processing ? 'Processing...' : 'Accept Bid'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this bid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the bid as rejected. The agent will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectBid} disabled={processing}>
              {processing ? 'Processing...' : 'Reject Bid'}
            </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedBid && (
          <PaymentModal
            jobId={jobId}
            bidId={selectedBid.id}
            amount={selectedBid.customer_facing_price || selectedBid.proposed_price}
            currency={selectedBid.currency}
            agentName={selectedBid.travel_agents?.agency_name || 'Agent'}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              toast.success('Payment completed!');
              onBidAccepted();
            }}
          />
        )}
      </>
    );
  };
