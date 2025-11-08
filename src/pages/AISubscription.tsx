import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AIUsageDisplay } from "@/components/ai/AIUsageDisplay";
import { useToast } from "@/hooks/use-toast";

export default function AISubscription() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const tier = searchParams.get("tier");

    if (success === "true") {
      toast({
        title: "Subscription Successful!",
        description: `You've successfully subscribed to the ${tier} plan. Your AI search limit has been updated.`,
      });
    } else if (canceled === "true") {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription process was canceled.",
        variant: "destructive"
      });
    }
  }, [searchParams, toast]);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Search Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your AI-powered search usage and upgrade your plan
          </p>
        </div>

        <AIUsageDisplay />
      </div>
    </div>
  );
}
