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
      setIsReady(false);
      return;
    }

    const initStreamActivity = async () => {
      try {
        // Get user profile for name and image
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        // Get Stream token from edge function
        const { data, error } = await supabase.functions.invoke('stream-token', {
          body: {
            userId: user.id,
            userName: profile?.username || user.email,
            userImage: profile?.avatar_url,
          },
        });

        if (error) throw error;

        const { token, apiKey, userId } = data;

        // Initialize Stream Activity Feeds client
        const client = connect(apiKey, token, userId);
        
        // Create user feed (for posting)
        const userFeedInstance = client.feed('user', userId);
        
        // Create timeline feed (for viewing posts from followed users)
        const timelineFeedInstance = client.feed('timeline', userId);

        setFeedClient(client);
        setUserFeed(userFeedInstance);
        setTimelineFeed(timelineFeedInstance);
        setIsReady(true);
        
        console.log('Stream Activity Feeds connected successfully');
      } catch (error) {
        console.error('Failed to initialize Stream Activity Feeds:', error);
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
