import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}

export const UserActivityHistory = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserLogs();
  }, []);

  const fetchUserLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, entity_type, entity_id, details, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return '✅';
    if (action.includes('update')) return '✏️';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('login')) return '🔐';
    return '📝';
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading your activity...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Your Activity History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No activity recorded yet
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="text-2xl">{getActionIcon(log.action)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-sm text-muted-foreground">{log.entity_type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'PPpp')}
                  </p>
                  {Object.keys(log.details).length > 0 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        View details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
