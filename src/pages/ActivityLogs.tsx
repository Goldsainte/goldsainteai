import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ActivityLogViewer } from "@/components/activity/ActivityLogViewer";
import { UserActivityHistory } from "@/components/activity/UserActivityHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";

const ActivityLogs = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!roles);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Activity Logs
        </h1>
        <p className="text-muted-foreground mt-2">
          {isAdmin ? 'Monitor platform-wide activity and user actions' : 'View your recent activity'}
        </p>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Activity</TabsTrigger>
            <TabsTrigger value="personal">My Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <ActivityLogViewer />
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <UserActivityHistory />
          </TabsContent>
        </Tabs>
      ) : (
        <UserActivityHistory />
      )}
    </div>
  );
};

export default ActivityLogs;
