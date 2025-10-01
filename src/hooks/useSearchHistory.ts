import { useState, useEffect } from 'react';

export interface SearchHistoryItem {
  id: string;
  type: string;
  location: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  timestamp: number;
}

const STORAGE_KEY = 'sainte-voyage-search-history';
const MAX_HISTORY_ITEMS = 20;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setHistory(parsed);
        }
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    };
    loadHistory();
  }, []);

  const addSearch = (search: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: SearchHistoryItem = {
      ...search,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Remove duplicates based on type and location
      const filtered = prev.filter(
        (item) => !(item.type === newItem.type && item.location === newItem.location)
      );
      
      // Add new item at the beginning and limit to MAX_HISTORY_ITEMS
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save search history:', error);
      }
      
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  const removeItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update search history:', error);
      }
      return updated;
    });
  };

  return {
    history,
    addSearch,
    clearHistory,
    removeItem,
  };
};
