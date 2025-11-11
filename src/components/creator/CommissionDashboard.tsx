import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Package, ShoppingBag, Gift, Link as LinkIcon } from "lucide-react";

interface RevenueSource {
  type: "booking" | "shop" | "gift" | "affiliate" | "partnership";
  amount: number;
  commission: number;
  count: number;
}

interface CommissionDashboardProps {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  revenueSources: RevenueSource[];
  currency: string;
  tierMultiplier: number;
}

export function CommissionDashboard({
  totalEarnings,
  availableBalance,
  pendingBalance,
  revenueSources,
  currency,
  tierMultiplier,
}: CommissionDashboardProps) {
  const getSourceIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Package className="w-4 h-4" />;
      case "shop":
        return <ShoppingBag className="w-4 h-4" />;
      case "gift":
        return <Gift className="w-4 h-4" />;
      case "affiliate":
        return <LinkIcon className="w-4 h-4" />;
      case "partnership":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (type: string) => {
    switch (type) {
      case "booking":
        return "Package Bookings";
      case "shop":
        return "Shop Sales";
      case "gift":
        return "Virtual Gifts";
      case "affiliate":
        return "Affiliate Revenue";
      case "partnership":
        return "Partnerships";
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(availableBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">In hold period</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Source</CardTitle>
          <CardDescription>
            Your earnings across all monetization channels
            {tierMultiplier > 1 && (
              <Badge variant="secondary" className="ml-2">
                {tierMultiplier}x Tier Bonus Applied
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueSources.map((source) => (
              <div key={source.type} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getSourceIcon(source.type)}
                  </div>
                  <div>
                    <p className="font-medium">{getSourceLabel(source.type)}</p>
                    <p className="text-sm text-muted-foreground">{source.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(source.commission)}</p>
                  <p className="text-xs text-muted-foreground">from {formatCurrency(source.amount)}</p>
                </div>
              </div>
            ))}

            {revenueSources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No revenue sources yet</p>
                <p className="text-sm mt-1">Start creating content and packages to earn commissions!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commission Structure Info */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Structure</CardTitle>
          <CardDescription>How your earnings are calculated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package Bookings</span>
              <span className="font-medium">Up to 40% commission</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shop Product Sales</span>
              <span className="font-medium">30% commission</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Virtual Gifts</span>
              <span className="font-medium">70% of gift value</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Affiliate Revenue</span>
              <span className="font-medium">Variable by partner</span>
            </div>
            {tierMultiplier > 1 && (
              <>
                <div className="border-t pt-3 mt-3" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Tier Multiplier</span>
                  <Badge variant="secondary">{tierMultiplier}x</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your tier bonus is applied to all commission earnings, boosting your total payout.
                </p>
              </>
            )}
            <div className="border-t pt-3 mt-3" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-medium">10% of commission</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Hold Period</span>
              <span className="font-medium">14 days after trip completion</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
