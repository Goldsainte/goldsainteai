import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PartnershipTagging } from "./PartnershipTagging";
import { PackageTagSelector } from "./PackageTagSelector";
import { PhotoEditor } from "./PhotoEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, Link2, Image, Star, BarChart3, Wand2, Edit } from "lucide-react";
import { toast } from "sonner";
import { extractMentions } from "@/lib/mentionHelpers";
import { extractHashtags } from "@/lib/hashtagHelpers";
import { StoryInteractionCreator } from "./StoryInteractionCreator";
import { GifSelector } from "./GifSelector";
import { BoomerangRecorder } from "./BoomerangRecorder";
import { MusicTrackSelector } from "./MusicTrackSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ContentUploadModal = ({ open, onOpenChange, onSuccess }: ContentUploadModalProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [originalCreator, setOriginalCreator] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'close_friends'>('public');
  const [showInteractionCreator, setShowInteractionCreator] = useState(false);
  const [storyInteraction, setStoryInteraction] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [partnershipBrandId, setPartnershipBrandId] = useState<string | null>(null);
  const [taggedPackageIds, setTaggedPackageIds] = useState<string[]>([]);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [selectedGifUrl, setSelectedGifUrl] = useState<string | null>(null);
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<any>(null);
  const [boomerangVideo, setBoomerangVideo] = useState<Blob | null>(null);

  const detectPlatform = (url: string): string | null => {
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return null;
  };

  const generateAutoCaption = async () => {
    if (photoPreviewUrls.length === 0 && !videoPreviewUrl) {
      toast.error('Please upload media first');
      return;
    }

    setGeneratingCaption(true);
    try {
      const imageUrl = photoPreviewUrls[0] || videoPreviewUrl;
      
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: { imageUrl }
      });

      if (error) throw error;

      if (data?.caption) {
        setCaption(data.caption);
        toast.success('Caption generated!');
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      toast.error('Failed to generate caption');
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 20 photos
    if (files.length > 20) {
      toast.error('Maximum 20 photos allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setPhotoFiles(validFiles);
    
    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(urls);
  };

  const handlePhotoEdit = (index: number) => {
    setEditingPhotoIndex(index);
  };

  const handleEditSave = async (editedImageUrl: string) => {
    if (editingPhotoIndex === null) return;

    try {
      // Convert blob URL to File
      const response = await fetch(editedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Update the photo file and preview
      const newPhotoFiles = [...photoFiles];
      newPhotoFiles[editingPhotoIndex] = file;
      setPhotoFiles(newPhotoFiles);

      const newPreviewUrls = [...photoPreviewUrls];
      newPreviewUrls[editingPhotoIndex] = editedImageUrl;
      setPhotoPreviewUrls(newPreviewUrls);

      setEditingPhotoIndex(null);
      toast.success('Photo updated!');
    } catch (error) {
      console.error('Error saving edited photo:', error);
      toast.error('Failed to save edits');
    }
  };

  const handlePhotoUpload = async () => {
    if (photoFiles.length === 0 || !user) {
      toast.error('Please select at least one photo');
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];
      const maxRetries = 3;

      // Upload all photos with retry logic
      for (const photoFile of photoFiles) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/photos/${Date.now()}-${Math.random()}.${fileExt}`;
        
        let uploadSuccess = false;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const { error: uploadError } = await supabase.storage
              .from('travel-videos')
              .upload(fileName, photoFile, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('travel-videos')
              .getPublicUrl(fileName);
            
            uploadedUrls.push(publicUrl);
            uploadSuccess = true;
            break;
          } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        
        if (!uploadSuccess) {
          throw lastError || new Error('Upload failed after retries');
        }
      }

      // Extract mentions and hashtags
      const mentions = extractMentions(caption);
      const hashtags = extractHashtags(caption);

      // Create post
      const { data: postData, error: insertError } = await supabase
        .from('travel_posts')
        .insert([{
          user_id: user.id,
          image_urls: uploadedUrls,
          media_type: 'photo',
          thumbnail_url: uploadedUrls[0], // First photo as thumbnail
          caption: caption || null,
          location: location || null,
          status: 'active',
          ...(selectedMusicTrack && {
            music_track_id: selectedMusicTrack.id,
            music_track_name: selectedMusicTrack.name,
            music_track_artist: selectedMusicTrack.artist,
            music_preview_url: selectedMusicTrack.previewUrl,
            music_album_art: selectedMusicTrack.albumArt,
            music_service: 'apple_music',
          }),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Tag mentioned users
      if (mentions.length > 0 && postData) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('username', mentions);

        if (profiles && profiles.length > 0) {
          const tags = profiles.map(profile => ({
            post_id: postData.id,
            tagged_user_id: profile.id,
          }));

          await supabase.from('post_user_tags').insert(tags);
        }
      }

      // Process hashtags (existing function will handle this)
      if (hashtags.length > 0 && postData) {
        await supabase.rpc('extract_and_store_hashtags', {
          p_post_id: postData.id,
          p_caption: caption,
        });
      }

      toast.success(`${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''} uploaded successfully!`);
      
      setPhotoFiles([]);
      setPhotoPreviewUrls([]);
      setCaption("");
      setLocation("");
      setPartnershipBrandId(null);
      setTaggedPackageIds([]);

      // Create paid partnership if brand is tagged
      if (partnershipBrandId && postData) {
        const { error: partnershipError } = await supabase
          .from("paid_partnerships")
          .insert({
            post_id: postData.id,
            creator_id: user.id,
            brand_id: partnershipBrandId,
            status: "pending",
          });

        if (partnershipError) {
          console.error("Error creating partnership:", partnershipError);
          toast.error("Photos uploaded but partnership request failed");
        }
      }

      // Tag CoCurated packages
      if (taggedPackageIds.length > 0 && postData) {
        const packageTags = taggedPackageIds.map(packageId => ({
          post_id: postData.id,
          package_id: packageId
        }));

        const { error: packageTagError } = await supabase
          .from('package_post_tags')
          .insert(packageTags);

        if (packageTagError) {
          console.error("Error tagging packages:", packageTagError);
        }
      }
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast.error(error.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
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
    if (!videoRef.current) {
      toast.error('Video not loaded');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
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
      const { data: postData, error } = await supabase.from("travel_posts").insert([{
        user_id: user.id,
        caption,
        location: location || null,
        embed_url: embedUrl,
        embed_platform: platform,
        original_creator: originalCreator || null,
        status: 'active',
        ...(selectedMusicTrack && {
          music_track_id: selectedMusicTrack.id,
          music_track_name: selectedMusicTrack.name,
          music_track_artist: selectedMusicTrack.artist,
          music_preview_url: selectedMusicTrack.previewUrl,
          music_album_art: selectedMusicTrack.albumArt,
          music_service: 'apple_music',
        }),
      }]).select().single();

      if (error) throw error;

      // Check if auto-share to Instagram is enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('auto_share_instagram, instagram_username')
        .eq('id', user.id)
        .single();

      if (profile?.auto_share_instagram && profile?.instagram_username && postData?.image_urls?.[0]) {
        // Auto-share to Instagram
        await supabase.functions.invoke('instagram-post', {
          body: { 
            imageUrl: postData.image_urls[0],
            caption: caption || ''
          }
        }).catch(err => {
          console.error('Instagram auto-share failed:', err);
          toast.error('Posted, but Instagram share failed');
        });
      }

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
      const maxRetries = 3;
      let uploadSuccess = false;
      let publicUrl = '';
      
      // Upload video with retry logic
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('travel-videos')
            .upload(fileName, videoFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl: url } } = supabase.storage
            .from('travel-videos')
            .getPublicUrl(fileName);
          
          publicUrl = url;
          uploadSuccess = true;
          break;
        } catch (err) {
          if (attempt < maxRetries) {
            toast.info(`Upload attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          } else {
            throw err;
          }
        }
      }
      
      if (!uploadSuccess) {
        throw new Error('Video upload failed after retries');
      }

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

      // Extract mentions and hashtags
      const mentions = extractMentions(caption);
      const hashtags = extractHashtags(caption);

      // Create post
      const { data: postData, error: insertError } = await supabase
        .from('travel_posts')
        .insert([{
          user_id: user.id,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          media_type: 'video',
          caption: caption || null,
          location: location || null,
          status: 'active',
          ...(selectedMusicTrack && {
            music_track_id: selectedMusicTrack.id,
            music_track_name: selectedMusicTrack.name,
            music_track_artist: selectedMusicTrack.artist,
            music_preview_url: selectedMusicTrack.previewUrl,
            music_album_art: selectedMusicTrack.albumArt,
            music_service: 'apple_music',
          }),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Tag mentioned users
      if (mentions.length > 0 && postData) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('username', mentions);

        if (profiles && profiles.length > 0) {
          const tags = profiles.map(profile => ({
            post_id: postData.id,
            tagged_user_id: profile.id,
          }));

          await supabase.from('post_user_tags').insert(tags);
        }
      }

      // Process hashtags
      if (hashtags.length > 0 && postData) {
        await supabase.rpc('extract_and_store_hashtags', {
          p_post_id: postData.id,
          p_caption: caption,
        });
      }

      toast.success('Video uploaded successfully!');
      
      setVideoFile(null);
      setCaption("");
      setLocation("");
      setThumbnailFile(null);
      setVideoPreviewUrl("");
      setPartnershipBrandId(null);
      setTaggedPackageIds([]);

      // Create paid partnership if brand is tagged
      if (partnershipBrandId && postData) {
        const { error: partnershipError } = await supabase
          .from("paid_partnerships")
          .insert({
            post_id: postData.id,
            creator_id: user.id,
            brand_id: partnershipBrandId,
            status: "pending",
          });

        if (partnershipError) {
          console.error("Error creating partnership:", partnershipError);
          toast.error("Video uploaded but partnership request failed");
        }
      }

      // Tag CoCurated packages
      if (taggedPackageIds.length > 0 && postData) {
        const packageTags = taggedPackageIds.map(packageId => ({
          post_id: postData.id,
          package_id: packageId
        }));

        const { error: packageTagError } = await supabase
          .from('package_post_tags')
          .insert(packageTags);

        if (packageTagError) {
          console.error("Error tagging packages:", packageTagError);
        }
      }
      
      onOpenChange(false);
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Share Content</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="photo" className="w-full flex flex-col overflow-hidden flex-1">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 flex-shrink-0">
            <TabsTrigger value="photo">
              <Image className="w-4 h-4 mr-2" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="video">
              <Upload className="w-4 h-4 mr-2" />
              Video
            </TabsTrigger>
            <TabsTrigger value="music" className="col-span-2 md:col-span-1">
              🎵 Music
            </TabsTrigger>
            <TabsTrigger value="embed" className="hidden md:flex">
              <Link2 className="w-4 h-4 mr-2" />
              Embed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo" className="space-y-4 mt-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label>Photos (up to 20)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                disabled={uploading}
              />
            </div>

            {photoPreviewUrls.length > 0 && (
              <div className="space-y-2">
                <Label>Photo Previews</Label>
                <div className="grid grid-cols-2 gap-2">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handlePhotoEdit(index)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Caption</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateAutoCaption}
                  disabled={generatingCaption || (photoPreviewUrls.length === 0 && !videoPreviewUrl)}
                >
                  {generatingCaption ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 mr-1" />
                      AI Caption
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                placeholder="Tell us about your adventure... Use #hashtags and @mentions"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={uploading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use #hashtags to help others discover your content and @username to tag people
              </p>
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

            <PartnershipTagging
              onPartnershipChange={setPartnershipBrandId}
              currentBrandId={partnershipBrandId}
            />

            <PackageTagSelector
              selectedPackageIds={taggedPackageIds}
              onPackageTagged={(packageId) => {
                if (!taggedPackageIds.includes(packageId)) {
                  setTaggedPackageIds([...taggedPackageIds, packageId]);
                }
              }}
            />

            <Button
              onClick={handlePhotoUpload}
              disabled={photoFiles.length === 0 || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Upload Photos
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="video" className="space-y-4 mt-4 overflow-y-auto flex-1">
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
                    ref={videoRef}
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
                placeholder="Tell us about your adventure... Use #hashtags and @mentions"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={uploading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use #hashtags and @username to tag people
              </p>
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

            <PartnershipTagging
              onPartnershipChange={setPartnershipBrandId}
              currentBrandId={partnershipBrandId}
            />

            <PackageTagSelector
              selectedPackageIds={taggedPackageIds}
              onPackageTagged={(packageId) => {
                if (!taggedPackageIds.includes(packageId)) {
                  setTaggedPackageIds([...taggedPackageIds, packageId]);
                }
              }}
            />

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="close_friends">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-500 fill-green-500" />
                      Close Friends
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visibility === 'close_friends' && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs text-green-700 dark:text-green-300">
                  <Star className="h-3 w-3 inline mr-1" />
                  Only your close friends will see this
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowInteractionCreator(true)}
                className="w-full"
                type="button"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {storyInteraction ? 'Change' : 'Add'} Story Interaction
              </Button>
              {storyInteraction && (
                <p className="text-xs text-muted-foreground">
                  Added: {storyInteraction.type}
                </p>
              )}
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

          <TabsContent value="gif" className="space-y-4 mt-4 px-6 overflow-y-auto flex-1">
            <GifSelector onSelectGif={(gifUrl) => {
              setSelectedGifUrl(gifUrl);
              toast.success("GIF selected! Add caption and location to post.");
            }} />
            
            {selectedGifUrl && (
              <>
                <div className="space-y-2">
                  <Label>Selected GIF Preview</Label>
                  <img src={selectedGifUrl} alt="Selected GIF" className="w-full rounded-lg" />
                </div>

                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Where was this?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (!selectedGifUrl || !user) return;
                    setUploading(true);
                    try {
                      const { data: postData, error } = await supabase.from("travel_posts").insert([{
                        user_id: user.id,
                        image_urls: [selectedGifUrl],
                        media_type: 'gif',
                        caption: caption || null,
                        location: location || null,
                        status: 'active',
                      }]).select().single();
                      if (error) throw error;

                      // Check if auto-share to Instagram is enabled
                      const { data: profile } = await supabase
                        .from('profiles')
                        .select('auto_share_instagram, instagram_username')
                        .eq('id', user.id)
                        .single();

                      if (profile?.auto_share_instagram && profile?.instagram_username) {
                        await supabase.functions.invoke('instagram-post', {
                          body: { 
                            imageUrl: selectedGifUrl,
                            caption: caption || ''
                          }
                        }).catch(err => {
                          console.error('Instagram auto-share failed:', err);
                          toast.error('Posted, but Instagram share failed');
                        });
                      }

                      toast.success('GIF posted!');
                      setSelectedGifUrl(null);
                      setCaption("");
                      setLocation("");
                      onOpenChange(false);
                      onSuccess();
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to post GIF');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={!selectedGifUrl || uploading}
                  className="w-full"
                >
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting...</> : 'Post GIF'}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="boomerang" className="space-y-4 mt-4 px-6 overflow-y-auto flex-1">
            <BoomerangRecorder onRecordingComplete={(blob) => {
              setBoomerangVideo(blob);
              toast.success("Boomerang recorded! Add caption to post.");
            }} />

            {boomerangVideo && (
              <>
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Where was this?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (!boomerangVideo || !user) return;
                    setUploading(true);
                    try {
                      const fileName = `${user.id}/boomerang/${Date.now()}.webm`;
                      const { error: uploadError } = await supabase.storage
                        .from('travel-videos')
                        .upload(fileName, boomerangVideo);
                      if (uploadError) throw uploadError;

                      const { data: { publicUrl } } = supabase.storage
                        .from('travel-videos')
                        .getPublicUrl(fileName);

                      const { data: postData, error } = await supabase.from("travel_posts").insert([{
                        user_id: user.id,
                        video_url: publicUrl,
                        media_type: 'boomerang',
                        caption: caption || null,
                        location: location || null,
                        status: 'active',
                      }]).select().single();
                      if (error) throw error;

                      // Note: Instagram API doesn't support video posts via auto-share for Basic Display API
                      // This would require Instagram Content Publishing API with additional permissions
                      
                      toast.success('Boomerang posted!');
                      setBoomerangVideo(null);
                      setCaption("");
                      setLocation("");
                      onOpenChange(false);
                      onSuccess();
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to post Boomerang');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={!boomerangVideo || uploading}
                  className="w-full"
                >
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting...</> : 'Post Boomerang'}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="music" className="space-y-4 mt-4 px-6 overflow-y-auto flex-1">
            <MusicTrackSelector 
              selectedTrack={selectedMusicTrack}
              onTrackSelect={(track) => {
                setSelectedMusicTrack(track);
                if (track) {
                  toast.success(`Selected: ${track.name} by ${track.artist}`);
                }
              }} 
            />

            {selectedMusicTrack && (
              <>
                <div className="space-y-2">
                  <Label>Selected Track</Label>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">{selectedMusicTrack.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMusicTrack.artist}</p>
                  </div>
                </div>

                {photoPreviewUrls.length === 0 && (
                  <div className="space-y-2">
                    <Label>Add Photo or Video</Label>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type.startsWith('image/')) {
                            setPhotoFiles([file]);
                            setPhotoPreviewUrls([URL.createObjectURL(file)]);
                          } else if (file.type.startsWith('video/')) {
                            setVideoFile(file);
                            setVideoPreviewUrl(URL.createObjectURL(file));
                          }
                        }
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={async () => {
                    toast.info("Music story posting coming soon!");
                  }}
                  disabled={uploading}
                  className="w-full"
                >
                  Post with Music
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="embed" className="space-y-4 mt-4 px-6 overflow-y-auto flex-1">
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
      
      <StoryInteractionCreator
        open={showInteractionCreator}
        onOpenChange={setShowInteractionCreator}
        onSave={(interaction) => setStoryInteraction(interaction)}
      />

      {editingPhotoIndex !== null && photoPreviewUrls[editingPhotoIndex] && (
        <PhotoEditor
          imageUrl={photoPreviewUrls[editingPhotoIndex]}
          onSave={handleEditSave}
          onCancel={() => setEditingPhotoIndex(null)}
        />
      )}
    </Dialog>
  );
};

export default ContentUploadModal;
