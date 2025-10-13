import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Check, ExternalLink, Loader2, Music } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CrosspostingSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [autoShareTikTok, setAutoShareTikTok] = useState(false);
  const [autoShareInstagram, setAutoShareInstagram] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCrosspostingSettings();
    }
  }, [user]);

  const fetchCrosspostingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tiktok_username, instagram_username, auto_share_tiktok, auto_share_instagram')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setTiktokConnected(!!data.tiktok_username);
        setInstagramConnected(!!data.instagram_username);
        setAutoShareTikTok(data.auto_share_tiktok || false);
        setAutoShareInstagram(data.auto_share_instagram || false);
      }
    } catch (error) {
      console.error('Error fetching crossposting settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTikTok = () => {
    // TikTok OAuth flow would go here
    // For now, just show instructions
    toast.info('Opening TikTok authorization...', {
      description: 'You will be redirected to TikTok to authorize access'
    });
    
    // Open TikTok OAuth (this would be replaced with actual OAuth flow)
    window.open('https://www.tiktok.com/auth/authorize/', '_blank');
  };

  const handleConnectInstagram = () => {
    const instagramAppId = import.meta.env.VITE_INSTAGRAM_APP_ID;
    const redirectUri = `${window.location.origin}/instagram-callback`;
    
    if (!instagramAppId || instagramAppId === 'YOUR_INSTAGRAM_APP_ID_HERE') {
      toast.error('Instagram App ID not configured', {
        description: 'Please configure your Instagram App ID in the backend settings'
      });
      return;
    }
    
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;
    
    toast.info('Opening Instagram authorization...', {
      description: 'You will be redirected to Instagram to authorize access'
    });
    
    window.location.href = authUrl;
  };

  const handleDisconnectTikTok = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          tiktok_username: null,
          auto_share_tiktok: false 
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      setTiktokConnected(false);
      setAutoShareTikTok(false);
      toast.success('TikTok disconnected');
    } catch (error) {
      console.error('Error disconnecting TikTok:', error);
      toast.error('Failed to disconnect TikTok');
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          instagram_username: null,
          auto_share_instagram: false 
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      setInstagramConnected(false);
      setAutoShareInstagram(false);
      toast.success('Instagram disconnected');
    } catch (error) {
      console.error('Error disconnecting Instagram:', error);
      toast.error('Failed to disconnect Instagram');
    }
  };

  const handleToggleAutoShareTikTok = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ auto_share_tiktok: checked })
        .eq('id', user?.id);

      if (error) throw error;
      
      setAutoShareTikTok(checked);
      toast.success(checked ? 'Auto-share to TikTok enabled' : 'Auto-share to TikTok disabled');
    } catch (error) {
      console.error('Error updating auto-share:', error);
      toast.error('Failed to update setting');
    }
  };

  const handleToggleAutoShareInstagram = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ auto_share_instagram: checked })
        .eq('id', user?.id);

      if (error) throw error;
      
      setAutoShareInstagram(checked);
      toast.success(checked ? 'Auto-share to Instagram enabled' : 'Auto-share to Instagram disabled');
    } catch (error) {
      console.error('Error updating auto-share:', error);
      toast.error('Failed to update setting');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in required</h2>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/travel-settings-2')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Crossposting</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          Connect your social media accounts to easily share your content across platforms
        </p>

        {/* TikTok */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-black p-2">
                <Music className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  TikTok
                  {tiktokConnected && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  {tiktokConnected ? 'Connected' : 'Not connected'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tiktokConnected ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-tiktok">Auto-share to TikTok</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically share new videos to TikTok
                    </p>
                  </div>
                  <Switch
                    id="auto-tiktok"
                    checked={autoShareTikTok}
                    onCheckedChange={handleToggleAutoShareTikTok}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDisconnectTikTok}
                  className="w-full"
                >
                  Disconnect TikTok
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleConnectTikTok}
                className="w-full gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Connect TikTok Account
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Share your videos directly to TikTok with one tap
            </p>
          </CardContent>
        </Card>

        {/* Instagram */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737] p-2">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  Instagram
                  {instagramConnected && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  {instagramConnected ? 'Connected' : 'Not connected'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {instagramConnected ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-instagram">Auto-share to Instagram</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically share new videos to Instagram
                    </p>
                  </div>
                  <Switch
                    id="auto-instagram"
                    checked={autoShareInstagram}
                    onCheckedChange={handleToggleAutoShareInstagram}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDisconnectInstagram}
                  className="w-full"
                >
                  Disconnect Instagram
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleConnectInstagram}
                className="w-full gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Connect Instagram Account
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Share your photos and videos to Instagram Stories and Reels
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CrosspostingSettings;
