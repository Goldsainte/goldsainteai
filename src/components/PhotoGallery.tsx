import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  images: string[];
  hotelName: string;
}

export const PhotoGallery = ({ images, hotelName }: PhotoGalleryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  // If no images, show message
  if (!images || images.length === 0) {
    return (
      <div className="h-[400px] rounded-lg border-2 border-dashed border-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-1">No photos available</p>
          <p className="text-sm">Photos for this property are not available at this time.</p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Grid Preview - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-[300px] md:h-[400px]">
        {/* Main large image - full height on mobile, spans 2 rows on desktop */}
        <div 
          className="col-span-2 row-span-2 relative rounded-lg overflow-hidden cursor-pointer group bg-muted"
          onClick={() => {
            setCurrentIndex(0);
            setIsOpen(true);
          }}
        >
          <img 
            src={images[0]} 
            alt={`${hotelName} - Main`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.replaceChildren();
                const div = document.createElement('div');
                div.className = 'w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted';
                const p = document.createElement('p');
                p.className = 'text-sm mt-2';
                p.textContent = 'Photo loading...';
                div.appendChild(p);
                parent.appendChild(div);
              }
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        
        {/* Thumbnail images - better proportions on mobile */}
        {images.slice(1, 5).map((img, idx) => (
          <div 
            key={idx}
            className="relative rounded-lg overflow-hidden cursor-pointer group bg-muted h-[145px] md:h-auto"
            onClick={() => {
              setCurrentIndex(idx + 1);
              setIsOpen(true);
            }}
          >
            <img 
              src={img} 
              alt={`${hotelName} - ${idx + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                parent.replaceChildren();
                const div = document.createElement('div');
                div.className = 'w-full h-full flex items-center justify-center bg-muted';
                parent.appendChild(div);
                }
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            {idx === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-lg">
                +{images.length - 5} photos
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-2">
        <Button variant="outline" onClick={() => { setShowGrid(true); setIsOpen(true); }}>
          View all {images.length} photos
        </Button>
      </div>

      {/* Full Screen Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black">
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Grid Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-16 z-50 text-white hover:bg-white/20"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3x3 className="h-6 w-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-4 py-2 rounded-lg">
              {currentIndex + 1} / {images.length}
            </div>

            {showGrid ? (
              // Grid View
              <div className="w-full h-full overflow-y-auto p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "aspect-video rounded-lg overflow-hidden cursor-pointer border-4 transition-all",
                        currentIndex === idx ? "border-primary" : "border-transparent"
                      )}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowGrid(false);
                      }}
                    >
                      <img 
                        src={img} 
                        alt={`${hotelName} - ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                      loading="lazy"/>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Single Image View
              <>
                <img 
                  src={images[currentIndex]} 
                  alt={`${hotelName} - ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                loading="lazy"/>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}

                {/* Thumbnail Strip */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
                  {images.slice(0, 30).map((img, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 flex-shrink-0",
                        currentIndex === idx ? "border-primary" : "border-transparent"
                      )}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      loading="lazy"/>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
