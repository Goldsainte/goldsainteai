import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import tropicalHideaway from "@/assets/luxury-tropical-hideaway.webp";
import resortPool from "@/assets/luxury-resort-pool.webp";
import veniceSunset from "@/assets/luxury-venice-sunset.webp";
import infinityPool from "@/assets/luxury-infinity-pool.webp";
import arcticSpa from "@/assets/luxury-arctic-spa.webp";

interface Collection {
  title: string;
  count: number;
  imageUrl: string;
  destination: string;
}

const collections: Collection[] = [
  {
    title: "Tropical Paradises",
    count: 127,
    imageUrl: infinityPool,
    destination: "Maldives"
  },
  {
    title: "Iconic Beach Resorts",
    count: 89,
    imageUrl: resortPool,
    destination: "Caribbean"
  },
  {
    title: "European Romance",
    count: 156,
    imageUrl: veniceSunset,
    destination: "Venice"
  },
  {
    title: "Wellness Escapes",
    count: 73,
    imageUrl: tropicalHideaway,
    destination: "Bali"
  },
  {
    title: "Arctic Adventures",
    count: 42,
    imageUrl: arcticSpa,
    destination: "Iceland"
  }
];

export const CuratedDestinationCollections = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-20 h-1 bg-luxury-gold mx-auto mb-6" />
          <h2 className="font-secondary text-3xl sm:text-4xl md:text-5xl text-luxury-emerald mb-4">
            Destination Collections
          </h2>
          <p className="text-luxury-emerald/70 text-lg max-w-2xl mx-auto">
            Expertly curated selections for every style of travel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {collections.map((collection) => (
            <Card
              key={collection.title}
              className="relative h-72 md:h-80 lg:h-96 overflow-hidden cursor-pointer group border-luxury-gold/20 hover:shadow-xl transition-all duration-500"
              onClick={() => navigate('/storyboards')}
            >
              <img
                src={collection.imageUrl}
                alt={collection.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-emerald/90 via-luxury-emerald/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                <div className="w-12 h-1 bg-luxury-gold mb-4 transform origin-left group-hover:w-20 transition-all duration-500" />
                <h3 className="font-secondary text-xl md:text-2xl text-white mb-2 drop-shadow-lg">
                  {collection.title}
                </h3>
                <p className="text-white/90 text-sm">
                  {collection.count.toLocaleString()} Exclusive Properties
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
