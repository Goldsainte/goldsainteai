import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Camera, Upload as UploadIcon } from "lucide-react";
import { toast } from "sonner";

interface VideoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentCaption: string | null;
  currentLocation: string | null;
  currentThumbnailUrl: string | null;
  videoUrl: string | null;
  onSuccess: () => void;
}

const VideoEditModal = ({
  open,
  onOpenChange,
  postId,
  currentCaption,
  currentLocation,
  currentThumbnailUrl,
  videoUrl,
  onSuccess,
}: VideoEditModalProps) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState(currentCaption || "");
  const [location, setLocation] = useState(currentLocation || "");
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(currentThumbnailUrl);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setThumbnailFile(file);
      setPreviewThumbnail(URL.createObjectURL(file));
    }
  };

  const captureVideoFrame = () => {
    const video = videoRef.current;
    if (!video) {
      toast.error('Video not loaded');
      return;
    }

    const performCapture = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        toast.error('Please play the video briefly, then try again.');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Unable to capture frame.');
        return;
      }

      try {
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Unable to capture frame. Ensure the video is fully loaded.');
            return;
          }
          const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          setThumbnailFile(file);
          setPreviewThumbnail(URL.createObjectURL(file));
          toast.success('Frame captured as cover photo');
        }, 'image/jpeg', 0.9);
      } catch (e) {
        console.error('Capture error', e);
        toast.error('Capture blocked by browser (CORS). Try reloading, then capture again.');
      }
    };

    if (video.readyState < 2) {
      const onLoad = () => {
        video.removeEventListener('loadeddata', onLoad);
        performCapture();
      };
      video.addEventListener('loadeddata', onLoad, { once: true } as any);
      video.load();
    } else {
      performCapture();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      let thumbnailUrl = currentThumbnailUrl;

      // Upload new thumbnail if one was selected/captured
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split('.').pop();
        const thumbFileName = `${user.id}/thumbnails/${Date.now()}.${thumbExt}`;
        
        const { error: thumbUploadError } = await supabase.storage
          .from('travel-videos')
          .upload(thumbFileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (thumbUploadError) throw thumbUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('travel-videos')
          .getPublicUrl(thumbFileName);
        thumbnailUrl = publicUrl;
      }

      const { error } = await supabase
        .from("travel_posts")
        .update({
          caption: caption || null,
          location: location || null,
          thumbnail_url: thumbnailUrl,
        })
        .eq("id", postId);

      if (error) throw error;

      toast.success("Post updated successfully!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast.error(error.message || "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {videoUrl && (
            <div className="space-y-2">
              <Label>Cover Photo</Label>
              <div className="space-y-2">
                {previewThumbnail && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={previewThumbnail} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full rounded-lg bg-black"
                  controls
                  preload="metadata"
                  crossOrigin="anonymous"
                  playsInline
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={captureVideoFrame}
                    disabled={saving}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Frame
                  </Button>
                  <div className="relative flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      disabled={saving}
                      className="hidden"
                      id="edit-thumbnail-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('edit-thumbnail-upload')?.click()}
                      disabled={saving}
                      className="w-full"
                    >
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Tell us about your adventure..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={saving}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Where was this taken?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={saving}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoEditModal;
