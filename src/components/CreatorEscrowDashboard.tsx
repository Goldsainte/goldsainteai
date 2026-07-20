import { Clock, CheckCircle, Info, AlertTriangle, Shield, Sparkles, ArrowRight } from "lucide-react";

export const CreatorEscrowDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Info Alert */}
      <div className="bg-[#0c4d47]/5 border border-[#0c4d47]/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#0c4d47]/10 flex items-center justify-center flex-shrink-0">
          <Shield className="h-4 w-4 text-[#0c4d47]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#0a2225]">
            Payments are active
          </p>
          <p className="text-sm text-[#6B7280]">
            Payments are charged securely through Stripe, directly to your account.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Clock className="h-5 w-5 text-[#C7A962]" />}
          label="Pending"
          value="$0.00"
          helper="Processing or awaiting release"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-[#0c4d47]" />}
          label="Total Released"
          value="$0.00"
          helper="Successfully paid out"
          highlight
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          label="Under Dispute"
          value="$0.00"
          helper="Being reviewed"
        />
      </div>

      {/* How Payments Work */}
      <div className="bg-white border border-[#E5DFC6] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E5DFC6]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#C7A962]" />
            <h3 className="text-lg font-secondary text-[#0a2225]">
              How Payments Work
            </h3>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Platform Fee */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FDF9F0] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-secondary text-[#C7A962]">1</span>
            </div>
            <div>
              <h4 className="font-medium text-[#0a2225] mb-1">
                Platform Fee: <span className="text-[#C7A962]">7% total (3.5% + 3.5%)</span>
              </h4>
              <p className="text-sm text-[#6B7280]">
                A 3.5% host fee is deducted from your payout. An additional 3.5% service fee is added to the traveler's total. Total platform take: 7%.
              </p>
            </div>
          </div>

          {/* Milestone Releases */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FDF9F0] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-secondary text-[#C7A962]">2</span>
            </div>
            <div>
              <h4 className="font-medium text-[#0a2225] mb-1">
                Milestone-Based Releases
              </h4>
              <p className="text-sm text-[#6B7280]">
                Payments are charged directly to your Stripe account at booking. No invoicing, no chasing.
              </p>
            </div>
          </div>

          {/* Upfront Payout */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FDF9F0] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-secondary text-[#C7A962]">3</span>
            </div>
            <div>
              <h4 className="font-medium text-[#0a2225] mb-1">
                Upfront Payout <span className="text-xs px-2 py-0.5 rounded-full bg-[#C7A962]/10 text-[#C7A962] ml-1">Verified Creators</span>
              </h4>
              <p className="text-sm text-[#6B7280]">
                Payments are processed securely through Stripe and land directly in your connected account.
              </p>
            </div>
          </div>

          {/* Example Breakdown */}
          <div className="bg-[#FDF9F0] border border-[#E5DFC6] rounded-xl p-5 mt-6">
            <p className="text-xs uppercase tracking-wider text-[#C7A962] font-medium mb-4">
              Example Breakdown
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Customer pays</span>
                <span className="font-medium text-[#0a2225]">$5,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Platform fee (3.5%)</span>
                <span className="text-[#6B7280]">-$175</span>
              </div>
              <div className="h-px bg-[#E5DFC6] my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#0a2225]">Your earnings</span>
                <span className="font-secondary text-lg text-[#C7A962]">$4,825</span>
              </div>
              <div className="h-px bg-[#E5DFC6] my-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7280] flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Upfront (20%)
                </span>
                <span className="text-[#0c4d47] font-medium">$850</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7280] flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Paid to your account
                </span>
                <span className="text-[#6B7280]">$3,400</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({
  icon,
  label,
  value,
  helper,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 space-y-3 transition-all ${
      highlight 
        ? "bg-white border-2 border-[#C7A962] shadow-sm" 
        : "bg-white border border-[#E5DFC6]"
    }`}>
      <div className="flex items-center justify-between">
        {icon}
        <p className="text-xs uppercase tracking-wider text-[#6B7280] font-medium">
          {label}
        </p>
      </div>
      <p className={`text-2xl font-secondary ${highlight ? "text-[#C7A962]" : "text-[#0a2225]"}`}>
        {value}
      </p>
      <p className="text-xs text-[#9CA3AF]">{helper}</p>
    </div>
  );
}
