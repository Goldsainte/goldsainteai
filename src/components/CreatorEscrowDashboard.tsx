import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const CreatorEscrowDashboard = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('creator_escrow_payouts')
        .select(`
          *,
          package:travel_packages(name),
          booking:bookings(booking_reference)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock },
      completed: { variant: "default", icon: CheckCircle },
      cancelled: { variant: "destructive", icon: null }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {status}
      </Badge>
    );
  };

  const totalPending = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.net_amount), 0);

  const totalReleased = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.net_amount), 0);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending in Escrow</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Will be released according to schedule
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Released</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalReleased.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Transferred to your account
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No payouts yet
              </p>
            ) : (
              payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{payout.package.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {payout.payout_type} • {payout.booking.booking_reference}
                    </div>
                    {payout.milestone_description && (
                      <div className="text-xs text-muted-foreground">
                        {payout.milestone_description}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <div className="font-semibold">
                      {payout.currency} {Number(payout.net_amount).toFixed(2)}
                    </div>
                    {getStatusBadge(payout.status)}
                    {payout.scheduled_release_date && payout.status === 'pending' && (
                      <div className="text-xs text-muted-foreground">
                        Release: {new Date(payout.scheduled_release_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
