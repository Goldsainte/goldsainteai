// src/components/home/HowItWorksSection.tsx
import treehouseImg from "@/assets/austin-distel-riQNJpiaGgE-unsplash.jpeg";        // hammock / jungle
import resortPoolImg from "@/assets/christian-lambert-vmIWr0NnpCQ-unsplash.jpeg";   // resort pool
import snowTreeImg from "@/assets/nicolas-meunier-WKGmcxLdXC4-unsplash.jpeg";       // snow & tree
import landRoverImg from "@/assets/alexandre-barbosa-2V5Gq6Y95Ao-unsplash.jpeg";    // group + Land Rover
import snowyTravelerImg from "@/assets/erik-mclean-sG_rwogcBCw-unsplash.jpg";       // traveler in snow
import friendsHikeImg from "@/assets/felix-rostig-UmV2wr-Vbq8-unsplash.jpeg";       // friends hiking
import infinityPoolImg from "@/assets/maximilien-t-scharner-FD0Ga_KJTwM-unsplash.jpeg"; // infinity pool

const steps = [
  {
    k: "step-1",
    label: "Step 1",
    title: "Tell us your dream trip",
    body: "In a few lines, share where you'd love to go, who's coming with you, and how you want it to feel — from quiet retreats to once-in-a-lifetime celebrations.",
    pill: "Traveler",
  },
  {
    k: "step-2",
    label: "Step 2",
    title: "Goldsainte AI matches your team",
    body: "Our AI concierge quietly works in the background, pairing you with TikTok creators and certified travel agents who specialize in your style of travel.",
    pill: "Goldsainte AI",
  },
  {
    k: "step-3",
    label: "Step 3",
    title: "Co-design the storyboard",
    body: "Creators bring the trip to life with visual storyboards, while agents layer in flights, villas, transfers and hidden-door experiences using their private rates.",
    pill: "Creators × Agents",
  },
  {
    k: "step-4",
    label: "Step 4",
    title: "Book safely on Goldsainte",
    body: "Approve the itinerary, pay securely in one place, and keep every message on-platform. Our trust & safety team and escrow flow protect every booking.",
    pill: "On-platform only",
  },
];

const collageImages = [
  treehouseImg,
  infinityPoolImg,
  resortPoolImg,
  friendsHikeImg,
  landRoverImg,
  snowTreeImg,
  snowyTravelerImg,
];


export function HowItWorksSection() {
  return (
    <section className="bg-[#f7f3ea] py-16 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-start">
        {/* LEFT: copy + steps */}
        <div className="w-full md:w-[52%] space-y-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8D8D8D]">
            Elevated travel, made simple
          </p>
          <h2 className="font-display text-[26px] leading-snug text-[#0a2225] md:text-[30px]">
            How Goldsainte works
          </h2>
          <p className="text-[12px] leading-relaxed text-[#4a4a4a] max-w-lg">
            Goldsainte sits between inspiration and execution. Travelers share a
            dream, TikTok creators bring it to life visually, and certified
            agents quietly engineer the logistics behind the scenes.
          </p>

          <div className="mt-2 space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.k}
                className="group rounded-3xl border border-[#E5DFC6] bg-white/90 p-4 md:p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D]">
                    {step.label}
                  </span>
                  <span className="rounded-full border border-[#BFAD72]/60 bg-[#E5DFC6]/60 px-2 py-0.5 text-[9px] text-[#0a2225]">
                    {step.pill}
                  </span>
                </div>
                <p className="font-display text-[15px] text-[#0a2225] mb-1">
                  {step.title}
                </p>
                <p className="text-[11px] leading-relaxed text-[#4a4a4a]">
                  {step.body}
                </p>

                {index === 0 && (
                  <div className="mt-3 inline-flex items-center rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] font-semibold text-[#E5DFC6]">
                    Start by posting a trip brief
                  </div>
                )}
                {index === 2 && (
                  <p className="mt-2 text-[10px] text-[#8D8D8D]">
                    Storyboards feel like Pinterest for your trip — scenes,
                    hotels, experiences and moments you can react to in real time.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 text-[11px] text-[#8D8D8D]">
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
                  />
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#0c4d47] px-4 py-3 text-[11px] text-[#E5DFC6]">
                <p className="font-semibold mb-1">
                  Every trip begins with a storyboard.
                </p>
                <p className="text-[10px] text-[#E5DFC6]/90">
                  Creators curate scenes like these; agents turn them into a
                  bookable itinerary — flights, suites, drivers, dinners. You
                  see the trip before you ever click "Book".
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
