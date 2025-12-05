import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Real images from assets
import heroMain from "@/assets/sections/built-for-every-side-main.jpg";
import heroRightTop from "@/assets/resort-pool-palms.jpg";
import heroRightBottom from "@/assets/elephants-safari.jpg";

// Luxury editorial photography for "How Goldsainte AI works" accordion
import santoriniStepsImg from "@/assets/santorini-steps.jpg";
import veniceGondolaImg from "@/assets/venice-gondola.jpg";
import hotAirBalloonsImg from "@/assets/hot-air-balloons.jpg";
import tropicalAerialImg from "@/assets/tropical-islands-aerial.jpg";
import mountainBridgeImg from "@/assets/mountain-bridge-adventure.jpg";

/* -------------------------------------------------------------------------- */
/*  Built for every side of luxury travel                                     */
/* -------------------------------------------------------------------------- */

export const BuiltForEverySideSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-center">
        {/* LEFT SIDE: COPY + PERSONAS */}
        <div className="space-y-8 md:w-3/5">
          <div className="space-y-3 text-center md:text-left">
            <p className="inline-flex rounded-full bg-[#0c4d47] px-2 md:px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.06em] md:tracking-[0.12em] text-[#D4C07A] whitespace-nowrap">
              {t('home.builtForEverySide.badge')}
            </p>
            <h2 className="font-secondary text-[26px] leading-tight text-[#0a2225] md:text-4xl md:whitespace-nowrap">
              {t('home.builtForEverySide.title')}
            </h2>
            <p className="max-w-md mx-auto md:mx-0 text-sm text-[#4A4A4A]">
              {t('home.builtForEverySide.description')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PersonaCard
              label={t('home.builtForEverySide.travelers.label')}
              items={[
                t('home.builtForEverySide.travelers.item1'),
                t('home.builtForEverySide.travelers.item2'),
                t('home.builtForEverySide.travelers.item3'),
              ]}
            />
            <PersonaCard
              label={t('home.builtForEverySide.creators.label')}
              items={[
                t('home.builtForEverySide.creators.item1'),
                t('home.builtForEverySide.creators.item2'),
                t('home.builtForEverySide.creators.item3'),
              ]}
            />
            <PersonaCard
              label={t('home.builtForEverySide.agents.label')}
              items={[
                t('home.builtForEverySide.agents.item1'),
                t('home.builtForEverySide.agents.item2'),
                t('home.builtForEverySide.agents.item3'),
              ]}
            />
            <PersonaCard
              label={t('home.builtForEverySide.brands.label')}
              items={[
                t('home.builtForEverySide.brands.item1'),
                t('home.builtForEverySide.brands.item2'),
                t('home.builtForEverySide.brands.item3'),
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
                {t('home.builtForEverySide.collageCaption')}
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
      <span className="mb-3 inline-flex w-fit rounded-full bg-[#0c4d47] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[#D4C07A]">
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
/*  How Goldsainte AI works - 4 Tabbed Categories                             */
/* -------------------------------------------------------------------------- */

import { Sparkles, Palette, Users, CreditCard, Heart, Brain, Rss, Star, Wand2, Layers, ArrowRightLeft, Bookmark, Target, MessageSquare, Building2, UserCheck, Mic, Shield, Bell, MessagesSquare } from "lucide-react";

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
    <section className="bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-10 md:mb-14 text-center">
          <p className="inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.12em] text-[#D4C07A] mb-4">
            Powered by AI
          </p>
          <h2 className="font-secondary text-[26px] leading-[1.15] text-[#0a2225] md:text-[40px] mb-3">
            How <span className="italic">Goldsainte AI</span> works
          </h2>
          <p className="max-w-xl mx-auto text-sm md:text-base text-[#5A5A5A]">
            From inspiration to booking, AI handles the heavy lifting.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex justify-center mb-8 md:mb-12">
          <div className="inline-flex gap-1 md:gap-2 p-1 rounded-full bg-[#F5EFE1] border border-[#E5DFC6]">
            {tabsData.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-white text-[#0a2225] shadow-sm"
                      : "text-[#6B7280] hover:text-[#0a2225]"
                  )}
                >
                  <IconComponent className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Layout: Features + Image */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left: Feature Grid */}
          <div className="lg:w-[55%]">
            <div className="grid gap-4 md:gap-5 md:grid-cols-2">
              {activeTabData.features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className={cn(
                      "rounded-2xl border border-[#E5DFC6] bg-white p-4 md:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                      "animate-in fade-in slide-in-from-bottom-2"
                    )}
                    style={{ animationDelay: `${index * 75}ms`, animationFillMode: "both" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#0c4d47]/10 flex items-center justify-center">
                        <FeatureIcon className="w-4 h-4 md:w-5 md:h-5 text-[#0c4d47]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-secondary text-sm md:text-base text-[#0a2225] mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-[12px] md:text-[13px] leading-relaxed text-[#5A5A5A]">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

  const items = [
    {
      title: t('home.trustSafety.item1.title'),
      body: t('home.trustSafety.item1.body'),
    },
    {
      title: t('home.trustSafety.item2.title'),
      body: t('home.trustSafety.item2.body'),
    },
    {
      title: t('home.trustSafety.item3.title'),
      body: t('home.trustSafety.item3.body'),
    },
    {
      title: t('home.trustSafety.item4.title'),
      body: t('home.trustSafety.item4.body'),
    },
  ];

  return (
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="space-y-3 text-center md:text-left">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A7151]">
            {t('home.trustSafety.badge')}
          </p>
          <h2 className="font-secondary text-[26px] leading-tight text-[#0a2225] md:text-4xl">
            {t('home.trustSafety.title')}
          </h2>
          <p className="max-w-lg mx-auto md:mx-0 text-sm text-[#4A4A4A]">
            {t('home.trustSafety.description')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-[0_8px_20px_rgba(10,34,37,0.08)]"
            >
              <h3 className="text-sm font-semibold text-[#0a2225]">
                {item.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#4A4A4A]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};