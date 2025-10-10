import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CreatorEscrowDashboard = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Escrow system is active! Payments are held securely and released when milestones are met.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending in Escrow</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting milestone completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Released</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully paid out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Dispute</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Being reviewed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Escrow Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Platform Fee: 15%</h4>
            <p className="text-sm text-muted-foreground">
              A 15% platform fee covers payment processing, support, and platform operations.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Milestone-Based Releases</h4>
            <p className="text-sm text-muted-foreground">
              Earnings are released as you complete milestones. Submit evidence and get paid after customer approval.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Upfront Payout (Verified Creators)</h4>
            <p className="text-sm text-muted-foreground">
              Verified creators receive 20-30% upfront. The remaining 70-80% is held in escrow until milestones are met.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Example Breakdown</h4>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
              <p>• Customer pays: $5,000</p>
              <p>• Platform fee (15%): $750</p>
              <p>• Your earnings: $4,250</p>
              <p>• Upfront (20%): $850</p>
              <p>• Held in escrow: $3,400</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
