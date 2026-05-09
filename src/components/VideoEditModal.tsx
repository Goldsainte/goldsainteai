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
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, Camera, Upload as UploadIcon, Volume2, Music } from "lucide-react";
import { toast } from "sonner";
import { MusicTrackSelector } from "./MusicTrackSelector";

interface VideoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentCaption: string | null;
  currentLocation: string | null;
  currentThumbnailUrl: string | null;
  videoUrl: string | null;
  currentMusicTrack?: {
    id: string;
    name: string;
    artist: string;
    albumArt: string | null;
    previewUrl: string | null;
  } | null;
  currentNativeVolume?: number;
  currentMusicVolume?: number;
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
  currentMusicTrack,
  currentNativeVolume,
  currentMusicVolume,
  onSuccess,
}: VideoEditModalProps) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState(currentCaption || "");
  const [location, setLocation] = useState(currentLocation || "");
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(currentThumbnailUrl);
  const [selectedTrack, setSelectedTrack] = useState<any>(currentMusicTrack || null);
  const [nativeVideoVolume, setNativeVideoVolume] = useState(currentNativeVolume || 100);
  const [musicVolume, setMusicVolume] = useState(currentMusicVolume || 80);
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
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      if (!videoWidth || !videoHeight) {
        toast.error('Please play the video briefly, then try again.');
        return;
      }

      // Calculate the 9:16 crop that matches what's visible in the preview
      const targetAspect = 9 / 16;
      const videoAspect = videoWidth / videoHeight;
      
      let cropWidth, cropHeight, cropX, cropY;
      
      if (videoAspect > targetAspect) {
        // Video is wider than 9:16, crop sides
        cropHeight = videoHeight;
        cropWidth = videoHeight * targetAspect;
        cropX = (videoWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        // Video is taller than 9:16, crop top/bottom
        cropWidth = videoWidth;
        cropHeight = videoWidth / targetAspect;
        cropX = 0;
        cropY = (videoHeight - cropHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Unable to capture frame.');
        return;
      }

      try {
        // Draw only the cropped portion that matches what's visible
        ctx.drawImage(
          video,
          cropX, cropY, cropWidth, cropHeight,  // Source rectangle
          0, 0, cropWidth, cropHeight           // Destination rectangle
        );
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Unable to capture frame. Ensure the video is fully loaded.');
            return;
          }
          const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          setThumbnailFile(file);
          setPreviewThumbnail(URL.createObjectURL(file));
          toast.success('Frame captured! Click "Save Changes" below to apply it.');
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
          music_track_id: selectedTrack?.id || null,
        music_track_name: selectedTrack?.name || null,
        music_track_artist: selectedTrack?.artist || null,
        music_preview_url: selectedTrack?.previewUrl || null,
        music_album_art: selectedTrack?.albumArt || null,
        music_service: 'apple_music',
        native_video_volume: nativeVideoVolume,
        music_volume: selectedTrack ? musicVolume : null,
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
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Sainte</DialogTitle>
        </DialogHeader>

        {/* Sticky Video Preview with Capture Controls */}
        {videoUrl && (
          <div className="space-y-2 border-b pb-4 flex-shrink-0">
            <Label>Video Preview & Capture</Label>
            <div className="relative w-full aspect-[9/16] max-h-[300px] rounded-lg overflow-hidden bg-black">
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el) el.volume = nativeVideoVolume / 100;
              }}
              src={videoUrl}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              preload="metadata"
              crossOrigin="anonymous"
              playsInline
            />
          </div>
          
          {/* Volume Controls */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Original Video Audio
                </label>
                <span className="text-sm text-muted-foreground">{nativeVideoVolume}%</span>
              </div>
              <Slider
                value={[nativeVideoVolume]}
                onValueChange={(value) => {
                  setNativeVideoVolume(value[0]);
                  if (videoRef.current) videoRef.current.volume = value[0] / 100;
                }}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            
            {selectedTrack && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Background Music
                  </label>
                  <span className="text-sm text-muted-foreground">{musicVolume}%</span>
                </div>
                <Slider
                  value={[musicVolume]}
                  onValueChange={(value) => setMusicVolume(value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
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
        )}

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-2 min-h-0">
          {previewThumbnail && (
            <div className="space-y-2">
              <Label>Current Cover Photo</Label>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <img 
                  src={previewThumbnail} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                loading="lazy"/>
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

          <MusicTrackSelector
            selectedTrack={selectedTrack}
            onTrackSelect={setSelectedTrack}
          />
        </div>

        {/* Sticky Save Button */}
        <div className="border-t pt-4 mt-4 bg-background flex-shrink-0">
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
