import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Briefcase, MapPin, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: agentData, error: agentError } = await supabase
        .from('travel_agents')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (agentError) throw agentError;
      setAgent(agentData);

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
        .eq('agent_id', agentData?.id)
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;
      setMyBids(bidsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase
        .from('agent_bids')
        .insert({
          job_id: selectedJob.id,
          agent_id: agent.id,
          proposed_price: parseFloat(formData.get('proposed_price') as string),
          estimated_completion_days: parseInt(formData.get('estimated_days') as string),
          proposal_details: formData.get('proposal_details') as string
        } as any);

      if (error) throw error;

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
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SimpleHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Agent Profile Not Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                You need to create an agent profile first
              </p>
              <Button onClick={() => navigate('/agent-onboarding')}>Create Agent Profile</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-chiffon text-primary mb-2">Agent Dashboard</h1>
          <p className="text-muted-foreground">{agent.agency_name} • Rating: {agent.rating}/5 ({agent.total_reviews} reviews)</p>
          {!agent.is_verified && (
            <Badge variant="secondary" className="mt-2">Pending Verification</Badge>
          )}
        </div>

        {!agent.is_verified && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Application Under Review</h3>
                  <p className="text-sm text-yellow-800">
                    Your agent application is currently being reviewed by our admin team. 
                    You'll be able to access the marketplace and place bids once your application is approved. 
                    This typically takes 2-3 business days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">Available Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="my-bids">My Bids ({myBids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs available</h3>
                  <p className="text-muted-foreground">Check back later for new opportunities</p>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-chiffon">{job.title}</CardTitle>
                        <CardDescription>{job.description}</CardDescription>
                      </div>
                      <Badge>{job.booking_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{job.destination}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">${job.budget_min} - ${job.budget_max}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        if (!agent.is_verified) {
                          toast.error('Your application must be approved before you can place bids');
                          return;
                        }
                        setSelectedJob(job);
                        setIsBidDialogOpen(true);
                      }}
                      disabled={!agent.is_verified}
                    >
                      {agent.is_verified ? 'Place Bid' : 'Awaiting Approval'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="my-bids" className="space-y-4">
            {myBids.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                  <p className="text-muted-foreground">Start bidding on available jobs</p>
                </CardContent>
              </Card>
            ) : (
              myBids.map((bid) => (
                <Card key={bid.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-chiffon">{bid.marketplace_jobs?.title}</CardTitle>
                        <CardDescription>{bid.marketplace_jobs?.destination}</CardDescription>
                      </div>
                      <Badge variant={bid.status === 'accepted' ? 'default' : 'secondary'}>
                        {bid.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Your Bid:</span>
                        <span className="font-semibold">${bid.proposed_price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completion Time:</span>
                        <span>{bid.estimated_completion_days} days</span>
                      </div>
                      <p className="text-sm mt-2">{bid.proposal_details}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
              <div>
                <Label htmlFor="proposed_price">Your Price ($)</Label>
                <Input id="proposed_price" name="proposed_price" type="number" required step="0.01" />
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
      </main>

      <Footer />
    </div>
  );
}
