import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Reply, Trash2, Paperclip, Download, FileText, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { useTripChat } from '@/hooks/useTripChat';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface TripChatProps {
  tripId: string;
  members: any[];
}

export const TripChat = ({ tripId, members }: TripChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { messages, loading, sendMessage, deleteMessage } = useTripChat(tripId);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage, replyingTo || undefined, selectedFile || undefined);
      setNewMessage('');
      setReplyingTo(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Error handled in hook
    } finally {
      setSending(false);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-4 w-4" />;
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
            {message.file_url && (
              <div className="mb-2">
                {message.file_type?.startsWith('image/') ? (
                  <img 
                    src={message.file_url} 
                    alt={message.file_name || 'Shared image'}
                    className="max-w-[300px] rounded-lg cursor-pointer"
                    onClick={() = loading="lazy"> window.open(message.file_url!, '_blank')}
                  />
                ) : (
                  <a
                    href={message.file_url}
                    download={message.file_name}
                    className="flex items-center gap-2 p-2 rounded bg-background/10 hover:bg-background/20 transition-colors"
                  >
                    {getFileIcon(message.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{message.file_name}</p>
                      <p className="text-xs opacity-70">{formatFileSize(message.file_size)}</p>
                    </div>
                    <Download className="h-4 w-4 flex-shrink-0" />
                  </a>
                )}
              </div>
            )}
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
                onClick={() => deleteMessage(message.id, message.file_url)}
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

          {selectedFile && (
            <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedFile.type)}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
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
            <Button onClick={handleSend} disabled={(!newMessage.trim() && !selectedFile) || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
