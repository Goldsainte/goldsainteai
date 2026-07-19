// src/components/home/TrustAndSafety.tsx
import { ShieldCheck, Lock, MessageSquare, Scale } from "lucide-react";

const features = [
  {
    label: "Verification",
    pill: "Identity",
    title: "Verified professionals",
    body: "Agents complete Stripe Identity and license checks before taking bookings. Know who you're working with.",
    icon: ShieldCheck,
  },
  {
    label: "Payments",
    pill: "Payments",
    title: "Protected funds",
    body: "You pay your specialist directly through Stripe, with support from booking to return.",
    icon: Lock,
  },
  {
    label: "Communication",
    pill: "Safety",
    title: "On-platform only",
    body: "All booking details, approvals, and conversations stay inside Goldsainte for your protection.",
    icon: MessageSquare,
  },
  {
    label: "Support",
    pill: "Resolution",
    title: "Structured disputes",
    body: "If something doesn't go to plan, we have a clear path for review and fair resolution.",
    icon: Scale,
  },
];

// Curated travel images for the collage
const collageImages = [
  {
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    alt: "Luxury resort pool",
    className: "col-span-1 row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80",
    alt: "Elegant hotel lobby",
    className: "col-span-1 row-span-1",
  },
  {
    src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
    alt: "Seaside villa",
    className: "col-span-1 row-span-1",
  },
];

export function TrustAndSafety() {
  return (
    <section className="bg-[#f7f3ea] py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-10 md:mb-12">
          <p className="mb-3 inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.12em] text-[#D4C07A]">
            Protected Journeys
          </p>
          <h2 className="font-display text-3xl leading-snug text-[#0a2225] md:text-4xl lg:text-[42px] mb-3">
            Trust, safety & payments
          </h2>
          <p className="max-w-2xl text-sm md:text-base leading-relaxed text-[#4a4a4a]">
            Every transaction, every conversation, and every commitment is designed with your peace of mind in mind.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Feature Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group rounded-3xl border border-[#E5DFC6] bg-white/90 p-4 md:p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D]">
                      {feature.label}
                    </span>
                    <span className="rounded-full border border-[#BFAD72]/60 bg-[#E5DFC6]/60 px-2 py-0.5 text-[10px] text-[#0a2225]">
                      {feature.pill}
                    </span>
                  </div>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0c4d47]/10">
                    <Icon className="h-4 w-4 text-[#0c4d47]" />
                  </div>
                  <p className="font-display text-base text-[#0a2225] mb-1">
                    {feature.title}
                  </p>
                  <p className="text-xs leading-relaxed text-[#4a4a4a]">
                    {feature.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column - Image Collage */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-3 h-full">
              {/* Tall left image */}
              <div className="relative row-span-2 overflow-hidden rounded-2xl">
                <img
                  src={collageImages[0].src}
                  alt={collageImages[0].alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Top right image */}
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={collageImages[1].src}
                  alt={collageImages[1].alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Bottom right - Trust message card */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0c4d47] p-5 flex flex-col justify-center">
                <div className="mb-2">
                  <ShieldCheck className="h-6 w-6 text-[#D4C07A]" />
                </div>
                <p className="text-sm font-medium text-white leading-relaxed">
                  All communication and payments stay inside Goldsainte.
                </p>
                <p className="mt-1 text-xs text-white/70">
                  No phone numbers, no side deals — just protected, organized travel.
                </p>
              </div>
            </div>
            {/* Decorative offset border */}
            <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-2xl border border-[#E5DFC6]" />
          </div>
        </div>
      </div>
    </section>
  );
}
