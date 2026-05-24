import React, { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Real images from assets - Persona carousel images
import santoriniStepsImg from "@/assets/santorini-steps.jpg";
import creatorCanyonImg from "@/assets/creator-canyon-views.jpg";
import agentPlanningImg from "@/assets/agent-travel-planning.jpg";
import tropicalHideawayImg from "@/assets/luxury-tropical-hideaway.jpg";

// Additional images for HowGoldsainteWorksSection
import veniceGondolaImg from "@/assets/venice-gondola.jpg";
import hotAirBalloonsImg from "@/assets/hot-air-balloons.jpg";
import mountainBridgeImg from "@/assets/mountain-bridge-adventure.jpg";
import { CreatorAIMagic } from "@/components/home/CreatorAIMagic";
import { TravelerDiscoveryMagic } from "@/components/home/TravelerDiscoveryMagic";
import { AgentProposalMagic } from "@/components/home/AgentProposalMagic";

/* -------------------------------------------------------------------------- */
/*  Built for every side of luxury travel - Horizontal Scroll Carousel        */
/* -------------------------------------------------------------------------- */

type PersonaCarouselCardProps = {
  image: string;
  headline: string;
  tagline: string;
  href: string;
  browseHref?: string;
  browseLabel?: string;
};

const personasCarouselData: PersonaCarouselCardProps[] = [
  {
    image: santoriniStepsImg,
    headline: "Travelers",
    tagline: "AI-matched trips built around your style.",
    href: "/auth?mode=signup&role=traveler",
  },
  {
    image: creatorCanyonImg,
    headline: "Creators",
    tagline: "Turn your content into bookable experiences.",
    href: "/auth?mode=signup&role=creator",
  },
  {
    image: agentPlanningImg,
    headline: "Agents",
    tagline: "Verified leads delivered to your inbox.",
    href: "/apply/agent/signup",
  },
  {
    image: tropicalHideawayImg,
    headline: "Brands",
    tagline: "Partner with creators who match your aesthetic.",
    href: "/apply/brand",
  },
];

const PersonaCarouselCard: React.FC<PersonaCarouselCardProps & { index: number }> = ({
  image,
  headline,
  tagline,
  href,
  browseHref,
  browseLabel,
  index,
}) => {
  return (
    <a
      href={href}
      className="group relative aspect-[3/4] w-[280px] md:w-[300px] lg:w-[320px] flex-shrink-0 overflow-hidden rounded-[28px] snap-center cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(199,169,98,0.25)] ring-1 ring-[#C7A962]/15 hover:ring-[#C7A962]/40 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 120}ms`, animationFillMode: "both" }}
    >
      {/* Full-bleed image with enhanced hover zoom */}
      <img
        src={image}
        alt={headline}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      loading="lazy"/>

      {/* Inner vignette effect */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] pointer-events-none" />

      {/* Enhanced gradient overlay - more dramatic */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 via-50% to-transparent transition-all duration-500" />
      
      {/* Double-line frame on hover - white inner */}
      <div className="absolute inset-3 rounded-[20px] border border-white/0 group-hover:border-white/25 transition-all duration-500 pointer-events-none" />
      
      {/* Gold bottom border accent - always visible, intensifies on hover */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#C7A962]/30 to-transparent group-hover:via-[#C7A962]/90 transition-all duration-500" />

      {/* Decorative gold corner accents - top left */}
      <div className="absolute top-4 left-4 w-8 h-8 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-[#C7A962]/80 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-[1.5px] bg-gradient-to-b from-[#C7A962]/80 to-transparent" />
      </div>
      
      {/* Decorative gold corner accents - bottom right */}
      <div className="absolute bottom-4 right-4 w-8 h-8 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-[1.5px] bg-gradient-to-l from-[#C7A962]/80 to-transparent" />
        <div className="absolute bottom-0 right-0 h-full w-[1.5px] bg-gradient-to-t from-[#C7A962]/80 to-transparent" />
      </div>

      {/* Text content with parallax animation */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 transition-transform duration-500 group-hover:-translate-y-1">
        {/* Gold-accented pill badge - enhanced */}
        <span className="mb-3 inline-block rounded-full bg-[#C7A962]/25 border border-[#C7A962]/50 backdrop-blur-sm px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5EFE1] shadow-sm">
          {headline}
        </span>
        {/* Serif italic tagline for editorial feel */}
        <p className="font-secondary font-light italic text-[15px] md:text-base text-white/95 leading-relaxed tracking-wide">
          {tagline}
        </p>
        {browseHref && browseLabel && (
          <Link
            to={browseHref}
            onClick={(e) => e.stopPropagation()}
            className="mt-2.5 inline-block text-[13px] font-medium text-[#F5EFE1]/80 hover:text-white hover:underline transition-colors duration-200"
          >
            {browseLabel} →
          </Link>
        )}
      </div>

      {/* Hover arrow indicator with slide-in animation */}
      <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#C7A962]/25 border border-[#C7A962]/40 backdrop-blur-sm flex items-center justify-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-400 delay-75">
        <svg className="w-4 h-4 text-[#F5EFE1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </a>
  );
};

export const BuiltForEverySideSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-[#FDF9F0] pt-16 pb-8 md:pt-24 md:pb-12 overflow-hidden">
      {/* Section header - elevated typography */}
      <div className="mx-auto max-w-6xl px-4 text-left mb-12 md:mb-14">
        <p className="inline-flex rounded-full bg-[#0c4d47] px-4 py-1.5 text-[10px] md:text-xs font-medium uppercase tracking-[0.14em] text-[#D4C07A] mb-3">
          {t('home.builtForEverySide.badge')}
        </p>
        {/* Gold decorative line */}
        <div className="w-14 h-[3px] bg-gradient-to-r from-[#C7A962] to-[#C7A962]/40 mb-5" />
        <h2 className="font-secondary text-[30px] md:text-[40px] lg:text-[46px] leading-[1.1] tracking-tight text-[#0a2225]">
          Built for every side of{" "}
          <span className="italic">luxury travel</span>
        </h2>
        <p className="max-w-2xl text-sm md:text-base text-[#5A5A5A] mt-4 leading-relaxed font-light">
          Each role brings something essential — travelers bring the vision, creators bring the aesthetic, agents refine the details, brands shape the experience. Goldsainte brings them together in one cinematic journey.
        </p>
      </div>

      {/* Horizontal scroll container with peek effect */}
      <div className="relative">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 lg:w-20 bg-gradient-to-r from-[#FDF9F0] to-transparent z-10 pointer-events-none" />

        {/* Scrollable cards container */}
        <div 
          className="flex gap-5 md:gap-6 overflow-x-auto px-4 lg:px-[max(16px,calc((100vw-1152px)/2))] pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
          `}</style>
          {personasCarouselData.map((persona, index) => (
            <PersonaCarouselCard key={persona.headline} {...persona} index={index} />
          ))}
        </div>

        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 lg:w-20 bg-gradient-to-l from-[#FDF9F0] to-transparent z-10 pointer-events-none" />
      </div>

      {/* Refined scroll hint for mobile with gold arrows */}
      <p className="mt-8 text-center text-[11px] uppercase tracking-[0.18em] text-[#8B8B8B] lg:hidden font-light">
        <span className="text-[#C7A962]">←</span>
        <span className="mx-2">Swipe to explore</span>
        <span className="text-[#C7A962]">→</span>
      </p>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  How Goldsainte AI works - 4 Tabbed Categories                             */
/* -------------------------------------------------------------------------- */

import { Sparkles, Palette, Users, CreditCard, Heart, Brain, Rss, Star, Wand2, Layers, ArrowRightLeft, Bookmark, Target, MessageSquare, Building2, UserCheck, Mic, Shield, Bell, MessagesSquare, ShieldCheck, Lock, Scale, Fingerprint, BadgeCheck, Eye, Wallet, RefreshCw, MessageCircle, FileText, Ban, Gavel, Clock, FileCheck, Compass, Camera, Briefcase, ClipboardList, Calendar, TrendingUp, Map, Handshake, Zap } from "lucide-react";

type AIFeature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

type TabData = {
  id: string;
  label: string;
  icon: React.ElementType;
  captionLabel?: string;
  intro?: { title: string; description: string };
  features: AIFeature[];
};

const tabsData: TabData[] = [
  {
    id: "travelers",
    label: "For Travelers",
    icon: Compass,
    captionLabel: "Discover & Book",
    intro: {
      title: "Discover trips you'll fall in love with.",
      description:
        "Browse itineraries from trusted travel specialists and explorers, personalized in real time to your taste — and booked entirely on-platform.",
    },
    features: [
      {
        icon: Heart,
        title: "Handpicked Experiences",
        description:
          "Discover trips designed by creators and certified travel experts—not generic travel templates.",
      },
      {
        icon: Calendar,
        title: "Instant Booking",
        description:
          "Book complete itineraries and travel packages in minutes with streamlined planning and checkout.",
      },
      {
        icon: Sparkles,
        title: "Personalized Travel",
        description:
          "Customize experiences around your interests, travel style, budget, and preferred pace.",
      },
      {
        icon: Star,
        title: "AI-Powered Discovery",
        description:
          "Goldsainte learns your preferences to recommend destinations and experiences tailored to you.",
      },
    ],
  },
  {
    id: "creators",
    label: "For Travel Creators",
    icon: Camera,
    captionLabel: "Create & Monetize",
    intro: {
      title: "Upload your camera roll. Watch Goldsainte rebuild your journey.",
      description:
        "AI identifies destinations, restaurants, travel dates, and experiences — then assembles them into a bookable itinerary you can publish and monetize in minutes.",
    },
    features: [
      {
        icon: Wand2,
        title: "AI Trip Reconstruction",
        description:
          "Upload photos and videos and let AI identify destinations, activities, timestamps, and experiences automatically.",
      },
      {
        icon: Zap,
        title: "Instant Itinerary Generation",
        description:
          "Transform past trips into structured travel itineraries in minutes—not hours of manual planning.",
      },
      {
        icon: Wallet,
        title: "Monetize Your Experiences",
        description:
          "Publish and sell curated itineraries directly through the Goldsainte marketplace.",
      },
      {
        icon: Users,
        title: "Build Your Travel Brand",
        description:
          "Turn your travel style, recommendations, and experiences into a scalable audience and income stream.",
      },
    ],
  },
  {
    id: "agents",
    label: "For Travel Agents",
    icon: Briefcase,
    captionLabel: "Sell & Customize",
    intro: {
      title: "Design bespoke proposals like a luxury magazine.",
      description:
        "Curate hotels, restaurants, and experiences into elegant, white-glove proposals — delivered to verified travelers and protected on-platform.",
    },
    features: [
      {
        icon: Briefcase,
        title: "Curated Travel Packages",
        description:
          "List premium travel experiences travelers can browse and book instantly.",
      },
      {
        icon: Map,
        title: "Custom Trip Planning",
        description:
          "Personalize itineraries around traveler preferences, budgets, and goals.",
      },
      {
        icon: Handshake,
        title: "Custom Trip Requests",
        description:
          "Receive custom traveler requests and craft tailored proposals to win their business.",
      },
      {
        icon: Brain,
        title: "AI-Enhanced Workflow",
        description:
          "Use AI-assisted tools to streamline itinerary building and trip customization.",
      },
    ],
  },
];

// Tab-specific signature animations
const tabAnimations: Record<string, React.FC> = {
  travelers: TravelerDiscoveryMagic,
  creators: CreatorAIMagic,
  agents: AgentProposalMagic,
};

export const HowGoldsainteWorksSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("travelers");

  const activeTabData = tabsData.find((tab) => tab.id === activeTab) || tabsData[0];

  return (
    <section id="how-it-works" className="bg-[#FDF9F0] px-4 pt-10 pb-16 md:pt-14 md:pb-24 scroll-mt-16">
      <div className="mx-auto max-w-6xl">
        {/* Section Header — mirrors TwoWaysComparison */}
        <div className="mb-12 md:mb-16 text-center">
          <span className="inline-block rounded-full border border-[#0c4d47] bg-[#0c4d47] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#bfad72] mb-4">
            How It Works
          </span>
          <div className="mx-auto w-14 h-px bg-[#C7A962] mb-5" />
          <h2 className="font-secondary text-2xl md:text-4xl text-[#0a2225] mb-3">
            How Goldsainte Works
          </h2>
          <p className="text-sm md:text-base text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed">
            A curated travel marketplace where travelers discover experiences, travel storytellers share and earn from their journeys, and certified travel agents sell or customize travel packages.
          </p>
        </div>

        {/* Two-Column Layout: Accordion + Image */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Left: Accordion */}
          <div className="lg:w-[55%]">
            <Accordion
              type="single"
              collapsible
              value={activeTab}
              onValueChange={(value) => value && setActiveTab(value)}
              className="space-y-4"
            >
              {tabsData.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <AccordionItem
                    key={tab.id}
                    value={tab.id}
                    className="border-0"
                  >
                    <AccordionTrigger
                      className={cn(
                        "flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 md:py-5 rounded-xl transition-all duration-500 hover:no-underline",
                        "[&>svg]:transition-all [&>svg]:duration-500 [&>svg]:text-[#C7A962]",
                        isActive
                          ? "bg-[#FDFBF7] border-l-4 border-l-[#C7A962] shadow-[0_4px_20px_rgba(199,169,98,0.08)]"
                          : "bg-white border-l-4 border-l-transparent hover:bg-[#FDFBF7] hover:border-l-[#C7A962]/50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500",
                        isActive ? "bg-[#C7A962]/15" : "bg-[#F5EFE1]"
                      )}>
                        <TabIcon className="w-4 h-4 md:w-5 md:h-5 text-[#C7A962]" />
                      </div>
                      <span className="font-secondary text-base md:text-lg text-[#0a2225] flex-1 text-left">
                        {tab.label}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-6 pb-3 px-2">
                      {tab.intro && (
                        <div className="mb-6 px-1">
                          <h3 className="font-secondary text-lg md:text-xl text-[#0a2225] mb-2">
                            {tab.intro.title}
                          </h3>
                          <p className="text-sm md:text-[15px] leading-relaxed text-[#5A5A5A]">
                            {tab.intro.description}
                          </p>
                        </div>
                      )}
                      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                        {tab.features.map((feature, index) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <div
                              key={feature.title}
                              className={cn(
                                "flex items-start gap-4 group",
                                "animate-in fade-in slide-in-from-bottom-3 duration-500"
                              )}
                              style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5EFE1] flex items-center justify-center group-hover:bg-[#C7A962]/15 transition-colors duration-300">
                                <FeatureIcon className="w-5 h-5 text-[#C7A962]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-secondary text-base text-[#0a2225] mb-1.5">
                                  {feature.title}
                                </h4>
                                <p className="text-sm leading-relaxed text-[#6B7280]">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* Right: Dynamic Image Panel */}
          <div className="lg:w-[45%] flex items-center justify-center">
            <div className="relative w-full max-w-md">
              {/* Subtle background frame */}
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[32px] border border-[#E5DFC6]/70 bg-[#F5EFE1]/30" />
              
              {/* Image container with smooth transitions */}
              <div className="relative overflow-hidden rounded-[32px] shadow-[0_24px_60px_rgba(10,34,37,0.12)]">
                {Object.entries(tabAnimations).map(([tabId, Anim], idx) => {
                  const isActive = activeTab === tabId;
                  return (
                    <div
                      key={`${tabId}-${isActive ? activeTab : "idle"}`}
                      className={cn(
                        "w-full transition-opacity duration-500",
                        isActive
                          ? "opacity-100 relative"
                          : "opacity-0 absolute inset-0 pointer-events-none",
                        idx > 0 && isActive ? "" : ""
                      )}
                    >
                      <Anim />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-10 md:mt-12 text-center text-[13px] text-[#8B8B8B] max-w-md mx-auto">
          All communication and payments stay inside Goldsainte. No phone numbers, no side deals — just beautifully organized trips.
        </p>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Trust, safety & payments                                                  */
/* -------------------------------------------------------------------------- */

export const TrustSafetyPaymentsSection: React.FC = () => {
  const { t } = useTranslation();

  const pillars: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: Sparkles,
      title: t('home.trustSafety.item1.title'),
      body: t('home.trustSafety.item1.body'),
    },
    {
      icon: Handshake,
      title: t('home.trustSafety.item2.title'),
      body: t('home.trustSafety.item2.body'),
    },
    {
      icon: Compass,
      title: t('home.trustSafety.item3.title'),
      body: t('home.trustSafety.item3.body'),
    },
    {
      icon: Map,
      title: t('home.trustSafety.item4.title'),
      body: t('home.trustSafety.item4.body'),
    },
  ];

  return (
    <section className="bg-[#FDF9F0] px-4 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Centered editorial header — matches "The Goldsainte Ecosystem" pattern */}
        <div className="mx-auto max-w-3xl text-center mb-10 md:mb-12">
          <p className="inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.18em] text-[#D4C07A]">
            {t('home.trustSafety.badge')}
          </p>
          <span aria-hidden="true" className="mx-auto mt-4 block h-px w-12 bg-[#C7A962]" />
          <h2 className="mt-5 font-secondary text-[28px] leading-[1.1] tracking-tight text-[#0a2225] md:text-[44px]">
            {t('home.trustSafety.title')}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] md:text-base leading-relaxed text-[#5A5A5A]">
            {t('home.trustSafety.description')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          {/* Left: Pillars */}
          <div className="lg:w-[55%] w-full">
            <ul className="divide-y divide-[#E5DFC6]">
              {pillars.map((p, index) => {
                const Icon = p.icon;
                return (
                  <li
                    key={p.title}
                    className="flex items-start gap-5 py-7 animate-in fade-in slide-in-from-bottom-3 duration-700"
                    style={{ animationDelay: `${index * 90}ms`, animationFillMode: "both" }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C7A962]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#C7A962]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-secondary text-base md:text-lg text-[#0a2225] mb-1.5">
                        {p.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#5A5A5A]">
                        {p.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: Aspirational editorial image */}
          <div className="lg:w-[45%] flex items-center justify-center w-full">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[32px] border border-[#E5DFC6]/70 bg-[#F5EFE1]/30" />
              <div className="relative overflow-hidden rounded-[32px] shadow-[0_24px_60px_rgba(10,34,37,0.12)]">
                <OptimizedImage
                  src={tropicalHideawayImg}
                  alt="A serene luxury escape, quietly orchestrated"
                  className="w-full h-[320px] md:h-[480px] object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-6 md:p-7">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/12 backdrop-blur-md border border-white/20 px-3.5 py-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4C07A]" />
                    <span className="font-secondary italic text-white/95 text-sm tracking-wide">
                      Quietly orchestrated by Goldsainte intelligence
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};