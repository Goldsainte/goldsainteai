import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BrandGalleryProps {
  images: string[];
  brandName: string;
  className?: string;
}

export function BrandGallery({ images, brandName, className }: BrandGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
          Gallery
        </h2>
        <span className="text-xs text-[#8C8470]">
          {images.length} {images.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      {/* Horizontal scrollable gallery */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {images.map((url, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className="shrink-0 overflow-hidden rounded-xl border border-[#E5DFC6] bg-[#F5F0E0] transition-all hover:border-[#C7B892] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#C7B892] focus:ring-offset-2"
          >
            <img
              src={url}
              alt={`${brandName} gallery ${idx + 1}`}
              className="h-32 w-44 md:h-40 md:w-56 object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image */}
            {selectedIndex !== null && (
              <div className="flex items-center justify-center min-h-[60vh] p-8">
                <img
                  src={images[selectedIndex]}
                  alt={`${brandName} gallery ${selectedIndex + 1}`}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                />
              </div>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
              {selectedIndex !== null && `${selectedIndex + 1} of ${images.length}`}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
