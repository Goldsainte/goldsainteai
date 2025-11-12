import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsParams {
  articleId: string;
}

function getOrCreateSessionId() {
  // SSR safety check
  if (typeof window === 'undefined') return 'ssr';
  
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
  const rowIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!articleId) return;

    // Track page view
    const trackView = async () => {
      if (hasTrackedViewRef.current) return;
      hasTrackedViewRef.current = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: inserted, error } = await supabase
          .from("journal_analytics" as any)
          .insert({
            article_id: articleId,
            user_id: user?.id ?? null,
            session_id: sessionIdRef.current,
            referrer: document.referrer || null,
          } as any)
          .select('id')
          .single();
        
        if (!error && inserted) {
          rowIdRef.current = (inserted as any).id;
        }
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    trackView();

    // Track scroll depth with throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const scrollTop = window.scrollY;
          
          // Prevent NaN on short pages
          const denom = Math.max(1, documentHeight - windowHeight);
          const scrollPercent = Math.round((scrollTop / denom) * 100);
          
          if (scrollPercent > scrollDepthRef.current) {
            scrollDepthRef.current = Math.min(scrollPercent, 100);
          }
          
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    // Flush analytics on tab close/background
    const flush = async () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      try {
        await supabase.from("journal_analytics" as any)
          .update({
            view_duration_seconds: duration,
            scroll_depth_percent: scrollDepthRef.current,
          } as any)
          .eq('id', rowIdRef.current || '');
      } catch (error) {
        // Silently fail - analytics shouldn't break UX
      }
    };

    const onPageHide = () => flush();
    const onBeforeUnload = () => flush();

    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);

    // Track time spent and scroll depth on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      
      // Update analytics with duration and scroll depth
      const updateAnalytics = async () => {
        try {
          const query = supabase
            .from("journal_analytics" as any)
            .update({
              view_duration_seconds: duration,
              scroll_depth_percent: scrollDepthRef.current,
            } as any);
          
          // Update by row ID if available, fallback to session + article
          if (rowIdRef.current) {
            await query.eq('id', rowIdRef.current);
          } else {
            await query
              .eq("session_id", sessionIdRef.current)
              .eq("article_id", articleId);
          }
        } catch (error) {
          console.error("Error updating analytics:", error);
        }
      };
      
      updateAnalytics();
    };
  }, [articleId]);
}
