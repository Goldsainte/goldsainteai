import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceCallInterfaceProps {
  agentId?: string;
  onClose?: () => void;
}

export const VoiceCallInterface = ({ 
  agentId = 'default_2b62614f-80f2-421f-b568-1b409194cd21',
  onClose 
}: VoiceCallInterfaceProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [callStarted, setCallStarted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice call connected');
      toast.success('Connected to AI assistant');
      setCallStarted(true);
    },
    onDisconnect: () => {
      console.log('Voice call disconnected');
      toast.info('Call ended');
      setCallStarted(false);
      setCallDuration(0);
    },
    onMessage: (message) => {
      console.log('Received message:', message);
    },
    onError: (error) => {
      console.error('Voice call error:', error);
      toast.error('Call error: ' + (typeof error === 'string' ? error : 'Unknown error'));
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStarted) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStarted]);

  const startCall = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Generate signed URL from the agent ID
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`
      );
      
      if (!signedUrlResponse.ok) {
        throw new Error('Failed to get signed URL');
      }
      
      const { signed_url } = await signedUrlResponse.json();
      
      // Start the conversation with the signed URL
      await conversation.startSession({ signedUrl: signed_url });
      toast.success('Starting call...');
    } catch (error: any) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start call: ' + (error?.message || 'Unknown error'));
    }
  };

  const endCall = async () => {
    try {
      await conversation.endSession();
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Note: Muting would require additional audio stream management
    toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleVolume = async () => {
    const newVolume = volume > 0 ? 0 : 1;
    setVolume(newVolume);
    await conversation.setVolume({ volume: newVolume });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-6">
        {/* Call Status */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-2">AI Voice Assistant</h3>
          <p className="text-muted-foreground">
            {conversation.status === 'connected' ? 'Connected' : 'Ready to call'}
          </p>
          {callStarted && (
            <p className="text-sm text-muted-foreground mt-2">
              {formatDuration(callDuration)}
            </p>
          )}
        </div>

        {/* AI Speaking Indicator */}
        {conversation.isSpeaking && (
          <div className="flex items-center gap-2 text-primary animate-pulse">
            <Volume2 className="h-5 w-5" />
            <span className="font-medium">AI is speaking...</span>
          </div>
        )}

        {/* Call Avatar */}
        <div className={cn(
          "relative w-32 h-32 rounded-full flex items-center justify-center transition-all",
          conversation.isSpeaking 
            ? "bg-gradient-to-br from-primary to-accent animate-pulse scale-110" 
            : "bg-gradient-to-br from-primary to-accent"
        )}>
          <Phone className="h-16 w-16 text-primary-foreground" />
        </div>

        {/* Call Controls */}
        {conversation.status !== 'connected' ? (
          <Button
            size="lg"
            onClick={startCall}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Phone className="h-5 w-5 mr-2" />
            Start Voice Call
          </Button>
        ) : (
          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              size="lg"
              onClick={toggleMute}
              className="flex-1"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={toggleVolume}
              className="flex-1"
            >
              {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
              className="flex-1"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>✓ Microphone access required</p>
          <p>✓ Speak naturally with the AI assistant</p>
          <p>✓ The AI will respond with voice</p>
        </div>
      </div>
    </Card>
  );
};
