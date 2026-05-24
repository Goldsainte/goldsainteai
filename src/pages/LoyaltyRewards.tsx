import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

interface LoyaltyPoints {
  points_balance: number;
  lifetime_points: number;
  tier: string;
}

interface PointsTransaction {
  id: string;
  points_amount: number;
  transaction_type: string;
  reason: string;
  created_at: string;
}

interface Referral {
  id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  referrer_points_earned: number;
  created_at: string;
}

const tierConfig = {
  bronze:   { next: "silver",   threshold: 2000,     benefits: ["5% discount on services"] },
  silver:   { next: "gold",     threshold: 5000,     benefits: ["10% discount", "Priority support"] },
  gold:     { next: "platinum", threshold: 10000,    benefits: ["15% discount", "Priority matching", "Free cancellation"] },
  platinum: { next: null,       threshold: Infinity, benefits: ["20% discount", "Dedicated agent", "VIP support", "Exclusive deals"] },
};

export default function LoyaltyRewards() {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoyaltyData();
    generateReferralCode();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get loyalty points
      const { data: points } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setLoyaltyData(points);

      // Get transactions
      const { data: txns } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setTransactions(txns || []);

      // Get referrals
      const { data: refs } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      setReferrals(refs || []);
    } catch (error) {
      console.error("Error loading loyalty data:", error);
      toast.error("Failed to load loyalty data");
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate a simple referral code based on user ID
    const code = `REF${user.id.slice(0, 8).toUpperCase()}`;
    setReferralCode(code);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-[#FDF9F0] flex-1 py-24 px-6">
        <p className="text-center text-[#0a2225]/60 font-secondary text-xl">
          Loading your dossier…
        </p>
      </div>
    );
  }

  const currentTier = loyaltyData?.tier || "bronze";
  const config = tierConfig[currentTier as keyof typeof tierConfig];
  const lifetime = loyaltyData?.lifetime_points || 0;
  const progress = config.next ? Math.min(100, (lifetime / config.threshold) * 100) : 100;

  return (
    <div className="bg-[#FDF9F0] text-[#0a2225] flex-1">
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-20">
        {/* HEADER */}
        <header className="max-w-3xl mb-14 md:mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
            Loyalty
          </p>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] mb-6">
            Rewards & Standing
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 leading-relaxed max-w-2xl">
            Your points balance, current tier, and benefits — earned with every booking, review, and referral on Goldsainte.
          </p>
        </header>

        <div className="border-y border-[#E5DFC6] bg-white/60 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8 mb-16">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#0a2225]/40 mb-2">
                Points Balance
              </p>
              <p className="font-secondary text-4xl md:text-5xl leading-none text-[#0a2225]">
                {(loyaltyData?.points_balance || 0).toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-[#0a2225]/60" style={{ fontFamily: MONO }}>
              Lifetime · {lifetime.toLocaleString()} pts
            </p>
          </div>
        </div>

        {/* TIER + PROGRESS */}
        <div className="py-14 md:py-18 border-t border-[#E5DFC6] grid md:grid-cols-12 gap-8 md:gap-14">
          <div className="md:col-span-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962]">
              01 — Current Tier
            </p>
          </div>
          <div className="md:col-span-8">
            <h2 className="font-secondary text-2xl md:text-3xl leading-[1.25] text-[#0a2225] mb-4 capitalize">
              {currentTier}
            </h2>

            {config.next && (
              <div className="mb-10">
                <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/60 mb-3">
                  <span>Progress to {config.next}</span>
                  <span style={{ fontFamily: MONO }}>{lifetime.toLocaleString()} / {config.threshold.toLocaleString()}</span>
                </div>
                <div className="h-px bg-[#E5DFC6] relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#C7A962]"
                    style={{ width: `${progress}%`, height: "1px" }}
                  />
                </div>
              </div>
            )}

            <p className="text-[10px] uppercase tracking-[0.22em] text-[#0c4d47] mb-3 mt-8">
              Member Benefits
            </p>
            <ul className="space-y-2.5">
              {config.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#0a2225]/70 leading-snug">
                  <span className="text-[#0c4d47] mt-0.5 flex-shrink-0">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-14 md:py-18 border-t border-[#E5DFC6] grid md:grid-cols-12 gap-8 md:gap-14">
          <div className="md:col-span-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962]">
              02 — Earn Points
            </p>
          </div>
          <div className="md:col-span-8 grid sm:grid-cols-3 gap-4">
            {[
              { pts: "+100", label: "Per completed booking" },
              { pts: "+50", label: "For each review you leave" },
              { pts: "+500", label: "Per successful referral" },
            ].map((item) => (
              <div key={item.label} className="border border-[#E5DFC6] rounded-sm bg-[#FDF9F0] p-6">
                <p className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-2">{item.pts}<span className="text-sm text-[#0a2225]/40 ml-1">pts</span></p>
                <p className="text-sm text-[#0a2225]/70 leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* REFERRAL */}
        <div className="py-14 md:py-18 border-t border-[#E5DFC6] grid md:grid-cols-12 gap-8 md:gap-14">
          <div className="md:col-span-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962]">
              03 — Referral
            </p>
          </div>
          <div className="md:col-span-8">
            <h2 className="font-secondary text-2xl md:text-3xl leading-[1.25] text-[#0a2225] mb-4">
              Invite Friends
            </h2>
            <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-xl mb-8">
              Share your code and earn 500 points for each friend who completes a booking.
            </p>

            <div className="flex items-center gap-4 border-b border-[#E5DFC6] pb-3 max-w-md">
              <span className="flex-1 text-lg tracking-wider text-[#0a2225]" style={{ fontFamily: MONO }}>
                {referralCode}
              </span>
              <button
                onClick={copyReferralLink}
                className="text-[10px] uppercase tracking-[0.22em] text-[#0c4d47] hover:text-[#0a2225] transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>

            <div className="mt-10">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/40 mb-5">
                Your Referrals ({referrals.length})
              </p>
              {referrals.length === 0 ? (
                <p className="text-sm text-[#0a2225]/60">
                  No referrals yet — share your link to begin.
                </p>
              ) : (
                <ul className="space-y-4 max-w-2xl">
                  {referrals.map((ref) => (
                    <li
                      key={ref.id}
                      className="flex items-center justify-between border-b border-[#E5DFC6] pb-4"
                    >
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#C7A962] mb-1">
                          {ref.status}
                        </p>
                        <p className="text-sm text-[#0a2225]/60" style={{ fontFamily: MONO }}>
                          {new Date(ref.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {ref.status === "rewarded" && (
                        <p className="font-secondary text-xl text-[#0c4d47]">
                          +{ref.referrer_points_earned} pts
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* HISTORY */}
        <div className="py-14 md:py-18 border-t border-[#E5DFC6] grid md:grid-cols-12 gap-8 md:gap-14">
          <div className="md:col-span-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962]">
              04 — Ledger
            </p>
          </div>
          <div className="md:col-span-8">
            <h2 className="font-secondary text-2xl md:text-3xl leading-[1.25] text-[#0a2225] mb-8">
              Points History
            </h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-[#0a2225]/60">
                No transactions yet.
              </p>
            ) : (
              <ul className="space-y-5 max-w-2xl">
                {transactions.map((txn) => (
                  <li
                    key={txn.id}
                    className="flex items-center justify-between border-b border-[#E5DFC6] pb-4"
                  >
                    <div>
                      <p className="text-base text-[#0a2225] mb-1">{txn.reason}</p>
                      <p className="text-xs text-[#0a2225]/50" style={{ fontFamily: MONO }}>
                        {new Date(txn.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p
                      className={`font-secondary text-xl ${txn.points_amount > 0 ? "text-[#0c4d47]" : "text-[#0a2225]/60"}`}
                    >
                      {txn.points_amount > 0 ? "+" : ""}
                      {txn.points_amount} pts
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
