import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCoinBalance } from "@/hooks/useCoinBalance";

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

  useEffect(() => {
    if (open) {
      loadGifts();
    }
  }, [open]);

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
      const { data, error } = await supabase.rpc('send_virtual_gift', {
        p_sender_id: user.id,
        p_recipient_id: recipientId,
        p_post_id: postId,
        p_gift_id: giftId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; coins_spent?: number };

      if (result?.success) {
        toast({
          title: "Gift Sent! 🎁",
          description: `You spent ${cost} coins`,
        });
        refetch();
        onOpenChange(false);
      } else {
        throw new Error(result?.error || 'Failed to send gift');
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      toast({
        title: "Error",
        description: "Failed to send gift",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Send a Gift</span>
            <div className="flex items-center gap-1 text-sm font-normal">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{balance} coins</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          {gifts.map((gift) => (
            <Button
              key={gift.id}
              onClick={() => handleSendGift(gift.id, gift.coin_cost)}
              disabled={loading || balance < gift.coin_cost}
              variant="outline"
              className="h-auto flex flex-col items-center gap-2 py-4"
            >
              <span className="text-3xl">{gift.display_name.split(' ')[0]}</span>
              <span className="text-xs">{gift.display_name.split(' ').slice(1).join(' ')}</span>
              <span className="text-xs font-medium flex items-center gap-1">
                <Coins className="h-3 w-3 text-yellow-500" />
                {gift.coin_cost}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
