import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Target, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PromotePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

interface PromotionPlan {
  id: string;
  name: string;
  duration_days: number;
  reach_estimate: string;
  price: number;
  features: string[];
  icon: typeof TrendingUp;
}

const promotionPlans: PromotionPlan[] = [
  {
    id: "basic",
    name: "Basic Boost",
    duration_days: 3,
    reach_estimate: "5K-10K",
    price: 29.99,
    features: [
      "3 days of promotion",
      "Highlighted in feed",
      "Estimated 5K-10K reach"
    ],
    icon: TrendingUp
  },
  {
    id: "standard",
    name: "Standard Boost",
    duration_days: 7,
    reach_estimate: "15K-25K",
    price: 79.99,
    features: [
      "7 days of promotion",
      "Priority placement in feed",
      "Estimated 15K-25K reach",
      "Featured on Trending page"
    ],
    icon: Users
  },
  {
    id: "premium",
    name: "Premium Boost",
    duration_days: 14,
    reach_estimate: "50K-100K",
    price: 149.99,
    features: [
      "14 days of promotion",
      "Top placement in feed",
      "Estimated 50K-100K reach",
      "Featured on Trending page",
      "Cross-platform promotion"
    ],
    icon: Target
  }
];

export function PromotePostModal({ open, onOpenChange, postId }: PromotePostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("standard");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePromote = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to promote posts",
        variant: "destructive",
      });
      return;
    }

    const plan = promotionPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsProcessing(true);

    try {
      // Create checkout session for promotion payment
      const { data, error } = await supabase.functions.invoke('create-promotion-checkout', {
        body: {
          postId,
          planId: plan.id,
          amount: plan.price,
          durationDays: plan.duration_days
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error promoting post:", error);
      toast({
        title: "Error",
        description: "Failed to start promotion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPlanDetails = promotionPlans.find(p => p.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Promote Your Post
          </DialogTitle>
          <DialogDescription>
            Boost your post's visibility and reach more travelers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
            {promotionPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? "border-secondary bg-secondary/5"
                      : "hover:border-secondary/50"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-secondary" />
                          <Label htmlFor={plan.id} className="text-lg font-semibold cursor-pointer">
                            {plan.name}
                          </Label>
                        </div>
                        <span className="text-2xl font-bold text-secondary">
                          ${plan.price}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {plan.duration_days} days
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {plan.reach_estimate} reach
                        </div>
                      </div>

                      <ul className="space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              );
            })}
          </RadioGroup>

          {selectedPlanDetails && (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Total</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlanDetails.duration_days} days promotion
                  </p>
                </div>
                <p className="text-2xl font-bold text-secondary">
                  ${selectedPlanDetails.price}
                </p>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePromote} 
            disabled={isProcessing}
            className="bg-secondary hover:bg-secondary/90"
          >
            {isProcessing ? "Processing..." : "Promote Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
