import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, Plus, MapPin, DollarSign, Clock, ArrowLeft, MessageSquare, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ComprehensiveJobForm } from "@/components/ComprehensiveJobForm";
import { JobBidsReview } from "@/components/JobBidsReview";
import { JobMessaging } from "@/components/JobMessaging";
import { JobApprovalModal } from "@/components/JobApprovalModal";
import { ReviewModal } from "@/components/ReviewModal";
import { DisputeResolutionModal } from "@/components/DisputeResolutionModal";
import { JobFileUpload } from "@/components/JobFileUpload";
import { PaymentMilestonesManager } from "@/components/PaymentMilestonesManager";
import { InvoiceGenerator } from "@/components/InvoiceGenerator";
import { PaymentPlanSelector } from "@/components/PaymentPlanSelector";
import { RefundGuaranteeCard } from "@/components/RefundGuaranteeCard";
import { AIAgentMatching } from "@/components/AIAgentMatching";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";

export default function Marketplace() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobBids, setJobBids] = useState<any[]>([]);
  const [completionSubmission, setCompletionSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewJobDialogOpen, setIsViewJobDialogOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewJobId, setReviewJobId] = useState<string>("");
  const [reviewAgentId, setReviewAgentId] = useState<string>("");
  const [reviewAgentName, setReviewAgentName] = useState<string>("");
  const [disputeJobId, setDisputeJobId] = useState<string | null>(null);
  const [jobAttachments, setJobAttachments] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchJobs();
  }, [user, isLoading, navigate]);

  const fetchAttachments = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('marketplace_job_attachments')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setJobAttachments(prev => ({ ...prev, [jobId]: data || [] }));
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const { data: openJobs, error: openError } = await supabase
        .from('marketplace_jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (openError) throw openError;
      setJobs(openJobs || []);

      const { data: userJobs, error: userError } = await supabase
        .from('marketplace_jobs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (userError) throw userError;
      setMyJobs(userJobs || []);

    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load marketplace jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobBids = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_bids')
        .select('*, travel_agents(*)')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobBids(data || []);
    } catch (error: any) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to load bids');
    }
  };

  const handleViewJob = async (job: any) => {
    setSelectedJob(job);
    await fetchJobBids(job.id);
    await fetchAttachments(job.id);
    
    // If job is pending approval, fetch completion submission
    if (job.status === 'pending_approval') {
      await fetchCompletionSubmission(job.id);
    }
    
    setIsViewJobDialogOpen(true);
  };

  const fetchCompletionSubmission = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_completion_submissions')
        .select('*')
        .eq('job_id', jobId)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      setCompletionSubmission(data);
    } catch (error: any) {
      console.error('Error fetching completion submission:', error);
    }
  };

  const handleCreateJob = async (jobData: any) => {
    try {
      const { error } = await supabase
        .from('marketplace_jobs')
        .insert({
          user_id: user?.id!,
          title: jobData.title,
          description: jobData.description,
          booking_type: jobData.jobCategory,
          requirements: {
            clientInfo: {
              name: jobData.clientName,
              contactMethod: jobData.contactMethod,
              timeZone: jobData.timeZone,
              preferredContactHours: jobData.preferredContactHours,
            },
            transportation: {
              departureCity: jobData.departureCity,
              destinationCity: jobData.destinationCity,
              departureDate: jobData.departureDate,
              returnDate: jobData.returnDate,
              numberOfTravelers: jobData.numberOfTravelers,
              ageGroups: jobData.ageGroups,
              classPreference: jobData.classPreference,
              airlinePreferences: jobData.airlinePreferences,
              baggageRequirements: jobData.baggageRequirements,
              visaRequired: jobData.visaRequired,
            },
            accommodation: {
              destination: jobData.hotelDestination,
              checkInDate: jobData.checkInDate,
              checkOutDate: jobData.checkOutDate,
              hotelStars: jobData.hotelStars,
              hotelBrand: jobData.hotelBrand,
              roomRequirements: jobData.roomRequirements,
              budgetPerNight: jobData.budgetPerNight,
              specialNeeds: jobData.specialNeeds,
            },
            itinerary: {
              destinations: jobData.destinations,
              tripDuration: jobData.tripDuration,
              tripType: jobData.tripType,
              preferredActivities: jobData.preferredActivities,
              includedServices: jobData.includedServices,
            },
            payment: {
              paymentMethod: jobData.paymentMethod,
              commissionTerms: jobData.commissionTerms,
            },
            timeline: {
              quoteDeadline: jobData.quoteDeadline,
              jobStartDate: jobData.jobStartDate,
              tripDate: jobData.tripDate,
              urgencyLevel: jobData.urgencyLevel,
            },
            agentRequirements: {
              languages: jobData.languagesRequired,
              experience: jobData.experienceRequired,
              accreditation: jobData.accreditationRequired,
            },
            deliverables: jobData.expectedDeliverables,
          },
          budget_min: jobData.budgetMin,
          budget_max: jobData.budgetMax,
          currency: jobData.currency,
          destination: jobData.destinationCity || jobData.hotelDestination || jobData.destinations,
          number_of_travelers: jobData.numberOfTravelers,
          travel_dates: jobData.departureDate || jobData.checkInDate || jobData.tripDate ? {
            start: jobData.departureDate || jobData.checkInDate || jobData.tripDate,
            end: jobData.returnDate || jobData.checkOutDate,
          } : null,
        } as any);

      if (error) throw error;

      // Get the newly created job
      const { data: newJob } = await supabase
        .from('marketplace_jobs')
        .select('id, title, description, destination, budget_min, budget_max, booking_type')
        .eq('user_id', user?.id!)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (newJob) {
        // Trigger AI matching in background (non-blocking)
        try {
          await invokeEdgeFunction('ai-agent-matching', {
            body: {
              jobId: newJob.id,
              generateScores: true
            },
            timeout: 20000,
            showToastOnError: false,
          });
          console.log('AI matching triggered for job:', newJob.id);
        } catch (matchError) {
          console.error('Error triggering AI matching:', matchError);
        }

        // Notify agents about the new job
        try {
          await invokeEdgeFunction('notify-agents-new-job', {
            body: {
              jobId: newJob.id,
              jobTitle: newJob.title,
              jobDescription: newJob.description,
              destination: newJob.destination || 'Not specified',
              budgetMin: newJob.budget_min,
              budgetMax: newJob.budget_max,
            },
            timeout: 15000,
            showToastOnError: false,
          });
        } catch (notifyError) {
          console.error('Error notifying agents:', notifyError);
        }
      }

      toast.success('Job posted successfully! Agents have been notified.');
      setIsCreateDialogOpen(false);
      fetchJobs();
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error('Failed to post job');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-chiffon text-primary mb-2">Travel Agent Marketplace</h1>
            <p className="text-muted-foreground">Connect with expert travel agents for complex bookings</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Post a Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0">
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                <DialogTitle className="font-chiffon text-2xl">Post a Comprehensive Travel Job</DialogTitle>
                <DialogDescription>
                  Provide detailed information about your travel needs and get bids from qualified agents
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-hidden px-6 pb-6">
                <ComprehensiveJobForm 
                  onSubmit={handleCreateJob}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
            <TabsTrigger value="my-jobs">My Jobs ({myJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No open jobs</h3>
                  <p className="text-muted-foreground text-center">
                    Be the first to post a travel job
                  </p>
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
                    <Button variant="outline" className="w-full">View Details & Bid</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="my-jobs" className="space-y-4">
            {myJobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs posted yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Post your first travel job to connect with agents
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>Post a Job</Button>
                </CardContent>
              </Card>
            ) : (
              myJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-chiffon">{job.title}</CardTitle>
                        <CardDescription>{job.destination}</CardDescription>
                      </div>
                       <Badge variant={
                         job.status === 'open' ? 'default' :
                         job.status === 'in_progress' ? 'default' :
                         job.status === 'pending_approval' ? 'secondary' :
                         job.status === 'completed' ? 'default' :
                         job.status === 'assigned' ? 'secondary' :
                         job.status === 'expired' ? 'destructive' :
                         'outline'
                       }>
                         {job.status.replace('_', ' ')}
                       </Badge>
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
                        <span className="text-sm">{job.currency} {job.budget_min} - {job.budget_max}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleViewJob(job)} 
                      className="w-full"
                      variant="outline"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Bids & Messages
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isViewJobDialogOpen} onOpenChange={setIsViewJobDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-chiffon">{selectedJob?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={
                  selectedJob?.status === 'open' ? 'default' :
                  selectedJob?.status === 'assigned' ? 'secondary' :
                  selectedJob?.status === 'expired' ? 'destructive' :
                  'outline'
                }>
                  {selectedJob?.status}
                </Badge>
                <span className="text-sm">
                  Expires: {selectedJob?.expires_at ? new Date(selectedJob.expires_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Job Details</h3>
              <p className="text-sm text-muted-foreground">{selectedJob?.description}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium">{selectedJob?.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget Range</p>
                  <p className="font-medium">
                    {selectedJob?.currency} {selectedJob?.budget_min} - {selectedJob?.budget_max}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Agent Matching - Show for open jobs */}
            {selectedJob?.status === 'open' && (
              <AIAgentMatching
                jobId={selectedJob.id}
                onSelectAgent={(agentId) => {
                  navigate(`/agents/${agentId}`);
                }}
              />
            )}

            <JobBidsReview
              jobId={selectedJob?.id}
              bids={jobBids}
              jobStatus={selectedJob?.status}
              onBidAccepted={() => {
                fetchJobs();
                if (selectedJob) {
                  fetchJobBids(selectedJob.id);
                }
              }}
            />

            {selectedJob?.status === 'pending_approval' && completionSubmission && (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                        Job Completion Submitted
                      </h3>
                      <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                        Your agent has marked this job as complete. Please review their work and approve to release payment.
                      </p>
                      <Button 
                        onClick={() => setIsApprovalModalOpen(true)}
                        size="sm"
                      >
                        Review & Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* File Upload Section - Show for assigned/in_progress jobs */}
            {(selectedJob?.status === 'assigned' || selectedJob?.status === 'in_progress') && (
              <JobFileUpload
                jobId={selectedJob.id}
                onUploadComplete={() => fetchAttachments(selectedJob.id)}
              />
            )}

            {/* Payment Milestones - Show for in_progress and completed jobs */}
            {(selectedJob?.status === 'in_progress' || selectedJob?.status === 'completed' || selectedJob?.status === 'pending_approval') && selectedJob?.total_paid_amount && (
              <PaymentMilestonesManager
                jobId={selectedJob.id}
                totalAmount={selectedJob.total_paid_amount}
                currency={selectedJob.currency || 'USD'}
                isAgent={false}
              />
            )}

            {/* Payment Plan Option - Show for open/assigned jobs */}
            {(selectedJob?.status === 'open' || selectedJob?.status === 'assigned') && 
             !selectedJob?.payment_plan_enabled && 
             selectedJob?.budget_max && (
              <PaymentPlanSelector
                jobId={selectedJob.id}
                totalAmount={selectedJob.budget_max}
                currency={selectedJob.currency || 'USD'}
                onPlanCreated={() => {
                  fetchJobs();
                  toast.success('Payment plan created successfully');
                }}
              />
            )}

            {/* Refund Guarantee - Show for assigned jobs without guarantee */}
            {selectedJob?.status === 'assigned' && 
             !selectedJob?.refund_guarantee_enabled && 
             selectedJob?.total_paid_amount && (
              <RefundGuaranteeCard
                jobId={selectedJob.id}
                totalAmount={selectedJob.total_paid_amount}
                currency={selectedJob.currency || 'USD'}
                onGuaranteeAdded={() => {
                  fetchJobs();
                  toast.success('Refund protection added');
                }}
              />
            )}

            {/* Invoice Generation - Show for completed jobs */}
            {selectedJob?.status === 'completed' && selectedJob?.assigned_agent_id && (
              <InvoiceGenerator
                jobId={selectedJob.id}
                customerId={selectedJob.user_id}
                agentId={selectedJob.assigned_agent_id}
              />
            )}

            {(selectedJob?.status === 'assigned' || selectedJob?.status === 'in_progress') && selectedJob?.assigned_agent_id && (
              <>
                <JobMessaging
                  jobId={selectedJob.id}
                  receiverId={selectedJob.assigned_agent_id}
                />
                
                {/* Dispute Resolution Button */}
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      variant="outline"
                      className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDisputeJobId(selectedJob.id)}
                    >
                      Raise a Dispute
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Having issues? Open a dispute for our team to review
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {completionSubmission && selectedJob && (
        <JobApprovalModal
          open={isApprovalModalOpen}
          onOpenChange={setIsApprovalModalOpen}
          submissionId={completionSubmission.id}
          jobId={selectedJob.id}
          completionNotes={completionSubmission.completion_notes || ''}
          deliverables={completionSubmission.deliverables_description}
          onSuccess={() => {
            fetchJobs();
            setIsApprovalModalOpen(false);
            setIsViewJobDialogOpen(false);
            
            // Prompt for review
            if (selectedJob?.assigned_agent_id) {
              const agentBid = jobBids.find(bid => bid.status === 'accepted');
              if (agentBid) {
                setReviewJobId(selectedJob.id);
                setReviewAgentId(selectedJob.assigned_agent_id);
                setReviewAgentName(agentBid.travel_agents?.agency_name || 'this agent');
                setIsReviewModalOpen(true);
              }
            }
          }}
        />
      )}

      {reviewJobId && reviewAgentId && (
        <ReviewModal
          jobId={reviewJobId}
          agentId={reviewAgentId}
          agentName={reviewAgentName}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewJobId("");
            setReviewAgentId("");
            setReviewAgentName("");
          }}
          onSuccess={() => {
            toast.success('Thank you for your review!');
          }}
        />
      )}

      <DisputeResolutionModal
        open={!!disputeJobId}
        onOpenChange={(open) => !open && setDisputeJobId(null)}
        jobId={disputeJobId || ''}
        onSuccess={() => {
          fetchJobs();
          setDisputeJobId(null);
          setIsViewJobDialogOpen(false);
        }}
      />

      <Footer />
    </div>
  );
}
