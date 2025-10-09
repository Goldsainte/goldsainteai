import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Briefcase, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PaymentMilestonesManager } from "@/components/PaymentMilestonesManager";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MyJobs() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchJobs();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    applyFilters();
  }, [jobs, filterStatus, searchQuery, sortBy]);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('marketplace_jobs')
        .select(`
          *,
          travel_agents(agency_name, rating),
          agent_bids(count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.destination?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "budget-high":
          return (b.budget_max || 0) - (a.budget_max || 0);
        case "budget-low":
          return (a.budget_min || 0) - (b.budget_min || 0);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "disputed":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Briefcase className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: "default",
      in_progress: "secondary",
      pending_approval: "default",
      completed: "default",
      cancelled: "destructive",
      disputed: "destructive",
      expired: "outline"
    };

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'in_progress' || j.status === 'pending_approval').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    open: jobs.filter(j => j.status === 'open').length,
    totalSpent: jobs
      .filter(j => j.status === 'completed' && j.total_paid_amount)
      .reduce((sum, j) => sum + j.total_paid_amount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-chiffon text-primary mb-1 leading-tight">My Jobs</h1>
          <p className="text-sm text-muted-foreground">Track and manage all your travel requests</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">
                    ${stats.totalSpent.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="budget-high">Budget (High)</SelectItem>
                  <SelectItem value="budget-low">Budget (Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Start by posting your first travel job"}
              </p>
              <Button onClick={() => navigate('/marketplace')}>
                Post a Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-lg font-chiffon mb-2 line-clamp-1">{job.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        {job.destination && (
                          <>
                            <span>{job.destination}</span>
                            <span>•</span>
                          </>
                        )}
                        <span className="font-medium text-foreground">
                          ${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {job.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {job.travel_agents && (
                        <span className="text-muted-foreground">
                          Agent: {job.travel_agents.agency_name}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => {
                        setSelectedJob(job);
                        setViewDetailsOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      {/* Job Details Modal */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-chiffon">{selectedJob?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-4 mt-2">
                {selectedJob && getStatusBadge(selectedJob.status)}
                <span className="text-sm">
                  Posted: {selectedJob && format(new Date(selectedJob.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Job Details</h3>
              <p className="text-sm text-muted-foreground mb-4">{selectedJob?.description}</p>
              <div className="grid grid-cols-2 gap-4">
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

            {/* Payment Milestones */}
            {(selectedJob?.status === 'in_progress' || 
              selectedJob?.status === 'completed' || 
              selectedJob?.status === 'pending_approval') && 
             selectedJob?.total_paid_amount && (
              <PaymentMilestonesManager
                jobId={selectedJob.id}
                totalAmount={selectedJob.total_paid_amount}
                currency={selectedJob.currency || 'USD'}
                isAgent={false}
              />
            )}

            {selectedJob?.travel_agents && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assigned Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedJob.travel_agents.agency_name}</p>
                      {selectedJob.travel_agents.rating && (
                        <p className="text-sm text-muted-foreground">
                          Rating: {selectedJob.travel_agents.rating}/5
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setViewDetailsOpen(false);
                        navigate('/marketplace');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      View Full Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}