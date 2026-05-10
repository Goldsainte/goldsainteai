import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Briefcase, Award, Clock, ArrowLeft, Globe, Mail, Phone, Flag } from "lucide-react";
import { InstagramVerifiedBadge } from "@/components/badges/InstagramVerifiedBadge";
import { BusinessVerifiedBadge } from "@/components/badges/BusinessVerifiedBadge";
import { toast } from "sonner";
import { ReviewsSection } from "@/components/ReviewsSection";
import { AgentAvailabilityCalendar } from "@/components/AgentAvailabilityCalendar";
import { TrustBadges } from "@/components/TrustBadges";
import { ReportUserModal } from "@/components/ReportUserModal";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";
import { MessageButton } from "@/components/messaging/MessageButton";

export default function AgentProfile() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (agentId) {
      fetchAgentData();
    }
  }, [agentId]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);

      // Fetch agent details
      const { data: agentData, error: agentError } = await supabase
        .from('travel_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;
      setAgent(agentData);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('agent_reviews')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Calculate stats
      const { data: completedJobs, error: jobsError } = await supabase
        .from('marketplace_jobs')
        .select('id, status, created_at, completed_at')
        .eq('assigned_agent_id', agentId)
        .in('status', ['completed', 'in_progress']);

      if (!jobsError && completedJobs) {
        const completed = completedJobs.filter(j => j.status === 'completed');
        const avgCompletionTime = completed.length > 0
          ? completed.reduce((acc, job) => {
              const start = new Date(job.created_at).getTime();
              const end = new Date(job.completed_at).getTime();
              return acc + (end - start);
            }, 0) / completed.length / (1000 * 60 * 60 * 24) // Convert to days
          : 0;

        setStats({
          totalJobs: completedJobs.length,
          completedJobs: completed.length,
          completionRate: completedJobs.length > 0 
            ? Math.round((completed.length / completedJobs.length) * 100)
            : 0,
          avgCompletionTime: Math.round(avgCompletionTime)
        });
      }

    } catch (error: any) {
      console.error('Error fetching agent data:', error);
      toast.error('Failed to load agent profile');
    } finally {
      setLoading(false);
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

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2">Agent Not Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                The agent profile you're looking for doesn't exist
              </p>
              <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
            </CardContent>
          </Card>
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

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Agent Info */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={agent.profile_image_url} />
                    <AvatarFallback className="text-2xl">
                      {agent.agency_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>

                  <h1 className="text-2xl font-secondary text-primary mb-1">
                    {agent.agency_name}
                  </h1>

                  {agent.profiles && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {agent.profiles.first_name} {agent.profiles.last_name}
                    </p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-[#C7A962] text-[#C7A962]" />
                      <span className="text-2xl font-bold">{agent.rating?.toFixed(1) || "N/A"}</span>
                      <span className="text-muted-foreground">({agent.total_reviews || 0} reviews)</span>
                    </div>
                    
                    <TrustBadges
                      identityVerified={agent.identity_verified}
                      backgroundCheckStatus={agent.background_check_status}
                      professionalLicenseVerified={agent.professional_license_verified}
                      insuranceVerified={agent.insurance_verified}
                      trustScore={agent.trust_score}
                      size="md"
                    />
                  </div>

                  {agent.is_business_verified ? (
                    <div className="mb-4">
                      <BusinessVerifiedBadge />
                    </div>
                  ) : agent.is_verified ? (
                    <div className="mb-4">
                      <InstagramVerifiedBadge />
                    </div>
                  ) : null}

                  <p className="text-sm text-muted-foreground mb-4">
                    {agent.bio || 'No bio available'}
                  </p>

                  <div className="space-y-2 w-full">
                    <MessageButton
                      recipientId={agent.user_id}
                      recipientName={agent.agency_name}
                      className="w-full"
                    />
                    <Button className="w-full" onClick={() => navigate('/marketplace')}>
                      Request Service
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowReportModal(true)}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report Agent
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  {agent.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                  )}
                  {agent.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                  {agent.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={agent.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        Website
                      </a>
                    </div>
                  )}
                  {agent.experience_years && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{agent.experience_years} years experience</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="font-semibold">{stats.completionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Jobs Completed</span>
                    <span className="font-semibold">{stats.completedJobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Completion</span>
                    <span className="font-semibold">{stats.avgCompletionTime} days</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Specializations */}
            {agent.specializations && agent.specializations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.specializations.map((spec: string) => (
                      <Badge key={spec} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Destinations */}
            {agent.destinations && agent.destinations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Destination Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.destinations.map((dest: string) => (
                      <Badge key={dest} variant="outline">{dest}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {agent.languages && agent.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map((lang: string) => (
                      <Badge key={lang} variant="secondary">{lang}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No reviews yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.profiles?.avatar_url} />
                              <AvatarFallback>
                                {review.profiles?.first_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {review.profiles?.first_name
                                  ? `${review.profiles.first_name} ${review.profiles.last_name ?? ''}`
                                  : 'Customer'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-[#C7A962] text-[#C7A962]'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Travel Storyboard */}
            <div className="mt-6">
              <TravelStoryboard
                title="Storyboard Your Next Itinerary"
                subtitle={`Visual inspiration for trips to ${agent.destinations?.slice(0, 3).join(', ') || 'amazing destinations'}`}
                maxItems={16}
                highlightTags={agent.destinations || []}
              />
            </div>

            {/* Availability Calendar */}
            <AgentAvailabilityCalendar agentId={agentId!} />
          </div>
        </div>
      </main>
      
      {agent && (
        <ReportUserModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={agent.user_id}
          reportedUserName={agent.agency_name}
        />
      )}
    </div>
  );
}
