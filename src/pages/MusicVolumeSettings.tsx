import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, Volume2, Music2 } from "lucide-react";
import { toast } from "sonner";

const MusicVolumeSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nativeVideoVolume, setNativeVideoVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(80);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchPreferences();
  }, [user, navigate]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('native_video_volume, music_volume')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setNativeVideoVolume(data.native_video_volume);
        setMusicVolume(data.music_volume);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load volume preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          native_video_volume: nativeVideoVolume,
          music_volume: musicVolume,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Volume preferences saved');
      navigate(-1);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save volume preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Music & Audio</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Native Video Audio */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <h2 className="font-semibold">Native Video Audio</h2>
              <p className="text-sm text-muted-foreground">
                Control volume for videos with original sound
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Volume</span>
              <span className="text-sm font-medium">{nativeVideoVolume}%</span>
            </div>
            <Slider
              value={[nativeVideoVolume]}
              onValueChange={(value) => setNativeVideoVolume(value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Background Music */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Music2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <h2 className="font-semibold">Background Music</h2>
              <p className="text-sm text-muted-foreground">
                Control volume for added music tracks
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Volume</span>
              <span className="text-sm font-medium">{musicVolume}%</span>
            </div>
            <Slider
              value={[musicVolume]}
              onValueChange={(value) => setMusicVolume(value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default MusicVolumeSettings;