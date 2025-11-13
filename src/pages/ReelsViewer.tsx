import { ChevronUp, ChevronDown, Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { useState } from "react";

export default function ReelsViewer() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => setCurrentIndex((i) => i + 1);
  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-[min(468px,90vw)]">
        <div className="h-[calc(100vh-80px)] bg-black rounded-xl overflow-hidden relative">
          {/* Video placeholder */}
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white">Reel {currentIndex + 1}</p>
          </div>

          {/* Up/Down navigation */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <ChevronUp className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Actions on right */}
          <div className="absolute right-3 bottom-24 flex flex-col gap-4 items-center">
            <button className="flex flex-col items-center gap-1">
              <Heart className="w-7 h-7 text-white" />
              <span className="text-xs text-white">1.2K</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <MessageCircle className="w-7 h-7 text-white" />
              <span className="text-xs text-white">45</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Share2 className="w-7 h-7 text-white" />
            </button>
            <button className="flex flex-col items-center gap-1">
              <MoreVertical className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-4 left-4 right-20 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-white/20" />
              <span className="font-semibold text-sm">username</span>
              <button className="px-3 py-1 border border-white rounded-lg text-xs font-semibold">
                Follow
              </button>
            </div>
            <p className="text-sm">Reel caption goes here...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
