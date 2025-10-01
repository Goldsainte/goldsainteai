import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchHistoryItem {
  id: string;
  type: string;
  location: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  timestamp: number;
}

const MAX_HISTORY_ITEMS = 20;

export const useSearchHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setHistory([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('search_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(MAX_HISTORY_ITEMS);

        if (error) throw error;

        if (data) {
          const formatted = data.map((item) => {
            const params = item.search_params as any;
            return {
              id: item.id,
              type: item.search_type,
              location: params?.location || '',
              checkIn: params?.checkIn,
              checkOut: params?.checkOut,
              guests: params?.guests,
              timestamp: new Date(item.created_at).getTime(),
            };
          });
          setHistory(formatted);
        }
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    };
    loadHistory();
  }, [user]);

  const addSearch = async (search: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
    if (!user) return;

    try {
      // Insert into database
      const { data, error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_type: search.type,
          search_params: {
            location: search.location,
            checkIn: search.checkIn,
            checkOut: search.checkOut,
            guests: search.guests,
          },
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newItem: SearchHistoryItem = {
          id: data.id,
          type: data.search_type,
          location: search.location,
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          guests: search.guests,
          timestamp: new Date(data.created_at).getTime(),
        };

        setHistory((prev) => {
          // Remove duplicates based on type and location
          const filtered = prev.filter(
            (item) => !(item.type === newItem.type && item.location === newItem.location)
          );
          
          // Add new item at the beginning and limit to MAX_HISTORY_ITEMS
          return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
        });
      }
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  const removeItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to remove search history item:', error);
    }
  };

  return {
    history,
    addSearch,
    clearHistory,
    removeItem,
  };
};
