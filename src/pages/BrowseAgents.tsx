import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedAgentCard } from "@/components/EnhancedAgentCard";
import { RealTimeBookingNotifications } from "@/components/RealTimeBookingNotifications";


export default function BrowseAgents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [minRating, setMinRating] = useState<number>(0);
  const [experienceRange, setExperienceRange] = useState<"all" | "0-2" | "3-5" | "5+">("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [myAgentProfile, setMyAgentProfile] = useState<any | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<Record<string, any>>({});
  const [agentBadges, setAgentBadges] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [agents, searchQuery, filterSpecialization, sortBy, minRating, experienceRange, selectedLanguage]);

  // Fetch my agent profile for current user (to guide onboarding/visibility)
  useEffect(() => {
    const fetchMyProfile = async () => {
      if (!user) {
        setMyAgentProfile(null);
        return;
      }
      const { data } = await supabase
        .from('travel_agents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setMyAgentProfile(data || null);
    };
    fetchMyProfile();
  }, [user]);

  const fetchAgents = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('travel_agents')
        .select('*')
        .eq('is_verified', true)
        .eq('is_active', true);

      if (error) throw error;
      setAgents(data || []);

      // Fetch metrics and badges for all agents
      if (data && data.length > 0) {
        const agentIds = data.map(a => a.id);
        
        // Fetch performance metrics
        const { data: metricsData } = await supabase
          .from('agent_performance_metrics')
          .select('*')
          .in('agent_id', agentIds);
        
        const metricsMap: Record<string, any> = {};
        metricsData?.forEach(m => {
          metricsMap[m.agent_id] = m;
        });
        setAgentMetrics(metricsMap);

        // Fetch badges
        const { data: badgesData } = await supabase
          .from('agent_badges')
          .select('*')
          .in('agent_id', agentIds)
          .gte('valid_until', new Date().toISOString());
        
        const badgesMap: Record<string, any[]> = {};
        badgesData?.forEach(b => {
          if (!badgesMap[b.agent_id]) badgesMap[b.agent_id] = [];
          badgesMap[b.agent_id].push(b);
        });
        setAgentBadges(badgesMap);
      }
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...agents];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.agency_name?.toLowerCase().includes(query) ||
        agent.bio?.toLowerCase().includes(query) ||
        agent.specializations?.some((s: string) => s.toLowerCase().includes(query)) ||
        agent.destinations?.some((d: string) => d.toLowerCase().includes(query))
      );
    }

    // Specialization filter
    if (filterSpecialization !== "all") {
      filtered = filtered.filter(agent =>
        agent.specializations?.includes(filterSpecialization)
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(agent => (agent.rating || 0) >= minRating);
    }

    // Experience filter
    if (experienceRange !== "all") {
      filtered = filtered.filter(agent => {
        const exp = agent.experience_years || 0;
        if (experienceRange === "0-2") return exp <= 2;
        if (experienceRange === "3-5") return exp >= 3 && exp <= 5;
        if (experienceRange === "5+") return exp > 5;
        return true;
      });
    }

    // Language filter
    if (selectedLanguage !== "all") {
      filtered = filtered.filter(agent =>
        agent.languages?.includes(selectedLanguage)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === "reviews") {
        return (b.total_reviews || 0) - (a.total_reviews || 0);
      } else if (sortBy === "experience") {
        return (b.experience_years || 0) - (a.experience_years || 0);
      }
      return 0;
    });

    setFilteredAgents(filtered);
  };

  // Get unique specializations and languages
  const allSpecializations = Array.from(
    new Set(agents.flatMap(agent => agent.specializations || []))
  );
  
  const allLanguages = Array.from(
    new Set(agents.flatMap(agent => agent.languages || []))
  );

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

        <div className="mb-8">
          <h1 className="text-4xl font-chiffon text-primary mb-2">Browse Travel Agents</h1>
          <p className="text-muted-foreground">Find the perfect agent for your travel needs</p>
        </div>

        {user && !myAgentProfile && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-3">
                You're not listed yet. Complete agent onboarding to appear here and bid on jobs.
              </p>
              <Button onClick={() => navigate('/agent-onboarding')}>Complete Agent Onboarding</Button>
            </CardContent>
          </Card>
        )}

        {user && myAgentProfile && (!myAgentProfile.is_active || !myAgentProfile.is_verified) && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm">Your profile status</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={myAgentProfile.is_active ? 'secondary' : 'destructive'}>
                      Active: {myAgentProfile.is_active ? 'Yes' : 'No'}
                    </Badge>
                    <Badge variant={myAgentProfile.is_verified ? 'secondary' : 'outline'}>
                      Verified: {myAgentProfile.is_verified ? 'Yes' : 'Pending'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate('/agent-dashboard')}>Manage Profile</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Primary Filters */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {allSpecializations.map(spec => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="experience">Most Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                  <Select value={minRating.toString()} onValueChange={(v) => setMinRating(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Rating</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Experience</label>
                  <Select value={experienceRange} onValueChange={(v: any) => setExperienceRange(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Experience</SelectItem>
                      <SelectItem value="0-2">0-2 Years</SelectItem>
                      <SelectItem value="3-5">3-5 Years</SelectItem>
                      <SelectItem value="5+">5+ Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Language</SelectItem>
                      {allLanguages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredAgents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <EnhancedAgentCard
                key={agent.id}
                agent={agent}
                metrics={agentMetrics[agent.id]}
                badges={agentBadges[agent.id]}
                onClick={() => navigate(`/agent/${agent.id}`)}
              />
            ))}
          </div>
        )}

        {/* Real-time booking notifications */}
        <RealTimeBookingNotifications />
      </main>
    </div>
  );
}
