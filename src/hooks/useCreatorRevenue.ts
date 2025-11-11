import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RevenueSource {
  type: "booking" | "shop" | "gift" | "affiliate" | "partnership";
  amount: number;
  commission: number;
  count: number;
}

interface CreatorRevenue {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  revenueSources: RevenueSource[];
  tierMultiplier: number;
  isLoading: boolean;
}

export function useCreatorRevenue(creatorId: string): CreatorRevenue {
  const { toast } = useToast();
  const [revenue, setRevenue] = useState<CreatorRevenue>({
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    revenueSources: [],
    tierMultiplier: 1,
    isLoading: true,
  });

  useEffect(() => {
    if (!creatorId) return;

    fetchRevenue();
    subscribeToUpdates();
  }, [creatorId]);

  const fetchRevenue = async () => {
    try {
      // Fetch creator balance
      const { data: balance, error: balanceError } = await (supabase as any)
        .from("creator_balances")
        .select("*")
        .eq("creator_id", creatorId)
        .single();

      if (balanceError) throw balanceError;

      // Fetch revenue transactions
      const { data: transactions, error: transactionsError } = await (supabase as any)
        .from("creator_revenue_transactions")
        .select("*")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      // Aggregate revenue by source
      const sourceMap = new Map<string, RevenueSource>();

      transactions.forEach((tx: any) => {
        const existing = sourceMap.get(tx.transaction_type) || {
          type: tx.transaction_type,
          amount: 0,
          commission: 0,
          count: 0,
        };

        sourceMap.set(tx.transaction_type, {
          type: tx.transaction_type,
          amount: existing.amount + tx.amount,
          commission: existing.commission + tx.net_payout,
          count: existing.count + 1,
        });
      });

      // Get tier multiplier from most recent transaction
      const tierMultiplier = transactions.length > 0 ? transactions[0].tier_multiplier : 1;

      setRevenue({
        totalEarnings: balance?.total_earned || 0,
        availableBalance: balance?.available_balance || 0,
        pendingBalance: balance?.pending_balance || 0,
        revenueSources: Array.from(sourceMap.values()),
        tierMultiplier,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Error fetching creator revenue:", error);
      toast({
        title: "Error loading revenue",
        description: error.message,
        variant: "destructive",
      });
      setRevenue((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`creator-revenue-${creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "creator_revenue_transactions",
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          fetchRevenue();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "creator_balances",
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          fetchRevenue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return revenue;
}
