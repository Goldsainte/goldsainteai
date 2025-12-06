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

const PersonaCarouselCard: React.FC<PersonaCarouselCardProps & { index: number }> = ({
  image,
  headline,
  tagline,
  href,
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
      />

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
          className="flex gap-5 md:gap-6 overflow-x-auto px-4 lg:px-[calc((100vw-1280px)/2+16px)] pb-4 snap-x snap-mandatory scrollbar-hide"
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

import { Sparkles, Palette, Users, CreditCard, Heart, Brain, Rss, Star, Wand2, Layers, ArrowRightLeft, Bookmark, Target, MessageSquare, Building2, UserCheck, Mic, Shield, Bell, MessagesSquare, ShieldCheck, Lock, Scale, Fingerprint, BadgeCheck, Eye, Wallet, RefreshCw, MessageCircle, FileText, Ban, Gavel, Clock, FileCheck } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("");

  const activeTabData = tabsData.find((tab) => tab.id === activeTab) || tabsData[0];

  return (
    <section className="bg-[#FDF9F0] px-4 pt-10 pb-16 md:pt-14 md:pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 md:mb-16 text-left">
          <p className="inline-flex rounded-full bg-[#C7A962]/10 border border-[#C7A962]/30 px-4 py-1.5 text-[10px] md:text-xs font-medium uppercase tracking-[0.15em] text-[#8B7355] mb-5">
            Powered by AI
          </p>
          <h2 className="font-secondary text-[26px] leading-[1.15] text-[#0a2225] md:text-[40px] mb-3">
            How <span className="italic">Goldsainte AI</span> works
          </h2>
          <p className="max-w-2xl text-sm md:text-base text-[#5A5A5A] leading-relaxed">
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
  const [openItem, setOpenItem] = useState<string>("");

  const items: { id: string; icon: LucideIcon; title: string; body: string; subFeatures: { icon: LucideIcon; title: string; description: string }[] }[] = [
    {
      id: "identity",
      icon: ShieldCheck,
      title: t('home.trustSafety.item1.title'),
      body: t('home.trustSafety.item1.body'),
      subFeatures: [
        { icon: UserCheck, title: "Verified professionals", description: "Every agent and creator is identity-verified before joining." },
        { icon: Fingerprint, title: "Stripe Identity", description: "Government ID + selfie matching for all marketplace participants." },
        { icon: BadgeCheck, title: "Background checks", description: "Enhanced screening for travel professionals handling your trips." },
        { icon: Eye, title: "Continuous monitoring", description: "Ongoing compliance and performance tracking." },
      ],
    },
    {
      id: "escrow",
      icon: Lock,
      title: t('home.trustSafety.item2.title'),
      body: t('home.trustSafety.item2.body'),
      subFeatures: [
        { icon: Wallet, title: "Secure escrow", description: "Funds held safely until trip milestones are completed." },
        { icon: CreditCard, title: "Milestone releases", description: "Payments released in stages as your trip progresses." },
        { icon: ShieldCheck, title: "Fraud protection", description: "Stripe-powered payment processing with chargeback protection." },
        { icon: RefreshCw, title: "Easy refunds", description: "Clear refund policies with automated processing." },
      ],
    },
    {
      id: "safe",
      icon: MessageSquare,
      title: t('home.trustSafety.item3.title'),
      body: t('home.trustSafety.item3.body'),
      subFeatures: [
        { icon: MessageCircle, title: "On-platform messaging", description: "All conversations stay inside Goldsainte for your protection." },
        { icon: FileText, title: "Full audit trail", description: "Every message and decision is documented and accessible." },
        { icon: Ban, title: "No side deals", description: "Payments and bookings must stay on-platform." },
        { icon: Bell, title: "Real-time alerts", description: "Instant notifications for important trip updates." },
      ],
    },
    {
      id: "dispute",
      icon: Scale,
      title: t('home.trustSafety.item4.title'),
      body: t('home.trustSafety.item4.body'),
      subFeatures: [
        { icon: Gavel, title: "Fair mediation", description: "Impartial dispute resolution by our trust team." },
        { icon: Clock, title: "Quick turnaround", description: "Most disputes resolved within 48-72 hours." },
        { icon: FileCheck, title: "Clear policies", description: "Transparent terms govern all marketplace transactions." },
        { icon: Users, title: "Human support", description: "Real people review and resolve complex issues." },
      ],
    },
  ];

  return (
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Two-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Left Column: Header + Accordion */}
          <div className="lg:w-[55%]">
            {/* Section Header - Left Aligned */}
            <div className="mb-8 md:mb-10">
              <p className="inline-flex rounded-full bg-[#C7A962]/10 border border-[#C7A962]/30 px-4 py-1.5 text-[10px] md:text-xs font-medium uppercase tracking-[0.15em] text-[#8B7355] mb-5">
                {t('home.trustSafety.badge')}
              </p>
              <h2 className="font-secondary text-[26px] leading-[1.15] text-[#0a2225] md:text-[40px] mb-3">
                {t('home.trustSafety.title')}
              </h2>
              <p className="max-w-xl text-sm md:text-base text-[#5A5A5A] leading-relaxed">
                {t('home.trustSafety.description')}
              </p>
            </div>

            {/* Accordion */}
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
                        <Icon className="w-4 h-4 md:w-5 md:h-5 text-[#C7A962]" />
                      </div>
                      <span className="font-secondary text-base md:text-lg text-[#0a2225] flex-1 text-left">
                        {item.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-6 pb-3 px-2">
                      <div className="grid gap-5 md:grid-cols-2">
                        {item.subFeatures.map((feature, index) => {
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

          {/* Right Column: Editorial Image Panel */}
          <div className="lg:w-[45%] flex items-center justify-center">
            <div className="relative w-full max-w-md">
              {/* Subtle background frame */}
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[32px] border border-[#E5DFC6]/70 bg-[#F5EFE1]/30" />
              
              {/* Image container */}
              <div className="relative overflow-hidden rounded-[32px] shadow-[0_24px_60px_rgba(10,34,37,0.12)]">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                  alt="Luxury resort trust & safety"
                  className="w-full h-[280px] md:h-[420px] object-cover"
                  loading="lazy"
                />
                
                {/* Gradient overlay with trust message */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4C07A]" />
                    <span className="text-white/90 text-sm font-medium tracking-wide">
                      Protected Journeys
                    </span>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed max-w-xs">
                    All communication and payments stay inside Goldsainte — no phone numbers, no side deals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};