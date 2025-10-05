import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, Star, TrendingUp, MapPin } from "lucide-react";

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
      medium: { variant: "secondary" as const, color: "text-yellow-600" },
      low: { variant: "outline" as const, color: "text-gray-600" },
    };
    const config = variants[confidence as keyof typeof variants] || variants.low;
    return (
      <Badge variant={config.variant} className={config.color}>
        {confidence} confidence
      </Badge>
    );
  };

  if (!analyzed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Agent Matching
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
          <p className="text-muted-foreground mb-4">
            Use AI to find the best matching travel agents for this job
          </p>
          <Button onClick={runMatching} disabled={loading}>
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
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommended Agents ({matches.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={runMatching} disabled={loading}>
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
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
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
