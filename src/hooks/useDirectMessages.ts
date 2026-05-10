import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  status: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  isInitiator: boolean;
  tripId: string | null;
  tripTitle: string | null;
  otherParticipant: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    accountType: string | null;
    isVerified: boolean;
  };
  createdAt: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ConversationsData {
  requests: Conversation[];
  primary: Conversation[];
  archived: Conversation[];
}

export function useDirectMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationsData>({
    requests: [],
    primary: [],
    archived: [],
  });
  const [totalUnread, setTotalUnread] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      const { data, error: fnError } = await supabase.functions.invoke("get-conversations", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (fnError) throw fnError;

      setConversations(data.conversations);
      setTotalUnread(data.totalUnread);
      setRequestCount(data.requestCount);
      setError(null);
    } catch (e: any) {
      console.error("Error fetching conversations:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendMessage = useCallback(
    async (recipientId: string, message: string, conversationId?: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error("No session");

      const { data, error } = await supabase.functions.invoke("send-direct-message", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { recipientId, message, conversationId },
      });

      if (error) throw error;
      
      // Refresh conversations after sending
      await fetchConversations();
      
      return data;
    },
    [user, fetchConversations]
  );

  const manageConversation = useCallback(
    async (conversationId: string, action: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error("No session");

      const { data, error } = await supabase.functions.invoke("manage-conversation", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { conversationId, action },
      });

      if (error) throw error;
      
      // Refresh conversations after action
      await fetchConversations();
      
      return data;
    },
    [user, fetchConversations]
  );

  // Fetch on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dm-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dm_conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    totalUnread,
    requestCount,
    loading,
    error,
    sendMessage,
    manageConversation,
    refetch: fetchConversations,
  };
}

export function useConversationMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return { messages, loading, refetch: fetchMessages };
}
