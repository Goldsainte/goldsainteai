import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useNewMomentsToast() {
  const { toast } = useToast();
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('feed-posts-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'travel_posts' },
        (payload) => {
          const newPost = payload.new as any;
          if (newPost.created_at > lastSeenRef.current && newPost.status === 'active') {
            setPending(v => v + 1);
          }
        }
      )
      .subscribe();

    // Show toast at most once every 8 seconds
    const intervalId = setInterval(() => {
      if (pending > 0) {
        toast({
          title: `${pending} new ${pending > 1 ? 'posts' : 'post'}`,
          description: "Pull to refresh or tap to load.",
          duration: 5000,
        });
        setPending(0);
        lastSeenRef.current = new Date().toISOString();
      }
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [pending, toast]);

  return null;
}
