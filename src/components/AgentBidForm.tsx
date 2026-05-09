import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface AgentBidFormProps {
  jobId: string;
  jobTitle: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  onBidSubmitted: () => void;
}

export function AgentBidForm({ 
  jobId, 
  jobTitle, 
  budgetMin, 
  budgetMax, 
  currency = "USD",
  onBidSubmitted 
}: AgentBidFormProps) {
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const [agentPrice, setAgentPrice] = useState("");
  const [completionDays, setCompletionDays] = useState("");
  const [proposal, setProposal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate pricing breakdown
  const calculatePricing = () => {
    const price = parseFloat(agentPrice);
    if (isNaN(price) || price <= 0) return null;

    const serviceFee = price * 0.035;
    const customerPrice = price + serviceFee;
    const successFee = price * 0.035;
    const agentPayout = price - successFee;

    return {
      customerPrice: customerPrice.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      successFee: successFee.toFixed(2),
      agentPayout: agentPayout.toFixed(2),
    };
  };

  const pricing = calculatePricing();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to submit a bid");
      return;
    }

    const price = parseFloat(agentPrice);
    const days = parseInt(completionDays);

    if (isNaN(price) || price < 100 || price > 100000) {
      toast.error("Bid amount must be between 100 and 100,000");
      return;
    }

    if (isNaN(days) || days <= 0) {
      toast.error("Please enter valid completion days");
      return;
    }

    const trimmedProposal = proposal.trim();
    if (trimmedProposal.length < 10 || trimmedProposal.length > 5000) {
      toast.error("Proposal must be between 10 and 5000 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get agent ID
      const { data: agentData, error: agentError } = await supabase
        .from('travel_agents')
        .select('id, agency_name')
        .eq('user_id', user.id)
        .single();

      if (agentError || !agentData) {
        toast.error("Agent profile not found. Please complete your agent profile first.");
        return;
      }

      // Calculate pricing
      const serviceFee = price * 0.035;
      const customerPrice = price + serviceFee;
      const successFee = price * 0.035;
      const agentPayout = price - successFee;

      // Insert bid
      const { data: bidData, error: bidError } = await supabase
        .from('agent_bids')
        .insert({
          job_id: jobId,
          agent_id: agentData.id,
          agent_quoted_price: price,
          proposed_price: price,
          customer_facing_price: customerPrice,
          platform_service_fee: serviceFee,
          platform_success_fee: successFee,
          agent_payout_amount: agentPayout,
          service_fee_percentage: 3.5,
          success_fee_percentage: 3.5,
          estimated_completion_days: days,
          proposal_details: trimmedProposal,
          currency: currency.trim(),
          status: 'pending',
        })
        .select()
        .single();

      if (bidError) throw bidError;

      // Log bid submission
      await logActivity({
        action: 'bid_submitted',
        entity_type: 'agent_bid',
        entity_id: bidData.id,
        details: { 
          jobId, 
          agentPrice: price, 
          customerPrice, 
          estimatedDays: days,
          agencyName: agentData.agency_name 
        }
      });

      // Get job owner ID for notification
      const { data: jobData } = await supabase
        .from('marketplace_jobs')
        .select('user_id')
        .eq('id', jobId)
        .single();

      // Send notification to job owner
      if (jobData?.user_id) {
        try {
          await invokeEdgeFunction('notify-new-bid', {
            body: {
              jobId: jobId,
              bidId: agentData.id,
              customerId: jobData.user_id,
            },
            timeout: 10000,
            showToastOnError: false,
          });
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }

      toast.success("Bid submitted successfully!");
      setAgentPrice("");
      setCompletionDays("");
      setProposal("");
      onBidSubmitted();
    } catch (error: any) {
      console.error('Error submitting bid:', error);
      toast.error("Failed to submit bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-secondary">Submit Your Bid</CardTitle>
        <CardDescription>
          Provide your pricing and proposal for "{jobTitle}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Your Price ({currency})</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter your price"
                value={agentPrice}
                onChange={(e) => setAgentPrice(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            {budgetMin && budgetMax && (
              <p className="text-xs text-muted-foreground">
                Client's budget range: {currency} {budgetMin} - {budgetMax}
              </p>
            )}
          </div>

          {pricing && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Pricing Breakdown</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Client Pays:</span>
                <span className="font-medium">{currency} {pricing.customerPrice}</span>
                
                <span className="text-muted-foreground">Service Fee (3.5%):</span>
                <span className="text-destructive">-{currency} {pricing.serviceFee}</span>
                
                <span className="text-muted-foreground">Success Fee (3.5%):</span>
                <span className="text-destructive">-{currency} {pricing.successFee}</span>
                
                <span className="text-muted-foreground font-semibold">You Receive:</span>
                <span className="font-semibold text-primary">{currency} {pricing.agentPayout}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="days">Estimated Completion (days)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="days"
                type="number"
                min="1"
                placeholder="Number of days"
                value={completionDays}
                onChange={(e) => setCompletionDays(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposal">Your Proposal</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="proposal"
                placeholder="Explain your approach, experience, and why you're the best fit for this job..."
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                className="pl-10 min-h-[120px]"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Bid"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
