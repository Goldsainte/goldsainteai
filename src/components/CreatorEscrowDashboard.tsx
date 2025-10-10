import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CreatorEscrowDashboard = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Escrow system is now active! Your payments will be held securely and released according to your package milestones.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending in Escrow</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
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
            <div className="text-2xl font-bold text-green-600">$0.00</div>
            <p className="text-xs text-muted-foreground">
              Transferred to your account
            </p>
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
              Goldsainte collects a 15% platform fee from each booking to maintain the platform, provide customer support, and ensure secure transactions.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Upfront Payout (Verified Creators)</h4>
            <p className="text-sm text-muted-foreground">
              If you're a verified creator, you can receive 20-30% of your payout upfront to cover deposits and initial costs. The remaining 70-80% is held in escrow.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Final Release</h4>
            <p className="text-sm text-muted-foreground">
              Remaining funds are released 48-72 hours after trip completion (or 7 days before for high-trust creators). Customers can dispute within this window for protection.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Payment Breakdown Example</h4>
            <div className="text-sm space-y-1 pl-4">
              <p>• Customer pays: $5,000</p>
              <p>• Platform fee (15%): $750</p>
              <p>• Your total earnings: $4,250</p>
              <p>• Upfront to you (20%): $850</p>
              <p>• Held in escrow: $3,400</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
