import { Mic, Sparkles, Shield, Image, ShoppingBag, ArrowRight } from "lucide-react";

interface ConciergeIntroModalProps {
  open: boolean;
  onClose: () => void;
  onEnableFeatures: () => void;
}

const features = [
  {
    icon: ShoppingBag,
    title: "Browse The Collection",
    description: "Explore curated, ready-to-book trips from verified creators and travel agents."
  },
  {
    icon: Mic,
    title: "Speak naturally, anytime",
    description: "Talk to Madison like a real concierge. Say 'Hey Goldsainte' to activate voice mode."
  },
  {
    icon: Sparkles,
    title: "AI-powered matching",
    description: "Get matched with creators and certified agents who fit your destination, budget, and aesthetic."
  },
  {
    icon: Image,
    title: "Turn ideas into storyboards",
    description: "Build visual mood boards from saved inspiration — then share with partners to refine."
  },
  {
    icon: Shield,
    title: "Everything stays on-platform",
    description: "Payments, messaging, and disputes are protected. No phone numbers or off-platform deals."
  }
];

export const ConciergeIntroModal = ({ open, onClose, onEnableFeatures }: ConciergeIntroModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-[#E5DFC6] bg-[#FDF9F0] shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Hero Image */}
          <div className="relative h-48 md:h-auto md:w-2/5">
            <img
              src="https://images.unsplash.com/photo-1502786129293-79981df4e689?auto=format&fit=crop&w=800&q=80"
              alt="Luxury travel destination"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r" />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 md:p-8">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-2 rounded-full bg-[#F5EFE1] px-3 py-1.5">
                <Sparkles className="h-4 w-4 text-[#C7A962]" />
                <span className="text-sm font-medium text-[#0a2225]">Madison</span>
              </div>
              <button
                onClick={onClose}
                className="text-sm text-[#7A7151] transition-colors hover:text-[#0a2225] hover:underline"
              >
                Skip for now
              </button>
            </div>

            {/* Title & Description */}
            <h2 className="mb-3 font-secondary text-2xl font-semibold text-[#0a2225] md:text-3xl">
              Your luxury travel concierge, powered by AI
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#3F3A33]">
              Madison helps you design, discover, and book cinematic travel experiences. Browse The Collection for ready-to-book trips, or tell Madison what you're dreaming of — she'll match you with creators and agents who bring it to life.
            </p>

            {/* Features */}
            <div className="mb-6 space-y-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-xl border border-[#E5DFC6] bg-white/80 p-3"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F5EFE1]">
                    <feature.icon className="h-4 w-4 text-[#C7A962]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[#0a2225]">
                      {feature.title}
                    </h4>
                    <p className="text-xs leading-relaxed text-[#3F3A33]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                onEnableFeatures();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0a2225] px-6 py-3 text-sm font-medium text-[#E5DFC6] transition-all hover:bg-[#0a2225]/90"
            >
              Start with Madison
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
