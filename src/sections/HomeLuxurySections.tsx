import React from "react";
import { cn } from "@/lib/utils";

// Real images from assets
import heroMain from "@/assets/sections/built-for-every-side-main.jpg";
import heroRightTop from "@/assets/resort-pool-palms.jpg";
import heroRightBottom from "@/assets/elephants-safari.jpg";

import aiStep1 from "@/assets/tokyo-street.jpg";
import aiStep2 from "@/assets/luxury-hotels.jpg";
import aiStep3 from "@/assets/creator-road-trip.jpg";
import aiStep4 from "@/assets/photographer-plane.jpg";

import trustBg from "@/assets/luxury-destinations.jpg";

/* -------------------------------------------------------------------------- */
/*  Built for every side of luxury travel                                     */
/* -------------------------------------------------------------------------- */

export const BuiltForEverySideSection: React.FC = () => {
  return (
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start">
        {/* LEFT SIDE: COPY + PERSONAS */}
        <div className="space-y-8 md:w-3/5">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-[#C7B892]/30 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#7A7151]">
              Travelers — Creators — Agents — Brands
            </p>
            <h2 className="font-secondary text-3xl leading-tight text-[#0a2225] md:text-4xl">
              Built for every side of luxury travel
            </h2>
            <p className="max-w-md text-sm text-[#4A4A4A]">
              Each role brings something essential — travelers bring the vision,
              creators bring the aesthetic, agents refine the details, brands
              shape the experience. Goldsainte brings them together in one
              cinematic journey.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PersonaCard
              label="Travelers"
              items={[
                "Save ideas the way you savor moments — moodboards from TikToks, Reels and images you love.",
                "Get matched with creators and travel designers who understand your pace, taste and budget.",
                "Book inside a protected marketplace with escrow, support and a single trip story to return to.",
              ]}
            />
            <PersonaCard
              label="Creators"
              items={[
                "Turn your signature aesthetic into storyboards that become real trips.",
                "Collaborate with certified agents who handle rates, contracts and logistics.",
                "Earn on every trip booked, without becoming a full-time travel agent.",
              ]}
            />
            <PersonaCard
              label="Travel agents"
              items={[
                "Receive high-intent briefs from travelers who already know how they want the trip to feel.",
                "Co-design itineraries with creators on storyboards that pre-sell your itineraries.",
                "Manage payments and status in one calm, luxury-focused workspace.",
              ]}
            />
            <PersonaCard
              label="Brands"
              items={[
                "Present your world as curated collections, not generic listings.",
                "Reach travelers at the exact moment of inspiration and trip planning.",
                "Let AI surface guests whose aesthetic and expectations align with your brand.",
              ]}
            />
          </div>
        </div>

        {/* RIGHT SIDE: COLLAGE (VERTICALLY CENTERED) */}
        <div className="md:w-2/5 flex items-center justify-center">
          <div className="relative w-full max-w-md md:max-w-lg rounded-[32px] bg-white p-3 shadow-[0_24px_60px_rgba(10,34,37,0.18)]">
            {/* subtle stacked card in the back */}
            <div className="pointer-events-none absolute inset-3 translate-x-3 translate-y-4 rounded-[28px] border border-[#E5DFC6] bg-[#FDF9F0]" />

            <div className="relative space-y-3 rounded-[28px] bg-white p-3">
              {/* TOP HERO IMAGE — NOW THE ALPINE TREE PHOTO */}
              <div className="overflow-hidden rounded-[24px]">
                <img
                  src={heroMain}
                  alt="Alpine tree in snow at golden hour, with two travelers"
                  className="h-64 w-full object-cover md:h-80"
                />
              </div>

              {/* BOTTOM TWO IMAGES */}
              <div className="grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-[20px]">
                  <img
                    src={heroRightTop}
                    alt="Poolside scene at a modern resort"
                    className="h-32 w-full object-cover md:h-36"
                  />
                </div>
                <div className="overflow-hidden rounded-[20px]">
                  <img
                    src={heroRightBottom}
                    alt="Elephants walking across a golden savannah"
                    className="h-32 w-full object-cover md:h-36"
                  />
                </div>
              </div>

              <p className="rounded-[18px] bg-[#F5EFE1] px-4 py-3 text-[11px] leading-relaxed text-[#6E6650]">
                Each role brings something essential — travelers frame the
                story, creators refine the aesthetic, agents engineer the
                journey, brands set the tone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

type PersonaCardProps = {
  label: string;
  items: string[];
};

const PersonaCard: React.FC<PersonaCardProps> = ({ label, items }) => {
  return (
    <div className="flex h-full flex-col rounded-[24px] border border-[#E5DFC6] bg-white/80 px-5 py-5">
      <span className="mb-3 inline-flex w-fit rounded-full bg-[#0a2225] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#E5DFC6]">
        {label}
      </span>
      <ul className="space-y-2 text-[13px] text-[#3F3A33]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[7px] h-[3px] w-[3px] flex-shrink-0 rounded-full bg-[#C7B892]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  How Goldsainte AI works                                                   */
/* -------------------------------------------------------------------------- */

export const HowGoldsainteWorksSection: React.FC = () => {
  const steps = [
    {
      id: "1",
      title: "Share your inspiration",
      body: "Paste TikToks, Reels, mood images or notes. Tell us who's traveling, when, and the feeling you want the trip to hold.",
      image: aiStep1,
      alt: "City street with warm cinematic tones",
    },
    {
      id: "2",
      title: "Madison drafts your storyboard",
      body: "Our AI concierge translates your inspiration into a visual storyboard with destinations, hotel vibes and curated experiences that match your aesthetic.",
      image: aiStep2,
      alt: "Architectural city scene in soft light",
    },
    {
      id: "3",
      title: "Creators and agents collaborate",
      body: "Matched creators refine the look and feel; certified travel agents layer in flights, stays and experiences — all inside the same evolving storyboard.",
      image: aiStep3,
      alt: "Friends on a rooftop vehicle in open landscape",
    },
    {
      id: "4",
      title: "You review, chat and book on Goldsainte",
      body: "Compare proposals, refine details in chat, and confirm the one that feels right. Payments go through Goldsainte's escrow for added protection.",
      image: aiStep4,
      alt: "Traveler with camera capturing the moment",
    },
  ];

  return (
    <section className="bg-[#F6F0E4] px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start">
        <div className="md:w-2/5 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A7151]">
            How Goldsainte AI works
          </p>
          <h2 className="font-secondary text-3xl leading-tight text-[#0a2225] md:text-4xl">
            A concierge in the loop, not just an algorithm.
          </h2>
          <p className="max-w-sm text-sm text-[#4A4A4A]">
            Goldsainte AI listens to your style, curates the right partners and
            quietly orchestrates the journey in the background — while you stay
            in the experience.
          </p>
        </div>

        <div className="md:w-3/5 space-y-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex flex-col gap-6 md:items-center",
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              )}
            >
              {/* Text */}
              <div className="md:w-1/2 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C7B892] text-[11px] font-semibold text-[#7A7151]">
                    {step.id}
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-[#A4987C]">
                    Step {step.id}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#0a2225]">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#4A4A4A]">
                  {step.body}
                </p>
              </div>

              {/* Image */}
              <div className="md:w-1/2">
                <div className="overflow-hidden rounded-[26px] bg-[#D8CFBD]/40 shadow-[0_18px_40px_rgba(10,34,37,0.18)]">
                  <img
                    src={step.image}
                    alt={step.alt}
                    className="h-52 w-full object-cover md:h-64"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Trust, safety & payments                                                  */
/* -------------------------------------------------------------------------- */

export const TrustSafetyPaymentsSection: React.FC = () => {
  const items = [
    {
      title: "Identity verification, done quietly",
      body: "Agents complete Stripe Identity and license checks before taking bookings, so you're working with real, vetted professionals.",
    },
    {
      title: "Escrowed payments for peace of mind",
      body: "Your funds sit safely in escrow and are released in clear stages, with a post-trip protection window built in.",
    },
    {
      title: "A safe place to plan",
      body: "All messaging, proposals and approvals stay inside Goldsainte, keeping your details where they belong.",
    },
    {
      title: "Structured dispute resolution",
      body: "If something doesn't feel right, our team steps in. Every trip includes a clear, well-documented path for review and resolution.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0a2225] px-4 py-16 md:py-24">
      {/* Subtle background image overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <img
          src={trustBg}
          alt="Soft-focus luxury hotel lobby"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2225] via-[#0a2225]/95 to-[#0a2225]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#C9B786]">
            Trust, safety & payments
          </p>
          <h2 className="font-secondary text-3xl leading-tight text-[#FDFBF5] md:text-4xl">
            Built for trips where the details matter.
          </h2>
          <p className="max-w-lg text-sm text-[#D9D1C0]">
            For trips that carry meaning, trust isn't a feature — it's the
            foundation. Goldsainte is designed with discreet identity checks,
            secure payments and human oversight at every step.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#344240] bg-[#111C1D]/95 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
            >
              <h3 className="text-sm font-semibold text-[#F5EEE0]">
                {item.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#C8C0B0]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
