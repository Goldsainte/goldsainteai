import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { filterMessageContent, sanitizeContactInfo } from "@/utils/contentFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";

const messageSchema = z.object({
  message_text: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message must be less than 1000 characters")
});

interface JobMessagingProps {
  jobId: string;
  jobOwnerId: string;
  agentId?: string;
}

export const JobMessaging = ({ jobId, jobOwnerId, agentId }: JobMessagingProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`job-messages-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_messages')
        .select('*, sender:profiles!marketplace_messages_sender_id_fkey(username, first_name, last_name)')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!user) return;

    try {
      // Validate message
      const validation = messageSchema.safeParse({ message_text: newMessage });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      // Content filtering - check for prohibited content
      const filterResult = filterMessageContent(validation.data.message_text);
      if (filterResult.isViolation) {
        toast.error(filterResult.reason, { duration: 5000 });
        return;
      }

      setSending(true);

      // Determine receiver based on who is sending
      let receiverId: string;
      if (user.id === jobOwnerId) {
        // Job owner is sending, receiver is the agent
        if (!agentId) {
          toast.error('No agent assigned to this job');
          return;
        }
        const { data: agentData } = await supabase
          .from('travel_agents')
          .select('user_id')
          .eq('id', agentId)
          .single();
        
        if (!agentData) {
          toast.error('Agent not found');
          return;
        }
        receiverId = agentData.user_id;
      } else {
        // Agent is sending, receiver is job owner
        receiverId = jobOwnerId;
      }

      const { error } = await supabase
        .from('marketplace_messages')
        .insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: receiverId,
          message_text: validation.data.message_text
        });

      if (error) throw error;

      setNewMessage("");
      toast.success('Message sent');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getSenderName = (message: any) => {
    const sender = message.sender;
    if (sender?.first_name && sender?.last_name) {
      return `${sender.first_name} ${sender.last_name}`;
    }
    return sender?.username || 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Platform Security:</strong> All communication must remain within Goldsainte. 
            Messages containing emails, phone numbers, or external links are automatically blocked. 
            Attempting to move transactions off-platform violates our Terms of Service.
          </AlertDescription>
        </Alert>
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getSenderName(message).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {getSenderName(message)}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm break-words">{message.message_text}</p>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none"
            rows={2}
            maxLength={1000}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={sending || !newMessage.trim()}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
