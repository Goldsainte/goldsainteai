import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Briefcase, Clock, Shield, Plus, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { JobMessaging } from "@/components/JobMessaging";
import { StripeConnectOnboarding } from "@/components/StripeConnectOnboarding";
import { JobCompletionModal } from "@/components/JobCompletionModal";
import { AgentAvailabilityCalendar } from "@/components/AgentAvailabilityCalendar";
import { AgentAnalyticsDashboard } from "@/components/AgentAnalyticsDashboard";
import { AgentVerificationUpload } from "@/components/AgentVerificationUpload";
import { AgentSettingsTab } from "./agent/components/AgentSettingsTab";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentMilestonesManager } from "@/components/PaymentMilestonesManager";
import { InvoiceGenerator } from "@/components/InvoiceGenerator";
import { AgentCreatorCollabs } from "@/components/AgentCreatorCollabs";
import { BackButton } from "@/components/ui/BackButton";
import { CreatorGuidesTab } from "@/pages/creator/components/CreatorGuidesTab";
import { CreatorStripeOnboarding } from "@/components/CreatorStripeOnboarding";
import { GettingStartedChecklist } from "@/components/onboarding/GettingStartedChecklist";
import { CreatorPerformanceTab } from "./creator/components/CreatorPerformanceTab";
import { Link } from "react-router-dom";
import { AgentAvailableJobsTab } from "./agent/components/AgentAvailableJobsTab";
import { AgentMyBidsTab } from "./agent/components/AgentMyBidsTab";

