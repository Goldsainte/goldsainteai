import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export const CancellationPolicyBanner = () => {
  return (
    <div className="mb-16">
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Keep things flexible</h2>
          <p className="text-lg text-muted-foreground">
            You'll receive a full refund if you cancel at least 24 hours in advance of most experiences.
          </p>
        </div>
      </Card>
    </div>
  );
};
