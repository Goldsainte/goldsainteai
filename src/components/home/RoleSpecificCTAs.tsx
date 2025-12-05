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
    },
    {
      icon: Briefcase,
      title: t('home.rolesCTA.applyAsAgent.title'),
      body: t('home.rolesCTA.applyAsAgent.body'),
      buttonText: t('home.rolesCTA.applyAsAgent.button'),
      link: "/apply/agent",
      backgroundImage: agentImage,
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
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.12em] text-[#D4C07A] mb-4">
          The Goldsainte Experience Awaits
        </p>
        <h2 className="font-secondary text-[26px] leading-snug text-[#0a2225] md:text-4xl lg:text-[42px] mb-3">
          Choose how you join <em>Goldsainte AI</em>
        </h2>
        <p className="max-w-xl mx-auto text-sm md:text-base text-[#5A5A5A] mb-14">
          Whether you're planning your next journey, sharing your adventures, or crafting unforgettable itineraries — there's a place for you here.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <div
                key={index}
                className="group flex flex-col rounded-2xl border border-[#E5DFC6] bg-[#F5EFE1] shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Background image banner */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={role.backgroundImage}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {/* Icon overlay */}
                  <div className="absolute bottom-4 left-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#C7B892]/40 backdrop-blur-sm shadow-sm">
                      <Icon className="h-5 w-5 text-[#0c4d47]" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6">
                  <h3 className="font-secondary text-lg text-[#0a2225] mb-2">
                    {role.title}
                  </h3>
                  
                  <p className="text-sm leading-relaxed text-[#4a4a4a] mb-5 flex-1">
                    {role.body}
                  </p>

                  <Button
                    asChild
                    className="w-full rounded-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] transition-colors duration-300"
                  >
                    <Link to={role.link}>
                      {role.buttonText}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
