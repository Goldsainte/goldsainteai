import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Clock, CheckCircle2 } from "lucide-react";

interface CancellationPolicy {
  id: string;
  name: string;
  description: string;
  full_refund_hours: number;
  partial_refund_hours: number | null;
  partial_refund_percentage: number | null;
  no_refund_hours: number;
  is_default: boolean;
}

interface CancellationPolicySelectorProps {
  selectedPolicyId?: string;
  onPolicySelect: (policyId: string) => void;
}

export const CancellationPolicySelector = ({
  selectedPolicyId,
  onPolicySelect,
}: CancellationPolicySelectorProps) => {
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("cancellation_policies")
        .select("*")
        .order("full_refund_hours", { ascending: false });

      if (error) throw error;

      setPolicies(data || []);
      
      // Auto-select default policy if none selected
      if (!selectedPolicyId && data) {
        const defaultPolicy = data.find((p) => p.is_default);
        if (defaultPolicy) {
          onPolicySelect(defaultPolicy.id);
        }
      }
    } catch (error) {
      console.error("Error fetching cancellation policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    if (hours >= 24) {
      const days = hours / 24;
      return `${days} ${days === 1 ? "day" : "days"}`;
    }
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  };

  if (loading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Cancellation Policy
        </CardTitle>
        <CardDescription>
          Choose the refund terms that work best for your service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedPolicyId} onValueChange={onPolicySelect}>
          <div className="space-y-3">
            {policies.map((policy) => (
              <Label
                key={policy.id}
                htmlFor={policy.id}
                className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
              >
                <RadioGroupItem value={policy.id} id={policy.id} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{policy.name}</span>
                    {policy.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {policy.description}
                  </p>
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>
                        Full refund up to {formatHours(policy.full_refund_hours)} before
                      </span>
                    </div>
                    {policy.partial_refund_hours && policy.partial_refund_percentage && (
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3 text-orange-500" />
                        <span>
                          {policy.partial_refund_percentage}% refund up to{" "}
                          {formatHours(policy.partial_refund_hours)} before
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        No refund within {formatHours(policy.no_refund_hours)} of service
                      </span>
                    </div>
                  </div>
                </div>
              </Label>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
