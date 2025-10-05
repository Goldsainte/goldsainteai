import { useState } from "react";
import { CreditCard, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentPlanSelectorProps {
  jobId: string;
  totalAmount: number;
  currency: string;
  onPlanCreated?: () => void;
}

export const PaymentPlanSelector = ({
  jobId,
  totalAmount,
  currency,
  onPlanCreated,
}: PaymentPlanSelectorProps) => {
  const { toast } = useToast();
  const [selectedInstallments, setSelectedInstallments] = useState("3");
  const [frequency, setFrequency] = useState("monthly");
  const [creating, setCreating] = useState(false);

  const installmentOptions = [
    { value: "3", label: "3 installments" },
    { value: "6", label: "6 installments" },
    { value: "12", label: "12 installments" },
  ];

  const calculateInstallment = () => {
    const count = parseInt(selectedInstallments);
    return (totalAmount / count).toFixed(2);
  };

  const calculateEndDate = () => {
    const count = parseInt(selectedInstallments);
    const now = new Date();
    
    let months = 0;
    if (frequency === "weekly") months = Math.ceil(count / 4);
    else if (frequency === "biweekly") months = Math.ceil(count / 2);
    else months = count;

    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate.toLocaleDateString();
  };

  const createPaymentPlan = async () => {
    try {
      setCreating(true);

      const count = parseInt(selectedInstallments);
      const installmentAmount = parseFloat(calculateInstallment());
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      // Calculate end date based on frequency
      if (frequency === "weekly") {
        endDate.setDate(endDate.getDate() + (count * 7));
      } else if (frequency === "biweekly") {
        endDate.setDate(endDate.getDate() + (count * 14));
      } else {
        endDate.setMonth(endDate.getMonth() + count);
      }

      // Calculate next payment date
      const nextPayment = new Date(startDate);
      if (frequency === "weekly") {
        nextPayment.setDate(nextPayment.getDate() + 7);
      } else if (frequency === "biweekly") {
        nextPayment.setDate(nextPayment.getDate() + 14);
      } else {
        nextPayment.setMonth(nextPayment.getMonth() + 1);
      }

      const { error } = await supabase.from("payment_plans").insert({
        job_id: jobId,
        total_amount: totalAmount,
        currency,
        number_of_installments: count,
        installment_amount: installmentAmount,
        frequency,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        next_payment_date: nextPayment.toISOString().split("T")[0],
        status: "pending",
      });

      if (error) throw error;

      // Update job to enable payment plan
      await supabase
        .from("marketplace_jobs")
        .update({ payment_plan_enabled: true })
        .eq("id", jobId);

      toast({
        title: "Payment plan created",
        description: `${count} installments of ${currency} ${installmentAmount} each`,
      });

      onPlanCreated?.();
    } catch (error: any) {
      console.error("Error creating payment plan:", error);
      toast({
        title: "Failed to create payment plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Plan Options
        </CardTitle>
        <CardDescription>
          Break down your payment into flexible installments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Spread the cost over time with flexible payment installments. No interest or hidden fees.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Number of Installments</Label>
          <RadioGroup value={selectedInstallments} onValueChange={setSelectedInstallments}>
            {installmentOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="cursor-pointer flex-1">
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    <span className="font-semibold">
                      {currency} {(totalAmount / parseInt(option.value)).toFixed(2)} each
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Payment Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Installment Amount:</span>
            <span className="font-bold text-lg">
              {currency} {calculateInstallment()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">First Payment:</span>
            <span className="font-medium">Today</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Final Payment:</span>
            <span className="font-medium">{calculateEndDate()}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-semibold">
              {currency} {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={createPaymentPlan}
          disabled={creating}
          className="w-full"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {creating ? "Creating Plan..." : "Set Up Payment Plan"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By setting up a payment plan, you agree to automatic charges on the scheduled dates
        </p>
      </CardContent>
    </Card>
  );
};
