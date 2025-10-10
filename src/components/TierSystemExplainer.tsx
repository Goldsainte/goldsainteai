import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, TrendingUp, Award, Zap } from "lucide-react";

export function TierSystemExplainer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          How the Tier System Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            Your creator tier is based on your performance metrics including followers, posts, engagement rate, and monthly earnings.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Automatic Evaluation</h4>
              <p className="text-sm text-muted-foreground">
                Your tier is automatically evaluated when you click the refresh button on your tier card. The system calculates your current metrics (followers, posts, engagement, earnings) and determines if you qualify for a higher tier.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Tier Benefits</h4>
              <p className="text-sm text-muted-foreground">
                Higher tiers unlock better commission bonuses, priority support, analytics access, and exclusive features. Each tier has specific requirements you need to meet.
              </p>
            </div>
          </div>

          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2">Metrics Tracked:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-5 list-disc">
              <li><strong>Followers:</strong> Total followers from user_follows table</li>
              <li><strong>Posts:</strong> Total posts you've created</li>
              <li><strong>Engagement Rate:</strong> (Likes + Comments) / Posts / Followers × 100</li>
              <li><strong>Monthly Earnings:</strong> Sum of completed earnings from last 30 days</li>
            </ul>
          </div>

          <div className="bg-primary/5 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Tip:</strong> To move up tiers, focus on creating engaging content, growing your follower base, and earning through packages, templates, and virtual gifts. Click the refresh button on your tier card to recalculate your progress anytime.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}