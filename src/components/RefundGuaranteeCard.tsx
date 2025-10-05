import { Shield, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RefundOption {
  type: string;
  title: string;
  description: string;
  coverage: number;
  price: number;
}

interface RefundGuaranteeCardProps {
  jobId: string;
  totalAmount: number;
  currency: string;
  onGuaranteeAdded?: () => void;
}

export const RefundGuaranteeCard = ({
  jobId,
  totalAmount,
  currency,
  onGuaranteeAdded,
}: RefundGuaranteeCardProps) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [adding, setAdding] = useState(false);

  const refundOptions: RefundOption[] = [
    {
      type: "full_refund",
      title: "Full Refund Protection",
      description: "100% refund if you cancel for any reason",
      coverage: 100,
      price: totalAmount * 0.10, // 10% of booking
    },
    {
      type: "partial_refund",
      title: "Partial Refund Protection",
      description: "50% refund if you cancel up to 48 hours before",
      coverage: 50,
      price: totalAmount * 0.05, // 5% of booking
    },
    {
      type: "service_credit",
      title: "Service Credit",
      description: "Get 100% as credit for future bookings",
      coverage: 100,
      price: totalAmount * 0.03, // 3% of booking
    },
  ];

  const addRefundGuarantee = async () => {
    if (!selectedOption) {
      toast({
        title: "No option selected",
        description: "Please select a refund protection option",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdding(true);

      const option = refundOptions.find((o) => o.type === selectedOption);
      if (!option) throw new Error("Invalid option");

      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 6); // Valid for 6 months

      const claimDeadline = new Date();
      claimDeadline.setDate(claimDeadline.getDate() - 2); // Must claim 2 days before travel

      const { error } = await supabase.from("refund_guarantees").insert({
        job_id: jobId,
        guarantee_type: option.type,
        coverage_percentage: option.coverage,
        covered_amount: (totalAmount * option.coverage) / 100,
        currency,
        terms_and_conditions: `${option.description}. Valid until ${validUntil.toLocaleDateString()}. Claims must be made before ${claimDeadline.toLocaleDateString()}.`,
        valid_until: validUntil.toISOString().split("T")[0],
        claim_deadline: claimDeadline.toISOString().split("T")[0],
      });

      if (error) throw error;

      // Update job
      await supabase
        .from("marketplace_jobs")
        .update({ refund_guarantee_enabled: true })
        .eq("id", jobId);

      toast({
        title: "Protection added",
        description: `${option.title} has been added to your booking`,
      });

      onGuaranteeAdded?.();
    } catch (error: any) {
      console.error("Error adding refund guarantee:", error);
      toast({
        title: "Failed to add protection",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Refund Protection
        </CardTitle>
        <CardDescription>
          Add peace of mind with flexible cancellation options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
          {refundOptions.map((option) => (
            <Card
              key={option.type}
              className={`cursor-pointer transition-all ${
                selectedOption === option.type
                  ? "border-primary shadow-md"
                  : "hover:border-muted-foreground"
              }`}
              onClick={() => setSelectedOption(option.type)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={option.type} id={option.type} />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.type}
                      className="cursor-pointer flex items-start justify-between"
                    >
                      <div>
                        <h4 className="font-semibold mb-1">{option.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {option.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {option.coverage}% Coverage
                          </Badge>
                          {option.type === "full_refund" && (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Most Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Add for</p>
                        <p className="text-lg font-bold">
                          {currency} {option.price.toFixed(2)}
                        </p>
                      </div>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>

        <Button
          onClick={addRefundGuarantee}
          disabled={!selectedOption || adding}
          className="w-full"
        >
          {adding ? "Adding Protection..." : "Add Refund Protection"}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ Cancel for any reason coverage available</p>
          <p>✓ Quick and easy claims process</p>
          <p>✓ Protection lasts for 6 months from booking</p>
        </div>
      </CardContent>
    </Card>
  );
};
