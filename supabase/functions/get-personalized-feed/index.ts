import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      .select('id, user_id, video_url, thumbnail_url, caption, location, view_count, like_count, comment_count, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100);

    if (postsError) throw postsError;

    // Fetch profile data for all posts
    const postsWithProfiles = await Promise.all(
      (allPosts || []).map(async (post) => {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('username, avatar_url, is_verified, instagram_username')
          .eq('id', post.user_id)
          .maybeSingle();
        
        return {
          ...post,
          profiles: profile || { username: 'TravelExplorer', avatar_url: null, is_verified: false, instagram_username: null }
        };
      })
    );

    // Score and rank posts
    const scoredPosts = postsWithProfiles.map(post => {
      let score = 0;
      
      // Always include your own posts prominently
      if (post.user_id === user.id) {
        score += 1000;
      }
      
      // Boost posts from followed accounts (high priority)
      if (followingIds.includes(post.user_id)) {
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
      
      return { ...post, score };
    });

    // Sort by score and return top posts
    const personalizedFeed = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    console.log(`[PERSONALIZED-FEED] Returning ${personalizedFeed.length} personalized posts`);
    console.log(`[PERSONALIZED-FEED] Top 3 scores: ${personalizedFeed.slice(0, 3).map(p => p.score).join(', ')}`);

    return new Response(JSON.stringify({ posts: personalizedFeed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[PERSONALIZED-FEED] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
