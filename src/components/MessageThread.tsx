import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, Video, MoreVertical, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'customer' | 'agent';
  message_type: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface MessageThreadProps {
  conversationId: string;
  userId: string;
  userType: 'customer' | 'agent';
}

export const MessageThread = ({ conversationId, userId, userType }: MessageThreadProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();
    subscribeToMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await (supabase as any).rpc("mark_messages_as_read", {
        p_conversation_id: conversationId,
        p_user_id: userId,
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          markMessagesAsRead();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? (payload.new as Message) : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await (supabase as any)
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          sender_type: userType,
          message_type: "text",
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {userType === 'customer' ? 'A' : 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base">
                {userType === 'customer' ? 'Your Agent' : 'Customer'}
              </p>
              <p className="text-xs text-muted-foreground font-normal">Online</p>
            </div>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === userId;

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                isOwnMessage ? "flex-row-reverse" : "flex-row"
              )}
            >
              {!isOwnMessage && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {message.sender_type === 'agent' ? 'A' : 'C'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-3",
                  isOwnMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <div
                  className={cn(
                    "flex items-center gap-1 mt-1 text-xs",
                    isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  <span>{format(new Date(message.created_at), "h:mm a")}</span>
                  {isOwnMessage && (
                    <>
                      {message.is_read ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};
