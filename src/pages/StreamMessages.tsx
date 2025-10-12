import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStream } from '@/contexts/StreamContext';
import { 
  Chat, 
  Channel, 
  ChannelHeader, 
  MessageInput, 
  MessageList, 
  Thread, 
  Window,
  ChannelList,
  LoadingIndicator,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { Button } from '@/components/ui/button';
import { Video, Phone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const StreamMessages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { client, isReady } = useStream();
  const [activeChannel, setActiveChannel] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!isReady || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  const filters = { 
    type: 'messaging',
    members: { $in: [user?.id || ''] }
  };
  
  const sort = { last_message_at: -1 as const };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/travel-feed')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        {activeChannel && (
          <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/voice-call')}
                title="Start Audio Call"
              >
                <Phone className="h-5 w-5" />
              </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toast.info('Video calls coming soon!')}
              title="Start Video Call"
            >
              <Video className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Stream Chat UI */}
      <div className="h-[calc(100vh-64px)]">
        <Chat client={client} theme="str-chat__theme-dark">
          <div className="flex h-full">
            {/* Channel List Sidebar */}
            <div className="w-80 border-r border-border bg-card">
              <ChannelList
                filters={filters}
                sort={sort}
                options={{ limit: 30 }}
                Preview={(props) => {
                  const channelName = (props.channel.data as any)?.name || 'Unnamed Channel';
                  return (
                    <div 
                      className="p-4 hover:bg-accent cursor-pointer border-b border-border"
                      onClick={() => setActiveChannel(props.channel)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                          {channelName?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">
                            {channelName}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {props.latestMessage || 'No messages yet'}
                          </div>
                        </div>
                        {props.unread > 0 && (
                          <div className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs font-semibold">
                            {props.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            {/* Chat Window */}
            <div className="flex-1">
              {activeChannel ? (
                <Channel channel={activeChannel}>
                  <Window>
                    <ChannelHeader />
                    <MessageList />
                    <MessageInput />
                  </Window>
                  <Thread />
                </Channel>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-xl mb-2">Select a conversation</p>
                    <p className="text-sm">Choose from your existing conversations or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Chat>
      </div>
    </div>
  );
};

export default StreamMessages;
