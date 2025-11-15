import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getMyEarningsSummary, getMyLatestEarnings } from "@/services/earningsService";

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
      // Use new earnings system
      const [summary, ledger] = await Promise.all([
        getMyEarningsSummary(),
        getMyLatestEarnings(),
      ]);

      // Aggregate revenue by source from ledger
      const sourceMap = new Map<string, RevenueSource>();

      ledger.forEach((entry) => {
        const type = entry.role === "agent" ? "booking" : entry.role === "creator" ? "booking" : "partnership";
        const existing = sourceMap.get(type) || {
          type,
          amount: 0,
          commission: 0,
          count: 0,
        };

        sourceMap.set(type, {
          type,
          amount: existing.amount + entry.amount,
          commission: existing.commission + entry.amount,
          count: existing.count + 1,
        });
      });

      setRevenue({
        totalEarnings: summary.paid + summary.available + summary.pending + summary.locked,
        availableBalance: summary.available,
        pendingBalance: summary.pending,
        revenueSources: Array.from(sourceMap.values()),
        tierMultiplier: 1, // This would come from user tier settings
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
          table: "earnings_ledger",
          filter: `user_id=eq.${creatorId}`,
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
          table: "payouts",
          filter: `user_id=eq.${creatorId}`,
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
