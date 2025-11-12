import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsParams {
  articleId: string;
}

function getOrCreateSessionId() {
  let sid = sessionStorage.getItem("journal_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("journal_sid", sid);
  }
  return sid;
}

export function useArticleAnalytics({ articleId }: AnalyticsParams) {
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const hasTrackedViewRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  useEffect(() => {
    if (!articleId) return;

    // Track page view
    const trackView = async () => {
      if (hasTrackedViewRef.current) return;
      hasTrackedViewRef.current = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from("journal_analytics" as any).insert({
          article_id: articleId,
          user_id: user?.id ?? null,
          session_id: sessionIdRef.current,
          referrer: document.referrer || null,
        } as any);
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    trackView();

    // Track scroll depth
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = Math.round(
        (scrollTop / (documentHeight - windowHeight)) * 100
      );
      
      if (scrollPercent > scrollDepthRef.current) {
        scrollDepthRef.current = scrollPercent;
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Track time spent and scroll depth on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
      
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      
      // Update analytics with duration and scroll depth
      const updateAnalytics = async () => {
        try {
          await supabase
            .from("journal_analytics" as any)
            .update({
              view_duration_seconds: duration,
              scroll_depth_percent: scrollDepthRef.current,
            } as any)
            .eq("session_id", sessionIdRef.current)
            .eq("article_id", articleId);
        } catch (error) {
          console.error("Error updating analytics:", error);
        }
      };
      
      updateAnalytics();
    };
  }, [articleId]);
}
