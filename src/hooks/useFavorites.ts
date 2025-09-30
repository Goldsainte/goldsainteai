import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface Favorite {
  id: string;
  user_id: string;
  favorite_type: 'flight' | 'hotel' | 'restaurant';
  favorite_data: any;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data || []) as Favorite[]);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFavorite = async (type: 'flight' | 'hotel' | 'restaurant', data: any) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Redirecting to sign in page...",
      });
      setTimeout(() => navigate('/auth'), 1000);
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          favorite_type: type,
          favorite_data: data,
        });

      if (error) throw error;

      toast({
        title: "Added to favorites",
        description: `This ${type} has been saved to your favorites.`,
      });

      await fetchFavorites();
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Already in favorites",
          description: "This item is already in your favorites.",
        });
      } else {
        toast({
          title: "Failed to add favorite",
          description: error.message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Removed from favorites",
        description: "Item removed from your favorites.",
      });

      await fetchFavorites();
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to remove favorite",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const isFavorite = (type: 'flight' | 'hotel' | 'restaurant', itemData: any): string | null => {
    const favorite = favorites.find(
      (fav) => fav.favorite_type === type && JSON.stringify(fav.favorite_data) === JSON.stringify(itemData)
    );
    return favorite?.id || null;
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    fetchFavorites,
  };
};
