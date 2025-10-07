import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Minimize2, Maximize2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logomark from "@/assets/logomark-seal-gold.png";
import { RealtimeVoiceChat } from "@/utils/VoiceUtils";
import { WakeWordDetector } from "@/utils/WakeWordDetector";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIBookingConcierge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your Goldsainte AI Concierge. How may I assist you with your travel plans today? Feel free to say 'Hey Goldsainte' to activate voice mode, or type your request."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-booking-concierge', {
        body: {
          messages: [
            ...messages,
            { role: 'user', content: userMessage }
          ]
        }
      });

      if (error) {
        console.error('Concierge error:', error);
        toast({
          title: "Error",
          description: "Failed to get response. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message
      }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceMode = async () => {
    if (!voiceMode) {
      try {
        setVoiceStatus('connecting');

        // Pause wake word while in active voice call to avoid mic conflicts
        if (wakeWordDetectorRef.current) {
          wakeWordDetectorRef.current.stop();
          setWakeWordActive(false);
        }
        
        const getSessionToken = async () => {
          const { data, error } = await supabase.functions.invoke('realtime-voice-session');
          if (error) throw error;
          return data.client_secret.value;
        };

        let currentAssistantMessage = '';

        voiceChatRef.current = new RealtimeVoiceChat(
          (message) => {
            console.log('Voice message:', message);
            
            if (message.type === 'response.audio_transcript.delta') {
              currentAssistantMessage += message.delta;
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === 'assistant' && lastMsg.content === currentAssistantMessage.slice(0, -message.delta.length)) {
                  return [...prev.slice(0, -1), { role: 'assistant', content: currentAssistantMessage }];
                }
                return [...prev, { role: 'assistant', content: currentAssistantMessage }];
              });
            } else if (message.type === 'response.audio_transcript.done') {
              currentAssistantMessage = '';
            } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
              setMessages(prev => [...prev, { role: 'user', content: message.transcript }]);
            }
          },
          (status) => setVoiceStatus(status as any)
        );

        await voiceChatRef.current.init(getSessionToken);
        setVoiceMode(true);
        
        toast({
          title: "Voice Mode Active",
          description: "You can now speak naturally with the AI concierge",
        });
      } catch (error) {
        console.error('Voice error:', error);
        setVoiceStatus('error');
        toast({
          title: "Voice Error",
          description: "Failed to start voice mode",
          variant: "destructive",
        });
      }
    } else {
      voiceChatRef.current?.disconnect();
      setVoiceMode(false);
      setVoiceStatus('disconnected');
      // Resume wake word listening after call ends
      startWakeWordDetection();
    }
  };

  const startWakeWordDetection = async () => {
    try {
      wakeWordDetectorRef.current = new WakeWordDetector(() => {
        console.log('Wake word triggered!');
        if (!voiceMode) {
          toggleVoiceMode();
        }
      });

      const started = await wakeWordDetectorRef.current.start();
      if (started) {
        setWakeWordActive(true);
        toast({
          title: "Wake Word Active",
          description: "Say 'Hey Goldsainte' to activate voice mode",
        });
      }
    } catch (error) {
      console.error('Wake word error:', error);
      toast({
        title: "Wake Word Unavailable",
        description: "Please use the microphone button instead",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Start wake word detection on mount
    startWakeWordDetection();

    return () => {
      voiceChatRef.current?.disconnect();
      wakeWordDetectorRef.current?.stop();
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Open AI Booking Concierge"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="relative bg-gradient-to-br from-primary to-accent p-4 rounded-full shadow-2xl hover:scale-110 transition-transform">
            <img 
              src={logomark} 
              alt="Goldsainte AI Concierge" 
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>
      </button>
    );
  }

  return (
    <Card 
      className={`fixed bottom-6 right-6 z-50 shadow-2xl border-2 border-primary/20 transition-all ${
        isMinimized ? 'w-80' : 'w-96'
      } ${isMinimized ? 'h-16' : 'h-[600px]'}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logomark} alt="Goldsainte" className="w-8 h-8 object-contain" />
            {wakeWordActive && !voiceMode && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-primary-foreground">AI Concierge</h3>
            <p className="text-xs text-primary-foreground/80">
              {wakeWordActive && !voiceMode ? "Listening for 'Hey Goldsainte'" : "Powered by Goldsainte"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-primary-foreground hover:bg-white/10"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          <ScrollArea className="h-[calc(600px-140px)] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <img 
                        src={logomark} 
                        alt="Goldsainte" 
                        className="w-8 h-8 object-contain rounded-full bg-gradient-to-br from-primary to-accent p-1"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="flex-shrink-0">
                    <img 
                      src={logomark} 
                      alt="Goldsainte" 
                      className="w-8 h-8 object-contain rounded-full bg-gradient-to-br from-primary to-accent p-1"
                    />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              {!voiceMode && (
                <>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your travel request..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </>
              )}
              {voiceMode && (
                <div className="flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Voice mode active - speak naturally
                </div>
              )}
              <Button
                onClick={toggleVoiceMode}
                size="icon"
                variant={voiceMode ? "default" : "outline"}
                className={voiceMode ? "bg-gradient-to-r from-primary to-accent" : ""}
                disabled={voiceStatus === 'connecting'}
              >
                {voiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                onClick={async () => {
                  if (wakeWordActive) {
                    wakeWordDetectorRef.current?.stop();
                    setWakeWordActive(false);
                    toast({ title: "Wake Word Disabled" });
                  } else {
                    await startWakeWordDetection();
                  }
                }}
                variant={wakeWordActive ? "default" : "outline"}
              >
                {wakeWordActive ? "Wake On" : "Enable Wake"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
