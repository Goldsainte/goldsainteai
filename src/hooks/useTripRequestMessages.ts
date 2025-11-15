import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TripRequestMessage {
  id: string;
  trip_request_id: string;
  proposal_id: string | null;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface UseTripRequestMessagesProps {
  tripRequestId?: string;
  proposalId?: string;
  userId?: string;
  onNewMessage?: (message: TripRequestMessage) => void;
}

export const useTripRequestMessages = ({
  tripRequestId,
  proposalId,
  userId,
  onNewMessage,
}: UseTripRequestMessagesProps) => {
  const [messages, setMessages] = useState<TripRequestMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!tripRequestId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let query = supabase
      .from('trip_request_messages')
      .select('*')
      .eq('trip_request_id', tripRequestId);

    if (proposalId) {
      query = query.eq('proposal_id', proposalId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as TripRequestMessage[]);
    }
    setIsLoading(false);
  }, [tripRequestId, proposalId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!tripRequestId) return;

    const messageChannel = supabase
      .channel(`trip_request_messages:${tripRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_request_messages',
          filter: `trip_request_id=eq.${tripRequestId}`,
        },
        (payload) => {
          const newMessage = payload.new as TripRequestMessage;
          setMessages((prev) => [...prev, newMessage]);
          onNewMessage?.(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trip_request_messages',
          filter: `trip_request_id=eq.${tripRequestId}`,
        },
        (payload) => {
          const updated = payload.new as TripRequestMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    setChannel(messageChannel);

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [tripRequestId, onNewMessage]);

  const sendMessage = async (content: string, proposalId?: string) => {
    if (!userId || !tripRequestId) return null;

    const { data, error } = await supabase
      .from('trip_request_messages')
      .insert({
        trip_request_id: tripRequestId,
        proposal_id: proposalId || null,
        sender_id: userId,
        body: content,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data as TripRequestMessage;
  };

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('trip_request_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (!error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
      );
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
};
