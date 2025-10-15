import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, X, Star, Image as ImageIcon, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Utility to sanitize file names for safe storage keys
function sanitizeFileName(originalName: string): string {
  const parts = originalName.split('.')
  const extension = parts.length > 1 ? parts.pop()!.toLowerCase() : ''
  let baseName = parts.join('.')

  // Normalize Unicode and strip diacritics
  baseName = baseName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')

  // Replace all whitespace variants (including narrow no-break space U+202F) with dashes
  baseName = baseName.replace(/[\s\u00A0\u202F\u2009\u200A]+/g, '-')

  // Remove all characters except alphanumeric, dots, dashes, underscores
  baseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '')

  // Remove leading/trailing dashes and collapse multiple dashes
  baseName = baseName.replace(/^-+|-+$/g, '').replace(/-+/g, '-')

  // Truncate base name to 80 characters max
  baseName = baseName.substring(0, 80)

  // If baseName is empty after sanitization, use a fallback
  if (!baseName) baseName = 'file'

  return extension ? `${baseName}.${extension}` : baseName
}

interface PromotionalMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption: string;
  isCover: boolean;
  displayOrder: number;
}

interface VendorPromotionalMediaUploadProps {
  media: PromotionalMedia[];
  onMediaChange: (media: PromotionalMedia[]) => void;
}

export default function VendorPromotionalMediaUpload({
  media,
  onMediaChange
}: VendorPromotionalMediaUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 50);
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} - JPG/PNG only`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 10485760) {
        toast({
          title: "File too large",
          description: `${file.name} - Max 10MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(`Uploading ${validFiles.length} photos...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadPromises = validFiles.map(async (file, index) => {
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName}`;
        const filePath = `${user.id}/photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vendor-promotions')
          .upload(filePath, file);

        if (uploadError) {
          if (uploadError.message?.includes('Invalid key')) {
            throw new Error(`File name contains unsupported characters. Please rename "${file.name}" and try again.`);
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('vendor-promotions')
          .getPublicUrl(filePath);

        return {
          id: `temp-${Date.now()}-${index}`,
          type: 'photo' as const,
          url: publicUrl,
          caption: '',
          isCover: media.length === 0 && index === 0, // First photo is cover if no existing media
          displayOrder: media.length + index
        };
      });

      const results = await Promise.all(uploadPromises);
      onMediaChange([...media, ...results]);

      toast({
        title: "Upload successful",
        description: `${results.length} photo${results.length > 1 ? 's' : ''} uploaded`,
      });

      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 104857600) { // 100MB
      toast({
        title: "File too large",
        description: "Video must be less than 100MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress("Uploading video...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${sanitizedName}`;
      const filePath = `${user.id}/videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-promotions')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message?.includes('Invalid key')) {
          throw new Error(`File name contains unsupported characters. Please rename "${file.name}" and try again.`);
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-promotions')
        .getPublicUrl(filePath);

      const newVideo: PromotionalMedia = {
        id: `temp-${Date.now()}`,
        type: 'video',
        url: publicUrl,
        caption: '',
        isCover: false,
        displayOrder: media.length
      };

      onMediaChange([...media, newVideo]);

      toast({
        title: "Video uploaded",
        description: "Video uploaded successfully",
      });

      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...media];
    updated[index].caption = caption;
    onMediaChange(updated);
  };

  const setCoverPhoto = (index: number) => {
    const updated = media.map((item, i) => ({
      ...item,
      isCover: i === index && item.type === 'photo'
    }));
    onMediaChange(updated);
  };

  const removeMedia = (index: number) => {
    const updated = media.filter((_, i) => i !== index);
    onMediaChange(updated);
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    const updated = [...media];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updated.forEach((item, i) => item.displayOrder = i);
    onMediaChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Upload Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Up to 50 photos • JPG/PNG • Max 10MB each
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5" />
              Upload Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Up to 3 videos • MP4 • Max 100MB each
            </p>
          </CardContent>
        </Card>
      </div>

      {uploading && (
        <Card className="p-4 bg-primary/5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium">{uploadProgress}</p>
          </div>
        </Card>
      )}

      {/* Media Gallery */}
      {media.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg">Your Fleet Showcase ({media.length})</Label>
            <Badge variant="secondary">
              {media.filter(m => m.type === 'photo').length} photos, {media.filter(m => m.type === 'video').length} videos
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item, index) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {item.type === 'photo' ? (
                    <img 
                      src={item.url} 
                      alt={item.caption || 'Fleet photo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={item.url} 
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                  
                  {item.isCover && (
                    <Badge className="absolute top-2 left-2 bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Cover Photo
                    </Badge>
                  )}

                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <CardContent className="p-3 space-y-2">
                  <Textarea
                    placeholder="Add caption, hashtags..."
                    value={item.caption}
                    onChange={(e) => updateCaption(index, e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  
                  <div className="flex gap-2">
                    {item.type === 'photo' && !item.isCover && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCoverPhoto(index)}
                        className="flex-1"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Set as Cover
                      </Button>
                    )}
                    
                    <div className="flex gap-1">
                      {index > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveMedia(index, index - 1)}
                        >
                          ←
                        </Button>
                      )}
                      {index < media.length - 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveMedia(index, index + 1)}
                        >
                          →
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {media.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No media uploaded yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload photos and videos of your fleet to showcase your services
          </p>
        </Card>
      )}
    </div>
  );
}