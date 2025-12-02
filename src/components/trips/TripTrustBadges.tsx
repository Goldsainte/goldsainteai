import { Users, CreditCard, Globe, MessageCircle, Star } from "lucide-react";

interface TripTrustBadgesProps {
  totalTravelers?: number;
}

export function TripTrustBadges({ totalTravelers = 30000 }: TripTrustBadgesProps) {
  const badges = [
    {
      icon: CreditCard,
      title: "Flexible Payment Options",
      description: "Reserve your spot with just 25% down, pay in full, or apply for a payment plan at booking.",
    },
    {
      icon: Globe,
      title: "Trusted Local Experiences",
      description: "We partner with handpicked Trip Operators worldwide to give you authentic, unforgettable adventures.",
    },
    {
      icon: Star,
      title: "Thousands of Reviews",
      description: "Don't just take our word for it, read what real Travelers are saying.",
    },
    {
      icon: MessageCircle,
      title: "Here When You Need Us",
      description: "Questions? We're just a tap away. Get support via Chat or our Help Center.",
    },
  ];

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-[#0a2225] p-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-[#C7B892]" />
          <span className="text-sm font-medium text-[#C7B892]">
            Join {totalTravelers.toLocaleString()}+ Travelers Who've Booked With Goldsainte
          </span>
        </div>
        <p className="mt-2 font-secondary text-xl font-semibold text-white">
          Explore the world with confidence. You're in great company!
        </p>
      </div>

      {/* Badges Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {badges.map((badge) => (
          <div
            key={badge.title}
            className="rounded-xl bg-white/5 p-4 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#C7B892]/20">
              <badge.icon className="h-5 w-5 text-[#C7B892]" />
            </div>
            <h4 className="mt-3 text-[14px] font-semibold text-white">
              {badge.title}
            </h4>
            <p className="mt-1 text-[12px] leading-relaxed text-white/70">
              {badge.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
