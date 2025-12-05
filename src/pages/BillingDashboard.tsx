import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, CreditCard, Calendar, DollarSign, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";

interface BillingInfo {
  customer: any;
  subscriptions: any[];
  invoices: any[];
  upcomingInvoice: any;
  paymentMethods: any[];
}

const BillingDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBillingInfo();
  }, [user]);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('get-billing-info', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      setBillingInfo(data);
    } catch (error: any) {
      console.error("Error fetching billing info:", error);
      toast.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      open: "secondary",
      draft: "outline",
      uncollectible: "destructive",
      void: "outline",
      active: "default",
      canceled: "destructive",
      past_due: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const handleManageSubscription = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        // Same-tab navigation to avoid popup blockers
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast.error("Failed to open subscription management");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <BackButton className="mb-6" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and billing</p>
        </div>
        <Button onClick={handleManageSubscription} className="gap-2">
          <CreditCard className="h-4 w-4" />
          Manage Subscription
        </Button>
      </div>

      {/* Current Subscription */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingInfo?.subscriptions && billingInfo.subscriptions.length > 0 ? (
            <div className="space-y-4">
              {billingInfo.subscriptions.map((sub) => (
                <div key={sub.id} className="flex justify-between items-start p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Status:</span>
                      {getStatusBadge(sub.status)}
                    </div>
                    {sub.items.map((item: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">
                          {formatCurrency(item.price, item.currency)}
                        </span>
                        <span className="text-muted-foreground"> / {item.interval}</span>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      Current period: {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}
                    </div>
                    {sub.cancel_at_period_end && (
                      <Badge variant="destructive">Cancels at period end</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active subscription</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Charges */}
      {billingInfo?.upcomingInvoice && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Charge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center p-4 border rounded-lg bg-muted/50">
              <div>
                <div className="font-semibold text-lg">
                  {formatCurrency(billingInfo.upcomingInvoice.amount_due, billingInfo.upcomingInvoice.currency)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Due: {formatDate(billingInfo.upcomingInvoice.next_payment_attempt || billingInfo.upcomingInvoice.period_end)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Billing period: {formatDate(billingInfo.upcomingInvoice.period_start)} - {formatDate(billingInfo.upcomingInvoice.period_end)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      {billingInfo?.paymentMethods && billingInfo.paymentMethods.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {billingInfo.paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium capitalize">
                      {pm.brand} ending in {pm.last4}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires {pm.exp_month}/{pm.exp_year}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>View and download past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {billingInfo?.invoices && billingInfo.invoices.length > 0 ? (
            <div className="space-y-3">
              {billingInfo.invoices.map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {invoice.number || `Invoice ${invoice.id.substring(0, 8)}`}
                      </span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(invoice.created)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => invoice.invoice_pdf && window.open(invoice.invoice_pdf, '_blank')}
                              disabled={!invoice.invoice_pdf}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!invoice.invoice_pdf && (
                          <TooltipContent>
                            <p>PDF generating, check back soon</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No billing history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;
