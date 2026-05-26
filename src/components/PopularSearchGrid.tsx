import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useExpediaModal } from "@/contexts/ExpediaModalContext";
import beachCabinImage from "@/assets/beach-cabin.webp";
import beachPicnicImage from "@/assets/beach-picnic.webp";
import redFlowersImage from "@/assets/red-flowers-loungers.webp";
import redKayakImage from "@/assets/red-kayak-beach.webp";
import seoulAutumnImage from "@/assets/seoul-autumn.webp";
import tokyoStreetImage from "@/assets/tokyo-street.webp";
import dubaiCityImage from "@/assets/dubai-cityscape.webp";
import luxuryBeachImage from "@/assets/luxury-beach.webp";

export const PopularSearchGrid = () => {
  const { t } = useTranslation();
  const { openModal: openExpediaModal } = useExpediaModal();
  
  const popularSearches = [
    {
      id: 1,
      image: beachCabinImage,
      title: t('home.popularSearches.beachResorts'),
    },
    {
      id: 2,
      image: tokyoStreetImage,
      title: t('home.popularSearches.cityBreaks'),
    },
    {
      id: 3,
      image: redFlowersImage,
      title: t('home.popularSearches.romanticGetaways'),
    },
    {
      id: 4,
      image: dubaiCityImage,
      title: t('home.popularSearches.luxuryHotels'),
    },
    {
      id: 5,
      image: seoulAutumnImage,
      title: t('home.popularSearches.culturalExperiences'),
    },
    {
      id: 6,
      image: beachPicnicImage,
      title: t('home.popularSearches.wellnessRetreats'),
    },
    {
      id: 7,
      image: redKayakImage,
      title: t('home.popularSearches.adventureTravel'),
    },
    {
      id: 8,
      image: luxuryBeachImage,
      title: t('home.popularSearches.islandEscapes'),
    },
  ];

  return (
    <section className="py-12 sm:py-14 md:py-16 lg:py-20 bg-luxury-ivory">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <h2 className="font-secondary text-2xl sm:text-3xl md:text-4xl mb-6 sm:mb-8 font-light">
          {t('home.popularSearches.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {popularSearches.map((search) => (
            <Card
              key={search.id}
              onClick={() => openExpediaModal({ destination: search.title })}
              className="relative h-[240px] sm:h-[260px] md:h-[280px] rounded-lg overflow-hidden cursor-pointer group active:scale-95 transition-transform"
            >
              <img
                src={search.image}
                alt={search.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                <h3 className="text-white text-lg sm:text-xl font-medium">
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
