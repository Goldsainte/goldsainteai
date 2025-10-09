import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

interface VideoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const VideoUploadModal = ({ open, onOpenChange, onSuccess }: VideoUploadModalProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [originalCreator, setOriginalCreator] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const videoRef = useState<HTMLVideoElement | null>(null)[0];

  const detectPlatform = (url: string): string | null => {
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error('Video must be under 500MB');
        return;
      }
      
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      
      setVideoFile(file);
      // Create preview URL for video scrubbing
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setThumbnailFile(file);
    }
  };

  const captureVideoFrame = () => {
    if (!videoRef) {
      toast.error('Video not loaded');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.videoWidth;
    canvas.height = videoRef.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          setThumbnailFile(file);
          toast.success('Frame captured as thumbnail');
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleEmbedPost = async () => {
    if (!embedUrl || !caption || !user) {
      toast.error('Please provide an embed URL and caption');
      return;
    }

    const platform = detectPlatform(embedUrl);
    if (!platform) {
      toast.error('Please provide a valid TikTok, Instagram, or YouTube URL');
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.from("travel_posts").insert([{
        user_id: user.id,
        caption,
        location: location || null,
        embed_url: embedUrl,
        embed_platform: platform,
        original_creator: originalCreator || null,
        status: 'active',
      }]);

      if (error) throw error;

      toast.success('Embed posted successfully!');

      setCaption("");
      setLocation("");
      setEmbedUrl("");
      setOriginalCreator("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error posting embed:", error);
      toast.error(error.message || 'Failed to post embed');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !user) {
      toast.error('Please select a video');
      return;
    }

    setUploading(true);

    try {
      // Upload video
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('travel-videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('travel-videos')
        .getPublicUrl(fileName);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split('.').pop();
        const thumbFileName = `${user.id}/thumbnails/${Date.now()}.${thumbExt}`;
        
        const { error: thumbUploadError } = await supabase.storage
          .from('travel-videos')
          .upload(thumbFileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (!thumbUploadError) {
          const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
            .from('travel-videos')
            .getPublicUrl(thumbFileName);
          thumbnailUrl = thumbPublicUrl;
        }
      }

      const { error: insertError } = await supabase
        .from('travel_posts')
        .insert([{
          user_id: user.id,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          caption: caption || null,
          location: location || null,
          status: 'active',
        }]);

      if (insertError) throw insertError;

      toast.success('Video uploaded successfully!');
      
      setVideoFile(null);
      setCaption("");
      setLocation("");
      setThumbnailFile(null);
      setVideoPreviewUrl("");
      
      onSuccess();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Content</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="embed">
              <Link2 className="w-4 h-4 mr-2" />
              Embed Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Video</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="flex-1"
                />
                {videoFile && (
                  <span className="text-xs text-muted-foreground">
                    {(videoFile.size / (1024 * 1024)).toFixed(1)}MB
                  </span>
                )}
              </div>
            </div>

            {videoPreviewUrl && (
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="space-y-2">
                  <video
                    ref={(el) => {
                      if (el) {
                        // @ts-ignore
                        videoRef = el;
                      }
                    }}
                    src={videoPreviewUrl}
                    className="w-full rounded-lg bg-black"
                    controls
                    preload="metadata"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={captureVideoFrame}
                      disabled={uploading}
                      className="flex-1"
                    >
                      Capture Current Frame
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        disabled={uploading}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        Upload Cover Image
                      </Button>
                    </div>
                  </div>
                  {thumbnailFile && (
                    <p className="text-xs text-muted-foreground">
                      Cover image selected: {thumbnailFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea
                placeholder="Tell us about your adventure..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={uploading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="Where was this taken?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={uploading}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!videoFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="embedUrl">Video URL</Label>
              <Input
                id="embedUrl"
                type="url"
                placeholder="https://tiktok.com/@user/video/..."
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Supports TikTok, Instagram, and YouTube links
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator">Original Creator (optional)</Label>
              <Input
                id="creator"
                placeholder="@username"
                value={originalCreator}
                onChange={(e) => setOriginalCreator(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="embedCaption">Caption</Label>
              <Textarea
                id="embedCaption"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={uploading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="embedLocation">Location (optional)</Label>
              <Input
                id="embedLocation"
                placeholder="Paris, France"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={uploading}
              />
            </div>

            <Button onClick={handleEmbedPost} disabled={uploading} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Share Embed
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VideoUploadModal;
