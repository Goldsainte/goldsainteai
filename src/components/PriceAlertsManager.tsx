import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Trash2, TrendingDown, Plane, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currencyHelpers";

interface PriceAlert {
  id: string;
  origin_code: string;
  destination_code: string;
  departure_date: string;
  return_date: string | null;
  adults: number;
  cabin_class: string;
  target_price: number;
  current_price: number | null;
  currency: string;
  is_active: boolean;
  notification_frequency: string;
  last_checked_at: string | null;
  created_at: string;
}

export const PriceAlertsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('flight_price_alerts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load price alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('flight_price_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAlerts(alerts.filter(a => a.id !== id));
      toast({
        title: "Alert Deleted",
        description: "Price alert removed successfully"
      });
    } catch (error: any) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete price alert",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    setTogglingId(id);
    try {
      const { error } = await supabase
        .from('flight_price_alerts')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;

      setAlerts(alerts.map(a => a.id === id ? { ...a, is_active: !currentState } : a));
      toast({
        title: !currentState ? "Alert Activated" : "Alert Paused",
        description: !currentState ? "You'll receive notifications for this route" : "Notifications paused for this route"
      });
    } catch (error: any) {
      console.error('Error toggling alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive"
      });
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-3">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Price Alerts</h3>
          <p className="text-sm text-muted-foreground">
            Set price alerts on flight search results to get notified when prices drop
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Price Alerts</h3>
        <Badge variant="secondary">{alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}</Badge>
      </div>

      {alerts.map((alert) => {
        const isPriceBelowTarget = alert.current_price && alert.current_price <= alert.target_price;
        const isPast = new Date(alert.departure_date) < new Date();

        return (
          <Card key={alert.id} className={`p-4 ${!alert.is_active || isPast ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className={`p-2 rounded-lg ${isPriceBelowTarget ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                  <Plane className={`h-5 w-5 ${isPriceBelowTarget ? 'text-green-600' : 'text-primary'}`} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base">{alert.origin_code}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-bold text-base">{alert.destination_code}</span>
                      {isPast && (
                        <Badge variant="secondary" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(alert.departure_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      {alert.return_date && ` - ${new Date(alert.return_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {alert.adults} {alert.adults === 1 ? 'Adult' : 'Adults'} • {alert.cabin_class}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alert.is_active && !isPast}
                      onCheckedChange={() => handleToggle(alert.id, alert.is_active)}
                      disabled={togglingId === alert.id || isPast}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(alert.id)}
                      disabled={deletingId === alert.id}
                      className="h-8 w-8"
                    >
                      {deletingId === alert.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <div className="text-xs text-muted-foreground">Target Price</div>
                    <div className="font-semibold">{formatCurrency(alert.target_price, alert.currency)}</div>
                  </div>

                  {alert.current_price && (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">Current Price</div>
                        <div className={`font-semibold ${isPriceBelowTarget ? 'text-green-600' : ''}`}>
                          {formatCurrency(alert.current_price, alert.currency)}
                        </div>
                      </div>

                      {isPriceBelowTarget && (
                        <Badge className="bg-green-500/10 text-green-700 border-green-200">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Below target!
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {alert.last_checked_at && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Last checked: {new Date(alert.last_checked_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
