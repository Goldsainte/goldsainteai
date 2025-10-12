import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Instagram, Link as LinkIcon } from "lucide-react";

export const InstagramAPIDemo = () => {
  const [username, setUsername] = useState("");
  const [endpoint, setEndpoint] = useState("user");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsername, setConnectedUsername] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    checkConnection();
    
    // Handle OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('instagram_tokens')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setIsConnected(true);
        setConnectedUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectInstagram = () => {
    const appId = '1102295698246612'; // Replace with your Instagram App ID
    const redirectUri = encodeURIComponent(`${window.location.origin}/instagram-api`);
    const scope = 'instagram_business_basic,instagram_business_content_publish';
    
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('instagram-oauth-callback', {
        body: { code }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setIsConnected(true);
      setConnectedUsername(data.username);
      toast.success('Instagram account connected successfully!');
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/instagram-api');
    } catch (error: any) {
      console.error('OAuth error:', error);
      toast.error(error.message || 'Failed to connect Instagram account');
    }
  };

  const disconnectInstagram = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('instagram_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setConnectedUsername('');
      toast.success('Instagram account disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  const postToInstagram = async () => {
    if (!imageUrl) {
      toast.error("Please enter an image URL");
      return;
    }

    setPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-post', {
        body: { imageUrl, caption }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(data.message || 'Posted to Instagram!');
      setImageUrl('');
      setCaption('');
    } catch (error: any) {
      console.error('Post error:', error);
      toast.error(error.message || 'Failed to post to Instagram');
    } finally {
      setPosting(false);
    }
  };

  const fetchInstagramData = async () => {
    if (!username && endpoint !== 'media') {
      toast.error("Please enter an Instagram username");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('instagram-api', {
        body: { endpoint, username, mediaId: username }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data.data);
      toast.success("Data fetched successfully!");
    } catch (error: any) {
      console.error('Instagram API error:', error);
      toast.error(error.message || "Failed to fetch Instagram data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-6 w-6" />
            Instagram API Integration
          </CardTitle>
          <CardDescription>
            Connect your Instagram account to post content and fetch public data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fetch" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fetch">Fetch Data</TabsTrigger>
              <TabsTrigger value="post">Post Content</TabsTrigger>
            </TabsList>

            <TabsContent value="fetch" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Select value={endpoint} onValueChange={setEndpoint}>
                  <SelectTrigger id="endpoint">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User Profile</SelectItem>
                    <SelectItem value="posts">User Posts</SelectItem>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="following">Following</SelectItem>
                    <SelectItem value="media">Single Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  {endpoint === 'media' ? 'Post URL/ID' : 'Instagram Username'}
                </Label>
                <Input
                  id="username"
                  placeholder={endpoint === 'media' ? 'Post URL or ID' : '@username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <Button onClick={fetchInstagramData} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Data'
                )}
              </Button>
            </TabsContent>

            <TabsContent value="post" className="space-y-4">
              {!isConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Instagram Business account to start posting content
                  </p>
                  <Button onClick={connectInstagram} className="w-full">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Connect Instagram Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-5 w-5" />
                      <span className="font-medium">@{connectedUsername}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={disconnectInstagram}>
                      Disconnect
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption (optional)</Label>
                    <Textarea
                      id="caption"
                      placeholder="Write your caption here..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button onClick={postToInstagram} disabled={posting} className="w-full">
                    {posting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post to Instagram'
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
