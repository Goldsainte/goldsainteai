import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Collection {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
}

const collections: Collection[] = [
  {
    title: "Island Escapes",
    description: "Pristine beaches and turquoise waters",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    category: "beach"
  },
  {
    title: "Cultural Journeys",
    description: "Immerse in art, history, and traditions",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    category: "cultural"
  },
  {
    title: "Alpine Luxury",
    description: "Mountain retreats and winter wonderlands",
    imageUrl: "https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=800&q=80",
    category: "mountain"
  },
  {
    title: "Urban Elegance",
    description: "Cosmopolitan cities and modern marvels",
    imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
    category: "urban"
  },
  {
    title: "Desert Oases",
    description: "Luxury amid golden dunes",
    imageUrl: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80",
    category: "desert"
  }
];

export const CuratedCollections = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-luxury-ivory">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="font-secondary text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-wide">
            Curated Collections
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked experiences for the discerning traveler
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {collections.map((collection) => (
            <Card
              key={collection.category}
              className="relative h-64 md:h-72 rounded-2xl overflow-hidden cursor-pointer group border-0 shadow-lg hover:shadow-2xl transition-all duration-500"
              onClick={() => navigate('/storyboards')}
            >
              <img
                src={collection.imageUrl}
                alt={collection.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 transform group-hover:translate-y-[-4px] transition-transform duration-300">
                <h3 className="text-white text-2xl font-secondary font-bold mb-2 drop-shadow-lg">
                  {collection.title}
                </h3>
                <p className="text-white/90 text-sm drop-shadow-md">
                  {collection.description}
                </p>
              </div>
              <div className="absolute top-4 right-4 w-1 h-12 bg-luxury-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
