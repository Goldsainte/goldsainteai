import React, { useState } from "react";
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

/* -------------------------------------------------------------------------- */
/*  Built for every side of luxury travel - Horizontal Scroll Carousel        */
/* -------------------------------------------------------------------------- */

type PersonaCarouselCardProps = {
  image: string;
  headline: string;
  tagline: string;
  href: string;
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
    href: "/apply/agent",
  },
  {
    image: tropicalHideawayImg,
    headline: "Brands",
    tagline: "Partner with creators who match your aesthetic.",
    href: "/apply/brand",
  },
];

const PersonaCarouselCard: React.FC<PersonaCarouselCardProps> = ({
  image,
  headline,
  tagline,
  href,
}) => {
  return (
    <a
      href={href}
      className="group relative aspect-[3/4] w-[280px] md:w-[300px] lg:w-[320px] flex-shrink-0 overflow-hidden rounded-[28px] snap-center cursor-pointer"
    >
      {/* Full-bleed image with hover zoom */}
      <img
        src={image}
        alt={headline}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

      {/* Text content pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <span className="mb-2 inline-block rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white/95">
          {headline}
        </span>
        <p className="text-[15px] md:text-base font-light text-white/90 leading-relaxed">
          {tagline}
        </p>
      </div>

      {/* Hover arrow indicator */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </a>
  );
};

export const BuiltForEverySideSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-[#FDF9F0] py-16 md:py-24 overflow-hidden">
      {/* Section header - centered */}
      <div className="text-center mb-10 md:mb-12 px-4">
        <p className="inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.12em] text-[#D4C07A] mb-4">
          {t('home.builtForEverySide.badge')}
        </p>
        <h2 className="font-secondary text-[28px] md:text-4xl lg:text-[42px] leading-tight text-[#0a2225]">
          {t('home.builtForEverySide.title')}
        </h2>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-[#5A5A5A] mt-3">
          Each role brings something essential — travelers bring the vision, creators bring the aesthetic, agents refine the details, brands shape the experience. Goldsainte brings them together in one cinematic journey.
        </p>
      </div>

      {/* Horizontal scroll container with peek effect */}
      <div className="relative">
        {/* Left fade gradient (desktop only) */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#FDF9F0] to-transparent z-10 pointer-events-none" />

        {/* Scrollable cards container */}
        <div 
          className="flex gap-4 md:gap-5 overflow-x-auto px-6 md:px-8 lg:px-[calc((100vw-1280px)/2+32px)] pb-4 snap-x snap-mandatory"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
          `}</style>
          {personasCarouselData.map((persona) => (
            <PersonaCarouselCard key={persona.headline} {...persona} />
          ))}
        </div>

        {/* Right fade gradient (desktop only) */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FDF9F0] to-transparent z-10 pointer-events-none" />
      </div>

      {/* Scroll hint for mobile */}
      <p className="mt-6 text-center text-[11px] uppercase tracking-[0.15em] text-[#9A9A9A] lg:hidden">
        Swipe to explore →
      </p>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  How Goldsainte AI works - 4 Tabbed Categories                             */
/* -------------------------------------------------------------------------- */

import { Sparkles, Palette, Users, CreditCard, Heart, Brain, Rss, Star, Wand2, Layers, ArrowRightLeft, Bookmark, Target, MessageSquare, Building2, UserCheck, Mic, Shield, Bell, MessagesSquare, ShieldCheck, Lock, Scale } from "lucide-react";

type AIFeature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

type TabData = {
  id: string;
  label: string;
  icon: React.ElementType;
  features: AIFeature[];
};

const tabsData: TabData[] = [
  {
    id: "personalizes",
    label: "Personalizes",
    icon: Sparkles,
    features: [
      {
        icon: Heart,
        title: "AI-Curated Collections",
        description: "Curated itineraries built around your style — where you want to go, how you like to travel, and what makes you feel at home.",
      },
      {
        icon: Brain,
        title: "Behavioral Learning",
        description: "The more you explore, the smarter Goldsainte gets. It learns from your searches, saves, and bookings to recommend trips that feel like you.",
      },
      {
        icon: Rss,
        title: "Personalized Feed",
        description: "Your social feed ranks content based on accounts you follow, destinations you've liked, and what's trending in your travel world.",
      },
      {
        icon: Star,
        title: "Smart Recommendations",
        description: "AI analyzes your booking history, preferences, and favorites to surface destinations and experiences you'll love — before you even search.",
      },
    ],
  },
  {
    id: "creates",
    label: "Creates",
    icon: Palette,
    features: [
      {
        icon: Layers,
        title: "Storyboard Creation",
        description: "Turn TikToks, Pins, and daydreams into visual mood boards. Build a storyboard that captures exactly what you want your trip to feel like.",
      },
      {
        icon: Wand2,
        title: "AI Scene Suggestions",
        description: "Starting from scratch? AI auto-generates scene placeholders — arrival, golden hour, sunset dining, farewells — so your storyboard tells a story.",
      },
      {
        icon: ArrowRightLeft,
        title: "Storyboard → Trip Request",
        description: "One click converts your visual inspiration into an actionable trip request, ready for creators and agents to bring to life.",
      },
      {
        icon: Bookmark,
        title: "Save-to-Storyboard",
        description: "See something inspiring? Save it to your storyboard from anywhere on the platform — a hotel, a creator's reel, a destination card.",
      },
    ],
  },
  {
    id: "matches",
    label: "Matches",
    icon: Users,
    features: [
      {
        icon: Target,
        title: "AI Trip Matching",
        description: "Share your trip request and AI scores thousands of creators and agents in seconds — matching your vibe, budget, and destination with professionals who get it.",
      },
      {
        icon: MessageSquare,
        title: "Receive Proposals",
        description: "Verified creators and agents compete for your trip with custom proposals, pricing, and storyboards — you pick the one that feels right.",
      },
      {
        icon: UserCheck,
        title: "AI Agent Matching",
        description: "Find travel agents who specialize in exactly where you want to go and how you like to travel — no endless scrolling, just perfect fits.",
      },
      {
        icon: Building2,
        title: "AI Brand Discovery",
        description: "Looking for the perfect hotel or resort? AI matches you with properties based on your taste, style tags, and reviews from travelers like you.",
      },
    ],
  },
  {
    id: "books",
    label: "Books",
    icon: CreditCard,
    features: [
      {
        icon: Mic,
        title: "Voice Activation",
        description: "Just say 'Hey Goldsainte' — ask Madison anything about your trip, refine your storyboard, or get matched with a creator, all hands-free.",
      },
      {
        icon: Shield,
        title: "Protected Payments",
        description: "Pay securely through Stripe with commission-protected escrow. Your money is held safely until your trip is confirmed — no side deals, no risk.",
      },
      {
        icon: Bell,
        title: "AI Match Notifications",
        description: "Get notified instantly when a creator or agent matches your trip request — so you never miss the perfect opportunity.",
      },
      {
        icon: MessagesSquare,
        title: "All-in-One Booking",
        description: "Chat, review proposals, sign contracts, and book — all inside Goldsainte. No phone numbers, no emails, no off-platform chaos.",
      },
    ],
  },
];

// Tab-specific hero images mapping
const tabImages: Record<string, string> = {
  personalizes: santoriniStepsImg,
  creates: mountainBridgeImg,
  matches: veniceGondolaImg,
  books: hotAirBalloonsImg,
};

export const HowGoldsainteWorksSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("personalizes");

  const activeTabData = tabsData.find((tab) => tab.id === activeTab) || tabsData[0];

  return (
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 md:mb-16 text-center">
          <p className="inline-flex rounded-full bg-[#C7A962]/10 border border-[#C7A962]/30 px-4 py-1.5 text-[10px] md:text-xs font-medium uppercase tracking-[0.15em] text-[#8B7355] mb-5">
            Powered by AI
          </p>
          <h2 className="font-secondary text-[26px] leading-[1.15] text-[#0a2225] md:text-[40px] mb-3">
            How <span className="italic">Goldsainte AI</span> works
          </h2>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-[#5A5A5A] leading-relaxed">
            Goldsainte AI listens to your style, curates the right creators and certified agents, and quietly orchestrates the journey in the background — while you stay in the experience. From mood board to booking confirmation, every step feels effortless.
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
                        "flex items-center gap-4 px-6 py-5 rounded-xl transition-all duration-500 hover:no-underline",
                        "[&>svg]:transition-all [&>svg]:duration-500 [&>svg]:text-[#C7A962]",
                        isActive
                          ? "bg-[#FDFBF7] border-l-4 border-l-[#C7A962] shadow-[0_4px_20px_rgba(199,169,98,0.08)]"
                          : "bg-white border-l-4 border-l-transparent hover:bg-[#FDFBF7] hover:border-l-[#C7A962]/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                        isActive ? "bg-[#C7A962]/15" : "bg-[#F5EFE1]"
                      )}>
                        <TabIcon className="w-5 h-5 text-[#C7A962]" />
                      </div>
                      <span className="font-secondary text-lg text-[#0a2225] flex-1 text-left">
                        {tab.label}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-6 pb-3 px-2">
                      <div className="grid gap-5 md:grid-cols-2">
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
                {Object.entries(tabImages).map(([tabId, imageSrc]) => (
                  <img
                    key={tabId}
                    src={imageSrc}
                    alt={`${tabId} travel inspiration`}
                    className={cn(
                      "w-full h-[280px] md:h-[420px] object-cover transition-opacity duration-500",
                      activeTab === tabId ? "opacity-100" : "opacity-0 absolute inset-0"
                    )}
                  />
                ))}
                
                {/* Gradient overlay with tab label */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const TabIcon = activeTabData.icon;
                      return <TabIcon className="w-4 h-4 text-[#D4C07A]" />;
                    })()}
                    <span className="text-white/90 text-sm font-medium tracking-wide">
                      {activeTabData.label}
                    </span>
                  </div>
                </div>
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
  const [openItem, setOpenItem] = useState<string>("identity");

  const items: { id: string; icon: LucideIcon; title: string; body: string }[] = [
    {
      id: "identity",
      icon: ShieldCheck,
      title: t('home.trustSafety.item1.title'),
      body: t('home.trustSafety.item1.body'),
    },
    {
      id: "escrow",
      icon: Lock,
      title: t('home.trustSafety.item2.title'),
      body: t('home.trustSafety.item2.body'),
    },
    {
      id: "safe",
      icon: MessageSquare,
      title: t('home.trustSafety.item3.title'),
      body: t('home.trustSafety.item3.body'),
    },
    {
      id: "dispute",
      icon: Scale,
      title: t('home.trustSafety.item4.title'),
      body: t('home.trustSafety.item4.body'),
    },
  ];

  return (
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 md:mb-16 text-center">
          <p className="inline-flex rounded-full bg-[#C7A962]/10 border border-[#C7A962]/30 px-4 py-1.5 text-[10px] md:text-xs font-medium uppercase tracking-[0.15em] text-[#8B7355] mb-5">
            {t('home.trustSafety.badge')}
          </p>
          <h2 className="font-secondary text-[26px] leading-[1.15] text-[#0a2225] md:text-[40px] mb-3">
            {t('home.trustSafety.title')}
          </h2>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-[#5A5A5A] leading-relaxed">
            {t('home.trustSafety.description')}
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion
            type="single"
            collapsible
            value={openItem}
            onValueChange={(value) => value && setOpenItem(value)}
            className="space-y-4"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = openItem === item.id;
              return (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-0"
                >
                  <AccordionTrigger
                    className={cn(
                      "flex items-center gap-4 px-6 py-5 rounded-xl transition-all duration-500 hover:no-underline",
                      "[&>svg]:transition-all [&>svg]:duration-500 [&>svg]:text-[#C7A962]",
                      isActive
                        ? "bg-[#FDFBF7] border-l-4 border-l-[#C7A962] shadow-[0_4px_20px_rgba(199,169,98,0.08)]"
                        : "bg-white border-l-4 border-l-transparent hover:bg-[#FDFBF7] hover:border-l-[#C7A962]/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                      isActive ? "bg-[#C7A962]/15" : "bg-[#F5EFE1]"
                    )}>
                      <Icon className="w-5 h-5 text-[#C7A962]" />
                    </div>
                    <span className="font-secondary text-lg text-[#0a2225] flex-1 text-left">
                      {item.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-2 px-6 pl-20">
                    <p className="text-sm leading-relaxed text-[#6B7280]">
                      {item.body}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Footer Note */}
        <p className="mt-10 md:mt-12 text-center text-[13px] text-[#8B8B8B] max-w-md mx-auto">
          All communication and payments stay inside Goldsainte. No phone numbers, no side deals — just protected, organized travel.
        </p>
      </div>
    </section>
  );
};