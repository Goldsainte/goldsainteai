import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsParams {
  articleSlug: string;
  category?: string;
  authorId?: string;
  isSponsored?: boolean;
}

export function useArticleAnalytics({
  articleSlug,
  category,
  authorId,
  isSponsored,
}: AnalyticsParams) {
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const hasTrackedViewRef = useRef<boolean>(false);

  useEffect(() => {
    // Track page view
    const trackView = async () => {
      if (hasTrackedViewRef.current) return;
      hasTrackedViewRef.current = true;

      try {
        await supabase.from("journal_analytics" as any).insert({
          article_slug: articleSlug,
          event_type: "view",
          category,
          author_id: authorId,
          is_sponsored: isSponsored,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
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
              duration_seconds: duration,
              scroll_depth: scrollDepthRef.current,
            } as any)
            .eq("article_slug", articleSlug)
            .eq("event_type", "view")
            .order("created_at", { ascending: false })
            .limit(1);
          
          console.log("Analytics updated:", { duration, scrollDepth: scrollDepthRef.current });
        } catch (error) {
          console.error("Error updating analytics:", error);
        }
      };
      
      updateAnalytics();
    };
  }, [articleSlug, category, authorId, isSponsored]);
}
