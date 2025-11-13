import { httpJson } from '@/lib/http/client';

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
  personalized?: boolean;
}

const FEED_ENDPOINT = import.meta.env.VITE_FEED_ENDPOINT || '/api/feed';

function resolveFeedUrl(): URL {
  if (FEED_ENDPOINT.startsWith('http://') || FEED_ENDPOINT.startsWith('https://')) {
    return new URL(FEED_ENDPOINT);
  }

  if (typeof window === 'undefined') {
    return new URL(FEED_ENDPOINT, 'https://app.local');
  }

  return new URL(FEED_ENDPOINT, window.location.origin);
}

type FetchFeedArgs = {
  cursor?: string;
  limit?: number;
  personalized?: boolean;
  focusPostId?: string;
  signal?: AbortSignal;
};

export async function fetchFeedPaginated({
  cursor,
  limit = 20,
  personalized,
  focusPostId,
  signal,
}: FetchFeedArgs): Promise<FeedResponse> {
  const url = resolveFeedUrl();

  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  if (limit) {
    url.searchParams.set('limit', String(limit));
  }

  if (typeof personalized === 'boolean') {
    url.searchParams.set('personalized', personalized ? 'true' : 'false');
  }

  if (focusPostId) {
    url.searchParams.set('focusPostId', focusPostId);
  }

  const response = await httpJson<FeedResponse>(
    url.toString(),
    {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
    {
      retry: {
        attempts: 3,
        backoffMs: 400,
        maxBackoffMs: 4000,
        jitterMs: 250,
      },
    }
  );

  return {
    items: response.items ?? [],
    nextCursor: response.nextCursor ?? null,
    hasMore: Boolean(response.hasMore),
    personalized: response.personalized,
  };
}
