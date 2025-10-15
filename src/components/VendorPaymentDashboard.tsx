import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorPaymentDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [escrowAccount, setEscrowAccount] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await supabase
        .from('transportation_vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendor) return;

      const { data: escrow, error: escrowError } = await supabase
        .from('vendor_escrow_accounts')
        .select('*')
        .eq('vendor_id', vendor.id)
        .single();

      if (escrowError && escrowError.code !== 'PGRST116') throw escrowError;

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('transportation_payments')
        .select('*, transportation_bookings(pickup_location, dropoff_location, pickup_datetime)')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (paymentsError) throw paymentsError;

      setEscrowAccount(escrow);
      setPayments(paymentsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      held_in_escrow: "default",
      released_to_vendor: "default",
      refunded: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace(/_/g, ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Dashboard</h1>
          <p className="text-muted-foreground">Track your earnings and payouts</p>
        </div>
        <Button>Request Payout</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${escrowAccount?.available_amount?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Release</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${escrowAccount?.pending_amount?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${escrowAccount?.balance?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent payments and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <DollarSign className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">${payment.vendor_payout.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Booking on {new Date(payment.transportation_bookings.pickup_datetime).toLocaleDateString()}
                    </p>
                    {payment.escrow_release_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Release: {new Date(payment.escrow_release_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(payment.payment_status)}
                  <p className="text-xs text-muted-foreground mt-1">
                    Platform fee: ${payment.platform_fee.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}