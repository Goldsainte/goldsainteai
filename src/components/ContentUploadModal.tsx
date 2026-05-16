import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PartnershipTagging } from "./PartnershipTagging";
import { PhotoEditor } from "./PhotoEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Upload, Loader2, Link2, Image, Star, BarChart3, Wand2, Edit, X, Music, Sparkles, MapPin, Tag, Settings as SettingsIcon, Users, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { extractMentions } from "@/lib/mentionHelpers";
import { extractHashtags } from "@/lib/hashtagHelpers";
import { StoryInteractionCreator } from "./StoryInteractionCreator";
import { GifSelector } from "./GifSelector";
import { BoomerangRecorder } from "./BoomerangRecorder";
import { MusicTrackSelector } from "./MusicTrackSelector";
import { BottomActionBar } from "./BottomActionBar";
import { MusicSelectorDrawer } from "./MusicSelectorDrawer";
import { EffectsDrawer } from "./EffectsDrawer";
import { LocationDrawer } from "./LocationDrawer";
import { TaggingDrawer } from "./TaggingDrawer";
import { SettingsDrawer } from "./SettingsDrawer";

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
  initialTab?: "photo" | "video" | "music" | "embed";
}

const ContentUploadModal = ({ open, onOpenChange, onSuccess, initialTab = "photo" }: ContentUploadModalProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
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
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  
  // Drawer states for Instagram-style bottom bar
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false);
  const [effectsDrawerOpen, setEffectsDrawerOpen] = useState(false);
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);
  const [taggingDrawerOpen, setTaggingDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  
  // Volume controls
  const [nativeVideoVolume, setNativeVideoVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(80);

  // Sync activeTab with initialTab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

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
      let tempImageUrl = '';
      let tempImagePath = '';

      // Upload a temporary image for the AI to analyze
      if (photoPreviewUrls.length > 0 && photoFiles[0]) {
        // For photos, upload the first photo temporarily
        const tempFileName = `${user?.id}/ai-temp/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('travel-videos')
          .upload(tempFileName, photoFiles[0], {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('travel-videos')
          .createSignedUrl(tempFileName, 60);
        
        if (signedUrlError) throw signedUrlError;
        
        tempImageUrl = signedUrlData.signedUrl;
        tempImagePath = tempFileName;
      } else if (videoPreviewUrl && videoRef.current) {
        // For videos, capture a frame and upload it
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
          });

          const tempFileName = `${user?.id}/ai-temp/${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('travel-videos')
            .upload(tempFileName, blob, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('travel-videos')
            .createSignedUrl(tempFileName, 60);
          
          if (signedUrlError) throw signedUrlError;
          
          tempImageUrl = signedUrlData.signedUrl;
          tempImagePath = tempFileName;
        }
      }
      
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: { imageUrl: tempImageUrl }
      });

      // Clean up temporary image
      if (tempImagePath) {
        await supabase.storage.from('travel-videos').remove([tempImagePath]);
      }

      if (error) {
        if (error.message?.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (error.message?.includes('402')) {
          throw new Error('AI credits exhausted. Please add funds to your workspace.');
        }
        throw error;
      }

      if (data?.caption) {
        setCaption(data.caption);
        toast.success('Caption generated!');
      }
    } catch (error: any) {
      console.error('Error generating caption:', error);
      toast.error(error.message || 'Failed to generate caption');
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
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`);
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
          music_volume: selectedMusicTrack ? musicVolume : 80,
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

      // Tag explicitly selected users
      if (taggedUserIds.length > 0 && postData) {
        const userTags = taggedUserIds.map(userId => ({
          post_id: postData.id,
          tagged_user_id: userId,
        }));

        await supabase.from('post_user_tags').insert(userTags);
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
      setTaggedUserIds([]);

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
          native_video_volume: nativeVideoVolume,
          music_volume: selectedMusicTrack ? musicVolume : null,
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

      // Tag explicitly selected users
      if (taggedUserIds.length > 0 && postData) {
        const userTags = taggedUserIds.map(userId => ({
          post_id: postData.id,
          tagged_user_id: userId,
        }));

        await supabase.from('post_user_tags').insert(userTags);
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
      setTaggedUserIds([]);
      setNativeVideoVolume(100);
      setMusicVolume(80);

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
          <DialogTitle>New Post</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full flex flex-col overflow-hidden flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0 relative z-10 bg-background">
            <TabsTrigger value="photo">
              <Image className="w-4 h-4 mr-2" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="video">
              <Upload className="w-4 h-4 mr-2" />
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo" className="flex flex-col flex-1 min-h-0">
            {/* Top Section - Photo Upload & Preview */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 space-y-4 min-h-0">
              {photoPreviewUrls.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    disabled={uploading}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer block">
                    <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Tap to select photos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Up to 20 photos
                    </p>
                  </label>
                </div>
              ) : (
                <>
                  {/* Photo Grid Preview */}
                  <div className="grid grid-cols-2 gap-2">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        loading="lazy"/>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handlePhotoEdit(index)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {index === 0 && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 left-2"
                            onClick={() => {
                              setPhotoFiles([]);
                              setPhotoPreviewUrls([]);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Compact Caption Input with AI Button */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Textarea
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        disabled={uploading}
                        rows={2}
                        className="resize-none"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={generateAutoCaption}
                        disabled={generatingCaption || photoPreviewUrls.length === 0}
                        className="shrink-0"
                      >
                        {generatingCaption ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Selected Items Display */}
                  <div className="flex flex-wrap gap-2">
                    {selectedMusicTrack && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                        <Music className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{selectedMusicTrack.name}</span>
                      </div>
                    )}
                    {location && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{location}</span>
                      </div>
                    )}
                    {storyInteraction && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>{storyInteraction.type}</span>
                      </div>
                    )}
                    {(partnershipBrandId || taggedPackageIds.length > 0) && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                        <Tag className="w-3 h-3" />
                        <span>
                          {partnershipBrandId && taggedPackageIds.length > 0
                            ? `Brand + ${taggedPackageIds.length} packages`
                            : partnershipBrandId
                            ? 'Brand tagged'
                            : `${taggedPackageIds.length} packages`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handlePhotoUpload}
                    disabled={photoFiles.length === 0 || uploading}
                    className="w-full"
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : photoFiles.length === 0 ? (
                      <>
                        <Image className="mr-2 h-4 w-4" />
                        Add photos to post
                      </>
                    ) : (
                      <>
                        <Image className="mr-2 h-4 w-4" />
                        Post Photo
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Bottom Action Bar - Fixed at bottom */}
            <BottomActionBar
              actions={[
                {
                  icon: <Music className="w-5 h-5" />,
                  label: "Music",
                  onClick: () => setMusicDrawerOpen(true),
                  badge: selectedMusicTrack ? 1 : 0,
                  active: !!selectedMusicTrack,
                },
                {
                  icon: <Sparkles className="w-5 h-5" />,
                  label: "Effects",
                  onClick: () => setEffectsDrawerOpen(true),
                  badge: storyInteraction ? 1 : 0,
                  active: !!storyInteraction,
                },
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: "Location",
                  onClick: () => setLocationDrawerOpen(true),
                  badge: location ? 1 : 0,
                  active: !!location,
                },
                {
                  icon: <Tag className="w-5 h-5" />,
                  label: "Tag",
                  onClick: () => setTaggingDrawerOpen(true),
                  badge: (partnershipBrandId ? 1 : 0) + taggedPackageIds.length + taggedUserIds.length,
                  active: !!(partnershipBrandId || taggedPackageIds.length > 0 || taggedUserIds.length > 0),
                },
                {
                  icon: <SettingsIcon className="w-5 h-5" />,
                  label: "Settings",
                  onClick: () => setSettingsDrawerOpen(true),
                  active: visibility === 'close_friends',
                },
              ]}
              showLabels
            />
          </TabsContent>

          <TabsContent value="video" className="flex flex-col flex-1 min-h-0">
            {/* Top Section - Video Upload & Preview */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 space-y-4 min-h-0">
              {!videoFile ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer block">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Tap to upload a video
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max size: 500MB
                    </p>
                  </label>
                </div>
              ) : (
                <>
                  {/* Video Preview */}
                  {videoPreviewUrl && (
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        ref={(el) => {
                          videoRef.current = el;
                          if (el) el.volume = nativeVideoVolume / 100;
                        }}
                        src={videoPreviewUrl}
                        className="w-full max-h-[50vh] object-contain"
                        controls
                        playsInline
                        preload="metadata"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreviewUrl("");
                          setThumbnailFile(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

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
                    
                    {selectedMusicTrack && (
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

                  {/* Compact Caption Input with AI Button */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Textarea
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        disabled={uploading}
                        rows={2}
                        className="resize-none"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={generateAutoCaption}
                        disabled={generatingCaption || !videoPreviewUrl}
                        className="shrink-0"
                      >
                        {generatingCaption ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Selected Items Display */}
                  <div className="flex flex-wrap gap-2">
                    {selectedMusicTrack && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                        <Music className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{selectedMusicTrack.name}</span>
                      </div>
                    )}
                    {location && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{location}</span>
                      </div>
                    )}
                    {storyInteraction && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>{storyInteraction.type}</span>
                      </div>
                    )}
                    {(partnershipBrandId || taggedPackageIds.length > 0) && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                        <Tag className="w-3 h-3" />
                        <span>
                          {partnershipBrandId && taggedPackageIds.length > 0
                            ? `Brand + ${taggedPackageIds.length} packages`
                            : partnershipBrandId
                            ? 'Brand tagged'
                            : `${taggedPackageIds.length} packages`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={!videoFile || uploading}
                    className="w-full"
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : !videoFile ? (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Add video to post
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Post Video
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Bottom Action Bar - Fixed at bottom */}
            <BottomActionBar
              actions={[
                {
                  icon: <Music className="w-5 h-5" />,
                  label: "Music",
                  onClick: () => setMusicDrawerOpen(true),
                  badge: selectedMusicTrack ? 1 : 0,
                  active: !!selectedMusicTrack,
                },
                {
                  icon: <Sparkles className="w-5 h-5" />,
                  label: "Effects",
                  onClick: () => setEffectsDrawerOpen(true),
                  badge: storyInteraction ? 1 : 0,
                  active: !!storyInteraction,
                },
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: "Location",
                  onClick: () => setLocationDrawerOpen(true),
                  badge: location ? 1 : 0,
                  active: !!location,
                },
                {
                  icon: <Tag className="w-5 h-5" />,
                  label: "Tag",
                  onClick: () => setTaggingDrawerOpen(true),
                  badge: (partnershipBrandId ? 1 : 0) + taggedPackageIds.length + taggedUserIds.length,
                  active: !!(partnershipBrandId || taggedPackageIds.length > 0 || taggedUserIds.length > 0),
                },
                {
                  icon: <SettingsIcon className="w-5 h-5" />,
                  label: "Settings",
                  onClick: () => setSettingsDrawerOpen(true),
                  active: visibility === 'close_friends',
                },
              ]}
              showLabels
            />
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
                  <img src={selectedGifUrl} alt="Selected GIF" className="w-full rounded-lg" loading="lazy"/>
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

                <Button disabled className="w-full" title="Music posts launching soon">
                  Music posts launching soon
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

      {/* Instagram-style Drawers */}
      <MusicSelectorDrawer
        open={musicDrawerOpen}
        onOpenChange={setMusicDrawerOpen}
        selectedTrack={selectedMusicTrack}
        onTrackSelect={setSelectedMusicTrack}
      />

      <EffectsDrawer
        open={effectsDrawerOpen}
        onOpenChange={setEffectsDrawerOpen}
        onSave={setStoryInteraction}
      />

      <LocationDrawer
        open={locationDrawerOpen}
        onOpenChange={setLocationDrawerOpen}
        location={location}
        onLocationChange={setLocation}
      />

      <TaggingDrawer
        open={taggingDrawerOpen}
        onOpenChange={setTaggingDrawerOpen}
        partnershipBrandId={partnershipBrandId}
        onPartnershipChange={setPartnershipBrandId}
        taggedPackageIds={taggedPackageIds}
        onPackageTagsChange={setTaggedPackageIds}
        taggedUserIds={taggedUserIds}
        onPeopleTagsChange={setTaggedUserIds}
      />

      <SettingsDrawer
        open={settingsDrawerOpen}
        onOpenChange={setSettingsDrawerOpen}
        visibility={visibility}
        onVisibilityChange={setVisibility}
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
