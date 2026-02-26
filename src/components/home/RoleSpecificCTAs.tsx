// src/components/home/RoleSpecificCTAs.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Video, Briefcase, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import travelerImage from "@/assets/home/hero-overwater-villa.jpg";
import creatorImage from "@/assets/creator-canyon-views.jpg";
import agentImage from "@/assets/agent-travel-planning.jpg";
import brandImage from "@/assets/luxury-infinity-pool.jpg";

export function RoleSpecificCTAs() {
  const { t } = useTranslation();

  const roles = [
    {
      icon: User,
      title: t('home.rolesCTA.traveler.title'),
      body: t('home.rolesCTA.traveler.body'),
      buttonText: t('home.rolesCTA.traveler.button'),
      link: "/auth?mode=signup&role=traveler",
      backgroundImage: travelerImage,
    },
    {
      icon: Video,
      title: t('home.rolesCTA.joinAsCreator.title'),
      body: t('home.rolesCTA.joinAsCreator.body'),
      buttonText: t('home.rolesCTA.joinAsCreator.button'),
      link: "/auth?mode=signup&role=creator",
      backgroundImage: creatorImage,
      browseLink: "/creators",
      browseLabel: "Browse creators",
    },
    {
      icon: Briefcase,
      title: t('home.rolesCTA.applyAsAgent.title'),
      body: t('home.rolesCTA.applyAsAgent.body'),
      buttonText: t('home.rolesCTA.applyAsAgent.button'),
      link: "/apply/agent",
      backgroundImage: agentImage,
      browseLink: "/agents",
      browseLabel: "Browse agents",
    },
    {
      icon: Building2,
      title: t('home.rolesCTA.applyAsBrand.title'),
      body: t('home.rolesCTA.applyAsBrand.body'),
      buttonText: t('home.rolesCTA.applyAsBrand.button'),
      link: "/apply/brand",
      backgroundImage: brandImage,
    },
  ];

  return (
    <section className="bg-[#FDF9F0] py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 text-left">
        <p className="inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.12em] text-[#D4C07A] mb-4">
          The Goldsainte Experience Awaits
        </p>
        <h2 className="font-secondary text-[26px] leading-snug text-[#0a2225] md:text-4xl lg:text-[42px] mb-3">
          Choose how you join <em>Goldsainte AI</em>
        </h2>
        <p className="max-w-xl text-sm md:text-base text-[#5A5A5A] mb-14">
          Whether you're planning your next journey, sharing your adventures, or crafting unforgettable itineraries — there's a place for you here.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <div
                key={index}
                className="group cursor-pointer space-y-2.5"
              >
                {/* Clean image — no overlay */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl">
                  <img
                    src={role.backgroundImage}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Content below image */}
                <div className="space-y-2 px-0.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c4d47]/10">
                      <Icon className="h-4 w-4 text-[#0c4d47]" />
                    </div>
                    <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug">
                      {role.title}
                    </h3>
                  </div>
                  
                  <p className="text-[13px] leading-relaxed text-[#6B7280]">
                    {role.body}
                  </p>

                  <Button
                    asChild
                    size="sm"
                    className="w-full rounded-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] transition-colors duration-300"
                  >
                    <Link to={role.link}>
                      {role.buttonText}
                    </Link>
                  </Button>

                  {role.browseLink && (
                    <Link
                      to={role.browseLink}
                      className="block text-center text-[13px] font-medium text-[#0c4d47] hover:underline transition-colors duration-200"
                    >
                      {role.browseLabel}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
