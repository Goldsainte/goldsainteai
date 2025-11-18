// src/components/home/RoleSpecificCTAs.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Video, Briefcase } from "lucide-react";

export function RoleSpecificCTAs() {
  const roles = [
    {
      icon: Sparkles,
      title: "Plan my trip",
      body: "Tell Madison what you're dreaming about and let creators and agents do the heavy lifting.",
      buttonText: "Start my trip brief",
      link: "/post-trip",
    },
    {
      icon: Video,
      title: "Join as a creator",
      body: "Set up your creator profile, connect TikTok, and start turning your audience into curated journeys.",
      buttonText: "Creator sign up",
      link: "/auth?mode=signup&role=creator",
    },
    {
      icon: Briefcase,
      title: "Apply as a travel agent",
      body: "Share your credentials, specialties and preferred markets. Once verified, you'll receive curated briefs from qualified travelers.",
      buttonText: "Agent application",
      link: "/apply/agent",
    },
  ];

  return (
    <section className="bg-white border-t border-[#E5DFC6]/30 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-[28px] leading-snug text-[#0a2225] md:text-[34px] mb-12">
          Choose how you join Goldsainte
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <div
                key={index}
                className="flex flex-col rounded-3xl border border-[#E5DFC6] bg-[#f7f3ea]/50 p-6 md:p-8"
              >
                <div className="mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0c4d47]/10">
                    <Icon className="h-6 w-6 text-[#0c4d47]" />
                  </div>
                </div>
                
                <h3 className="font-display text-xl text-[#0a2225] mb-3">
                  {role.title}
                </h3>
                
                <p className="text-sm leading-relaxed text-[#4a4a4a] mb-6 flex-1">
                  {role.body}
                </p>

                <Button
                  asChild
                  className="w-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331]"
                >
                  <Link to={role.link}>
                    {role.buttonText}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
