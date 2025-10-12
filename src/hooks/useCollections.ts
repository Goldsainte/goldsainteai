import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  post_count?: number;
}

export const useCollections = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = async () => {
    if (!user) {
      setCollections([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch collections without count first
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('post_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      // Fetch counts separately for each collection
      const collectionsWithCount = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          try {
            const { count, error: countError } = await supabase
              .from('collection_posts')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);

            return {
              ...collection,
              post_count: countError ? 0 : (count || 0)
            };
          } catch {
            return {
              ...collection,
              post_count: 0
            };
          }
        })
      );

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error('Error fetching collections:', error);
      // Don't show error toast, just log it
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  const createCollection = async (name: string, description?: string, isPrivate = true) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('post_collections')
        .insert({
          user_id: user.id,
          name,
          description,
          is_private: isPrivate
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Collection created');
      await fetchCollections();
      return data;
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
      return null;
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      const { error } = await supabase
        .from('post_collections')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Collection updated');
      await fetchCollections();
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection');
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('post_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Collection deleted');
      await fetchCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const addPostToCollection = async (collectionId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('collection_posts')
        .insert({
          collection_id: collectionId,
          post_id: postId
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Post already in this collection');
          return;
        }
        throw error;
      }

      toast.success('Added to collection');
      await fetchCollections();
    } catch (error) {
      console.error('Error adding post to collection:', error);
      toast.error('Failed to add to collection');
    }
  };

  const removePostFromCollection = async (collectionId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('collection_posts')
        .delete()
        .eq('collection_id', collectionId)
        .eq('post_id', postId);

      if (error) throw error;

      toast.success('Removed from collection');
      await fetchCollections();
    } catch (error) {
      console.error('Error removing post from collection:', error);
      toast.error('Failed to remove from collection');
    }
  };

  const getCollectionPosts = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_posts')
        .select(`
          post_id,
          added_at,
          travel_posts (*)
        `)
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching collection posts:', error);
      return [];
    }
  };

  return {
    collections,
    isLoading,
    createCollection,
    updateCollection,
    deleteCollection,
    addPostToCollection,
    removePostFromCollection,
    getCollectionPosts,
    refreshCollections: fetchCollections
  };
};
