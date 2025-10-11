import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Heart, MessageCircle, Send } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PhotoCarouselModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  startIndex?: number;
  postId?: string;
  caption?: string | null;
  likeCount?: number;
  username?: string;
  userAvatar?: string;
}

const PhotoCarouselModal = ({ 
  open, 
  onOpenChange, 
  images, 
  startIndex = 0,
  postId,
  caption,
  likeCount: initialLikeCount = 0,
  username,
  userAvatar
}: PhotoCarouselModalProps) => {
  const { user } = useAuth();
  const [index, setIndex] = useState(startIndex);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  useEffect(() => {
    if (open) {
      setIndex(startIndex);
      if (postId && user) {
        checkIfLiked();
      }
    }
  }, [open, startIndex, postId, user]);

  const checkIfLiked = async () => {
    if (!postId || !user) return;
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();
    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!postId || !user) return;
    
    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const handleShare = () => {
    if (navigator.share && postId) {
      navigator.share({
        title: caption || 'Check out this post',
        url: `${window.location.origin}/travel-feed?postId=${postId}`
      }).catch(() => {});
    } else {
      toast.success("Link copied to clipboard");
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 bg-black border-none [&>button]:hidden">
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 text-white hover:bg-white/10 rounded-full"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Photo counter */}
          {images.length > 1 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {index + 1} / {images.length}
            </div>
          )}

          {/* Carousel */}
          <div className="flex-1 relative">
            <Carousel
              className="w-full h-full"
              opts={{ loop: false, align: "center" }}
              setApi={(api) => {
                if (api) {
                  api.on("select", () => setIndex(api.selectedScrollSnap()));
                  api.scrollTo(startIndex, true);
                }
              }}
            >
              <CarouselContent className="h-full">
                {images.map((src, i) => (
                  <CarouselItem key={i} className="basis-full h-full flex items-center justify-center p-0">
                    <img 
                      src={src} 
                      alt={`Photo ${i + 1}`} 
                      className="w-full h-full object-contain"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white border-none bg-black/20 hover:bg-black/40 disabled:opacity-30" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white border-none bg-black/20 hover:bg-black/40 disabled:opacity-30" />
                </>
              )}
            </Carousel>
          </div>

          {/* Instagram-style interaction bar */}
          <div className="bg-black border-t border-white/10">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLike}
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <Heart 
                    className={`h-7 w-7 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <MessageCircle className="h-7 w-7 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="hover:bg-transparent p-0 h-auto"
                >
                  <Send className="h-7 w-7 text-white" />
                </Button>
              </div>
            </div>

            {/* Likes and caption */}
            {(likeCount > 0 || caption) && (
              <div className="px-4 pb-4">
                {likeCount > 0 && (
                  <p className="text-white font-semibold text-sm mb-2">
                    {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
                  </p>
                )}
                {caption && (
                  <p className="text-white text-sm">
                    {username && <span className="font-semibold mr-2">{username}</span>}
                    {caption}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCarouselModal;
