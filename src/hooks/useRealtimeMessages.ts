import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean | null;
  created_at: string;
  job_id: string;
}

interface UseRealtimeMessagesProps {
  conversationId?: string;
  userId?: string;
  onNewMessage?: (message: Message) => void;
}

export const useRealtimeMessages = ({
  conversationId,
  userId,
  onNewMessage,
}: UseRealtimeMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('marketplace_messages')
      .select('*')
      .eq('job_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as any);
    }
    setIsLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to real-time message updates
    const messageChannel = supabase
      .channel(`marketplace_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `job_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages((prev) => [...prev, newMessage]);
          onNewMessage?.(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `job_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as any;
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
  }, [conversationId, onNewMessage]);

  const sendMessage = async (content: string, receiverId: string) => {
    if (!userId || !conversationId) return null;

    const { data, error } = await supabase
      .from('marketplace_messages')
      .insert({
        sender_id: userId,
        receiver_id: receiverId,
        message_text: content,
        job_id: conversationId,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data as any;
  };

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('marketplace_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (!error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
      );
    }
  };

  const markAllAsRead = async (senderId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('marketplace_messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', senderId)
      .eq('is_read', false);

    if (!error) {
      setMessages((prev) =>
        prev.map((m) => (m.sender_id === senderId ? { ...m, is_read: true } : m))
      );
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refetch: fetchMessages,
  };
};
