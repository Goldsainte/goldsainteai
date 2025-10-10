import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PromotePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

// Calculate promotion benefits based on budget
const calculateBenefits = (budget: number) => {
  const daysPerDollar = 0.2; // 5 dollars = 1 day
  const reachPerDollar = 200; // $1 = 200 estimated reach
  
  const days = Math.max(1, Math.round(budget * daysPerDollar));
  const reach = Math.round(budget * reachPerDollar);
  
  const features = [];
  
  // Base features
  features.push(`${days} day${days > 1 ? 's' : ''} of promotion`);
  features.push("Highlighted in feed");
  features.push(`Estimated ${reach.toLocaleString()}+ reach`);
  
  // Premium features based on budget
  if (budget >= 50) {
    features.push("Priority placement in feed");
  }
  if (budget >= 100) {
    features.push("Featured on Trending page");
  }
  if (budget >= 150) {
    features.push("Cross-platform promotion");
  }
  if (budget >= 200) {
    features.push("Dedicated account manager support");
  }
  
  return {
    days,
    reach: `${(reach / 1000).toFixed(1)}K${reach >= 10000 ? '+' : ''}`,
    features
  };
};

export function PromotePostModal({ open, onOpenChange, postId }: PromotePostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budget, setBudget] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);

  const benefits = calculateBenefits(budget);

  const handlePromote = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to promote posts",
        variant: "destructive",
      });
      return;
    }

    if (budget < 10) {
      toast({
        title: "Minimum Budget Required",
        description: "The minimum promotion budget is $10",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create checkout session for promotion payment
      const { data, error } = await supabase.functions.invoke('create-promotion-checkout', {
        body: {
          postId,
          planId: 'custom',
          amount: budget,
          durationDays: benefits.days
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Promote Your Post
          </DialogTitle>
          <DialogDescription>
            Choose your budget to boost visibility and reach more travelers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Budget Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Your Budget</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                <span className="text-3xl font-bold text-secondary">
                  ${budget}
                </span>
              </div>
            </div>
            
            <Slider
              value={[budget]}
              onValueChange={(value) => setBudget(value[0])}
              min={10}
              max={500}
              step={5}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$10 min</span>
              <span>$500 max</span>
            </div>
          </div>

          {/* Promotion Benefits */}
          <Card className="p-6 border-2 border-secondary/20 bg-secondary/5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-secondary" />
              What You'll Get
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold text-secondary">{benefits.days} day{benefits.days > 1 ? 's' : ''}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Est. Reach</p>
                <p className="text-2xl font-bold text-secondary">{benefits.reach}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Features included:</p>
              <ul className="space-y-2">
                {benefits.features.map((feature, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-secondary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Budget Suggestions */}
          <div className="flex gap-2">
            {[50, 100, 200, 300].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setBudget(amount)}
                className={budget === amount ? "border-secondary bg-secondary/10" : ""}
              >
                ${amount}
              </Button>
            ))}
          </div>

          {/* Total Summary */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Total Investment</p>
                <p className="text-sm text-muted-foreground">
                  {benefits.days} days · {benefits.reach} estimated reach
                </p>
              </div>
              <p className="text-3xl font-bold text-secondary">
                ${budget}
              </p>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePromote} 
            disabled={isProcessing || budget < 10}
            className="bg-secondary hover:bg-secondary/90"
          >
            {isProcessing ? "Processing..." : `Promote for $${budget}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
