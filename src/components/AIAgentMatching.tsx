import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, Star, TrendingUp, MapPin, RefreshCw } from "lucide-react";

interface AgentMatch {
  agent_id: string;
  agent_name: string;
  match_score: number;
  confidence_level: string;
  rating: number;
  total_reviews: number;
  matching_factors: Record<string, number>;
}

interface AIAgentMatchingProps {
  jobId: string;
  onSelectAgent?: (agentId: string) => void;
}

export function AIAgentMatching({ jobId, onSelectAgent }: AIAgentMatchingProps) {
  const [matches, setMatches] = useState<AgentMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [autoLoading, setAutoLoading] = useState(true);

  // Auto-load pre-calculated matches on mount
  useEffect(() => {
    loadPreCalculatedMatches();
  }, [jobId]);

  const loadPreCalculatedMatches = async () => {
    try {
      const { data: scores, error } = await supabase
        .from('ai_matching_scores')
        .select(`
          match_score,
          confidence_level,
          matching_factors,
          agent_id,
          travel_agents (
            agency_name,
            rating,
            total_reviews
          )
        `)
        .eq('job_id', jobId)
        .order('match_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (scores && scores.length > 0) {
        const formattedMatches = scores.map((score: any) => ({
          agent_id: score.agent_id,
          agent_name: score.travel_agents?.agency_name || 'Unknown Agent',
          match_score: score.match_score,
          confidence_level: score.confidence_level,
          rating: score.travel_agents?.rating || 0,
          total_reviews: score.travel_agents?.total_reviews || 0,
          matching_factors: score.matching_factors || {},
        }));
        
        setMatches(formattedMatches);
        setAnalyzed(true);
      }
    } catch (error) {
      console.error('Error loading pre-calculated matches:', error);
    } finally {
      setAutoLoading(false);
    }
  };

  const runMatching = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-agent-matching", {
        body: { jobId, generateScores: true },
      });

      if (error) throw error;

      setMatches(data.matches || []);
      setAnalyzed(true);
      toast.success(`Found ${data.matches?.length || 0} matching agents`);
      
      // Reload from database to ensure we have the latest data
      await loadPreCalculatedMatches();
    } catch (error) {
      console.error("Error running AI matching:", error);
      toast.error("Failed to find matching agents");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: { variant: "default" as const, color: "text-green-600" },
      medium: { variant: "secondary" as const, color: "text-[#C7A962]" },
      low: { variant: "outline" as const, color: "text-gray-600" },
    };
    const config = variants[confidence as keyof typeof variants] || variants.low;
    return (
      <Badge variant={config.variant} className={config.color}>
        {confidence} confidence
      </Badge>
    );
  };

  if (!analyzed && autoLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse text-primary" />
            AI Agent Matching
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">
            Loading AI-recommended agents...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analyzed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Agent Matching</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Use AI to find the best matching travel agents for this job
          </p>
          <Button onClick={runMatching} disabled={loading} size="sm">
            {loading ? "Analyzing..." : "Find Best Matches"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommended Agents ({matches.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={runMatching} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No matching agents found
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div
                key={match.agent_id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <h4 className="font-semibold">{match.agent_name}</h4>
                      {getConfidenceBadge(match.confidence_level)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-[#C7A962]" />
                        {match.rating.toFixed(1)} ({match.total_reviews} reviews)
                      </span>
                    </div>
                  </div>
                  {onSelectAgent && (
                    <Button size="sm" onClick={() => onSelectAgent(match.agent_id)}>
                      View Profile
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Match Score</span>
                    <span className="font-bold text-primary">{match.match_score}%</span>
                  </div>
                  <Progress value={match.match_score} className="h-2" />

                  {Object.keys(match.matching_factors).length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Match Factors:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(match.matching_factors).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace(/_/g, " ")}: {Math.round(value as number)}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
