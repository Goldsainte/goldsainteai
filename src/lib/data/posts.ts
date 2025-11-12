import { supabase } from '@/integrations/supabase/client';

export interface TravelPost {
  id: string;
  user_id: string;
  video_url?: string;
  embed_url?: string;
  embed_platform?: string;
  original_creator?: string;
  thumbnail_url: string | null;
  image_urls?: string[];
  media_type?: string;
  caption: string | null;
  location: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count?: number;
  is_featured?: boolean;
  music_track_id?: string;
  music_track_name?: string;
  music_track_artist?: string;
  music_preview_url?: string;
  music_album_art?: string;
  music_service?: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    is_verified?: boolean;
    instagram_username?: string | null;
  };
}

export interface FeedResponse {
  items: TravelPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Fetch feed with cursor-based pagination
 * Uses created_at timestamp as cursor for efficient pagination
 */
export async function fetchFeedPaginated({
  cursor,
  limit = 20
}: {
  cursor?: string;
  limit?: number;
}): Promise<FeedResponse> {
  let query = supabase
    .from('travel_posts')
    .select(`
      id,
      user_id,
      video_url,
      embed_url,
      embed_platform,
      original_creator,
      thumbnail_url,
      image_urls,
      media_type,
      caption,
      location,
      view_count,
      like_count,
      comment_count,
      share_count,
      is_featured,
      music_track_id,
      music_track_name,
      music_track_artist,
      music_preview_url,
      music_album_art,
      music_service,
      created_at
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  // If cursor provided, fetch posts BEFORE that timestamp
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching paginated posts:', error);
    throw error;
  }
  
  const items = data || [];
  
  // Batch fetch profiles to avoid N+1 queries
  if (items.length > 0) {
    const userIds = Array.from(new Set(items.map(p => p.user_id).filter(Boolean)));
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_verified, instagram_username')
        .in('id', userIds);
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      items.forEach((post: any) => {
        post.profiles = profilesMap.get(post.user_id) || {
          id: post.user_id,
          username: 'TravelExplorer',
          avatar_url: null,
          is_verified: false,
          instagram_username: null
        };
      });
    }
  }
  
  const nextCursor = items.length === limit ? items[items.length - 1].created_at : null;
  
  return {
    items: items as TravelPost[],
    nextCursor,
    hasMore: items.length === limit
  };
}
