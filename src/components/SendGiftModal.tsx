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
      toast({
        title: "Error",
        description: error.message || "Failed to send gift. Make sure the creator has set up payouts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]" data-tour="send-gift-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-2xl font-serif">
              <span>Send a Gift</span>
              <div className="flex items-center gap-2 text-base font-normal">
                <Coins className="h-5 w-5 text-[#BFAD72]" />
                <span className="font-semibold text-[#BFAD72]">{balance} coins</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {balance === 0 && (
            <div className="bg-[#0c4d47]/10 border-2 border-[#0c4d47] rounded-xl p-6 text-center space-y-3">
              <p className="text-base text-muted-foreground">You don't have any coins yet</p>
              <Button 
                onClick={() => setBuyCoinsOpen(true)}
                className="w-full bg-[#BFAD72] hover:bg-[#BFAD72]/90 text-[#0c4d47] font-semibold text-base h-12"
              >
                <Coins className="h-5 w-5 mr-2" />
                Buy Coins
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            {gifts.map((gift) => (
              <Button
                key={gift.id}
                onClick={() => handleSendGift(gift.id, gift.coin_cost)}
                disabled={loading || balance < gift.coin_cost}
                variant="outline"
                className="h-auto flex flex-col items-center gap-3 py-6 border-2 hover:border-[#BFAD72] hover:bg-[#BFAD72]/5 transition-all disabled:opacity-50"
              >
                <span className="text-5xl">{gift.display_name.split(' ')[0]}</span>
                <span className="text-base font-semibold">{gift.display_name.split(' ').slice(1).join(' ')}</span>
                <span className="text-sm font-bold flex items-center gap-1.5 text-[#BFAD72]">
                  <Coins className="h-4 w-4" />
                  {gift.coin_cost}
                </span>
              </Button>
            ))}
          </div>
          
          {balance > 0 && balance < Math.min(...gifts.map(g => g.coin_cost)) && (
            <Button 
              onClick={() => setBuyCoinsOpen(true)}
              className="w-full mt-3 bg-[#BFAD72] hover:bg-[#BFAD72]/90 text-[#0c4d47] font-semibold h-11"
            >
              <Coins className="h-4 w-4 mr-2" />
              Need More Coins?
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
