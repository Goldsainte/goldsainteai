// src/components/home/HomePhotoStrip.tsx
import { getPublicImageUrl } from "@/lib/images";

interface HomePhotoStripImage {
  src: string;
  alt: string;
}

interface HomePhotoStripProps {
  images: HomePhotoStripImage[];
  layout?: "mosaic" | "carousel" | "vertical";
  className?: string;
}

export function HomePhotoStrip({ 
  images, 
  layout = "mosaic",
  className = "" 
}: HomePhotoStripProps) {
  if (layout === "mosaic" && images.length >= 3) {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        <div className="col-span-2 md:col-span-1 md:row-span-2">
          <img
            src={getPublicImageUrl(images[0].src)}
            alt={images[0].alt}
            width={1200}
            height={1600}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="h-full w-full rounded-2xl object-cover shadow-sm"
          />
        </div>
        <div className="h-48 md:h-auto">
          <img
            src={getPublicImageUrl(images[1].src)}
            alt={images[1].alt}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 768px) 25vw, 50vw"
            className="h-full w-full rounded-2xl object-cover shadow-sm"
          />
        </div>
        <div className="h-48 md:h-auto">
          <img
            src={getPublicImageUrl(images[2].src)}
            alt={images[2].alt}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 768px) 25vw, 50vw"
            className="h-full w-full rounded-2xl object-cover shadow-sm"
          />
        </div>
      </div>
    );
  }

  if (layout === "vertical") {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {images.map((image, index) => (
          <img
            key={index}
            src={getPublicImageUrl(image.src)}
            alt={image.alt}
            width={1200}
            height={900}
            loading="lazy"
            decoding="async"
            sizes="100vw"
            className="w-full rounded-2xl object-cover shadow-sm aspect-[4/3]"
          />
        ))}
      </div>
    );
  }

  // Carousel layout
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="flex gap-4 animate-[scroll_20s_linear_infinite]">
        {images.map((image, index) => (
          <img
            key={index}
            src={getPublicImageUrl(image.src)}
            alt={image.alt}
            width={960}
            height={640}
            loading="lazy"
            decoding="async"
            sizes="384px"
            className="h-64 w-96 flex-shrink-0 rounded-2xl object-cover shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}
