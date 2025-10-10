import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CloseFriend {
  id: string;
  user_id: string;
  friend_user_id: string;
  created_at: string;
}

export const useCloseFriends = () => {
  const { user } = useAuth();
  const [closeFriends, setCloseFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCloseFriends();
    }
  }, [user]);

  const fetchCloseFriends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('close_friends')
        .select('friend_user_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setCloseFriends(data?.map(cf => cf.friend_user_id) || []);
    } catch (error) {
      console.error('Error fetching close friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCloseFriend = async (friendUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('close_friends')
        .insert({
          user_id: user.id,
          friend_user_id: friendUserId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in close friends');
          return;
        }
        throw error;
      }

      setCloseFriends(prev => [...prev, friendUserId]);
      toast.success('Added to close friends');
    } catch (error) {
      console.error('Error adding close friend:', error);
      toast.error('Failed to add to close friends');
    }
  };

  const removeCloseFriend = async (friendUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('close_friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_user_id', friendUserId);

      if (error) throw error;

      setCloseFriends(prev => prev.filter(id => id !== friendUserId));
      toast.success('Removed from close friends');
    } catch (error) {
      console.error('Error removing close friend:', error);
      toast.error('Failed to remove from close friends');
    }
  };

  const isCloseFriend = (friendUserId: string) => closeFriends.includes(friendUserId);

  const toggleCloseFriend = async (friendUserId: string) => {
    if (isCloseFriend(friendUserId)) {
      await removeCloseFriend(friendUserId);
    } else {
      await addCloseFriend(friendUserId);
    }
  };

  return {
    closeFriends,
    isLoading,
    addCloseFriend,
    removeCloseFriend,
    isCloseFriend,
    toggleCloseFriend,
    refreshCloseFriends: fetchCloseFriends,
  };
};
