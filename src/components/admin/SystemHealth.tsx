import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Zap, Server, AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  lastChecked: string;
  message?: string;
}

export function SystemHealth() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      name: "Database",
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
    {
      name: "Edge Functions",
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
    {
      name: "Storage",
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
    {
      name: "External APIs",
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const runHealthChecks = async () => {
    // TODO: Implement actual health checks
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "down":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      healthy: "default",
      degraded: "secondary",
      down: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getServiceIcon = (name: string) => {
    switch (name) {
      case "Database":
        return <Database className="h-5 w-5" />;
      case "Edge Functions":
        return <Zap className="h-5 w-5" />;
      case "Storage":
        return <Server className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const overallStatus =
    healthChecks.every((c) => c.status === "healthy")
      ? "healthy"
      : healthChecks.some((c) => c.status === "down")
      ? "down"
      : "degraded";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Health Overview</CardTitle>
              <CardDescription>Real-time status of all platform services</CardDescription>
            </div>
            {getStatusBadge(overallStatus)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthChecks.map((check) => (
              <div
                key={check.name}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div className="flex items-center gap-3">
                    {getServiceIcon(check.name)}
                    <div>
                      <p className="font-medium">{check.name}</p>
                      {check.message && (
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {check.responseTime !== undefined && (
                    <p className="text-sm font-medium">{check.responseTime}ms</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(check.lastChecked).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
