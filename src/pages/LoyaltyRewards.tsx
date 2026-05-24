import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

const SERIF = "'Cormorant Garamond', Georgia, serif";
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
      <div className="bg-[#f7f3ea] flex-1 py-24 px-6">
        <p className="text-center text-[#0a2225]/60 italic" style={{ fontFamily: SERIF }}>
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
    <div className="bg-[#f7f3ea] text-[#0a2225] flex-1 py-20 px-6 selection:bg-[#c9a84c]/30">
      <section className="w-full max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="grid grid-cols-1 md:grid-cols-12 border-t border-b border-[#0a2225] py-8 mb-16 gap-6">
          <div className="md:col-span-8">
            <span className="block uppercase tracking-[0.2em] text-[10px] font-bold mb-4 text-[#c9a84c]">
              Loyalty
            </span>
            <h1 className="text-4xl md:text-5xl tracking-tight" style={{ fontFamily: SERIF }}>
              Rewards & Standing
            </h1>
          </div>
          <div className="md:col-span-4 md:text-right flex flex-col justify-end">
            <span className="block text-[9px] uppercase tracking-[0.2em] opacity-40 mb-1">
              Points Balance
            </span>
            <span className="text-2xl italic" style={{ fontFamily: SERIF }}>
              {(loyaltyData?.points_balance || 0).toLocaleString()}
            </span>
          </div>
        </header>

        {/* TIER + PROGRESS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-7">
            <label className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-3">
              Current Tier
            </label>
            <h2 className="text-5xl italic mb-8 tracking-tight" style={{ fontFamily: SERIF }}>
              {currentTier[0].toUpperCase() + currentTier.slice(1)}
            </h2>

            {config.next && (
              <div className="mb-8">
                <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 mb-3">
                  <span>Progress to {config.next}</span>
                  <span style={{ fontFamily: MONO }}>{lifetime.toLocaleString()} / {config.threshold.toLocaleString()}</span>
                </div>
                <div className="h-px bg-[#0a2225]/15 relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#c9a84c]"
                    style={{ width: `${progress}%`, height: "1px" }}
                  />
                </div>
              </div>
            )}

            <label className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-4 mt-10">
              Member Benefits
            </label>
            <ul className="space-y-3 border-l border-[#c9a84c]/40 pl-6">
              {config.benefits.map((benefit, i) => (
                <li key={i} className="text-base italic text-[#0a2225]/80" style={{ fontFamily: SERIF }}>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-5">
            <div className="bg-[#0a2225] p-10 text-[#f7f3ea] relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/15 rounded-full -mr-16 -mt-16 blur-3xl" />
              <label className="relative z-10 block text-[9px] uppercase tracking-[0.3em] font-bold opacity-50 mb-8">
                Earn Points
              </label>
              <ul className="relative z-10 space-y-6">
                <li>
                  <p className="text-2xl italic mb-1" style={{ fontFamily: SERIF }}>+100 pts</p>
                  <p className="text-sm opacity-70">Per completed booking</p>
                </li>
                <li>
                  <p className="text-2xl italic mb-1" style={{ fontFamily: SERIF }}>+50 pts</p>
                  <p className="text-sm opacity-70">For each review you leave</p>
                </li>
                <li>
                  <p className="text-2xl italic mb-1" style={{ fontFamily: SERIF }}>+500 pts</p>
                  <p className="text-sm opacity-70">Per successful referral</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* REFERRAL */}
        <div className="border-t border-[#0a2225]/10 pt-16 mb-20">
          <span className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-3">
            Referral
          </span>
          <h2 className="text-3xl md:text-4xl italic mb-4 tracking-tight" style={{ fontFamily: SERIF }}>
            Invite Friends
          </h2>
          <p className="text-base text-[#0a2225]/70 font-light max-w-xl mb-8">
            Share your code and earn 500 points for each friend who completes a booking.
          </p>

          <div className="flex items-center gap-4 border-b border-[#0a2225]/30 pb-3 max-w-md">
            <span className="flex-1 text-lg tracking-wider" style={{ fontFamily: MONO }}>
              {referralCode}
            </span>
            <button
              onClick={copyReferralLink}
              className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#0c4d47] hover:text-[#0a2225] transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>

          <div className="mt-12">
            <label className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-6">
              Your Referrals ({referrals.length})
            </label>
            {referrals.length === 0 ? (
              <p className="text-base italic text-[#0a2225]/60" style={{ fontFamily: SERIF }}>
                No referrals yet — share your link to begin.
              </p>
            ) : (
              <ul className="space-y-4 max-w-2xl">
                {referrals.map((ref) => (
                  <li
                    key={ref.id}
                    className="flex items-center justify-between border-b border-[#0a2225]/10 pb-4"
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#c9a84c] mb-1">
                        {ref.status}
                      </p>
                      <p className="text-sm text-[#0a2225]/60" style={{ fontFamily: MONO }}>
                        {new Date(ref.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {ref.status === "rewarded" && (
                      <p className="text-lg italic" style={{ fontFamily: SERIF }}>
                        +{ref.referrer_points_earned} pts
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* HISTORY */}
        <div className="border-t border-[#0a2225]/10 pt-16">
          <span className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mb-3">
            Ledger
          </span>
          <h2 className="text-3xl md:text-4xl italic mb-10 tracking-tight" style={{ fontFamily: SERIF }}>
            Points History
          </h2>
          {transactions.length === 0 ? (
            <p className="text-base italic text-[#0a2225]/60" style={{ fontFamily: SERIF }}>
              No transactions yet.
            </p>
          ) : (
            <ul className="space-y-5 max-w-2xl">
              {transactions.map((txn) => (
                <li
                  key={txn.id}
                  className="flex items-center justify-between border-b border-[#0a2225]/10 pb-4"
                >
                  <div>
                    <p className="text-base mb-1">{txn.reason}</p>
                    <p className="text-xs text-[#0a2225]/50" style={{ fontFamily: MONO }}>
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`text-xl italic ${txn.points_amount > 0 ? "text-[#0c4d47]" : "text-[#0a2225]/60"}`}
                    style={{ fontFamily: SERIF }}
                  >
                    {txn.points_amount > 0 ? "+" : ""}
                    {txn.points_amount} pts
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
