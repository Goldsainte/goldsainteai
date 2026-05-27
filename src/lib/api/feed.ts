import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionUrl } from "@/lib/backendConfig";

export type FeedCursor = { cursorCreatedAt: string; cursorId: string } | null;

export interface FeedItem {
  id: string;
  user_id: string;
  caption: string;
  media_url: string;
  media_type: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  journey_id: string | null;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: FeedCursor;
}

export async function fetchFeed(
  cursor: FeedCursor = null, 
  limit = 20, 
  scope?: { journeyId?: string }
): Promise<FeedResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  
  if (cursor?.cursorCreatedAt && cursor?.cursorId) {
    params.set("cursorCreatedAt", cursor.cursorCreatedAt);
    params.set("cursorId", cursor.cursorId);
  }
  
  if (scope?.journeyId) {
    params.set("journeyId", scope.journeyId);
  }

  // Get auth token if available
  const { data: sessionData } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (sessionData.session?.access_token) {
    headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
  }

  // Call edge function via fetch for GET support
  const response = await fetch(
    `${getEdgeFunctionUrl("get-feed")}?${params.toString()}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Feed fetch failed: ${error}`);
  }

  return response.json();
}
