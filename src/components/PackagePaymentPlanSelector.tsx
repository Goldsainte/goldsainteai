import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PackagePaymentPlanSelectorProps {
  packageData: any;
  bookingId: string;
  onPlanCreated?: () => void;
}

export const PackagePaymentPlanSelector = ({
  packageData,
  bookingId,
  onPlanCreated
}: PackagePaymentPlanSelectorProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>("deposit_final");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const depositAmount = (packageData.price * (packageData.deposit_percentage || 30)) / 100;
  const remainingAmount = packageData.price - depositAmount;

  const handleCreatePaymentPlan = async () => {
    try {
      setCreating(true);

      const installmentCount = selectedPlan === "monthly" 
        ? packageData.payment_plan_options?.installments || 3
        : 2;

      const { data, error } = await supabase.functions.invoke('create-package-payment-plan', {
        body: {
          packageId: packageData.id,
          bookingId: bookingId,
          paymentPlanType: selectedPlan,
          installmentCount: installmentCount
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout for deposit
      if (data.clientSecret) {
        window.location.href = data.clientSecret;
      }

      toast({
        title: "Payment plan created",
        description: "Redirecting to secure checkout for your deposit payment...",
      });

      onPlanCreated?.();
    } catch (error: any) {
      console.error("Error creating payment plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create payment plan",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getPlanDescription = (planType: string) => {
    if (planType === "deposit_final") {
      return {
        title: "Deposit + Final Payment",
        description: `Pay ${packageData.deposit_percentage || 30}% now, remaining 30 days before trip`,
        schedule: [
          { label: "Today (Deposit)", amount: depositAmount },
          { label: "30 days before trip", amount: remainingAmount }
        ]
      };
    } else {
      const installments = packageData.payment_plan_options?.installments || 3;
      const monthlyAmount = remainingAmount / (installments - 1);
      return {
        title: "Monthly Installments",
        description: `Pay ${packageData.deposit_percentage || 30}% now, then ${installments - 1} monthly payments`,
        schedule: [
          { label: "Today (Deposit)", amount: depositAmount },
          { label: `${installments - 1} monthly payments`, amount: monthlyAmount }
        ]
      };
    }
  };

  const availablePlans = packageData.payment_plan_options?.types || ["deposit_final"];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Choose Your Payment Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your payment is charged securely through Stripe to the creator in stages. Deposits are non-refundable.
          </AlertDescription>
        </Alert>

        <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
          {availablePlans.map((planType: string) => {
            const plan = getPlanDescription(planType);
            return (
              <div
                key={planType}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPlan === planType ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => setSelectedPlan(planType)}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={planType} id={planType} className="mt-1" />
                  <div className="flex-1 space-y-3">
                    <Label htmlFor={planType} className="cursor-pointer">
                      <div className="font-semibold">{plan.title}</div>
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                    </Label>
                    <div className="space-y-2">
                      {plan.schedule.map((payment, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{payment.label}</span>
                          <span className="font-medium">
                            {packageData.currency} {payment.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Package Price</span>
            <span className="font-semibold">
              {packageData.currency} {packageData.price.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due Today (Deposit)</span>
            <span className="font-semibold text-primary">
              {packageData.currency} {depositAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={handleCreatePaymentPlan}
          disabled={creating}
          className="w-full"
          size="lg"
        >
          {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue to Secure Payment
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Payments automatically charged on schedule. Cancel anytime per cancellation policy.
        </p>
      </CardContent>
    </Card>
  );
};
