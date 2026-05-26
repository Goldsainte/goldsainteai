import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import luxuryBeachImage from "@/assets/luxury-beach.webp";
import tokyoCanalImage from "@/assets/tokyo-canal-night.webp";
import dubaiCityImage from "@/assets/dubai-cityscape.webp";

export const ThreeGridGallery = () => {
  const { t } = useTranslation();
  
  const gridItems = [
    {
      id: 1,
      image: luxuryBeachImage,
      title: t('home.gallery.beachEscapes'),
      subtitle: t('home.gallery.beachSubtitle')
    },
    {
      id: 2,
      image: tokyoCanalImage,
      title: t('home.gallery.cityRetreats'),
      subtitle: t('home.gallery.citySubtitle')
    },
    {
      id: 3,
      image: dubaiCityImage,
      title: t('home.gallery.desertOases'),
      subtitle: t('home.gallery.desertSubtitle')
    }
  ];
  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gridItems.map((item) => (
            <Card
              key={item.id}
              className="relative h-80 md:h-96 lg:h-[400px] rounded-lg overflow-hidden cursor-pointer group"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                <h3 className="font-secondary text-xl md:text-2xl text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/80 text-sm">{item.subtitle}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
