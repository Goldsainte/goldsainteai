import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreamActivity } from '@/contexts/StreamActivityContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Video, Image as ImageIcon } from 'lucide-react';

export default function CreateContent() {
  const navigate = useNavigate();
  const { userFeed, isReady } = useStreamActivity();
  const { user } = useAuth();
  const [contentType, setContentType] = useState<'journey' | 'sainte'>('journey');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [music, setMusic] = useState('');
  const [location, setLocation] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (isReady && !user) {
      toast.error('Please sign in to create content');
      navigate('/auth');
    }
  }, [isReady, user, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaUrl(''); // Clear URL if file is selected
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('user-content')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-content')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handlePost = async () => {
    if (!user) {
      toast.error('Please sign in to create content');
      navigate('/auth');
      return;
    }

    if (!userFeed) {
      toast.error('Feed service is initializing. Please wait a moment and try again.');
      return;
    }

    if (!mediaUrl && !mediaFile) {
      toast.error('Please provide a media file or URL');
      return;
    }

    try {
      setPosting(true);
      
      let finalMediaUrl = mediaUrl;
      
      // Upload file if selected
      if (mediaFile) {
        setUploading(true);
        toast.info('Uploading file...');
        try {
          finalMediaUrl = await uploadFile(mediaFile);
          console.log('[CreateContent] File uploaded:', finalMediaUrl);
          setUploading(false);
        } catch (uploadError) {
          console.error('[CreateContent] Upload error:', uploadError);
          toast.error('Failed to upload file. Please try again.');
          return;
        }
      }
      
      // Create the activity
      const activity: any = {
        actor: `User:${user.id}`,
        verb: contentType,
        object: `${contentType}:${Date.now()}`,
        foreign_id: `${contentType}:${user.id}:${Date.now()}`,
        time: new Date().toISOString(),
        ...(contentType === 'journey'
          ? { video_url: finalMediaUrl }
          : { images: [finalMediaUrl], image_url: finalMediaUrl }),
        ...(caption && { caption }),
        ...(music && contentType === 'journey' && { music }),
        ...(location && contentType === 'sainte' && { location }),
      };

      console.log('[CreateContent] Posting activity:', activity);
      
      const response = await userFeed.addActivity(activity);
      console.log('[CreateContent] Posted successfully:', response);

      // Also persist to profile posts so content appears on TravelProfile grids
      try {
        if (contentType === 'journey') {
          const { error: insertError } = await supabase
            .from('travel_posts')
            .insert([
              {
                user_id: user.id,
                media_type: 'video',
                video_url: finalMediaUrl,
                thumbnail_url: null,
                caption: caption || null,
                location: null,
                status: 'active',
              },
            ]);
          if (insertError) throw insertError;
        } else {
          const { error: insertError } = await supabase
            .from('travel_posts')
            .insert([
              {
                user_id: user.id,
                media_type: 'photo',
                image_urls: [finalMediaUrl],
                thumbnail_url: finalMediaUrl,
                caption: caption || null,
                location: location || null,
                status: 'active',
              },
            ]);
          if (insertError) throw insertError;
        }
        console.log('[CreateContent] Synced to travel_posts for profile view');
      } catch (dbErr) {
        console.warn('[CreateContent] travel_posts insert failed (feed is still posted):', dbErr);
      }
      
      toast.success(`${contentType === 'journey' ? 'Journey' : 'Sainte'} posted successfully!`);
      navigate('/');
    } catch (error) {
      console.error('[CreateContent] Error posting:', error);
      toast.error('Failed to post content. Please try again.');
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  if (!isReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!userFeed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Initializing feed service...</p>
        <p className="text-sm text-muted-foreground">If this persists, try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Create Content</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs value={contentType} onValueChange={(v) => setContentType(v as 'journey' | 'sainte')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="journey">
              <Video className="h-4 w-4 mr-2" />
              Journey (Video)
            </TabsTrigger>
            <TabsTrigger value="sainte">
              <ImageIcon className="h-4 w-4 mr-2" />
              Sainte (Photo)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journey">
            <Card>
              <CardHeader>
                <CardTitle>Create a Journey</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video-file">Upload Video</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="video-file"
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={handleFileSelect}
                      disabled={!!mediaUrl || uploading}
                      className="cursor-pointer"
                    />
                  </div>
                  {mediaFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {mediaFile.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input
                    id="video-url"
                    placeholder="https://example.com/video.mp4"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    disabled={!!mediaFile || uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Or enter a direct link to your video
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Share your journey..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="music">Music (optional)</Label>
                  <Input
                    id="music"
                    placeholder="Song name - Artist"
                    value={music}
                    onChange={(e) => setMusic(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handlePost}
                  disabled={posting || uploading}
                >
                  {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Post Journey'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sainte">
            <Card>
              <CardHeader>
                <CardTitle>Create a Sainte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-file">Upload Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image-file"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      disabled={!!mediaUrl || uploading}
                      className="cursor-pointer"
                    />
                  </div>
                  {mediaFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {mediaFile.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.jpg"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    disabled={!!mediaFile || uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Or enter a direct link to your image
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Share your experience..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    placeholder="Paris, France"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handlePost}
                  disabled={posting || uploading}
                >
                  {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Post Sainte'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sample URLs for testing */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Sample URLs for Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <p className="font-semibold">Video:</p>
              <code className="block bg-muted p-2 rounded text-xs break-all">
                https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
              </code>
            </div>
            <div>
              <p className="font-semibold">Image:</p>
              <code className="block bg-muted p-2 rounded text-xs break-all">
                https://images.unsplash.com/photo-1469854523086-cc02fe5d8800
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
