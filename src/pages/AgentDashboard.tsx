import { useTranslation } from "react-i18next";
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
import { AgentDirectRequestsTab } from "@/pages/agents/components/AgentDirectRequestsTab";
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
  const { t: tr } = useTranslation();
  const [searchParams] = useSearchParams();
  // Deep-linkable tabs (?tab=guides etc.) — the guide builder's Stripe popup
  // and Stripe Connect returns (?stripe=success) both need to land on Guides,
  // where the payout card lives for agents.
  // "earnings" must be allowlisted: the Getting Started checklist and the
  // post-verification page both deep-link to ?tab=earnings, which silently
  // fell back to the Desk while the tab was missing.
  const AGENT_TABS = ["available", "direct", "my-bids", "creator-collabs", "guides", "earnings", "analytics", "performance", "availability", "verification", "settings"] as const;
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
      toast.error(tr('dash.a.accessRequired', 'Agent access required'));
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
          // Only a real absence deserves a toast — during the first render
          // pass auth hasn't hydrated yet and user?.id is undefined, which
          // used to fire a spurious "No agent profiles found" on every load.
          if (user?.id) {
            toast.error(tr('dash.a.noAgentProfiles', 'No agent profiles found in system'));
          }
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
          toast.error(tr('dash.a.completeOnboarding', 'Please complete agent onboarding first'));
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

      // Fetch collaboration requests — NON-FATAL: this belongs to the
      // collabs feature (hidden for launch); its fancy joins must never be
      // able to take down the whole Bureau ("Failed to load dashboard").
      try {
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
      } catch (collabErr) {
        console.error('Collab requests fetch failed (non-fatal, feature hidden):', collabErr);
        setCollabRequests([]);
      }

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
      toast.error(tr('dash.a.loadFailed', 'Failed to load dashboard'));
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

      toast.success(tr('dash.a.bidPlaced', 'Bid placed successfully!'));
      setIsBidDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      toast.error(tr('dash.a.bidFailed', 'Failed to place bid'));
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
              <h3 className="text-lg font-semibold mb-2">{tr("dash.a.profileNotFound", "Agent Profile Not Found")}</h3>
              <p className="text-muted-foreground text-center mb-4">
                {tr("dash.a.needProfile", "You need to create an agent profile first")}
              </p>
              <Button onClick={() => navigate('/apply/agent')}>{tr("dash.a.createProfile", "Create Agent Profile")}</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const MORE_TABS = [
    { key: "earnings", label: tr("dash.a.payouts", "Payouts") },
    { key: "analytics", label: tr("dash.a.analytics", "Analytics") },
    { key: "availability", label: tr("dash.a.availability", "Availability") },
    { key: "verification", label: tr("dash.a.verification", "Verification") },
    { key: "settings", label: tr("dash.c.settings", "Settings") },
  ];
  const activeMore = MORE_TABS.find((t) => t.key === activeTab);
  const tabBtn = (val: string, label: string) => (
    <button
      key={val}
      type="button"
      onClick={() => setActiveTab(val)}
      className={`shrink-0 whitespace-nowrap pb-4 text-[11px] sm:text-[12px] uppercase tracking-[0.16em] sm:tracking-[0.22em] transition-colors ${
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
      <p className="text-[12px] uppercase tracking-[0.2em] text-[#0a2225]/50">{label}</p>
      <p className="mt-1.5 font-secondary text-[30px] leading-none text-[#0a2225]">
        {value ?? "—"}
      </p>
      <p className="mt-2 text-[12px] text-[#8D6B2F]">{tr("dash.a.view", "View")} →</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f7f3ea] flex flex-col pb-20 lg:pb-0">
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        {/* ── The Bureau ── */}
        <p className="text-[12.5px] uppercase tracking-[0.34em] text-[#8D6B2F]">{tr("dash.a.eyebrow", "The Bureau")}</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="font-secondary text-[44px] leading-[1.08] text-[#0a2225] md:text-[54px]">
              {tr("dash.t.welcome", "Welcome")}, {profile?.display_name || profile?.full_name?.split(" ")[0] || agent.agency_name}
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-[#0a2225]/55">
              {tr("dash.a.subtitle", "Your desk for winning briefs, designing journeys, and growing a book of clients on-platform.")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {agent.is_verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C7A962] px-4 py-2 text-[12.5px] uppercase tracking-[0.18em] text-[#8D6B2F]">
                  ◈ {tr("dash.a.verifiedAgent", "Verified agent")}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-[#0a2225]/20 px-4 py-2 text-[12.5px] uppercase tracking-[0.18em] text-[#0a2225]/50">
                  {tr("dash.a.pendingVerification", "Pending verification")}
                </span>
              )}
              {Number(agent.rating) > 0 && (
                <span className="inline-flex items-center rounded-full border border-[#0a2225]/15 px-4 py-2 text-[12.5px] uppercase tracking-[0.14em] text-[#0a2225]/60">
                  ★ {agent.rating}/5 · {agent.total_reviews} reviews
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/agents/${agent.user_id}`)}
              className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/25 px-6 py-3.5 text-[14px] text-[#0a2225] transition-colors hover:bg-white"
            >
              <ExternalLink className="h-4 w-4" /> {tr("dash.a.viewPublicProfile", "View public profile")}
            </button>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {tr("dash.a.adminView", "Admin View")}
                </Badge>
                <Select value={selectedAgentId || ''} onValueChange={handleAgentChange}>
                  <SelectTrigger className="w-[250px] rounded-full border-[#0a2225]/20 bg-white">
                    <SelectValue placeholder={tr("dash.a.selectAgent", "Select agent")} />
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
          {stat(tr("dash.a.openBriefs", "Open briefs"), jobs.length, () => setActiveTab("available"))}
          {stat(tr("dash.a.activeBids", "Active bids"), myBids.length, () => setActiveTab("my-bids"))}
          {stat(tr("dash.a.activeBookings", "Active bookings"), bookingCount, () => navigate("/partner-bookings"))}
          {stat(tr("dash.a.awaitingSignature", "Awaiting signature"), contractPendingCount, () => navigate("/partner-bookings"))}
        </div>

        <div className="mt-8">
          {user && <GettingStartedChecklist userId={user.id} role="agent" />}
        </div>

        <button
          type="button"
          onClick={() => navigate("/profile/media")}
          className="mt-4 inline-flex items-center gap-2 text-[15px] text-[#0a2225]"
        >
          {tr("dash.a.addPhotosVideo", "Add photos & video")} <ArrowRight className="h-4 w-4 text-[#8D6B2F]" />
        </button>

        {!agent.is_verified && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[#C7A962]/40 bg-white px-6 py-5">
            <Clock className="mt-1 h-6 w-6 shrink-0 text-[#C7A962]" />
            <div>
              <h3 className="font-secondary text-[19px] text-[#0a2225]">{tr("dash.a.appUnderReview", "Application under review")}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-[#0a2225]/55">
                {tr("dash.a.appReviewBody", "Your agent application is being reviewed by our team. You'll be able to bid on briefs once it's approved — typically 2–3 business days.")}
              </p>
            </div>
          </div>
        )}

        {/* Payment setup moved out of the Desk (founder call, Jul 26) — same
            treatment as creators, where Stripe lives in its own tab instead of
            a full-width box mid-page. The Getting Started checklist's
            "Connect Stripe" CTA already pointed at ?tab=earnings — a tab that
            didn't exist until now. */}

        {pendingTripsCount > 0 && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[#C7A962]/40 bg-white px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C7A962]/15">
              <Hourglass className="h-5 w-5 text-[#C7A962]" />
            </div>
            <div>
              <h3 className="font-secondary text-[19px] text-[#0a2225]">{tr("dash.a.listingUnderReview", "Your listing is under review")}</h3>
              <p className="mt-1 text-[14px] text-[#0a2225]/55">
                {tr("dash.a.listingReviewBody", "We typically approve new listings within 24–48 hours. You'll receive an email when it's live.")}
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-12 space-y-10">
          <div className="flex flex-nowrap items-center gap-6 sm:gap-8 overflow-x-auto border-b border-[#0a2225]/12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabBtn("desk", tr("dash.a.desk", "Desk"))}
            {tabBtn("available", `${tr("dash.a.briefs", "Briefs")} (${jobs.length})`)}
            {/* Direct requests were invisible to agents entirely — the Briefs
                tab reads marketplace_jobs, a different table (Jul 26). */}
            {tabBtn("direct", tr("dash.c.directRequests", "Direct requests"))}
            {tabBtn("my-bids", `${tr("dash.a.pipeline", "Pipeline")} (${myBids.length})`)}
            {/* creator-collabs tab hidden for launch — unfinished feature, undecided economics (see handoff) */}
            {tabBtn("guides", tr("dash.c.catalog", "Catalog"))}
            {tabBtn("performance", tr("dash.c.performance", "Performance"))}
            <div className="ml-auto shrink-0 pb-2 pl-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap pb-2 text-[12px] uppercase tracking-[0.22em] ${
                      activeMore ? "text-[#0a2225]" : "text-[#0a2225]/50 hover:text-[#0a2225]"
                    }`}
                  >
                    {activeMore ? activeMore.label : tr("dash.a.more", "More")} <ChevronDown className="h-3.5 w-3.5" />
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
              <p className="text-[12.5px] uppercase tracking-[0.34em] text-[#8D6B2F]">{tr("dash.a.startHere", "Start here")}</p>
              <h2 className="mt-4 max-w-3xl font-secondary text-[44px] leading-[1.08] text-[#0a2225] md:text-[58px]">
                {tr("dash.a.heroTitle", "Find a brief, design the trip, get paid.")}
              </h2>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#0a2225]/55">
                {tr("dash.a.heroSub", "The marketplace is full of travelers waiting for the right specialist. Send a proposal — or publish a packaged trip ready to book.")}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={() => navigate("/marketplace")}
                  className="rounded-full bg-[#0c4d47] px-9 py-4 text-[15px] text-white transition-colors hover:bg-[#0a2225]"
                >
                  {tr("dash.c.browseBriefs", "Browse trip requests")}
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
              <p className="text-[12.5px] uppercase tracking-[0.34em] text-[#8D6B2F]">
                {tr("dash.a.hwAgents", "How Goldsainte works for agents")}
              </p>
              <h2 className="mt-3 font-secondary text-[38px] text-[#0a2225]">{tr("dash.a.twoWays", "Two ways to earn")}</h2>
              <div className="mt-10 grid gap-14 md:grid-cols-2">
                <div>
                  <p className="font-secondary text-[20px] text-[#8D6B2F]">01</p>
                  <h3 className="mt-1.5 font-secondary text-[26px] text-[#0a2225]">{tr("dash.a.answerBrief", "Answer a brief")}</h3>
                  <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-[#0a2225]/80">
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">i.</i>{tr("dash.a.ab1", "Travelers post the journeys they want. Pick a brief that fits your expertise.")}</p>
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">ii.</i>{tr("dash.a.ab2", "Send a tailored proposal \u2014 itinerary, price, and timeline \u2014 drafted with Goldsainte AI in under a minute.")}</p>
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">iii.</i>{tr("dash.a.ab3", "They accept and pay the deposit \u2014 all without leaving the thread.")}</p>
                  </div>
                </div>
                <div>
                  <p className="font-secondary text-[20px] text-[#8D6B2F]">02</p>
                  <h3 className="mt-1.5 font-secondary text-[26px] text-[#0a2225]">{tr("dash.a.publishOwn", "Publish your own")}</h3>
                  <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-[#0a2225]/80">
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">i.</i>{tr("dash.a.po1", "Package a trip you know by heart \u2014 or a digital guide \u2014 in the trip builder.")}</p>
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">ii.</i>{tr("dash.a.po2", "It lists on the marketplace with your name and your price.")}</p>
                    <p className="flex gap-4"><i className="shrink-0 font-secondary italic text-[#8D6B2F]">iii.</i>{tr("dash.a.po3", "Travelers book it directly \u2014 no proposal needed, you wake up to bookings.")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid items-center gap-10 border-b border-[#0a2225]/10 py-14 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[12.5px] uppercase tracking-[0.34em] text-[#8D6B2F]">{tr("dash.a.howPaid", "How you get paid")}</p>
                <p className="mt-4 max-w-2xl text-[16px] leading-[1.7] text-[#0a2225]/80">
                  {tr("dash.a.feeBody", "You set your price — your costs and your margin are yours to build in. Travelers pay a 3.5% service fee on top; a matching 3.5% platform fee comes out of your payout. That is Goldsainte's entire take: 7% total, flat, on every booking. Every payment is charged directly to your own Stripe account at booking — you're the merchant of record on every trip you sell.")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-secondary text-[58px] leading-none text-[#0a2225]">7%</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.24em] text-[#0a2225]/50">
                  Total · 3.5 + 3.5
                </p>
              </div>
            </div>

            {/* HOW TO SEND A PROPOSAL — the operational 1-2-3. Agents had no
                entry point telling them where step one lives (Jul 24 2026). */}
            {/* PROPOSAL STEPS — rebuilt Jul 26. Previously flex rows with a
                hanging numeral: wrapped lines sat ragged against the number and
                the text ran the full container width, so long sentences were
                hard to track. Now a hairline rail with the numeral seated ON it
                — the same roman-numeral treatment already used on the Desk
                intro and the verification step, so this reads as house language
                rather than a new pattern. No max-width: this card is wide and
                capping the measure just left a dead column of white space. */}
            <div className="mt-2 rounded-2xl border border-[#E5DFC6] bg-[#FDF9F0] p-6 sm:p-8">
              <p className="text-[12px] uppercase tracking-[0.24em] text-[#8D6B2F]">
                {tr("dash.a.sendProposalSteps", "Send a proposal — step by step")}
              </p>
              <ol className="mt-7 space-y-7 border-l border-[#E5DFC6] text-[15px] leading-relaxed text-[#0a2225]">
                <li className="relative pl-9">
                  <span aria-hidden="true" className="absolute left-0 top-0 -translate-x-1/2 bg-[#FDF9F0] px-1.5 font-secondary text-[13px] italic leading-[1.7] text-[#8D6B2F]">i</span>
                  {tr("dash.a.step1", "Open a conversation with the traveler — reply to a trip request from the marketplace, or answer any traveler who messages you from your profile or one of your trips.")}
                </li>
                <li className="relative pl-9">
                  <span aria-hidden="true" className="absolute left-0 top-0 -translate-x-1/2 bg-[#FDF9F0] px-1.5 font-secondary text-[13px] italic leading-[1.7] text-[#8D6B2F]">ii</span>
                  {tr("dash.a.step2a", "Use the")} <strong className="font-medium">{tr("dash.a.step2strong", "Send a Proposal")}</strong> {tr("dash.a.step2b", "panel inside the thread — total price, deposit percentage, and a brief note. It arrives as a card the traveler can act on.")}
                </li>
                <li className="relative pl-9">
                  <span aria-hidden="true" className="absolute left-0 top-0 -translate-x-1/2 bg-[#FDF9F0] px-1.5 font-secondary text-[13px] italic leading-[1.7] text-[#8D6B2F]">iii</span>
                  {tr("dash.a.step3a", "They tap")} <strong className="font-medium">{tr("dash.a.step3strong", "Accept and Pay Deposit")}</strong> {tr("dash.a.step3b", "— charged directly on your Stripe — and the booking appears in Bookings with you.")}
                </li>
              </ol>
              <div className="mt-8 flex flex-wrap gap-3 pl-9">
                <Link to="/marketplace?tab=trip-requests" className="rounded-full bg-[#0c4d47] px-5 py-2.5 text-[13.5px] text-[#FDF9F0] transition-colors hover:bg-[#0a2225]">{tr("dash.c.browseBriefs", "Browse trip requests")}</Link>
                <Link to="/messages" className="rounded-full border border-[#0c4d47]/30 px-5 py-2.5 text-[13.5px] text-[#0a2225] transition-colors hover:bg-[#0c4d47]/5">{tr("dash.a.openMessages", "Open messages")}</Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-9 text-[15px]">
              <span>
                <span className="text-[12.5px] uppercase tracking-[0.24em] text-[#8D6B2F]">{tr("dash.t.newHere", "New here?")}</span>
                &nbsp;&nbsp;{tr("dash.c.fullGuide", "The full guide to proposals, payouts, and fees.")}
              </span>
              <Link to="/how-it-works/agent" className="text-[#0a2225] hover:text-[#8D6B2F]">
                {tr("dash.a.readGuide", "Read the guide")} →
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="guides" className="space-y-6">
            {/* Payout setup lives here for agents: guide publishing requires
                stripe_charges_enabled, and mounting this card runs the status
                check that syncs it. Agents can't reach /creator-dashboard. */}
            {/* Return to THIS dashboard, not /creator-dashboard — that route
                redirects non-creators to /traveler, which is where agents
                finishing Stripe were being dumped (founder report, Jul 26). */}
            <CreatorStripeOnboarding returnPath="/agent-dashboard?tab=guides" />
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

            <TabsContent value="direct">
              <AgentDirectRequestsTab />
            </TabsContent>

            <TabsContent value="earnings">
              <StripeConnectOnboarding />
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
              <DialogTitle>{tr("dash.a.placeYourBid", "Place Your Bid")}</DialogTitle>
              <DialogDescription>
                {tr("dash.a.bidDialogDesc", "Submit your proposal for this travel job")}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handlePlaceBid} className="space-y-4">
              <Alert className="mb-4">
                <AlertDescription className="text-xs">
                  {tr("dash.a.bidFeeNote", "Enter your base service price. Customer will see your price + 3.5% platform service fee. You'll receive your quoted price minus a 3.5% platform fee after job completion.")}
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="proposed_price">{tr("dash.a.yourServicePrice", "Your Service Price")} ({selectedJob?.currency || 'USD'})</Label>
                <Input 
                  id="proposed_price" 
                  name="proposed_price" 
                  type="number" 
                  required 
                  step="0.01"
                  min="1"
                  placeholder={tr("dash.a.pricePh", "Enter your price (e.g., 1000)")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {tr("dash.a.customerCharged", "Customer will be charged your price + 3.5% service fee")}
                </p>
              </div>
              
              <div>
                <Label htmlFor="estimated_days">{tr("dash.a.estCompletion", "Estimated Completion (days)")}</Label>
                <Input id="estimated_days" name="estimated_days" type="number" required />
              </div>
              
              <div>
                <Label htmlFor="proposal_details">{tr("dash.a.proposalDetails", "Proposal Details")}</Label>
                <Textarea 
                  id="proposal_details" 
                  name="proposal_details" 
                  required 
                  placeholder={tr("dash.a.approachPh", "Explain your approach and what you'll deliver...")}
                  rows={4}
                />
              </div>
              
              <Button type="submit" className="w-full">{tr("dash.a.submitBid", "Submit Bid")}</Button>
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
                {tr("dash.a.messagingDesc", "Communicate with the customer about this job")}
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
                {tr("dash.a.milestonesDesc", "Manage milestones and invoices for this job")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {selectedBidForDetails?.marketplace_jobs && (
                <>
                  {/* Job Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{tr("dash.a.jobSummary", "Job Summary")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tr("dash.a.statusLabel", "Status:")}</span>
                        <Badge>{selectedBidForDetails.marketplace_jobs.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tr("dash.a.yourBid", "Your Bid:")}</span>
                        <span className="font-semibold">
                          {selectedBidForDetails.currency} {selectedBidForDetails.proposed_price}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tr("dash.a.yourPayoutLabel", "Your Payout:")}</span>
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
