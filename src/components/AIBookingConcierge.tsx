import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Minimize2, Maximize2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logomark from "@/assets/logomark-seal-gold.png";
import { RealtimeVoiceChat } from "@/utils/VoiceUtils";
import { WakeWordDetector } from "@/utils/WakeWordDetector";
import { HoldMusicGenerator } from "@/utils/HoldMusicGenerator";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolResults?: any[]; // Add tool results to messages
}

export const AIBookingConcierge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your Goldsainte AI Concierge.\n\nTo get started:\n1. Make sure your microphone is unmuted\n2. Say 'Hey Goldsainte' to activate voice mode\n3. Or type your travel request below\n\nI can help you search AND book flights, hotels, rental cars, restaurants, events - plus check visa requirements. Ready to plan your trip?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const holdMusicRef = useRef<HoldMusicGenerator | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize hold music generator lazily on first use
  const initHoldMusic = () => {
    if (!holdMusicRef.current) {
      console.log('Initializing hold music generator');
      holdMusicRef.current = new HoldMusicGenerator();
    }
  };

  useEffect(() => {
    return () => {
      if (holdMusicRef.current) {
        console.log('Cleaning up hold music');
        holdMusicRef.current.cleanup();
        holdMusicRef.current = null;
      }
    };
  }, []);

  // Detect "hold on" phrases in assistant messages to trigger hold music
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const content = lastMessage.content.toLowerCase();
      const holdPhrases = [
        'hold on',
        'hold please',
        'please hold',
        'one moment',
        'just a moment',
        'one sec',
        'just a sec',
        'give me a moment',
        "i'll be back shortly",
        'ill be back shortly',
        'be back shortly',
        'be right back',
        'let me search',
        'searching for',
        'looking for',
        'checking',
        'checking availability',
        'retrieving rates',
        'finding',
        'curating options',
        'gathering options',
        'bringing back options',
        'options to consider'
      ];

      const stopPhrases = [
        "here are",
        "here's",
        "i found",
        "i've found",
        'results',
        'top options',
        'option 1',
        'option one'
      ];
      
      const shouldPlayMusic = holdPhrases.some(phrase => content.includes(phrase));
      const shouldStopMusic = stopPhrases.some(phrase => content.includes(phrase)) || content.length > 50;
      
      if (shouldPlayMusic) {
        console.log('Detected hold phrase, starting music');
        initHoldMusic();
        holdMusicRef.current?.play();
      } else if (shouldStopMusic) {
        // If assistant gives a substantial response or stop phrase, stop the music
        console.log('Stop phrase or substantial response detected, stopping music');
        holdMusicRef.current?.stop();
      }
    }
  }, [messages]);

  // Save conversation data to localStorage for seamless handoff
  const saveConversationData = () => {
    const conversationData = {
      messages,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('aiConciergeConversation', JSON.stringify(conversationData));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Ensure audio is unlocked for hold music during text processing
    initHoldMusic();
    try { await holdMusicRef.current?.unlock?.(); } catch {}

    setIsLoading(true);
    saveConversationData();

    try {
      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-booking-concierge`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }],
          stream: true 
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let accumulatedContent = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              // Assistant started responding - stop hold music
              holdMusicRef.current?.stop?.();
              accumulatedContent += content;
              // Update the last message with accumulated content
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: accumulatedContent
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      saveConversationData();
    } catch (error) {
      console.error('Error:', error);
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
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

        // Ensure audio is unlocked for hold music
        initHoldMusic();
        await holdMusicRef.current?.unlock?.();

        // Pause wake word while in active voice call to avoid mic conflicts
        if (wakeWordDetectorRef.current) {
          wakeWordDetectorRef.current.stop();
          setWakeWordActive(false);
        }
        
        const getSessionToken = async () => {
          try {
            const { data, error } = await supabase.functions.invoke('realtime-voice-session');
            if (error) {
              console.error('Session token error:', error);
              throw new Error('Failed to connect to voice service. Please try again.');
            }
            if (!data?.client_secret?.value) {
              throw new Error('Invalid session token received');
            }
            return data.client_secret.value;
          } catch (err) {
            console.error('Token fetch error:', err);
            throw new Error('Unable to connect to voice service');
          }
        };

        let currentAssistantMessage = '';
        let isAssistantSpeaking = false;

        voiceChatRef.current = new RealtimeVoiceChat(
          (message) => {
            console.log('Voice message:', message);
            
            if (message.type === 'response.audio_transcript.delta' || message.type === 'response.audio.delta') {
              // AI is responding - stop processing state and any hold music
              console.log('AI is responding, stopping processing state');
              setIsProcessing(false);
              holdMusicRef.current?.stop?.();
              
              if (message.type === 'response.audio_transcript.delta') {
                if (!isAssistantSpeaking) {
                  isAssistantSpeaking = true;
                  currentAssistantMessage = '';
                }
                currentAssistantMessage += message.delta;
                setMessages(prev => {
                  const filtered = prev.filter(m => !(m.role === 'assistant' && m.content === ''));
                  const lastMsg = filtered[filtered.length - 1];
                  if (lastMsg?.role === 'assistant' && isAssistantSpeaking) {
                    return [...filtered.slice(0, -1), { role: 'assistant', content: currentAssistantMessage }];
                  }
                  return [...filtered, { role: 'assistant', content: currentAssistantMessage }];
                });
                saveConversationData();
              }
            } else if (message.type === 'response.audio_transcript.done') {
              console.log('AI finished speaking');
              isAssistantSpeaking = false;
              setIsProcessing(false);
              holdMusicRef.current?.stop?.();
              saveConversationData();
            } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
              // User finished speaking - start processing state
              console.log('User finished speaking, starting processing state');
              setIsProcessing(true);
              setMessages(prev => [...prev, { role: 'user', content: message.transcript }]);
              saveConversationData();
            } else if (message.type === 'input_audio_buffer.speech_stopped') {
              // User stopped speaking - start processing
              console.log('Speech stopped, starting processing state');
              setIsProcessing(true);
            } else if (message.type === 'response.created') {
              // AI is starting to respond - might help catch the processing state earlier
              console.log('Response created, AI is thinking');
              setIsProcessing(true);
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
      } catch (error: any) {
        console.error('Voice error:', error);
        setVoiceStatus('error');
        
        // Provide specific error messages
        let errorMessage = "Failed to start voice mode";
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.name === 'NotAllowedError') {
          errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
        } else if (error?.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        } else if (error?.name === 'NotReadableError') {
          errorMessage = "Microphone is being used by another application. Please close other apps using the microphone.";
        }
        
        toast({
          title: "Voice Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Resume wake word detection if voice mode fails
        startWakeWordDetection();
      }
    } else {
      voiceChatRef.current?.disconnect();
      setVoiceMode(false);
      setVoiceStatus('disconnected');
      setIsProcessing(false);
      // Stop hold music
      if (holdMusicRef.current) {
        holdMusicRef.current.stop();
      }
      // Resume wake word listening after call ends
      startWakeWordDetection();
    }
  };

  const startWakeWordDetection = async () => {
    try {
      // Try Picovoice first (works on iOS)
      const { PicovoiceWakeWordDetector } = await import('@/utils/PicovoiceWakeWordDetector');
      const picoDetector = new PicovoiceWakeWordDetector(() => {
        console.log('Wake word triggered!');
        if (!voiceMode) {
          toggleVoiceMode();
        }
      });

      const started = await picoDetector.start();
      if (started) {
        wakeWordDetectorRef.current = picoDetector as any;
        setWakeWordActive(true);
        toast({
          title: "Wake Word Active",
          description: "Say 'Hey Sainte' to activate voice mode",
        });
        return;
      }
    } catch (picoError) {
      console.log('Picovoice not available, falling back to Web Speech API:', picoError);
    }

    // Fallback to Web Speech API
    try {
      const { WakeWordDetector } = await import('@/utils/WakeWordDetector');
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
    // Start wake word detection when widget is opened (user interaction)
    if (isOpen && !wakeWordDetectorRef.current) {
      startWakeWordDetection();
    }

    return () => {
      voiceChatRef.current?.disconnect();
      wakeWordDetectorRef.current?.stop();
    };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => { setIsOpen(true); initHoldMusic(); holdMusicRef.current?.unlock?.(); }}
            className="fixed bottom-6 right-6 z-50 group"
            aria-label="Open AI Booking Concierge"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative bg-gradient-to-br from-primary to-accent p-4 md:p-5 rounded-full shadow-2xl hover:scale-110 transition-transform">
                <img 
                  src={logomark} 
                  alt="Goldsainte AI Concierge" 
                  className="w-10 h-10 md:w-8 md:h-8 object-contain"
                />
              </div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Ask Goldsainte AI Mode</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Card 
      className={`fixed bottom-6 right-6 z-50 shadow-2xl border-2 border-primary/20 transition-all ${
        isMinimized ? 'w-80 md:w-80' : 'w-[calc(100vw-3rem)] md:w-96 max-w-md'
      } ${isMinimized ? 'h-16' : 'h-[70vh] md:h-[600px] max-h-[600px]'}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logomark} alt="Goldsainte" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            {wakeWordActive && !voiceMode && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-serif text-lg md:text-xl font-bold text-primary-foreground">AI Concierge</h3>
            <p className="text-xs text-primary-foreground/80">
              {wakeWordActive && !voiceMode ? "Listening for 'Hey Sainte'" : "Powered by Goldsainte"}
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
          <ScrollArea className="h-[calc(70vh-140px)] md:h-[calc(600px-140px)] p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx}>
                  <div
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <img 
                          src={logomark} 
                          alt="Goldsainte" 
                          className="w-6 h-6 object-contain rounded-full bg-gradient-to-br from-primary to-accent p-1"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                  
                  {/* Display tool results */}
                  {msg.toolResults && msg.toolResults.length > 0 && msg.toolResults.map((result, resultIdx) => {
                    // Handle agent inquiry confirmation
                    if (result.success && result.inquiryId) {
                      return (
                        <div key={resultIdx} className="mt-2 ml-8">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800 font-medium">
                              ✓ {result.message || "Your request has been received! A Goldsainte agent will contact you shortly."}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle payment link from booking
                    if (result.url && result.sessionId) {
                      return (
                        <div key={resultIdx} className="mt-2 ml-8">
                          <Button 
                            onClick={() => window.open(result.url, '_blank')}
                            className="w-full bg-primary hover:bg-primary/90"
                          >
                            Complete Payment to Confirm Booking
                          </Button>
                        </div>
                      );
                    }
                    
                    // Display search results
                    if (result.results && Array.isArray(result.results) && result.results.length > 0) {
                      return (
                        <div key={resultIdx} className="mt-2 ml-8 space-y-2">
                          {result.results.slice(0, 3).map((hotel: any, hotelIdx: number) => (
                            <div key={hotelIdx} className="bg-card border border-border rounded-lg p-3 text-xs">
                              <div className="flex gap-3">
                                {hotel.photos && hotel.photos[0] && (
                                  <img 
                                    src={hotel.photos[0]} 
                                    alt={hotel.name}
                                    className="w-20 h-20 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm truncate">{hotel.name}</h4>
                                  <p className="text-muted-foreground truncate">{hotel.city}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {hotel.rating > 0 && (
                                      <span className="text-yellow-500">★ {hotel.rating.toFixed(1)}</span>
                                    )}
                                    <span className="font-semibold text-primary">
                                      ${hotel.price?.toFixed(2)}/night
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="flex-shrink-0">
                    <img 
                      src={logomark} 
                      alt="Goldsainte" 
                      className="w-6 h-6 object-contain rounded-full bg-gradient-to-br from-primary to-accent p-1"
                    />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              {!voiceMode && (
                <>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your travel request..."
                    className="flex-1 text-sm h-10"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </>
              )}
              {voiceMode && (
                <div className="flex-1 flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  {isProcessing ? 'Processing your request...' : 'Voice mode active - speak naturally'}
                </div>
              )}
              <Button
                onClick={toggleVoiceMode}
                size="icon"
                variant={voiceMode ? "default" : "outline"}
                className={`h-10 w-10 ${voiceMode ? "bg-gradient-to-r from-primary to-accent" : ""}`}
                disabled={voiceStatus === 'connecting'}
                title={voiceMode ? "Stop listening" : "Start listening"}
              >
                {voiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            </div>
            {/* Mobile helper text */}
            <p className="text-xs text-muted-foreground mt-2 md:hidden text-center">
              {wakeWordActive ? "Say 'Hey Sainte' or tap mic button" : "Tap mic button to start voice chat"}
            </p>
          </div>
        </>
      )}
    </Card>
  );
};