export default function AgentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Deep-linkable tabs (?tab=guides etc.) — the guide builder's Stripe popup
  // and Stripe Connect returns (?stripe=success) both need to land on Guides,
  // where the payout card lives for agents.
  const AGENT_TABS = ["available", "my-bids", "creator-collabs", "guides", "analytics", "performance", "availability", "verification", "settings"] as const;
  const requestedTab = searchParams.get("tab");
  const initialTab = AGENT_TABS.includes(requestedTab as (typeof AGENT_TABS)[number])
    ? (requestedTab as string)
    : searchParams.get("stripe")
    ? "guides"
    : "available";
  const [agent, setAgent] = useState<any>(null);
  const [allAgents, setAllAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [collabRequests, setCollabRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  const [isMessagingDialogOpen, setIsMessagingDialogOpen] = useState(false);
  const [selectedJobForMessaging, setSelectedJobForMessaging] = useState<any>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionJob, setCompletionJob] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState({
    identity_verified: false,
    background_check_status: "not_started",
    professional_license_verified: false,
    insurance_verified: false,
    trust_score: 0,
  });
  const [selectedBidForDetails, setSelectedBidForDetails] = useState<any>(null);
  const [bidDetailsOpen, setBidDetailsOpen] = useState(false);
  const [pendingTripsCount, setPendingTripsCount] = useState(0);
  const [publishedTripsCount, setPublishedTripsCount] = useState(0);
  const [profile, setProfile] = useState<{ email: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as { email: string | null });
      });
  }, [user]);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!isAdmin && !isAgent) {
      toast.error('Agent access required');
      navigate('/');
      return;
    }
    fetchData();
  }, [user, isAdmin, isAgent, authLoading, roleLoading, navigate]);

  const fetchData = async (agentIdOverride?: string) => {
    try {
      setLoading(true);
      let agentId: string | undefined;

      // If admin, fetch all agents for selector
      if (isAdmin) {
        const { data: agents, error: agentsError } = await supabase
          .from('travel_agents')
          .select('id, agency_name, user_id')
          .order('agency_name');
        
        if (agentsError) throw agentsError;
        setAllAgents(agents || []);
        
        // Use override ID, or selected ID, or user's own agent, or first agent
        const targetAgentId = agentIdOverride || selectedAgentId;
        let agentToLoad = null;
        
        if (targetAgentId) {
          const { data: targetAgent } = await supabase
            .from('travel_agents')
            .select('*')
            .eq('id', targetAgentId)
            .single();
          agentToLoad = targetAgent;
        } else {
          // Try to find user's own agent first
          const { data: ownAgent } = await supabase
            .from('travel_agents')
            .select('*')
            .eq('user_id', user?.id)
            .maybeSingle();
          
          agentToLoad = ownAgent || agents?.[0];
        }
        
        if (!agentToLoad) {
          toast.error('No agent profiles found in system');
          setLoading(false);
          return;
        }
        
        setAgent(agentToLoad);
        setSelectedAgentId(agentToLoad.id);
        
        setVerificationStatus({
          identity_verified: agentToLoad.identity_verified || false,
          background_check_status: agentToLoad.background_check_status || "not_started",
          professional_license_verified: agentToLoad.professional_license_verified || false,
          insurance_verified: agentToLoad.insurance_verified || false,
          trust_score: agentToLoad.trust_score || 0,
        });
        
        agentId = agentToLoad.id;

      } else {
        // Non-admin: only fetch their own agent
        const { data: agentData, error: agentError } = await supabase
          .from('travel_agents')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle();

        if (agentError) throw agentError;
        
        if (!agentData) {
          toast.error('Please complete agent onboarding first');
          navigate('/apply/agent');
          return;
        }
        
        setAgent(agentData);
        setVerificationStatus({
          identity_verified: agentData.identity_verified || false,
          background_check_status: agentData.background_check_status || "not_started",
          professional_license_verified: agentData.professional_license_verified || false,
          insurance_verified: agentData.insurance_verified || false,
          trust_score: agentData.trust_score || 0,
        });
        
        agentId = agentData.id;
      }

      if (!agentId) {
        setLoading(false);
        return;
      }

      const { data: jobsData, error: jobsError } = await supabase
        .from('marketplace_jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      const { data: bidsData, error: bidsError } = await supabase
        .from('agent_bids')
        .select('*, marketplace_jobs(*)')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;
      setMyBids(bidsData || []);

      // Fetch collaboration requests
      const { data: collabsData, error: collabsError } = await supabase
        .from('creator_collab_requests')
        .select(`
          *,
          creator:profiles!creator_collab_requests_creator_id_fkey(
            username,
            avatar_url,
            tiktok_username
          ),
          trip_story:trip_stories(id, title, tiktok_post_id),
          package:packaged_trips(id, title, status)
        `)
        .eq('agent_id', user?.id)
        .order('created_at', { ascending: false });

      if (collabsError) throw collabsError;
      setCollabRequests(collabsData || []);

      // Fetch agent trip status counts (use auth user id as agent_id on packaged_trips)
      if (user?.id) {
        const [{ count: pCount }, { count: pubCount }] = await Promise.all([
          supabase
            .from("packaged_trips")
            .select("*", { count: "exact", head: true })
            .eq("agent_id", user.id)
            .eq("status", "pending_review"),
          supabase
            .from("packaged_trips")
            .select("*", { count: "exact", head: true })
            .eq("agent_id", user.id)
            .eq("status", "published"),
        ]);
        setPendingTripsCount(pCount || 0);
        setPublishedTripsCount(pubCount || 0);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    setLoading(true);
    fetchData(agentId);
  };

  const handlePlaceBid = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const agentPrice = parseFloat(formData.get('proposed_price') as string);
      
      // Calculate pricing with fees
      // Customer sees agentPrice + 3% service fee
      // Agent receives agentPrice - 15% success fee
      const serviceFee = agentPrice * 0.03;
      const successFee = agentPrice * 0.15;
      const customerPrice = agentPrice + serviceFee;
      const agentPayout = agentPrice - successFee;

      const { error } = await supabase
        .from('agent_bids')
        .insert({
          job_id: selectedJob.id,
          agent_id: agent.id,
          proposed_price: customerPrice, // Customer-facing price (for backwards compatibility)
          agent_quoted_price: agentPrice,
          customer_facing_price: customerPrice,
          service_fee_percentage: 3.0,
          success_fee_percentage: 15.0,
          platform_service_fee: serviceFee,
          platform_success_fee: successFee,
          agent_payout_amount: agentPayout,
          estimated_completion_days: parseInt(formData.get('estimated_days') as string),
          proposal_details: formData.get('proposal_details') as string,
          currency: selectedJob.currency || 'USD'
        } as any);

      if (error) throw error;

      // Get the created bid
      const { data: newBid } = await supabase
        .from('agent_bids')
        .select('id')
        .eq('job_id', selectedJob.id)
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Send notification
      if (newBid) {
        await supabase.functions.invoke('notify-new-bid', {
          body: { bidId: newBid.id, jobId: selectedJob.id }
        }).catch(err => console.error('Notification error:', err));
      }

      toast.success('Bid placed successfully!');
      setIsBidDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      toast.error('Failed to place bid');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Agent Profile Not Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                You need to create an agent profile first
              </p>
              <Button onClick={() => navigate('/apply/agent')}>Create Agent Profile</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0] flex flex-col pb-20 lg:pb-0">
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <BackButton className="mb-6" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-secondary text-primary mb-2">Agent Dashboard</h1>
            <p className="text-muted-foreground">{agent.agency_name} • Rating: {agent.rating}/5 ({agent.total_reviews} reviews)</p>
            {!agent.is_verified && (
              <Badge variant="secondary" className="mt-2">Pending Verification</Badge>
            )}
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                Admin View
              </Badge>
              <Select value={selectedAgentId || ''} onValueChange={handleAgentChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {allAgents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.agency_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {user && <GettingStartedChecklist userId={user.id} role="agent" />}
        <div className="mb-4 text-right">
          <Link to="/how-it-works/agent" className="text-xs text-[#0c4d47] hover:underline">
            How it works →
          </Link>
        </div>

        {/* Quick Access Navigation */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={() => navigate('/trip-builder')}
            className="bg-[#0c4d47] text-[#E5DFC6] rounded-full px-6 hover:bg-[#0a3d39]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Trip
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/marketplace')}
          >
            <Briefcase className="w-4 h-4" />
            Job Marketplace
          </Button>
        </div>

        {!agent.is_verified && (
          <Card className="mb-6 border-[#C7A962]/30 bg-[#FDF9F0]">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-[#C7A962] mt-1" />
                <div>
                  <h3 className="font-semibold text-[#0a2225] mb-1">Application Under Review</h3>
                  <p className="text-sm text-[#5c5c52]">
                    Your agent application is currently being reviewed by our admin team. 
                    You'll be able to access the marketplace and place bids once your application is approved. 
                    This typically takes 2-3 business days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <StripeConnectOnboarding />

        {pendingTripsCount > 0 && (
          <div className="mb-6 rounded-2xl border border-[#C7A962]/40 bg-[#FDF9F0] px-6 py-5 flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C7A962]/15 flex-shrink-0">
              <Hourglass className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div>
              <h3 className="font-secondary text-lg text-[#0a2225]">Your listing is under review</h3>
              <p className="text-sm text-[#6B7280] mt-1">
                We typically approve new listings within 24–48 hours. You'll receive an email when it's live.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue={initialTab} className="space-y-6">
          <div className="relative">
            <TabsList className="w-full overflow-x-auto scrollbar-hide bg-transparent border-b border-[#E5DFC6] rounded-none h-11 justify-start gap-0 flex">
              <TabsTrigger value="available" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">Available Jobs ({jobs.length})</TabsTrigger>
              <TabsTrigger value="my-bids" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">My Bids ({myBids.length})</TabsTrigger>
              <TabsTrigger value="creator-collabs" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">Creator Collabs ({collabRequests.length})</TabsTrigger>
              <TabsTrigger value="guides" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">Guides</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">Analytics</TabsTrigger>
             <TabsTrigger value="performance" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">Performance</TabsTrigger>
              <TabsTrigger value="availability" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">Availability</TabsTrigger>
              <TabsTrigger value="verification" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">Verification</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-none h-full border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0">Settings</TabsTrigger>
            </TabsList>
            <div className="pointer-events-none absolute right-0 top-0 h-11 w-12 bg-gradient-to-l from-[#FDF9F0] to-transparent md:hidden" />
          </div>

          <TabsContent value="guides" className="space-y-6">
            {/* Payout setup lives here for agents: guide publishing requires
                stripe_charges_enabled, and mounting this card runs the status
                check that syncs it. Agents can't reach /creator-dashboard. */}
            <CreatorStripeOnboarding />
            {/* Same guides studio creators use — itinerary_products is scoped
                per-user by RLS, so agents author and sell their own guides. */}
            <CreatorGuidesTab />
          </TabsContent>

          <TabsContent value="available">
            <AgentAvailableJobsTab
              jobs={jobs}
              isVerified={!!agent.is_verified}
              onSelectJob={(job) => {
                setSelectedJob(job);
                setIsBidDialogOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="my-bids">
            <AgentMyBidsTab
              myBids={myBids}
              onMessage={(job) => {
                setSelectedJobForMessaging(job);
                setIsMessagingDialogOpen(true);
              }}
              onPaymentDetails={(bid) => {
                setSelectedBidForDetails(bid);
                setBidDetailsOpen(true);
              }}
              onSubmitCompletion={(job) => {
                setCompletionJob(job);
                setCompletionModalOpen(true);
              }}
            />
          </TabsContent>

            <TabsContent value="creator-collabs">
              {agent && (
                <AgentCreatorCollabs 
                  collabRequests={collabRequests} 
                  agentId={user?.id || ''} 
                  onRefresh={fetchData} 
                />
              )}
            </TabsContent>

            <TabsContent value="availability">
              {agent && (
                <AgentAvailabilityCalendar agentId={agent.id} />
              )}
            </TabsContent>

            <TabsContent value="analytics">
              {agent && (
                <AgentAnalyticsDashboard agentId={agent.id} />
              )}
            </TabsContent>

            <TabsContent value="performance">
              <CreatorPerformanceTab role="agent" />
            </TabsContent>

            <TabsContent value="verification">
              {agent && (
                <AgentVerificationUpload
                  agentId={agent.id}
                  status={verificationStatus}
                  onVerificationSubmit={fetchData}
                />
              )}
            </TabsContent>

            <TabsContent value="settings">
              <AgentSettingsTab />
            </TabsContent>
          </Tabs>

        <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Place Your Bid</DialogTitle>
              <DialogDescription>
                Submit your proposal for this travel job
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handlePlaceBid} className="space-y-4">
              <Alert className="mb-4">
                <AlertDescription className="text-xs">
                  Enter your base service price. Customer will see your price + 3% platform service fee. 
                  You'll receive your quoted price minus 15% success fee after job completion.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="proposed_price">Your Service Price ({selectedJob?.currency || 'USD'})</Label>
                <Input 
                  id="proposed_price" 
                  name="proposed_price" 
                  type="number" 
                  required 
                  step="0.01"
                  min="1"
                  placeholder="Enter your price (e.g., 1000)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Customer will be charged your price + 3% service fee
                </p>
              </div>
              
              <div>
                <Label htmlFor="estimated_days">Estimated Completion (days)</Label>
                <Input id="estimated_days" name="estimated_days" type="number" required />
              </div>
              
              <div>
                <Label htmlFor="proposal_details">Proposal Details</Label>
                <Textarea 
                  id="proposal_details" 
                  name="proposal_details" 
                  required 
                  placeholder="Explain your approach and what you'll deliver..."
                  rows={4}
                />
              </div>
              
              <Button type="submit" className="w-full">Submit Bid</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isMessagingDialogOpen} onOpenChange={setIsMessagingDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-secondary">
                Messaging: {selectedJobForMessaging?.title}
              </DialogTitle>
              <DialogDescription>
                Communicate with the customer about this job
              </DialogDescription>
            </DialogHeader>

            {selectedJobForMessaging && (
              <JobMessaging
                jobId={selectedJobForMessaging.id}
                receiverId={selectedJobForMessaging.user_id}
              />
            )}
          </DialogContent>
        </Dialog>

        {completionJob && agent && (
          <JobCompletionModal
            open={completionModalOpen}
            onOpenChange={(open) => {
              setCompletionModalOpen(open);
              if (!open) setCompletionJob(null);
            }}
            jobId={completionJob.id}
            agentId={agent.id}
            onSuccess={() => {
              fetchData();
            }}
          />
        )}

        {/* Payment & Milestone Management Dialog */}
        <Dialog open={bidDetailsOpen} onOpenChange={setBidDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-secondary">
                Payment Management: {selectedBidForDetails?.marketplace_jobs?.title}
              </DialogTitle>
              <DialogDescription>
                Manage milestones and invoices for this job
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {selectedBidForDetails?.marketplace_jobs && (
                <>
                  {/* Job Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Job Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge>{selectedBidForDetails.marketplace_jobs.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Bid:</span>
                        <span className="font-semibold">
                          {selectedBidForDetails.currency} {selectedBidForDetails.proposed_price}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Payout:</span>
                        <span className="font-semibold text-green-600">
                          {selectedBidForDetails.currency} {selectedBidForDetails.agent_payout_amount?.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Milestones */}
                  {(selectedBidForDetails.marketplace_jobs.status === 'in_progress' || 
                    selectedBidForDetails.marketplace_jobs.status === 'completed') && 
                   selectedBidForDetails.marketplace_jobs.total_paid_amount && (
                    <PaymentMilestonesManager
                      jobId={selectedBidForDetails.marketplace_jobs.id}
                      totalAmount={selectedBidForDetails.marketplace_jobs.total_paid_amount}
                      currency={selectedBidForDetails.currency || 'USD'}
                      isAgent={true}
                      isAdmin={isAdmin}
                    />
                  )}

                  {/* Invoice Generator */}
                  {selectedBidForDetails.marketplace_jobs.status === 'completed' && (
                    <InvoiceGenerator
                      jobId={selectedBidForDetails.marketplace_jobs.id}
                      customerId={selectedBidForDetails.marketplace_jobs.user_id}
                      agentId={agent?.id}
                    />
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
