// src/components/home/HomePhotoStrip.tsx
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
            src={images[0].src}
            alt={images[0].alt}
            className="h-full w-full rounded-2xl object-cover shadow-sm"
          />
        </div>
        <div className="h-48 md:h-auto">
          <img
            src={images[1].src}
            alt={images[1].alt}
            className="h-full w-full rounded-2xl object-cover shadow-sm"
          />
        </div>
        <div className="h-48 md:h-auto">
          <img
            src={images[2].src}
            alt={images[2].alt}
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
            src={image.src}
            alt={image.alt}
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
            src={image.src}
            alt={image.alt}
            className="h-64 w-96 flex-shrink-0 rounded-2xl object-cover shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}
