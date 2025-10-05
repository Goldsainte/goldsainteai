import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Search, MessageCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  customer_id: string;
  agent_id: string;
  job_id: string;
  last_message_at: string | null;
  unread_count_customer: number;
  unread_count_agent: number;
  status: string;
}

interface ConversationsListProps {
  userId: string;
  userType: 'customer' | 'agent';
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationsList = ({
  userId,
  userType,
  selectedConversationId,
  onSelectConversation,
}: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    subscribeToConversations();
  }, [userId, userType]);

  const fetchConversations = async () => {
    try {
      let query = (supabase as any)
        .from("conversations")
        .select("*")
        .eq("status", "active")
        .order("last_message_at", { ascending: false, nullsFirst: false });

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
          table: "conversations",
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
      ? conversation.unread_count_customer 
      : conversation.unread_count_agent;
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </CardTitle>
        <CardDescription>
          {conversations.length} active {conversations.length === 1 ? "conversation" : "conversations"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const unreadCount = getUnreadCount(conversation);
            const isSelected = conversation.id === selectedConversationId;

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-colors hover:bg-accent",
                  isSelected && "bg-accent border-primary"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar>
                      <AvatarFallback>
                        {userType === 'customer' ? 'A' : 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold truncate">
                          {userType === 'customer' ? 'Your Agent' : 'Customer'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge variant="default" className="shrink-0">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Job #{conversation.job_id.slice(0, 8)}
                      </p>
                      {conversation.last_message_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(conversation.last_message_at), {
                            addSuffix: true,
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredConversations.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
