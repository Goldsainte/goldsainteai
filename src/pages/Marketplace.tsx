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
import { Briefcase, Plus, MapPin, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { ComprehensiveJobForm } from "@/components/ComprehensiveJobForm";

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchJobs();
  }, [user, navigate]);

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

      toast.success('Job posted successfully!');
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
        <SimpleHeader />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
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
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="font-chiffon text-2xl">Post a Comprehensive Travel Job</DialogTitle>
                <DialogDescription>
                  Provide detailed information about your travel needs and get bids from qualified agents
                </DialogDescription>
              </DialogHeader>
              
              <ComprehensiveJobForm 
                onSubmit={handleCreateJob}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
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
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Budget: ${job.budget_min} - ${job.budget_max}
                      </span>
                      <Button variant="outline" size="sm">View Bids</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
