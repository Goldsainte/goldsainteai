import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Mic, MicOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import logomark from "@/assets/logomark-seal-gold.png";
import { RealtimeVoiceChat } from "@/utils/VoiceUtils";
import { WakeWordDetector } from "@/utils/WakeWordDetector";
import { HoldMusicGenerator } from "@/utils/HoldMusicGenerator";
import { CompactFlightCard } from "./CompactFlightCard";
import { CompactHotelCard } from "./CompactHotelCard";
import { CompactCarCard } from "./CompactCarCard";
import { TravelPackageCard } from "./TravelPackageCard";
import { UberProductCard } from "./UberProductCard";
import { UberBookingModal } from "./UberBookingModal";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolResults?: any[]; // Add tool results to messages
}

export const AIBookingConcierge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [selectedUberProduct, setSelectedUberProduct] = useState<any>(null);
  const [isUberModalOpen, setIsUberModalOpen] = useState(false);
  const pushToTalkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const holdMusicRef = useRef<HoldMusicGenerator | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('[AIBookingConcierge] Component rendered, isOpen:', isOpen);

  // Load user's AI agent profile and restore conversation
  useEffect(() => {
    const loadAgentProfile = async () => {
      if (!user) {
        // Set default greeting even without user
        setMessages([{
          role: 'assistant',
          content: `Hello! I'm your Goldsainte AI Concierge.\n\n🎙️ To get started:\n1. Tap the microphone to start voice mode\n2. Or say "Hey Goldsainte" to activate hands-free\n3. Or type your travel request below\n\nI can help you search for flights, hotels, rental cars, restaurants, events - plus check visa requirements. Ready to plan your trip?`
        }]);
        return;
      }
      
      const { data, error } = await supabase
        .from('ai_agent_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setAgentProfile(data);

      // Try to restore recent conversation from localStorage
      const savedConversation = localStorage.getItem('aiConciergeConversation');
      let shouldUseInitialGreeting = true;

      if (savedConversation) {
        try {
          const parsed = JSON.parse(savedConversation);
          const savedTime = new Date(parsed.timestamp).getTime();
          const now = Date.now();
          const hoursSinceLastMessage = (now - savedTime) / (1000 * 60 * 60);

          // Restore conversation if less than 24 hours old and has valid messages
          if (hoursSinceLastMessage < 24 && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            console.log('Restoring conversation from localStorage:', parsed.messages.length, 'messages');
            setMessages(parsed.messages);
            shouldUseInitialGreeting = false;
          } else {
            // Clear old conversation
            console.log('Clearing old conversation');
            localStorage.removeItem('aiConciergeConversation');
          }
        } catch (e) {
          console.error('Failed to parse saved conversation:', e);
          localStorage.removeItem('aiConciergeConversation');
        }
      }

      // Set initial greeting only if not restoring a conversation
      if (shouldUseInitialGreeting) {
        const agentName = "Madison";
        console.log('Setting initial greeting with agent:', agentName);
        setMessages([{
          role: 'assistant',
          content: `Hello! I'm ${agentName}.\n\n🎙️ To get started:\n1. Tap the microphone to start voice mode\n2. Or say "Hey Goldsainte" to activate hands-free\n3. Or type your travel request below\n\nI can help you search for flights, hotels, rental cars, restaurants, events - plus check visa requirements. Ready to plan your trip?`
        }]);
      }
    };

    loadAgentProfile();
  }, [user]);

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

  // Play/stop hold music continuously throughout voice conversation
  useEffect(() => {
    console.log('Hold music state change:', { voiceMode, hasHoldMusic: !!holdMusicRef.current });
    
    if (voiceMode) {
      initHoldMusic();
      console.log('Starting continuous hold music');
      if (holdMusicRef.current) {
        holdMusicRef.current.play();
      }
    } else {
      console.log('Stopping hold music');
      if (holdMusicRef.current) {
        holdMusicRef.current.stop();
      }
    }
  }, [voiceMode]);

  // Handle URL parameters for opening AI chat with destination context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenAI = params.get('aiChat') === 'true';
    const destination = params.get('destination');
    
    if (shouldOpenAI && destination) {
      console.log('[AIBookingConcierge] Opening chat with destination:', destination);
      
      // Clear the URL parameters to avoid re-triggering
      const newParams = new URLSearchParams(location.search);
      newParams.delete('aiChat');
      newParams.delete('destination');
      navigate({ search: newParams.toString() }, { replace: true });
      
      // Open the chat
      setIsOpen(true);
      
      // Check if we should inject the destination message
      // Only inject if conversation is empty or just has the greeting
      const isNewConversation = messages.length <= 1;
      
      if (isNewConversation) {
        const destinationPrompt = `I'm interested in planning a trip to ${destination}. Can you help me explore options and suggest activities, accommodations, and experiences?`;
        
        // Wait a bit for the component to fully open before sending
        setTimeout(() => {
          sendProgrammaticMessage(destinationPrompt);
        }, 500);
      }
    }
  }, [location.search]);

  // Save conversation data to localStorage for seamless handoff
  const saveConversationData = () => {
    const conversationData = {
      messages,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('aiConciergeConversation', JSON.stringify(conversationData));
  };

  // Clear conversation and start fresh
  const clearConversation = () => {
    localStorage.removeItem('aiConciergeConversation');
    
    // Reset to initial greeting with detailed instructions
    const agentName = "Madison";
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm ${agentName}.\n\n🎙️ To get started:\n1. Tap the microphone to start voice mode\n2. Or say "Hey Goldsainte" to activate hands-free\n3. Or type your travel request below\n\nI can help you search for flights, hotels, rental cars, restaurants, events - plus check visa requirements. Ready to plan your trip?`
    }]);

    toast({
      title: "Conversation Cleared",
      description: "Starting fresh!",
    });
  };

  const handleSend = async () => {
    console.log('[AIBookingConcierge] handleSend called, input:', input, 'isLoading:', isLoading);
    
    if (!input.trim() || isLoading) {
      console.log('[AIBookingConcierge] handleSend blocked - empty input or loading');
      return;
    }

    const userMessage = input.trim();
    console.log('[AIBookingConcierge] Sending message:', userMessage);
    
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    saveConversationData();

    try {
      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-booking-concierge`;
      console.log('[AIBookingConcierge] Calling edge function:', CHAT_URL);
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }],
          stream: false,  // Disable streaming to allow tool execution
          agentProfile: agentProfile  // Pass agent profile to backend
        }),
      });

      console.log('[AIBookingConcierge] Response status:', resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[AIBookingConcierge] Error response:', errorText);
        
        // Handle specific error codes
        if (resp.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (resp.status === 402) {
          throw new Error("Service temporarily unavailable. Please try again later.");
        }
        if (resp.status === 504 || resp.status === 524) {
          throw new Error("Request timed out while searching. This can happen with complex travel searches. Please try again or simplify your request.");
        }
        
        throw new Error("Failed to get response. Please try again.");
      }

      const data = await resp.json();
      console.log('[AIBookingConcierge] Response data:', data);
      
      // Update assistant message with response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: data.content || data.message || "I apologize, I encountered an issue. Please try again.",
          toolResults: Array.isArray(data.toolResults) ? data.toolResults : []
        };
        return newMessages;
      });

      saveConversationData();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      
      // Update the assistant message with error
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant' && !newMessages[newMessages.length - 1].content) {
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: `I apologize, but ${errorMessage.toLowerCase()}`
          };
        }
        return newMessages;
      });
      
      toast({
        title: "Error",
        description: errorMessage,
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

  const sendProgrammaticMessage = async (messageContent: string) => {
    console.log('[AIBookingConcierge] Sending programmatic message:', messageContent);
    
    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    saveConversationData();

    try {
      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-booking-concierge`;
      console.log('[AIBookingConcierge] Calling edge function:', CHAT_URL);
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          stream: false,
          agentProfile: agentProfile
        }),
      });

      console.log('[AIBookingConcierge] Response status:', resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[AIBookingConcierge] Error response:', errorText);
        
        if (resp.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive",
          });
          throw new Error("Rate limit exceeded");
        }
        if (resp.status === 402) {
          toast({
            title: "AI usage limit reached",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
          throw new Error("Payment required");
        }
        
        throw new Error("Failed to get response");
      }

      const data = await resp.json();
      console.log('[AIBookingConcierge] Response data:', data);
      
      // Update assistant message with response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: data.content || data.message || "I apologize, I encountered an issue. Please try again.",
          toolResults: Array.isArray(data.toolResults) ? data.toolResults : []
        };
        return newMessages;
      });

      saveConversationData();
    } catch (error) {
      console.error('[AIBookingConcierge] Error:', error);
      
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant' && !newMessages[newMessages.length - 1].content) {
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: "I apologize, but I encountered an error. Please try again."
          };
        }
        return newMessages;
      });
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceMode = async () => {
    if (!voiceMode) {
      try {
        console.log('📞 Starting voice mode...');
        setVoiceStatus('connecting');

        // Pause wake word while in active voice call to avoid mic conflicts
        if (wakeWordDetectorRef.current) {
          console.log('⏸️ Pausing wake word detection during voice call');
          wakeWordDetectorRef.current.stop();
          setWakeWordActive(false);
        }
        
        const getSessionToken = async () => {
          try {
            const { data, error } = await supabase.functions.invoke('realtime-voice-session', {
              body: { agentProfile }
            });
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
              // AI is responding - stop processing state
              console.log('AI is responding, stopping processing state');
              setIsProcessing(false);
              
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
              saveConversationData();
            } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
              // User finished speaking - start processing state
              console.log('User finished speaking, starting processing state');
              setIsProcessing(true);
              setMessages(prev => [...prev, { role: 'user', content: message.transcript }]);
              saveConversationData();
              
              // Bridge voice Uber requests to text mode backend
              const transcript = message.transcript.toLowerCase();
              if ((transcript.includes('uber') || transcript.includes('ride') || transcript.includes('transport')) &&
                  (transcript.includes('from') || transcript.includes('to'))) {
                
                const fromMatch = transcript.match(/from\s+([^to]+?)(?:\s+to|$)/i);
                const toMatch = transcript.match(/to\s+(.+?)(?:\.|$|from)/i);
                
                if (fromMatch && toMatch) {
                  const from = fromMatch[1].trim();
                  const to = toMatch[1].trim();
                  
                  toast({
                    title: "Fetching Uber Options",
                    description: "Check the chat below for live pricing!",
                  });
                  
                  setTimeout(() => {
                    sendProgrammaticMessage(
                      `Get Uber price estimates from ${from} to ${to} and show me the options with pricing.`
                    );
                  }, 1000);
                }
              }
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
        console.log('✅ Voice mode activated successfully');
        
        toast({
          title: "Voice Mode Active",
          description: "Speak naturally - no need to say 'Hey Goldsainte'",
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
      console.log('📴 Ending voice mode...');
      voiceChatRef.current?.disconnect();
      setVoiceMode(false);
      setVoiceStatus('disconnected');
      setIsProcessing(false);
      // Stop hold music
      if (holdMusicRef.current) {
        holdMusicRef.current.stop();
      }
      // Resume wake word listening after call ends
      console.log('▶️ Resuming wake word detection');
      startWakeWordDetection();
    }
  };

  const startWakeWordDetection = async () => {
    try {
      console.log('🎤 Starting wake word detection...');
      wakeWordDetectorRef.current = new WakeWordDetector(() => {
        console.log('🎉 Wake word "Hey Goldsainte" detected! Activating voice mode...');
        if (!voiceMode) {
          toggleVoiceMode();
        }
      });

      const started = await wakeWordDetectorRef.current.start();
      console.log('Wake word detection started:', started);
      if (started) {
        setWakeWordActive(true);
        toast({
          title: "Wake Word Active",
          description: "Say 'Hey Goldsainte' to activate voice mode",
        });
      }
    } catch (error) {
      console.error('❌ Wake word error:', error);
      toast({
        title: "Wake Word Unavailable",
        description: "Please use the microphone button instead",
        variant: "destructive",
      });
    }
  };

  const handlePushToTalkStart = async () => {
    if (isPushToTalkActive || voiceMode) return;
    
    setIsPushToTalkActive(true);
    
    // Stop wake word detection while push-to-talk is active
    if (wakeWordDetectorRef.current) {
      wakeWordDetectorRef.current.stop();
      setWakeWordActive(false);
    }
    
    // Start voice mode
    await toggleVoiceMode();
  };

  const handlePushToTalkEnd = () => {
    if (!isPushToTalkActive) return;
    
    setIsPushToTalkActive(false);
    
    // Add a small delay before ending to ensure last audio is captured
    if (pushToTalkTimerRef.current) {
      clearTimeout(pushToTalkTimerRef.current);
    }
    
    pushToTalkTimerRef.current = setTimeout(() => {
      if (voiceMode) {
        toggleVoiceMode();
      }
      // Resume wake word detection
      startWakeWordDetection();
    }, 500);
  };

  useEffect(() => {
    // Start wake word detection when widget is opened (user interaction)
    if (isOpen && !wakeWordDetectorRef.current) {
      startWakeWordDetection();
    }

    return () => {
      voiceChatRef.current?.disconnect();
      wakeWordDetectorRef.current?.stop();
      if (pushToTalkTimerRef.current) {
        clearTimeout(pushToTalkTimerRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              console.log('[AIBookingConcierge] Button clicked, opening widget');
              setIsOpen(true);
            }}
            className="fixed bottom-24 md:bottom-28 right-6 z-50 group"
            aria-label="Open AI Booking Concierge"
            data-tour="ai-widget"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-md opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative bg-gradient-to-br from-primary to-accent p-2.5 md:p-3 rounded-full shadow-xl hover:scale-110 transition-transform">
                <img 
                  src={logomark} 
                  alt="Goldsainte AI Concierge" 
                  className="w-7 h-7 md:w-6 md:h-6 object-contain"
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
      className={`fixed bottom-20 md:bottom-28 right-6 z-50 shadow-2xl border-2 border-primary/20 transition-all ${
        isMinimized ? 'w-80 md:w-80' : 'w-[calc(100vw-3rem)] md:w-96 max-w-md'
      } ${isMinimized ? 'h-16' : 'h-[70vh] md:h-[600px] max-h-[70vh] md:max-h-[600px]'}`}
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
              {wakeWordActive && !voiceMode ? "Listening for 'Hey Goldsainte'" : "Powered by Goldsainte"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearConversation}
                className="text-primary-foreground hover:bg-white/10 h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear conversation</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground hover:bg-white/10 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          <ScrollArea className="h-[calc(70vh-180px)] md:h-[calc(600px-180px)] p-3" ref={scrollRef}>
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
                      <p className="text-[11px] md:text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
                    
                    // Display flight search results
                    if (result.data && Array.isArray(result.data) && result.data.length > 0 && result.data[0].itineraries) {
                      return (
                        <div key={resultIdx} className="mt-2 ml-8 space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">Top {Math.min(3, result.data.length)} flight options:</p>
                          {result.data.slice(0, 3).map((flight: any, flightIdx: number) => (
                            <CompactFlightCard 
                              key={flightIdx} 
                              flight={flight} 
                              dictionaries={result.dictionaries}
                            />
                          ))}
                        </div>
                      );
                    }
                    
                    // Display hotel search results
                    if (result.results && Array.isArray(result.results) && result.results.length > 0) {
                      return (
                        <div key={resultIdx} className="mt-2 ml-8 space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">Top {Math.min(3, result.results.length)} hotel options:</p>
                          {result.results.slice(0, 3).map((hotel: any, hotelIdx: number) => (
                            <CompactHotelCard 
                              key={hotelIdx} 
                              property={hotel}
                            />
                          ))}
                        </div>
                      );
                    }
                    
                    // Display car rental search results
                    if (result.data && Array.isArray(result.data) && result.data.length > 0 && result.data[0].vehicle) {
                      return (
                        <div key={resultIdx} className="mt-2 ml-8 space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">Top {Math.min(3, result.data.length)} car rental options:</p>
                          {result.data.slice(0, 3).map((car: any, carIdx: number) => (
                            <CompactCarCard 
                              key={carIdx} 
                              car={car}
                            />
                          ))}
                        </div>
                      );
                    }
                    
                    // Display travel package results
                    if (result.success && result.package) {
                      return (
                        <div key={resultIdx} className="mt-2 ml-8">
                          <p className="text-xs text-muted-foreground mb-2">Travel Package Created:</p>
                          <TravelPackageCard 
                            packageData={result.package}
                            onBook={() => {
                              toast({
                                title: "Package Booking",
                                description: "Package booking will be available soon!",
                              });
                            }}
                          />
                        </div>
                      );
                    }
                    
                    // Render Uber products
                    if (result.name === 'get_uber_estimate' && result.data?.products) {
                      return (
                        <div key={resultIdx} className="space-y-3">
                          {result.data.products.map((product: any) => (
                            <UberProductCard
                              key={product.product_id}
                              product={product}
                              onBook={() => {
                                setSelectedUberProduct({
                                  ...product,
                                  pickupLat: String(result.data.pickupLatitude || ''),
                                  pickupLng: String(result.data.pickupLongitude || ''),
                                  dropoffLat: String(result.data.dropoffLatitude || ''),
                                  dropoffLng: String(result.data.dropoffLongitude || ''),
                                });
                                setIsUberModalOpen(true);
                              }}
                            />
                          ))}
                        </div>
                      );
                    }

                    // Render Uber ride confirmation
                    if (result.name === 'request_uber_ride' && result.data?.success) {
                      return (
                        <Card key={resultIdx} className="bg-green-50 dark:bg-green-900/20">
                          <CardHeader>
                            <CardTitle className="text-sm">✓ Ride Confirmed!</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs">
                            <p>Your Uber is on the way!</p>
                          </CardContent>
                        </Card>
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
          <div className="p-4 md:p-3 border-t border-border bg-background">
            <div className="flex gap-2 mb-3">
              {!voiceMode && (
                <>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your travel request..."
                    className="flex-1 text-sm h-12 md:h-11"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 h-12 w-12 md:h-11 md:w-11 shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </>
              )}
              {voiceMode && (
                <div className="flex-1 flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  {isProcessing ? 'Processing your request...' : 'Voice mode active - speak naturally'}
                </div>
              )}
              
              {/* Voice mode toggle (microphone) */}
              <Button
                onClick={toggleVoiceMode}
                size="icon"
                variant={voiceMode ? "default" : "outline"}
                className={`h-14 w-14 md:h-12 md:w-12 shrink-0 ${voiceMode ? "bg-gradient-to-r from-green-500 to-green-600" : ""}`}
                disabled={voiceStatus === 'connecting'}
                title={voiceMode ? "End voice" : "Start voice"}
              >
                {voiceMode ? <MicOff className="h-6 w-6 md:h-5 md:w-5" /> : <Mic className="h-6 w-6 md:h-5 md:w-5" />}
              </Button>
            </div>
            {/* Helper text */}
            <p className="text-[11px] leading-tight text-muted-foreground text-center px-2">
              {voiceMode 
                ? "Voice mode active — speak naturally or tap to end"
                : "Tap the microphone to start voice mode, or type below"}
             </p>
          </div>
        </>
      )}
      
      {selectedUberProduct && (
        <UberBookingModal
          isOpen={isUberModalOpen}
          onClose={() => setIsUberModalOpen(false)}
          productId={selectedUberProduct.product_id}
          productName={selectedUberProduct.display_name}
          pickupLat={selectedUberProduct.pickupLat}
          pickupLng={selectedUberProduct.pickupLng}
          dropoffLat={selectedUberProduct.dropoffLat}
          dropoffLng={selectedUberProduct.dropoffLng}
        />
      )}
    </Card>
  );
};
