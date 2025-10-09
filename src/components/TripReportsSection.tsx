import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Calendar, ThumbsUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripReport {
  id: string;
  title: string;
  destination: string;
  trip_date: string;
  report_content: string;
  rating: number;
  would_recommend: boolean;
  agent_id?: string;
  created_at: string;
}

interface TripReportsSectionProps {
  agentId?: string;
  limit?: number;
}

export const TripReportsSection = ({ agentId, limit = 6 }: TripReportsSectionProps) => {
  const [reports, setReports] = useState<TripReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchReports();
  }, [agentId]);

  const fetchReports = async () => {
    try {
      let query = supabase
        .from('trip_reports')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching trip reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No trip reports available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {reports.map((report) => {
        const isExpanded = expanded[report.id];
        const contentPreview = report.report_content.slice(0, 200);
        const shouldTruncate = report.report_content.length > 200;

        return (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < report.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{report.rating}/5</span>
                  </div>
                </div>
                {report.would_recommend && (
                  <Badge variant="secondary" className="gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    Recommends
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {report.destination}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(report.trip_date).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {isExpanded || !shouldTruncate
                  ? report.report_content
                  : `${contentPreview}...`}
              </CardDescription>
              {shouldTruncate && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => toggleExpanded(report.id)}
                  className="px-0 mt-2"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
