import { Shield, Lock } from "lucide-react";

export function TrustFooterMobile() {
  return (
    <section className="md:hidden bg-[#f7f3ea] px-4 pb-12">
      <div className="bg-white/60 border border-[#E5DFC6] rounded-2xl p-5 space-y-4">
        {/* Marketplace Statement */}
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-[#0c4d47] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#0a2225]">All actions stay on-platform</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              We connect travelers, creators & agents — we don't operate trips ourselves.
            </p>
          </div>
        </div>
        
        <div className="border-t border-[#E5DFC6]" />
        
        {/* Trust Promise */}
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-[#0c4d47] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#0a2225]">Protected bookings</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              No phone numbers, no side deals — just beautifully organized, secure transactions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
