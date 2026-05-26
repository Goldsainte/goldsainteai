import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import tropicalHideaway from "@/assets/luxury-tropical-hideaway.webp";
import resortPool from "@/assets/luxury-resort-pool.webp";
import veniceSunset from "@/assets/luxury-venice-sunset.webp";
import infinityPool from "@/assets/luxury-infinity-pool.webp";
import arcticSpa from "@/assets/luxury-arctic-spa.webp";

interface LuxuryExperience {
  title: string;
  subtitle: string;
  imageUrl: string;
  destination: string;
  category: string;
}

const luxuryExperiences: LuxuryExperience[] = [
  {
    title: "Tropical Hideaways",
    subtitle: "Intimate jungle retreats",
    imageUrl: tropicalHideaway,
    destination: "Bali",
    category: "eco-luxury"
  },
  {
    title: "Iconic Resorts",
    subtitle: "Timeless beach elegance",
    imageUrl: resortPool,
    destination: "Maldives",
    category: "beach-resort"
  },
  {
    title: "European Romance",
    subtitle: "Historic city escapes",
    imageUrl: veniceSunset,
    destination: "Venice",
    category: "city-break"
  },
  {
    title: "Wellness Retreats",
    subtitle: "Rejuvenating sanctuaries",
    imageUrl: infinityPool,
    destination: "Thailand",
    category: "wellness"
  },
  {
    title: "Arctic Adventures",
    subtitle: "Dramatic northern landscapes",
    imageUrl: arcticSpa,
    destination: "Iceland",
    category: "adventure"
  }
];

export const LuxuryExperiencesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-luxury-ivory py-8 sm:py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-20 h-1 bg-luxury-gold mx-auto mb-6" />
          <h2 className="font-secondary text-xl sm:text-2xl md:text-3xl lg:text-4xl text-luxury-emerald mb-4">
            Curated Luxury Experiences
          </h2>
          <p className="text-luxury-emerald/70 text-sm sm:text-base max-w-2xl mx-auto">
            Discover exceptional destinations handpicked for the discerning traveller
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {luxuryExperiences.map((experience, index) => (
            <Card
              key={experience.title}
              className={`relative overflow-hidden cursor-pointer group border-luxury-gold/20 ${
                index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''
              } ${index === 0 ? 'lg:col-span-2' : ''}`}
              onClick={() => navigate('/storyboards')}
            >
              <div className="relative h-56 sm:h-64 md:h-72 lg:h-80">
                <img
                  src={experience.imageUrl}
                  alt={experience.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-emerald/80 via-luxury-emerald/20 to-transparent" />
                
                <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 md:p-6">
                  <div className="w-16 h-1 bg-luxury-gold mb-4 transform origin-left group-hover:w-24 transition-all duration-500" />
                  <h3 className="font-secondary text-lg sm:text-xl md:text-2xl text-white mb-2">
                    {experience.title}
                  </h3>
                  <p className="text-white/90 text-sm sm:text-base mb-4">
                    {experience.subtitle}
                  </p>
                  <div className="flex items-center gap-2 text-luxury-gold">
                    <span className="text-xs sm:text-sm tracking-wider uppercase">Explore Collection</span>
                    <span className="transform group-hover:translate-x-2 transition-transform duration-300">â†’</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
