import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Filter, Search } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const ActivityLogViewer = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueEntities = Array.from(new Set(logs.map(log => log.entity_type)));

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-500';
    if (action.includes('update')) return 'bg-blue-500';
    if (action.includes('delete')) return 'bg-red-500';
    if (action.includes('login')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading activity logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Platform Activity Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {uniqueEntities.map(entity => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No activity logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.entity_type}</TableCell>
                    <TableCell className="font-mono text-xs">{log.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip_address}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {JSON.stringify(log.details)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </CardContent>
    </Card>
  );
};
