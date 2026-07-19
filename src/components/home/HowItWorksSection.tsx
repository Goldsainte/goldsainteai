// src/components/home/HowItWorksSection.tsx
import beachFlowersImg from "@/assets/beach-flowers.webp";                         // beach with red flowers
import tokyoStreetImg from "@/assets/tokyo-street.webp";                             // Tokyo street scene
import photographerPlaneImg from "@/assets/photographer-plane.webp";                 // photographer with plane
import elephantsSafariImg from "@/assets/elephants-safari.webp";                     // elephants walking
import snowyTravelerImg from "@/assets/erik-mclean-sG_rwogcBCw-unsplash.webp";       // traveler in snow
import friendsHikeImg from "@/assets/felix-rostig-UmV2wr-Vbq8-unsplash.webp";       // friends hiking
import resortPoolPalmsImg from "@/assets/resort-pool-palms.webp";                    // resort pool with palms

const steps = [
  {
    k: "travelers",
    label: "For travelers",
    title: "Post the trip. We build the team.",
    body: "Share your dates, budget and the TikToks, Pins or moods that inspired the trip. Goldsainte surfaces creators + agents whose style and markets actually fit you. Review proposals and storyboards, then book the one that feels right — all inside Goldsainte.",
    pill: "Travelers",
  },
  {
    k: "creators",
    label: "For creators",
    title: "Storyboard the journey, not just the post.",
    body: "Set up your creator profile with TikTok handle, niche and destinations you love. Respond to briefs where your audience and aesthetic make sense. Co-design trips with agents and earn a creator share on every booked journey.",
    pill: "Creators",
  },
  {
    k: "agents",
    label: "For travel agents",
    title: "Curate, contract, and quietly run the show.",
    body: "Share your agency details, contract markets and sweet-spot budgets. Receive traveler and creator-led concepts that match your strengths. Build bookable itineraries, manage bookings and track payouts in one console.",
    pill: "Travel Agents",
  },
  {
    k: "ai-matching",
    label: "AI matching",
    title: "Find your perfect match, instantly.",
    body: "Share your destination, dates, and travel style. Our AI scores thousands of creator and agent profiles in seconds, surfacing only those whose expertise, aesthetic, and markets align with your vision. No endless scrolling—just curated matches, ready to collaborate.",
    pill: "AI Matching",
  },
];

const collageImages = [
  beachFlowersImg,
  resortPoolPalmsImg,
  tokyoStreetImg,
  friendsHikeImg,
  elephantsSafariImg,
  photographerPlaneImg,
  snowyTravelerImg,
];


export function HowItWorksSection() {
  return (
    <section className="bg-[#f7f3ea] py-16 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-start">
        {/* LEFT: copy + steps */}
        <div className="w-full md:w-[52%] space-y-6">
          <div className="inline-flex items-center rounded-full border border-[#0c4d47] bg-[#0c4d47] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#bfad72]">
            <span>Elevated travel, made simple</span>
          </div>
          <h2 className="font-display text-[26px] leading-snug text-[#0a2225] md:text-[30px]">
            How Goldsainte works
          </h2>
          <p className="text-sm leading-relaxed text-[#4a4a4a] max-w-lg">
            Goldsainte sits between inspiration and execution. Travelers share a
            dream, TikTok creators bring it to life visually, and certified
            agents quietly engineer the logistics behind the scenes.
          </p>

          <div className="mt-2 space-y-3">
            {steps.map((step) => (
              <div
                key={step.k}
                className="group rounded-3xl border border-[#E5DFC6] bg-white/90 p-4 md:p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-[#8D8D8D]">
                    {step.label}
                  </span>
                  <span className="rounded-full border border-[#BFAD72]/60 bg-[#E5DFC6]/60 px-2 py-0.5 text-xs text-[#0a2225]">
                    {step.pill}
                  </span>
                </div>
                <p className="font-display text-base text-[#0a2225] mb-1">
                  {step.title}
                </p>
                <p className="text-sm leading-relaxed text-[#4a4a4a]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 text-xs text-[#8D8D8D]">
            All communication and payments stay inside Goldsainte. No phone
            numbers, no side deals — just beautifully organized trips.
          </div>
        </div>

        {/* RIGHT: elevated collage */}
        <div className="w-full md:w-[48%]">
          <div className="relative mx-auto max-w-md">
            {/* subtle frame */}
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[32px] border border-[#E5DFC6]/70" />
            <div className="relative overflow-hidden rounded-[32px] bg-white/90 p-3">
              <div className="columns-2 gap-3 space-y-3">
                {collageImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Goldsainte travel inspiration"
                    className="w-full rounded-2xl object-cover"
                  loading="lazy"/>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
