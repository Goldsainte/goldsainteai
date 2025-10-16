import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserPreferences {
  nativeVideoVolume: number;
  musicVolume: number;
  loading: boolean;
  error: Error | null;
}

export const useUserPreferences = (): UserPreferences => {
  const { user } = useAuth();
  const [nativeVideoVolume, setNativeVideoVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(80);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('native_video_volume, music_volume')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setNativeVideoVolume(data.native_video_volume);
          setMusicVolume(data.music_volume);
        } else {
          // Create default preferences if none exist using upsert to handle race conditions
          const { data: upsertData, error: upsertError } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              native_video_volume: 100,
              music_volume: 80
            }, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (upsertError) {
            console.error('Error creating default preferences:', upsertError);
            setError(upsertError as Error);
          } else if (upsertData) {
            setNativeVideoVolume(upsertData.native_video_volume);
            setMusicVolume(upsertData.music_volume);
          }
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('user_preferences_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newData = payload.new as any;
          setNativeVideoVolume(newData.native_video_volume);
          setMusicVolume(newData.music_volume);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    nativeVideoVolume,
    musicVolume,
    loading,
    error
  };
};