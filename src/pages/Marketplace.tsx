import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, DollarSign, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  description: string;
  booking_type: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  status: string;
  created_at: string;
  agent_bids: Array<{
    id: string;
    proposed_price: number;
    proposal_details: string;
    agent_id: string;
    travel_agents: {
      agency_name: string;
      rating: number;
    };
  }>;
}

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bookingType, setBookingType] = useState("package");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [destination, setDestination] = useState("");
  const [travelers, setTravelers] = useState("1");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMyJobs();
  }, [user, navigate]);

  const fetchMyJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_jobs')
        .select(`
          *,
          agent_bids(
            id,
            proposed_price,
            proposal_details,
            agent_id,
            travel_agents(agency_name, rating)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_jobs')
        .insert({
          user_id: user.id,
          title,
          description,
          booking_type: bookingType,
          requirements: {
            destination,
            travelers: parseInt(travelers)
          },
          budget_min: budgetMin ? parseFloat(budgetMin) : null,
          budget_max: budgetMax ? parseFloat(budgetMax) : null,
          currency: 'USD',
          destination,
          number_of_travelers: parseInt(travelers)
        });

      if (error) throw error;

      toast.success('Job posted successfully! Agents will start bidding soon.');
      setShowForm(false);
      fetchMyJobs();
      
      // Reset form
      setTitle("");
      setDescription("");
      setBudgetMin("");
      setBudgetMax("");
      setDestination("");
      setTravelers("1");
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-chiffon text-primary mb-2">Travel Agent Marketplace</h1>
          <p className="text-muted-foreground">Post complex booking requests and receive bids from professional travel agents</p>
        </div>

        {!showForm ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="py-8 text-center">
                <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Need help with a complex booking?</h2>
                <p className="text-muted-foreground mb-4">
                  Post your travel requirements and let professional agents compete for your business
                </p>
                <Button onClick={() => setShowForm(true)} size="lg">
                  Post a Job
                </Button>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-2xl font-semibold mb-4">My Posted Jobs</h2>
              {myJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No jobs posted yet
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myJobs.map((job) => (
                    <Card key={job.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{job.title}</CardTitle>
                            <CardDescription>{formatDate(job.created_at)}</CardDescription>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            job.status === 'open' ? 'bg-green-50 text-green-600' :
                            job.status === 'assigned' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm">{job.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {job.budget_min && job.budget_max 
                                ? `${job.currency} ${job.budget_min} - ${job.budget_max}`
                                : 'Budget flexible'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{job.agent_bids?.length || 0} bids</span>
                          </div>
                        </div>

                        {job.agent_bids && job.agent_bids.length > 0 && (
                          <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-2">Recent Bids:</h4>
                            <div className="space-y-2">
                              {job.agent_bids.slice(0, 3).map((bid) => (
                                <div key={bid.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                  <span className="text-sm font-medium">{bid.travel_agents.agency_name}</span>
                                  <span className="text-sm">{job.currency} {bid.proposed_price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Post a New Job</CardTitle>
              <CardDescription>
                Describe your travel needs and budget. Travel agents will bid on your job.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Plan 2-week European vacation for family of 4"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed requirements, preferences, and any special needs..."
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookingType">Booking Type *</Label>
                    <Select value={bookingType} onValueChange={setBookingType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">Hotel Only</SelectItem>
                        <SelectItem value="flight">Flight Only</SelectItem>
                        <SelectItem value="package">Complete Package</SelectItem>
                        <SelectItem value="custom">Custom Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travelers">Number of Travelers *</Label>
                    <Input
                      id="travelers"
                      type="number"
                      min="1"
                      value={travelers}
                      onChange={(e) => setTravelers(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g., Paris, France"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Budget Min (USD)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      min="0"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Budget Max (USD)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      min="0"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Posting...' : 'Post Job'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
