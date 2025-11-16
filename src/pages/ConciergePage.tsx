import { Sparkles, PhoneCall, Map, Wand2 } from "lucide-react";
import { VoiceConciergeButton } from "@/components/VoiceConciergeButton";

/**
 * White-glove concierge page.
 * Embeds the existing AI / voice concierge experience
 * inside a calm, editorial frame.
 */
export default function ConciergePage() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-10 pb-6 md:pt-14 md:pb-10">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] border border-[#BFAD72]/40">
            <Sparkles className="h-3 w-3 text-[#BFAD72]" />
            <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
              Goldsainte Concierge
            </span>
          </div>
          <h1 className="font-display text-[24px] md:text-[28px] leading-snug">
            A calm, human-feeling assistant for every part of your trip.
          </h1>
          <p className="text-[11px] md:text-[12px] text-[#4a4a4a] max-w-xl">
            Ask Goldsainte Concierge to sketch a first itinerary, refine a brief
            for creators and agents, or make sense of options you already have.
            Think of it as the friend who's great at planning — and never
            sleeps.
          </p>
        </header>

        <div className="mt-6 grid gap-3 md:grid-cols-3 text-[11px]">
          <ReassuranceCard
            icon={<Map className="h-4 w-4 text-[#0c4d47]" />}
            title="From vague idea to clear brief"
            body="Share a mood, a city or a single TikTok. Concierge turns it into a structured brief that creators and agents can respond to."
          />
          <ReassuranceCard
            icon={<PhoneCall className="h-4 w-4 text-[#0c4d47]" />}
            title="Always in-platform, never lost in DMs"
            body="Concierge keeps everything inside Goldsainte — no scattered chats, no lost links, no off-platform deals."
          />
          <ReassuranceCard
            icon={<Wand2 className="h-4 w-4 text-[#0c4d47]" />}
            title="Understands your style"
            body="The more you travel with Goldsainte, the better Concierge gets at matching you with the right creators, agents and trips."
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-14 md:pb-20">
        <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] shadow-sm p-4 md:p-6 flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] text-[#8D8D8D]">Start with a sentence</p>
              <p className="text-sm font-semibold">
                "Plan me a 4–night trip where I can work in the mornings and
                swim at sunset."
              </p>
              <p className="text-[10px] text-[#8D8D8D] max-w-md">
                Concierge turns this into a draft itinerary and a brief you can
                share with creators and agents — without you needing a single
                spreadsheet.
              </p>
            </div>
            <div className="hidden md:flex flex-col gap-1 text-[10px] text-[#8D8D8D]">
              <span>Try asking:</span>
              <ul className="list-disc list-inside space-y-0.5">
                <li>"Match me with a creator in Lisbon who loves food."</li>
                <li>"Help me write a trip brief for a friends' 30th in Tulum."</li>
                <li>"Make my itinerary easier to film for TikTok."</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-[#f7f3ea] border border-[#E5DFC6] p-3 md:p-4 min-h-[260px] flex items-center justify-center">
            <div className="w-full max-w-xl">
              <VoiceConciergeButton />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ReassuranceCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-white/90 border border-[#E5DFC6] p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold">{title}</p>
        {icon}
      </div>
      <p className="text-[10px] text-[#4a4a4a]">{body}</p>
    </div>
  );
}
