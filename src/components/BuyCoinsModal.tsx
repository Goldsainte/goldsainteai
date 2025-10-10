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
  { coins: 10000, price: 99.00, bonus: 2500 },
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
      const currentPath = window.location.pathname;
      
      // Create payment intent via edge function
      const { data, error } = await supabase.functions.invoke('create-coin-purchase', {
        body: { 
          coin_amount: totalCoins, 
          price_usd: pkg.price,
          return_url: `${window.location.origin}${currentPath}`
        }
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
      <DialogContent className="max-w-3xl max-h-[90vh]" data-tour="buy-coins-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="h-5 w-5 text-yellow-500" />
            Buy Coins
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {COIN_PACKAGES.map((pkg) => (
            <div
              key={pkg.coins}
              className={`relative border rounded-lg p-3 ${
                pkg.popular ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="text-center space-y-1.5">
                <div className="text-2xl font-bold">{pkg.coins.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Coins</div>
                
                {pkg.bonus && (
                  <div className="text-xs text-green-600 font-medium">
                    +{pkg.bonus} Bonus!
                  </div>
                )}
                
                <div className="text-xl font-bold text-primary">
                  ${pkg.price.toFixed(2)}
                </div>
                
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading}
                  className="w-full h-8 text-sm"
                  variant={pkg.popular ? "default" : "outline"}
                >
                  {loading ? "Processing..." : "Buy Now"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center mt-2">
          Coins can be used to send virtual gifts to creators
        </div>
      </DialogContent>
    </Dialog>
  );
};
