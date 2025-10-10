import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export function TierUpgradeHistory() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["tier-upgrade-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tier_upgrade_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tier History</CardTitle>
          <CardDescription>Your tier upgrade history will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No tier changes yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tier History</CardTitle>
        <CardDescription>Track your creator tier progression</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => {
            const isUpgrade = entry.upgrade_type === 'automatic' || entry.upgrade_type === 'promotional';
            const Icon = isUpgrade ? ArrowUp : ArrowDown;
            const iconColor = isUpgrade ? "text-green-500" : "text-orange-500";

            return (
              <div key={entry.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className={`p-2 rounded-full bg-secondary ${iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium capitalize">{entry.from_tier}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium capitalize">{entry.to_tier}</span>
                    </div>
                    <Badge variant={isUpgrade ? "default" : "secondary"}>
                      {entry.upgrade_type}
                    </Badge>
                  </div>
                  {entry.reason && (
                    <p className="text-sm text-muted-foreground">{entry.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}