import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreamContextType {
  client: StreamChat | null;
  isReady: boolean;
}

const StreamContext = createContext<StreamContextType>({
  client: null,
  isReady: false,
});

export const useStream = () => useContext(StreamContext);

export const StreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user) {
      if (client) {
        client.disconnectUser();
        setClient(null);
        setIsReady(false);
      }
      return;
    }

    const initStream = async () => {
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

        const { token, apiKey, userName, userImage } = data;

        // Initialize Stream client
        const streamClient = StreamChat.getInstance(apiKey);
        
        await streamClient.connectUser(
          {
            id: user.id,
            name: userName || user.email || 'User',
            image: userImage,
          },
          token
        );

        setClient(streamClient);
        setIsReady(true);
        console.log('Stream client connected successfully');
      } catch (error) {
        console.error('Failed to initialize Stream:', error);
      }
    };

    initStream();

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [user]);

  return (
    <StreamContext.Provider value={{ client, isReady }}>
      {children}
    </StreamContext.Provider>
  );
};
