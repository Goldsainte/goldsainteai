import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MediaFrame } from "./MediaFrame";
import PostSidebar from "../feed/PostSidebar";
import { useEffect } from "react";

interface Post {
  id: string;
  media: {
    type: "image" | "video";
    url: string;
  };
  author: {
    username: string;
    avatar: string;
  };
  caption: string;
  likes: number;
  commentCount: number;
}

interface LightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}

export function Lightbox({ open, onOpenChange, post }: LightboxProps) {
  // Keyboard handler: Esc closes lightbox
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[min(935px,96vw)] max-h-[90vh]">
        <div className="grid md:grid-cols-2">
          <div className="bg-black flex items-center justify-center">
            <MediaFrame media={post.media} />
          </div>
          <div className="min-h-[60vh] max-h-[calc(100vh-140px)] overflow-y-auto border-l border-border p-4">
            <PostSidebar post={post} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
