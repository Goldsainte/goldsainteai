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
import { Briefcase, Clock, Shield, Plus, Hourglass, ChevronDown, ArrowRight, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
    : "desk";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
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
  const [profile, setProfile] = useState<{ email: string | null; full_name?: string | null; display_name?: string | null } | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [contractPendingCount, setContractPendingCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("email, full_name, display_name")
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

        // Desk stats — non-fatal
        try {
          const [{ count: bCount }, { count: cCount }] = await Promise.all([
            supabase
              .from("trip_bookings")
              .select("*", { count: "exact", head: true })
              .eq("partner_id", user.id)
              .in("status", ["confirmed", "paid_in_full", "deposit_pending", "payment_pending"]),
            supabase
              .from("trip_contracts")
              .select("*", { count: "exact", head: true })
              .eq("agent_id", user.id)
              .eq("status", "pending_signatures"),
          ]);
          setBookingCount(bCount ?? 0);
          setContractPendingCount(cCount ?? 0);
        } catch (statErr) {
          console.error("Desk stats failed (non-fatal):", statErr);
        }
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
      
      // Calculate pricing with fees — Goldsainte standard 7% total:
      // Customer sees agentPrice + 3.5% service fee
      // Agent receives agentPrice - 3.5% platform fee
      const serviceFee = agentPrice * 0.035;
      const successFee = agentPrice * 0.035;
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
          service_fee_percentage: 3.5,
          success_fee_percentage: 3.5,
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

  const MORE_TABS = [
    { key: "analytics", label: "Analytics" },
    { key: "availability", label: "Availability" },
    { key: "verification", label: "Verification" },
    { key: "settings", label: "Settings" },
  ];
  const activeMore = MORE_TABS.find((t) => t.key === activeTab);
  const tabBtn = (val: string, label: string) => (
    <button
      key={val}
      type="button"
      onClick={() => setActiveTab(val)}
      className={`whitespace-nowrap pb-4 text-[12px] uppercase tracking-[0.22em] transition-colors ${
        activeTab === val
          ? "border-b-2 border-[#0a2225] text-[#0a2225]"
          : "border-b-2 border-transparent text-[#0a2225]/50 hover:text-[#0a2225]"
      }`}
    >
      {label}
    </button>
  );
  const stat = (label: string, value: number | string | null, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-white px-5 py-5 text-left shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#0a2225]/50">{label}</p>
      <p className="mt-1.5 font-secondary text-[30px] leading-none text-[#0a2225]">
        {value ?? "—"}
      </p>
      <p className="mt-2 text-[12px] text-[#8D6B2F]">View →</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f7f3ea] flex flex-col pb-20 lg:pb-0">
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        {/* ── The Bureau ── */}
        <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">The Bureau</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="font-secondary text-[44px] leading-[1.08] text-[#0a2225] md:text-[54px]">
              Welcome, {profile?.display_name || profile?.full_name?.split(" ")[0] || agent.agency_name}
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-[#0a2225]/55">
              Your desk for winning briefs, designing journeys, and growing a book of clients
              on-platform.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {agent.is_verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C7A962] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#8D6B2F]">
                  ◈ Verified agent
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-[#0a2225]/20 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#0a2225]/50">
                  Pending verification
                </span>
              )}
              {Number(agent.rating) > 0 && (
                <span className="inline-flex items-center rounded-full border border-[#0a2225]/15 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#0a2225]/60">
                  ★ {agent.rating}/5 · {agent.total_reviews} reviews
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/agents/${agent.id}`)}
              className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/25 px-6 py-3.5 text-[14px] text-[#0a2225] transition-colors hover:bg-white"
            >
              <ExternalLink className="h-4 w-4" /> View public profile
            </button>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin View
                </Badge>
                <Select value={selectedAgentId || ''} onValueChange={handleAgentChange}>
                  <SelectTrigger className="w-[250px] rounded-full border-[#0a2225]/20 bg-white">
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
        </div>

        {/* ── Your desk today ── */}
        <div className="mt-10 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {stat("Open briefs", jobs.length, () => setActiveTab("available"))}
          {stat("Active bids", myBids.length, () => setActiveTab("my-bids"))}
          {stat("Active bookings", bookingCount, () => navigate("/partner-bookings"))}
          {stat("Awaiting signature", contractPendingCount, () => navigate("/partner-bookings"))}
        </div>

        <div className="mt-8">
          {user && <GettingStartedChecklist userId={user.id} role="agent" />}
        </div>

        {!agent.is_verified && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[#C7A962]/40 bg-white px-6 py-5">
            <Clock className="mt-1 h-6 w-6 shrink-0 text-[#C7A962]" />
            <div>
              <h3 className="font-secondary text-[19px] text-[#0a2225]">Application under review</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-[#0a2225]/55">
                Your agent application is being reviewed by our team. You'll be able to bid on
                briefs once it's approved — typically 2–3 business days.
              </p>
            </div>
          </div>
        )}

        <StripeConnectOnboarding />

        {pendingTripsCount > 0 && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[#C7A962]/40 bg-white px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C7A962]/15">
              <Hourglass className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div>
              <h3 className="font-secondary text-[19px] text-[#0a2225]">Your listing is under review</h3>
              <p className="mt-1 text-[14px] text-[#0a2225]/55">
                We typically approve new listings within 24–48 hours. You'll receive an email when
                it's live.
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-12 space-y-10">
          <div className="flex items-center gap-8 overflow-x-auto border-b border-[#0a2225]/12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabBtn("desk", "Desk")}
            {tabBtn("available", `Briefs (${jobs.length})`)}
            {tabBtn("my-bids", `Pipeline (${myBids.length})`)}
            {tabBtn("creator-collabs", `Clients (${collabRequests.length})`)}
            {tabBtn("guides", "Catalog")}
            {tabBtn("performance", "Performance")}
            <div className="ml-auto pb-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap pb-2 text-[12px] uppercase tracking-[0.22em] ${
                      activeMore ? "text-[#0a2225]" : "text-[#0a2225]/50 hover:text-[#0a2225]"
                    }`}
                  >
                    {activeMore ? activeMore.label : "More"} <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="!rounded-2xl !border-0 !bg-white !shadow-[0_8px_28px_rgba(10,34,37,0.22)]">
                  {MORE_TABS.map((t) => (
                    <DropdownMenuItem
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className="mx-1 cursor-pointer rounded-xl px-4 py-2.5 text-[14px] hover:bg-[#f7f3ea] focus:bg-[#f7f3ea]"
                    >
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Desk: the Bureau overview ── */}
          <TabsContent value="desk" className="space-y-0">
            <div className="border-b border-[#0a2225]/10 pb-16 pt-6">
              <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">Start here</p>
              <h2 className="mt-4 max-w-3xl font-secondary text-[44px] leading-[1.08] text-[#0a2225] md:text-[58px]">
                Find a brief, design the trip, get&nbsp;paid.
              </h2>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#0a2225]/55">
                The marketplace is full of travelers waiting for the right specialist. Send a
                proposal — or publish a packaged trip ready to book.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={() => navigate("/marketplace")}
                  className="rounded-full bg-[#0c4d47] px-9 py-4 text-[15px] text-white transition-colors hover:bg-[#0a2225]"
                >
                  Browse trip requests
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/trip-builder")}
                  className="inline-flex items-center gap-2 text-[15px] text-[#0a2225]"
                >
                  Or package a new trip <ArrowRight className="h-4 w-4 text-[#8D6B2F]" />
                </button>
              </div>
            </div>

            <div className="border-b border-[#0a2225]/10 py-16">
              <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">
                How Goldsainte works for agents
              </p>
              <h2 className="mt-3 font-secondary text-[38px] text-[#0a2225]">Two ways to earn</h2>
              <div className="mt-10 grid gap-14 md:grid-cols-2">
                <div>
                  <p className="font-secondary text-[20px] text-[#8D6B2F]">01</p>
                  <h3 className="mt-1.5 font-secondary text-[26px] text-[#0a2225]">Answer a brief</h3>
                  <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-[#0a2225]/80">
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">i.</i>Travelers post the journeys they want. Pick a brief that fits your expertise.</p>
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">ii.</i>Send a tailored proposal — itinerary, price, and timeline — drafted with Goldsainte AI in under a minute.</p>
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">iii.</i>They accept, sign the contract, and pay the deposit — all without leaving the thread.</p>
                  </div>
                </div>
                <div>
                  <p className="font-secondary text-[20px] text-[#8D6B2F]">02</p>
                  <h3 className="mt-1.5 font-secondary text-[26px] text-[#0a2225]">Publish your own</h3>
                  <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-[#0a2225]/80">
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">i.</i>Package a trip you know by heart — or a digital guide — in the trip builder.</p>
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">ii.</i>It lists on the marketplace with your name and your price.</p>
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">iii.</i>Travelers book it directly — no proposal needed, you wake up to bookings.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid items-center gap-10 border-b border-[#0a2225]/10 py-14 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-[#8D6B2F]">How you get paid</p>
                <p className="mt-4 max-w-2xl text-[16px] leading-[1.7] text-[#0a2225]/80">
                  You set your price — your costs and your margin are yours to build in. Travelers
                  pay a 3.5% service fee on top; a matching 3.5% platform fee comes out of your
                  payout. That is Goldsainte's entire take: 7% total, flat, on every booking. Every
                  payment is held in escrow — protected by a signed contract — and releases as
                  milestones complete.
                </p>
              </div>
              <div className="text-right">
                <p className="font-secondary text-[58px] leading-none text-[#0a2225]">7%</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[#0a2225]/50">
                  Total · 3.5 + 3.5
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-9 text-[15px]">
              <span>
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#8D6B2F]">New here?</span>
                &nbsp;&nbsp;The full guide to proposals, contracts, payouts, and fees.
              </span>
              <Link to="/how-it-works/agent" className="text-[#0a2225] hover:text-[#8D6B2F]">
                Read the guide →
              </Link>
            </div>
          </TabsContent>

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
                  Enter your base service price. Customer will see your price + 3.5% platform service fee. 
                  You'll receive your quoted price minus a 3.5% platform fee after job completion.
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
                  Customer will be charged your price + 3.5% service fee
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
