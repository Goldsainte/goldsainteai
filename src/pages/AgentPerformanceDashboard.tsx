import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { AgentPerformanceMetrics } from "@/components/AgentPerformanceMetrics";
import { AgentPerformanceBadges } from "@/components/AgentPerformanceBadges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Award, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AgentPerformanceDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    fetchAgentData();
  }, [user, isAdmin, isAgent, authLoading, roleLoading, navigate]);

  const fetchAgentData = async () => {
    try {
      const { data, error } = await supabase
        .from('travel_agents')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      // If admin and no agent record, load first available agent for viewing
      if (!data && isAdmin) {
        const { data: firstAgent, error: firstAgentError } = await supabase
          .from('travel_agents')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (firstAgentError) throw firstAgentError;
        setAgent(firstAgent);
      } else if (!data) {
        // Non-admin without agent record
        toast.error('Agent profile required');
        navigate('/agent-onboarding');
        return;
      } else {
        setAgent(data);
      }
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      toast.error('Failed to load agent data');
      if (!isAdmin) {
        navigate('/agent-onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/agent-dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agent Dashboard
          </Button>
          {isAdmin && agent?.user_id !== user?.id && (
            <Badge variant="outline">Viewing as Admin</Badge>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-secondary text-primary mb-2">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            {agent.agency_name} • Track your performance metrics and achievements
          </p>
        </div>

        {/* Badges Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Your Achievement Badges</CardTitle>
            </div>
            <CardDescription>
              Badges earned based on your performance and service quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgentPerformanceBadges agentId={agent.id} showLabels={true} />
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Performance Metrics</CardTitle>
            </div>
            <CardDescription>
              Your latest performance statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgentPerformanceMetrics agentId={agent.id} compact={false} />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {agent.trust_score || 0}/100
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on verifications and performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {agent.rating?.toFixed(1) || '0.0'}/5.0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {agent.total_reviews || 0} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-muted-foreground" />
                <div className="text-lg font-semibold">
                  {new Date(agent.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Account created
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
