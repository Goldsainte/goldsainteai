import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Plane, Hotel, Luggage, Compass, MapPin, Globe, Palmtree, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { BuyCoinsModal } from "@/components/BuyCoinsModal";

interface Gift {
  id: string;
  display_name: string;
  coin_cost: number;
  sort_order: number;
}

interface SendGiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  postId: string;
}

const getGiftName = (display: string) => {
  const parts = display.trim().split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : display;
};

const renderGiftIcon = (name: string) => {
  const key = name.toLowerCase();
  const iconProps = { className: "h-8 w-8 text-accent", strokeWidth: 2 };
  
  // Map generic gift names to travel-themed icons
  if (key.includes('heart')) return <Plane {...iconProps} />;
  if (key.includes('rose') || key.includes('flower')) return <Palmtree {...iconProps} />;
  if (key.includes('star')) return <Compass {...iconProps} />;
  if (key.includes('diamond') || key.includes('gem')) return <Hotel {...iconProps} />;
  if (key.includes('crown')) return <Globe {...iconProps} />;
  
  // Travel-themed keywords (if gifts are renamed in DB)
  if (key.includes('flight') || key.includes('plane')) return <Plane {...iconProps} />;
  if (key.includes('hotel') || key.includes('suite')) return <Hotel {...iconProps} />;
  if (key.includes('journey') || key.includes('trip') || key.includes('luggage')) return <Luggage {...iconProps} />;
  if (key.includes('adventure') || key.includes('compass')) return <Compass {...iconProps} />;
  if (key.includes('destination') || key.includes('pin')) return <MapPin {...iconProps} />;
  if (key.includes('world') || key.includes('globe')) return <Globe {...iconProps} />;
  if (key.includes('paradise') || key.includes('palm') || key.includes('beach')) return <Palmtree {...iconProps} />;
  if (key.includes('ticket') || key.includes('pass')) return <Ticket {...iconProps} />;
  
  // Fallback
  return <Compass {...iconProps} />;
};

export const SendGiftModal = ({ open, onOpenChange, recipientId, postId }: SendGiftModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { balance, refetch } = useCoinBalance();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadGifts();
      refetch(); // Refresh coin balance when modal opens
    }
  }, [open, refetch]);

  const loadGifts = async () => {
    const { data } = await supabase
      .from('virtual_gifts')
      .select('id, display_name, coin_cost, sort_order')
      .eq('is_active', true)
      .order('sort_order');
    
    if (data) setGifts(data);
  };

  const handleSendGift = async (giftId: string, cost: number) => {
    if (!user) return;
    if (recipientId === user.id) {
      toast({
        title: 'Not allowed',
        description: 'You cannot send a gift to yourself.',
        variant: 'destructive',
      });
      return;
    }
    
    if (balance < cost) {
      toast({
        title: "Insufficient Coins",
        description: "You need more coins to send this gift",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('process-gift-payment', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          giftId,
          recipientId,
          postId,
          coinAmount: cost
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Gift Sent! 🎁",
          description: `You spent ${cost} coins`,
        });
        refetch();
        onOpenChange(false);
      } else {
        throw new Error('Failed to send gift');
      }
    } catch (error: any) {
      console.error('Error sending gift:', error);
      const serverMessage = error?.context?.error || error?.context?.message;
      toast({
        title: 'Error',
        description: serverMessage || error.message || 'Failed to send gift. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[540px] border-accent/20 bg-card shadow-2xl z-[100]" data-tour="send-gift-modal">
          <DialogHeader className="space-y-4 pb-4">
            <DialogTitle className="flex items-center justify-center">
              <span className="font-secondary text-3xl tracking-wide bg-gradient-gold bg-clip-text text-transparent">
                Send a Gift
              </span>
            </DialogTitle>
            <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-primary shadow-lg border border-accent/30">
              <Coins className="h-6 w-6 text-accent" />
              <span className="font-secondary text-2xl font-bold text-primary-foreground">
                {balance}
              </span>
              <span className="text-base text-primary-foreground/90 uppercase tracking-wider font-medium">Coins</span>
            </div>
          </DialogHeader>
          
          {balance === 0 && (
            <div className="bg-gradient-primary rounded-xl p-5 text-center space-y-3 shadow-xl border border-accent/20">
              <p className="font-secondary text-base text-primary-foreground/90">Begin your luxury gifting experience</p>
              <Button 
                onClick={() => setBuyCoinsOpen(true)}
                className="w-full bg-gradient-gold hover:opacity-90 text-primary font-semibold text-sm h-11 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                <Coins className="h-4 w-4 mr-2" />
                Purchase Coins
              </Button>
            </div>
          )}
          
          <div className="max-h-[50vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-5 mt-2">
              {gifts.map((gift) => (
                <Button
                  key={gift.id}
                  onClick={() => handleSendGift(gift.id, gift.coin_cost)}
                  disabled={loading || balance < gift.coin_cost}
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-4 py-7 px-5 border-2 border-border rounded-2xl bg-background hover:border-accent hover:bg-accent/10 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none group"
                >
                  <div className="h-16 w-16 rounded-2xl border-2 border-accent/40 bg-accent/10 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/20 transition-all duration-300">
                    {renderGiftIcon(getGiftName(gift.display_name))}
                  </div>
                  <span className="font-secondary text-base font-semibold text-foreground leading-tight text-center min-h-[36px] flex items-center px-1">
                    {getGiftName(gift.display_name)}
                  </span>
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-gold shadow-lg border border-accent/20 group-hover:shadow-xl transition-shadow">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="text-base font-bold text-primary">{gift.coin_cost}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          {balance > 0 && balance < Math.min(...gifts.map(g => g.coin_cost)) && (
            <Button 
              onClick={() => setBuyCoinsOpen(true)}
              className="w-full mt-2 bg-gradient-gold hover:opacity-90 text-primary font-semibold h-10 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
            >
              <Coins className="h-4 w-4 mr-2" />
              Purchase More Coins
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <BuyCoinsModal 
        open={buyCoinsOpen} 
        onOpenChange={(open) => {
          setBuyCoinsOpen(open);
          if (!open) refetch();
        }} 
      />
    </>
  );
};
