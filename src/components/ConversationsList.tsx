import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Search, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  customer_id: string;
  agent_id: string;
  job_id: string;
  last_message_at: string | null;
  customer_unread_count: number;
  agent_unread_count: number;
  status: string;
}

interface ConversationsListProps {
  userId: string;
  userType: 'customer' | 'agent';
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  conversationType?: 'primary' | 'general' | 'channel' | 'request';
}

export const ConversationsList = ({
  userId,
  userType,
  selectedConversationId,
  onSelectConversation,
  conversationType,
}: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    subscribeToConversations();
  }, [userId, userType, conversationType]);

  const fetchConversations = async () => {
    try {
      let query = (supabase as any)
        .from("user_conversations")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      // Filter by conversation type
      if (conversationType === 'request') {
        query = query.eq("status", "pending");
      } else if (conversationType === 'channel') {
        query = query.eq("conversation_type", "channel").eq("status", "active");
      } else if (conversationType) {
        query = query.eq("conversation_type", conversationType).eq("status", "active");
      } else {
        query = query.eq("status", "active");
      }

      if (userType === 'customer') {
        query = query.eq("customer_id", userId);
      } else {
        // For agents, get their agent ID first
        const { data: agentData } = await (supabase as any)
          .from("travel_agents")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (agentData) {
          query = query.eq("agent_id", agentData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getUnreadCount = (conversation: Conversation) => {
    return userType === 'customer' 
      ? conversation.customer_unread_count 
      : conversation.agent_unread_count;
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-lg"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No conversations found" : "No messages yet"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const isSelected = selectedConversationId === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full p-3 text-left transition-colors flex items-center gap-3 hover:bg-muted",
                    isSelected && "bg-muted"
                  )}
                >
                  <Avatar className="h-14 w-14 flex-shrink-0">
                    <AvatarFallback className="text-lg">
                      {userType === 'customer' ? 'A' : 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="font-semibold truncate">
                        {userType === 'customer' ? 'Your Agent' : 'Customer'}
                      </p>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(conversation.last_message_at), {
                            addSuffix: false,
                          }).replace('about ', '')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm truncate",
                        unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        Job #{conversation.job_id.slice(0, 8)}
                      </p>
                      {unreadCount > 0 && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
