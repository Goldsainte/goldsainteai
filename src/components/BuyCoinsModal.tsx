import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CoinPackage {
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

const COIN_PACKAGES: CoinPackage[] = [
  { coins: 100, price: 0.99 },
  { coins: 500, price: 4.99, bonus: 50 },
  { coins: 1000, price: 9.99, bonus: 150, popular: true },
  { coins: 2500, price: 24.99, bonus: 500 },
  { coins: 5000, price: 49.99, bonus: 1200 },
];

interface BuyCoinsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BuyCoinsModal = ({ open, onOpenChange }: BuyCoinsModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (pkg: CoinPackage) => {
    setLoading(true);
    try {
      const totalCoins = pkg.coins + (pkg.bonus || 0);
      
      // Create payment intent via edge function
      const { data, error } = await supabase.functions.invoke('create-coin-purchase', {
        body: { coin_amount: totalCoins, price_usd: pkg.price }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Opening Checkout",
          description: "Complete your purchase in the new window",
        });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="h-6 w-6 text-yellow-500" />
            Buy Coins
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {COIN_PACKAGES.map((pkg) => (
            <div
              key={pkg.coins}
              className={`relative border rounded-lg p-4 ${
                pkg.popular ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">{pkg.coins.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Coins</div>
                
                {pkg.bonus && (
                  <div className="text-sm text-green-600 font-medium">
                    +{pkg.bonus} Bonus Coins!
                  </div>
                )}
                
                <div className="text-2xl font-bold text-primary">
                  ${pkg.price.toFixed(2)}
                </div>
                
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading}
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                >
                  {loading ? "Processing..." : "Buy Now"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center mt-4">
          Coins can be used to send virtual gifts to creators
        </div>
      </DialogContent>
    </Dialog>
  );
};
