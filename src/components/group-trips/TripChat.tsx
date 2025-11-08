import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Reply, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTripChat } from '@/hooks/useTripChat';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface TripChatProps {
  tripId: string;
  members: any[];
}

export const TripChat = ({ tripId, members }: TripChatProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, deleteMessage } = useTripChat(tripId);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage, replyingTo || undefined);
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      // Error handled in hook
    } finally {
      setSending(false);
    }
  };

  const getMemberEmail = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.email || 'Unknown User';
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getParentMessage = (parentId: string | null) => {
    if (!parentId) return null;
    return messages.find(m => m.id === parentId);
  };

  const renderMessage = (message: any) => {
    const isOwnMessage = message.user_id === user?.id;
    const parentMessage = getParentMessage(message.parent_message_id);
    const userEmail = getMemberEmail(message.user_id);

    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">{getInitials(userEmail)}</AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{userEmail}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.created_at), 'h:mm a')}
            </span>
          </div>
          
          {parentMessage && (
            <div className="px-3 py-1 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground mb-1">
              <div className="flex items-center gap-1 mb-1">
                <Reply className="h-3 w-3" />
                <span className="font-medium">Replying to {getMemberEmail(parentMessage.user_id)}</span>
              </div>
              <p className="truncate">{parentMessage.message}</p>
            </div>
          )}
          
          <div className={`px-4 py-2 rounded-lg ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            <p className="text-sm">{message.message}</p>
          </div>
          
          <div className="flex gap-2">
            {!isOwnMessage && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setReplyingTo(message.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            {isOwnMessage && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs text-destructive"
                onClick={() => deleteMessage(message.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const replyingToMessage = replyingTo ? messages.find(m => m.id === replyingTo) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Trip Chat
          <Badge variant="secondary">{messages.length} messages</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map(renderMessage)
            )}
          </div>
        </ScrollArea>

        <div className="space-y-2">
          {replyingToMessage && (
            <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4" />
                <span>
                  Replying to <strong>{getMemberEmail(replyingToMessage.user_id)}</strong>
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
