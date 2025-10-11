import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
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
        <DialogContent className="sm:max-w-[540px] border-accent/20 bg-gradient-to-br from-card via-card to-accent/5" data-tour="send-gift-modal">
          <DialogHeader className="space-y-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="font-secondary text-3xl tracking-wide bg-gradient-gold bg-clip-text text-transparent">
                Send a Gift
              </span>
            </DialogTitle>
            <div className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-primary shadow-lg border border-accent/30">
              <Coins className="h-5 w-5 text-accent" />
              <span className="font-secondary text-lg font-semibold text-primary-foreground">
                {balance}
              </span>
              <span className="text-sm text-primary-foreground/80 uppercase tracking-wider">Coins</span>
            </div>
          </DialogHeader>
          
          {balance === 0 && (
            <div className="bg-gradient-primary rounded-2xl p-8 text-center space-y-4 shadow-xl border border-accent/20">
              <p className="font-secondary text-lg text-primary-foreground/90">Begin your luxury gifting experience</p>
              <Button 
                onClick={() => setBuyCoinsOpen(true)}
                className="w-full bg-gradient-gold hover:opacity-90 text-primary font-semibold text-base h-14 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                <Coins className="h-5 w-5 mr-2" />
                Purchase Coins
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-5 mt-2">
            {gifts.map((gift) => (
              <Button
                key={gift.id}
                onClick={() => handleSendGift(gift.id, gift.coin_cost)}
                disabled={loading || balance < gift.coin_cost}
                variant="outline"
                className="h-auto flex flex-col items-center gap-4 py-8 px-4 border-2 border-accent/30 rounded-2xl bg-card hover:border-accent hover:bg-accent/10 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none group"
              >
                <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{gift.display_name.split(' ')[0]}</span>
                <span className="font-secondary text-base font-medium text-foreground">{gift.display_name.split(' ').slice(1).join(' ')}</span>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-gold shadow-md">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{gift.coin_cost}</span>
                </div>
              </Button>
            ))}
          </div>
          
          {balance > 0 && balance < Math.min(...gifts.map(g => g.coin_cost)) && (
            <Button 
              onClick={() => setBuyCoinsOpen(true)}
              className="w-full mt-4 bg-gradient-gold hover:opacity-90 text-primary font-semibold h-12 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
            >
              <Coins className="h-5 w-5 mr-2" />
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
