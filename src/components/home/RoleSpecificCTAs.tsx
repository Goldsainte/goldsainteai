// src/components/home/RoleSpecificCTAs.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Video, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";

export function RoleSpecificCTAs() {
  const { t } = useTranslation();

  const roles = [
    {
      icon: Sparkles,
      title: t('home.rolesCTA.planMyTrip.title'),
      body: t('home.rolesCTA.planMyTrip.body'),
      buttonText: t('home.rolesCTA.planMyTrip.button'),
      link: "/post-trip",
      backgroundImage: "/home/christian-lambert-vmIWr0NnpCQ-unsplash.jpeg",
    },
    {
      icon: Video,
      title: t('home.rolesCTA.joinAsCreator.title'),
      body: t('home.rolesCTA.joinAsCreator.body'),
      buttonText: t('home.rolesCTA.joinAsCreator.button'),
      link: "/auth?mode=signup&role=creator",
      backgroundImage: "/home/justin-clark-JkT5-MulyiE-unsplash.jpg",
    },
    {
      icon: Briefcase,
      title: t('home.rolesCTA.applyAsAgent.title'),
      body: t('home.rolesCTA.applyAsAgent.body'),
      buttonText: t('home.rolesCTA.applyAsAgent.button'),
      link: "/apply/agent",
      backgroundImage: "/home/nicolas-meunier-WKGmcxLdXC4-unsplash.jpeg",
    },
  ];

  return (
    <section className="bg-white border-t border-[#E5DFC6]/30 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-3xl leading-snug text-[#0a2225] md:text-4xl lg:text-[42px] mb-12">
          {t('home.rolesCTA.title')}
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <div
                key={index}
                className="group flex flex-col rounded-2xl border border-[#E5DFC6] bg-white shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Background image banner */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={role.backgroundImage}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  
                  {/* Icon overlay */}
                  <div className="absolute bottom-4 left-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
                      <Icon className="h-6 w-6 text-[#0c4d47]" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-8">
                  <h3 className="font-display text-xl text-[#0a2225] mb-3">
                    {role.title}
                  </h3>
                  
                  <p className="text-sm leading-[1.7] text-[#4a4a4a] mb-6 flex-1">
                    {role.body}
                  </p>

                  <Button
                    asChild
                    className="w-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] transition-colors duration-300"
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