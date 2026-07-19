// src/components/home/HowItWorksTimeline.tsx
import { HomePhotoStrip } from "./HomePhotoStrip";

export function HowItWorksTimeline() {
  const steps = [
    {
      label: "Step 1",
      title: "Share your inspiration",
      body: "Paste TikToks, Reels, YouTube clips or mood images. Tell us who's traveling, when, and how you want the trip to feel.",
    },
    {
      label: "Step 2",
      title: "We craft your storyboard",
      body: "Your travel concierge sketches a visual itinerary tailored to your style, budget, and pace. You review, edit, and approve.",
    },
    {
      label: "Step 3",
      title: "Creators and agents collaborate",
      body: "Matched TikTok creators refine the aesthetic; certified travel agents plug in real flights, stays and experiences—all inside the same storyboard.",
    },
    {
      label: "Step 4",
      title: "You review, chat and book on Goldsainte",
      body: "You compare proposals, chat with your team, and confirm the trip. You pay your specialist directly, secured by Stripe.",
    },
  ];

  const photoCollageImages = [
    {
      src: "/home/nicolas-meunier-WKGmcxLdXC4-unsplash.jpeg",
      alt: "City street with banners",
    },
    {
      src: "/home/alexandre-barbosa-2V5Gq6Y95Ao-unsplash.jpeg",
      alt: "Snow-covered tree and mountains",
    },
    {
      src: "/home/justin-clark-JkT5-MulyiE-unsplash.jpg",
      alt: "Creator with plane overhead",
    },
  ];

  return (
    <section className="bg-[#f7f3ea] py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-left font-display text-3xl leading-snug text-[#0a2225] md:text-4xl lg:text-[42px] mb-16">
          How <span className="italic">Goldsainte AI</span> works
        </h2>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Timeline (50%) */}
          <div className="lg:w-1/2 space-y-20">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-6">
                  {/* Step circle */}
                  <div className="flex-shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#BFAD72] bg-white">
                      <span className="font-display text-xl text-[#0a2225]">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D]/70 mb-2">
                      {step.label}
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl text-[#0a2225] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm md:text-base leading-[1.7] text-[#4a4a4a] max-w-[600px]">
                      {step.body}
                    </p>
                  </div>
                </div>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-7 top-14 bottom-0 w-0.5 bg-[#E5DFC6] -translate-x-px h-20" />
                )}
              </div>
            ))}
          </div>

          {/* Right: Photo collage (50%) */}
          <div className="lg:w-1/2">
            <HomePhotoStrip images={photoCollageImages} layout="vertical" />
          </div>
        </div>
      </div>
    </section>
  );
}
