import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    console.log(`[PERSONALIZED-FEED] Generating feed for user: ${user.id}`);

    // Get user's AI agent preferences
    const { data: aiAgent } = await supabaseClient
      .from('ai_agent_profiles')
      .select('travel_preferences')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get user's liked posts
    const { data: likedPosts } = await supabaseClient
      .from('post_likes')
      .select('post_id, travel_posts(location, caption)')
      .eq('user_id', user.id)
      .limit(10);

    // Get users they follow
    const { data: following } = await supabaseClient
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map(f => f.following_id) || [];

    console.log(`[PERSONALIZED-FEED] AI Preferences: ${JSON.stringify(aiAgent?.travel_preferences)}`);
    console.log(`[PERSONALIZED-FEED] Following ${followingIds.length} users`);
    console.log(`[PERSONALIZED-FEED] Liked ${likedPosts?.length || 0} posts`);

    // Fetch all active posts with profile data
    const { data: allPosts, error: postsError } = await supabaseClient
      .from('travel_posts')
      .select('id, user_id, video_url, embed_url, embed_platform, original_creator, thumbnail_url, image_urls, media_type, caption, location, view_count, like_count, comment_count, share_count, is_featured, music_track_id, music_track_name, music_track_artist, music_preview_url, music_album_art, music_service, native_video_volume, music_volume, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100);

    if (postsError) throw postsError;

    // Batch-fetch profiles to avoid N+1 queries
    const userIds = Array.from(new Set((allPosts || []).map((p: any) => p.user_id).filter(Boolean)));
    let profilesMap = new Map<string, any>();
    if (userIds.length) {
      const { data: profilesData } = await supabaseClient
        .from('profiles')
        .select('id, username, avatar_url, is_verified, instagram_username')
        .in('id', userIds);
      profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
    }

    const postsWithProfiles = (allPosts || []).map((post: any) => ({
      ...post,
      profiles: profilesMap.get(post.user_id) || { username: 'TravelExplorer', avatar_url: null, is_verified: false, instagram_username: null }
    }));

    // Score and rank posts
    const scoredPosts = postsWithProfiles.map(post => {
      let score = 0;
      const isFollowing = followingIds.includes(post.user_id);
      const isOwnPost = post.user_id === user.id;
      const isSuggested = !isFollowing && !isOwnPost;
      
      // Always include your own posts prominently
      if (isOwnPost) {
        score += 1000;
      }
      
      // Boost posts from followed accounts (high priority)
      if (isFollowing) {
        score += 100;
      }
      
      // Boost verified accounts
      if (post.profiles?.is_verified) {
        score += 30;
      }
      
      // Boost posts with similar locations to liked posts
      const likedLocations = likedPosts?.map((l: any) => l.travel_posts?.location).filter(Boolean) || [];
      if (post.location && likedLocations.some((loc: string) => loc && post.location?.toLowerCase().includes(loc.toLowerCase()))) {
        score += 50;
      }
      
      // Match AI travel preferences
      const preferences = aiAgent?.travel_preferences;
      if (preferences && post.caption) {
        const caption = post.caption.toLowerCase();
        
        // Check for preference keywords in caption
        if (preferences.preferred_destinations) {
          const destinations = preferences.preferred_destinations.toLowerCase();
          if (caption.includes(destinations) || post.location?.toLowerCase().includes(destinations)) {
            score += 40;
          }
        }
        
        if (preferences.interests) {
          const interests = Array.isArray(preferences.interests) 
            ? preferences.interests 
            : [preferences.interests];
          interests.forEach((interest: string) => {
            if (caption.includes(interest.toLowerCase())) {
              score += 20;
            }
          });
        }
        
        if (preferences.travel_style && caption.includes(preferences.travel_style.toLowerCase())) {
          score += 25;
        }
      }
      
      // Engagement score (views, likes, comments)
      const engagementScore = 
        (post.like_count * 2) + 
        (post.comment_count * 3) + 
        (post.view_count * 0.01);
      score += Math.min(engagementScore, 50); // Cap engagement bonus
      
      // Recency bonus (newer posts get slight boost)
      const daysOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld < 1) score += 15;
      else if (daysOld < 3) score += 10;
      else if (daysOld < 7) score += 5;
      
      return { ...post, score, is_suggested: isSuggested };
    });

    // Sort by score and return top posts
    const personalizedFeed = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 30); // Get more posts to mix in suggestions

    // Calculate suggestion stats
    const suggestedCount = personalizedFeed.filter(p => p.is_suggested).length;
    const followingCount = personalizedFeed.filter(p => !p.is_suggested && p.user_id !== user.id).length;

    console.log(`[PERSONALIZED-FEED] Returning ${personalizedFeed.length} personalized posts`);
    console.log(`[PERSONALIZED-FEED] Following: ${followingCount}, Suggested: ${suggestedCount}, Own: ${personalizedFeed.length - suggestedCount - followingCount}`);
    console.log(`[PERSONALIZED-FEED] Top 3 scores: ${personalizedFeed.slice(0, 3).map(p => p.score).join(', ')}`);

    return new Response(JSON.stringify({ posts: personalizedFeed }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[PERSONALIZED-FEED] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
