import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tag, Check, X } from "lucide-react";

interface PromoCodeInputProps {
  onCodeApplied: (discount: number, promoCodeId: string) => void;
  orderValue: number;
}

export function PromoCodeInput({ onCodeApplied, orderValue }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [appliedCode, setAppliedCode] = useState<any>(null);

  const applyPromoCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setApplying(true);
    try {
      // Check if code exists and is valid
      const { data: promoCode, error } = await supabase
        .from("promotional_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !promoCode) {
        toast.error("Invalid or expired promo code");
        return;
      }

      // Check if code is still valid
      if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
        toast.error("This promo code has expired");
        return;
      }

      // Check max uses
      if (promoCode.max_uses && promoCode.uses_count >= promoCode.max_uses) {
        toast.error("This promo code has reached its usage limit");
        return;
      }

      // Check min order value
      if (orderValue < promoCode.min_order_value) {
        toast.error(`Minimum order value is $${promoCode.min_order_value}`);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (promoCode.discount_type === "percentage") {
        discount = (orderValue * promoCode.discount_value) / 100;
      } else if (promoCode.discount_type === "fixed_amount") {
        discount = promoCode.discount_value;
      }

      setAppliedCode(promoCode);
      onCodeApplied(discount, promoCode.id);
      toast.success(`Promo code applied! You saved $${discount.toFixed(2)}`);
    } catch (error) {
      console.error("Error applying promo code:", error);
      toast.error("Failed to apply promo code");
    } finally {
      setApplying(false);
    }
  };

  const removeCode = () => {
    setAppliedCode(null);
    setCode("");
    onCodeApplied(0, "");
    toast.success("Promo code removed");
  };

  if (appliedCode) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
        <Tag className="h-4 w-4 text-green-600" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <code className="font-mono font-semibold text-green-600">
              {appliedCode.code}
            </code>
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground">{appliedCode.description}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={removeCode}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Promo Code</label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && applyPromoCode()}
        />
        <Button onClick={applyPromoCode} disabled={applying || !code.trim()}>
          {applying ? "Applying..." : "Apply"}
        </Button>
      </div>
    </div>
  );
}
