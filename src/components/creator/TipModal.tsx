// TipModal — one-tap "support this creator/agent" (2026-07-20).
// Preset amounts + custom, optional note, then hands off to Stripe checkout
// on the recipient's own connected account (they're the merchant of record).
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
}

const PRESETS = [5, 10, 25, 50];

export function TipModal({ open, onOpenChange, recipientId, recipientName }: TipModalProps) {
  const [selected, setSelected] = useState<number | null>(10);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const amount = custom ? Number(custom) : selected;

  const handleTip = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1 || amt > 500) {
      toast.error("Please choose a tip between $1 and $500.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tip-checkout", {
        body: {
          recipientId,
          amountCents: Math.round(amt * 100),
          note: note.trim() || undefined,
          successUrl: `${window.location.origin}/creators/${recipientId}?tip=success`,
          cancelUrl: `${window.location.origin}/creators/${recipientId}?tip=cancelled`,
        },
      });
      if (error) {
        let body: any = null;
        try {
          body = await error.context?.json?.();
        } catch {
          /* no body */
        }
        toast.error(body?.error || "Couldn't start the tip. Please try again.");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Couldn't start the tip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-secondary text-xl text-[#0a2225]">
            Support {recipientName}
          </DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Send a tip to say thanks. It goes directly to {recipientName} via secure Stripe
            checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setSelected(p);
                setCustom("");
              }}
              className={`rounded-xl border py-3 text-sm font-semibold transition-colors ${
                selected === p && !custom
                  ? "border-[#0C4D47] bg-[#0C4D47] text-white"
                  : "border-[#E5DFC6] bg-white text-[#0a2225] hover:bg-[#FDF9F0]"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>

        <div className="mt-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7A7151]">
            Or enter an amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[#6B7280]">$</span>
            <Input
              type="number"
              min={1}
              max={500}
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setSelected(null);
              }}
              placeholder="Custom"
              className="pl-8"
            />
          </div>
        </div>

        <div className="mt-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7A7151]">
            Add a note (optional)
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder={`Thanks for the Tokyo guide, ${recipientName}!`}
            rows={2}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleTip}
          disabled={loading || !amount}
          className="mt-3 w-full rounded-full bg-[#0C4D47] py-6 text-base font-semibold hover:bg-[#0C4D47]/90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `Send $${amount || 0} tip`
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
