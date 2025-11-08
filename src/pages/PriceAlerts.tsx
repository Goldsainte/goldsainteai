import { Bell } from "lucide-react";
import { PriceAlertsManager } from "@/components/PriceAlertsManager";
import { Card } from "@/components/ui/card";

const PriceAlerts = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Flight Price Alerts</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor flight prices and get notified when they drop below your target budget
          </p>
        </div>

        <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <h3 className="font-semibold mb-2">How Price Alerts Work</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Search for flights and click the bell icon to set an alert</li>
            <li>• We check prices automatically every 6 hours</li>
            <li>• Get notified instantly, daily, or weekly when prices drop</li>
            <li>• Alerts expire after the departure date passes</li>
          </ul>
        </Card>

        <PriceAlertsManager />
      </div>
    </div>
  );
};

export default PriceAlerts;
