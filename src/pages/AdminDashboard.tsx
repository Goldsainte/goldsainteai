import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformMetrics } from "@/components/admin/PlatformMetrics";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Shield, Users, FileText, DollarSign, Activity, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  // Check if user is admin (you'll need to implement this check)
  const isAdmin = true; // TODO: Implement actual admin check

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform management and monitoring</p>
        </div>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="metrics">
            <Activity className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            Health
          </TabsTrigger>
          <TabsTrigger value="security">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <PlatformMetrics />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>User Management - Coming Soon</p>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Content Moderation - Coming Soon</p>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Revenue Analytics - Coming Soon</p>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>System Health - Coming Soon</p>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Security Monitoring - Coming Soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
