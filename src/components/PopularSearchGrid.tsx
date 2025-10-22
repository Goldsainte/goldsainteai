import { Card } from "@/components/ui/card";
import beachCabinImage from "@/assets/beach-cabin.jpg";
import beachPicnicImage from "@/assets/beach-picnic.jpg";
import redFlowersImage from "@/assets/red-flowers-loungers.jpg";
import redKayakImage from "@/assets/red-kayak-beach.jpg";
import seoulAutumnImage from "@/assets/seoul-autumn.jpg";
import tokyoStreetImage from "@/assets/tokyo-street.jpg";
import dubaiCityImage from "@/assets/dubai-cityscape.jpg";
import luxuryBeachImage from "@/assets/luxury-beach.jpg";

const popularSearches = [
  {
    id: 1,
    image: beachCabinImage,
    title: "Beach Resorts",
  },
  {
    id: 2,
    image: tokyoStreetImage,
    title: "City Breaks",
  },
  {
    id: 3,
    image: redFlowersImage,
    title: "Romantic Getaways",
  },
  {
    id: 4,
    image: dubaiCityImage,
    title: "Luxury Hotels",
  },
  {
    id: 5,
    image: seoulAutumnImage,
    title: "Cultural Experiences",
  },
  {
    id: 6,
    image: beachPicnicImage,
    title: "Wellness Retreats",
  },
  {
    id: 7,
    image: redKayakImage,
    title: "Adventure Travel",
  },
  {
    id: 8,
    image: luxuryBeachImage,
    title: "Island Escapes",
  },
];

export const PopularSearchGrid = () => {
  return (
    <section className="py-16 md:py-20 bg-luxury-ivory">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-secondary text-3xl md:text-4xl mb-8 font-light">
          Popular searches
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularSearches.map((search) => (
            <Card
              key={search.id}
              className="relative h-[280px] rounded-lg overflow-hidden cursor-pointer group"
            >
              <img
                src={search.image}
                alt={search.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white text-xl font-medium">
                  {search.title}
                </h3>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
