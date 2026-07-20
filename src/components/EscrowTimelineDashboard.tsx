import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EscrowTimelineDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await (supabase as any)
        .from('transportation_vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendor) return;

      const { data, error } = await (supabase as any)
        .from('transportation_payments')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPayments(data || []);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'held_in_escrow': return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'released_to_vendor': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'refunded': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getTimeUntilRelease = (releaseDate: string) => {
    const now = new Date();
    const release = new Date(releaseDate);
    const diff = release.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : "Ready for release";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Timeline</h1>
        <p className="text-muted-foreground">Track your payment releases</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Payment status and release timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(payment.payment_status)}
                  <div>
                    <p className="font-semibold">
                      ${payment.vendor_payout.toFixed(2)} {payment.currency || 'USD'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Booking ID: {payment.booking_id.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={payment.payment_status === 'released_to_vendor' ? 'default' : 'secondary'}>
                    {payment.payment_status}
                  </Badge>
                  {payment.payment_status === 'held_in_escrow' && payment.escrow_release_date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Releases in {getTimeUntilRelease(payment.escrow_release_date)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No payments yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
