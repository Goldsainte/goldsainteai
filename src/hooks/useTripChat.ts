import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  trip_id: string;
  user_id: string;
  message: string;
  parent_message_id: string | null;
  created_at: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
}

export const useTripChat = (tripId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_messages')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchMessages();
    }
  }, [tripId]);

  useEffect(() => {
    const channel = supabase
      .channel('trip-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trip_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === (payload.new as Message).id ? (payload.new as Message) : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'trip_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as Message).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const uploadFile = async (file: File, messageId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${messageId}.${fileExt}`;
    const filePath = `${tripId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('trip-files')
      .upload(filePath, file, {
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('trip-files')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const sendMessage = async (message: string, parentMessageId?: string, file?: File) => {
    try {
      // First insert the message to get the ID
      const { data: newMessage, error: insertError } = await supabase
        .from('trip_messages')
        .insert([{
          trip_id: tripId,
          message: message || (file ? `Shared a file: ${file.name}` : ''),
          parent_message_id: parentMessageId || null,
        }] as any)
        .select()
        .single();

      if (insertError) throw insertError;

      // If there's a file, upload it and update the message
      if (file && newMessage) {
        const fileUrl = await uploadFile(file, newMessage.id);
        
        const { error: updateError } = await supabase
          .from('trip_messages')
          .update({
            file_url: fileUrl,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          } as any)
          .eq('id', newMessage.id);

        if (updateError) throw updateError;
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteFile = async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('trip-files')
        .remove([filePath]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting file:', error);
    }
  };

  const deleteMessage = async (messageId: string, fileUrl?: string | null) => {
    try {
      // Delete file from storage if exists
      if (fileUrl) {
        const filePath = fileUrl.split('/').slice(-2).join('/');
        await deleteFile(filePath);
      }

      const { error } = await supabase
        .from('trip_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
  };
};
