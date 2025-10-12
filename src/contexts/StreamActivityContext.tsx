import React, { createContext, useContext, useEffect, useState } from 'react';
import { connect } from 'getstream';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreamActivityContextType {
  feedClient: any | null;
  userFeed: any | null;
  timelineFeed: any | null;
  isReady: boolean;
}

const StreamActivityContext = createContext<StreamActivityContextType>({
  feedClient: null,
  userFeed: null,
  timelineFeed: null,
  isReady: false,
});

export const useStreamActivity = () => useContext(StreamActivityContext);

export const StreamActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [feedClient, setFeedClient] = useState<any>(null);
  const [userFeed, setUserFeed] = useState<any>(null);
  const [timelineFeed, setTimelineFeed] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setFeedClient(null);
      setUserFeed(null);
      setTimelineFeed(null);
      // Mark ready in guest mode so UI can render a CTA instead of hanging
      setIsReady(true);
      return;
    }

    const initStreamActivity = async () => {
      try {
        console.log('[StreamActivity] Starting initialization for user:', user.id);
        
        // Get user profile for name and image
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('[StreamActivity] Profile error:', profileError);
        }

        // Get Stream token from edge function
        console.log('[StreamActivity] Fetching token...');
        const { data, error } = await supabase.functions.invoke('stream-token', {
          body: {
            userId: user.id,
            userName: profile?.username || user.email,
            userImage: profile?.avatar_url,
          },
        });

        if (error) {
          console.error('[StreamActivity] Token fetch error:', error);
          throw new Error(`Failed to get Stream token: ${error.message}`);
        }

        if (!data || !data.token || !data.apiKey || !data.userId) {
          console.error('[StreamActivity] Invalid token response:', data);
          throw new Error('Invalid token response from server');
        }

        const { token, apiKey, userId } = data;
        console.log('[StreamActivity] Token received, initializing client...', { 
          apiKey: apiKey?.substring(0, 8),
          userId 
        });

        // Initialize Stream Activity Feeds client
        const client = connect(apiKey, token, userId);
        console.log('[StreamActivity] Client created');
        
        // Create user feed (for posting)
        const userFeedInstance = client.feed('user', userId);
        console.log('[StreamActivity] User feed created');
        
        // Create timeline feed (for viewing posts from followed users)
        const timelineFeedInstance = client.feed('timeline', userId);
        console.log('[StreamActivity] Timeline feed created');

        setFeedClient(client);
        setUserFeed(userFeedInstance);
        setTimelineFeed(timelineFeedInstance);
        setIsReady(true);
        
        console.log('[StreamActivity] ✓ Stream Activity Feeds connected successfully');
      } catch (error) {
        console.error('[StreamActivity] ✗ Failed to initialize Stream Activity Feeds:', error);
        console.error('[StreamActivity] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          userId: user?.id,
          userEmail: user?.email
        });
        // Set ready anyway to show the UI with error handling
        setIsReady(true);
      }
    };

    initStreamActivity();
  }, [user]);

  return (
    <StreamActivityContext.Provider value={{ feedClient, userFeed, timelineFeed, isReady }}>
      {children}
    </StreamActivityContext.Provider>
  );
};
