import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface PhotoCarouselModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  startIndex?: number;
}

const PhotoCarouselModal = ({ open, onOpenChange, images, startIndex = 0 }: PhotoCarouselModalProps) => {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-full h-screen p-0 bg-black border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-4 py-2 rounded-lg">
            {index + 1} / {images.length}
          </div>

          <Carousel
            className="w-full h-full"
            opts={{ loop: true, align: "start" }}
            setApi={(api) => {
              api?.on("select", () => setIndex(api.selectedScrollSnap()));
              api?.scrollTo(startIndex, true);
            }}
          >
            <CarouselContent className="h-full">
              {images.map((src, i) => (
                <CarouselItem key={i} className="basis-full h-full flex items-center justify-center">
                  <img src={src} alt={`Photo ${i + 1}`} className="max-w-full max-h-full object-contain" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white border-white/30 bg-white/10 hover:bg-white/20" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white border-white/30 bg-white/10 hover:bg-white/20" />
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCarouselModal;
