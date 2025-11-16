// src/pages/MarketplaceGuidelinesPage.tsx
import { ArrowLeft, Shield, MessageCircle, CreditCard, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MarketplaceGuidelinesPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-4xl px-4 pt-10 pb-6 md:pt-14 md:pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D] mb-4 hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] border border-[#BFAD72]/40">
            <Shield className="h-3 w-3 text-[#BFAD72]" />
            <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
              Marketplace Integrity
            </span>
          </div>
          <h1 className="font-display text-[24px] md:text-[28px] leading-snug">
            Marketplace Integrity Guidelines
          </h1>
          <p className="text-[11px] text-[#4a4a4a] max-w-2xl">
            Goldsainte exists so travelers, creators and travel agents can work
            together in a protected, transparent space. To keep that promise, we
            ask everyone to follow these guidelines.
          </p>
        </header>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-14 md:pb-20 space-y-6">
        <GuidelineCard
          icon={<MessageCircle className="h-5 w-5 text-[#0c4d47]" />}
          title="1. Keep communication on-platform"
          content={[
            "Use Goldsainte messaging for all trip discussions, proposals, approvals and changes.",
            "Do not share personal phone numbers, personal email addresses, private social media handles or encrypted messaging IDs to move the trip off-platform.",
          ]}
        />

        <GuidelineCard
          icon={<CreditCard className="h-5 w-5 text-[#0c4d47]" />}
          title="2. Keep payments and refunds on-platform"
          content={[
            "All deposits, balances, add-ons and refunds must be processed through Goldsainte.",
            "Do not request or send payment via wire transfer, cash app, direct bank details, QR codes or external booking links that bypass Goldsainte.",
          ]}
        />

        <GuidelineCard
          icon={<Users className="h-5 w-5 text-[#0c4d47]" />}
          title="3. Protect everyone's earnings"
          content={[
            "Creators and agents invest time into designing trips and securing rates. Taking a trip off-platform or bypassing the Goldsainte booking flow undermines that work.",
            "Repeated attempts to move trips or payments off-platform may lead to reduced visibility, loss of booking privileges or account suspension.",
          ]}
        />

        <GuidelineCard
          icon={<Shield className="h-5 w-5 text-[#0c4d47]" />}
          title="4. Safety and dispute support"
          content={[
            "Our ability to review issues, resolve disputes and assist with refunds relies on activity happening within Goldsainte.",
            "If you feel pressured to leave the platform, or see anything suspicious, please report it through support so we can help.",
          ]}
        />

        <div className="rounded-3xl bg-white/90 border border-[#E5DFC6] p-4 text-[11px] space-y-2">
          <p className="font-semibold">Why these guidelines matter</p>
          <p className="text-[#4a4a4a]">
            These guidelines are part of how we keep Goldsainte a safe, fair
            marketplace for travelers, creators and travel agents. When
            conversations or payments move off-platform, we can't protect your
            booking, recover funds, or ensure partners get paid fairly.
          </p>
          <p className="text-[10px] text-[#8D8D8D] pt-2 border-t border-[#E5DFC6]">
            This summary is for convenience only and does not replace our full
            Terms of Service. For complete legal terms, please refer to our
            official policies.
          </p>
        </div>
      </section>
    </main>
  );
}

function GuidelineCard({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string[];
}) {
  return (
    <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 space-y-2">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          <ul className="space-y-2 text-[11px] text-[#4a4a4a]">
            {content.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-[5px] h-1 w-1 rounded-full bg-[#BFAD72] flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
