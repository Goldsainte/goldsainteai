import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useSearchTracking = () => {
  const { user } = useAuth();

  const trackSearch = async (
    searchType: 'hotel' | 'flight' | 'car' | 'restaurant' | 'event' | 'destination',
    searchParams: Record<string, any>
  ) => {
    if (!user) return; // Only track for authenticated users

    try {
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_type: searchType,
          search_params: searchParams
        });

      if (error) {
        console.error('Error tracking search:', error);
      }
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  };

  const getRecentSearches = async (limit = 10) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch search history:', error);
      return [];
    }
  };

  const clearSearchHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  return {
    trackSearch,
    getRecentSearches,
    clearSearchHistory
  };
};
