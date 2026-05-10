import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProposalComposerProps {
  conversationId: string;
  senderId: string;
  onClose: () => void;
  onSent?: () => void;
}

export function ProposalComposer({
  conversationId,
  senderId,
  onClose,
  onSent,
}: ProposalComposerProps) {
  const [price, setPrice] = useState("");
  const [depositPercentage, setDepositPercentage] = useState("25");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(price);
    const depPct = Number(depositPercentage);
    if (!priceNum || priceNum <= 0) {
      toast({ title: "Enter a valid price", variant: "destructive" });
      return;
    }
    if (!depPct || depPct <= 0 || depPct > 100) {
      toast({ title: "Deposit % must be between 1 and 100", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        body: `Proposal: $${priceNum.toLocaleString()} (${depPct}% deposit)`,
        message_type: "proposal",
        metadata: {
          price: priceNum,
          depositPercentage: depPct,
          note: note.trim(),
        },
      } as any);
      if (error) throw error;
      toast({ title: "Proposal sent" });
      onSent?.();
      onClose();
    } catch (err: any) {
      toast({
        title: "Couldn't send proposal",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[#E5DFC6]/40 bg-[#FDFBF7] p-4 space-y-3"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[#C7A962]">
        Send a Proposal
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="prop-price" className="text-xs text-[#5a6c6e]">
            Total price (USD)
          </Label>
          <Input
            id="prop-price"
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="3500"
            className="border-[#E5DFC6] bg-white"
          />
        </div>
        <div>
          <Label htmlFor="prop-dep" className="text-xs text-[#5a6c6e]">
            Deposit %
          </Label>
          <Input
            id="prop-dep"
            type="number"
            min={1}
            max={100}
            value={depositPercentage}
            onChange={(e) => setDepositPercentage(e.target.value)}
            className="border-[#E5DFC6] bg-white"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="prop-note" className="text-xs text-[#5a6c6e]">
          Brief note (optional)
        </Label>
        <Textarea
          id="prop-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What's included…"
          className="border-[#E5DFC6] bg-white"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          className="bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send proposal"}
        </Button>
      </div>
    </form>
  );
}