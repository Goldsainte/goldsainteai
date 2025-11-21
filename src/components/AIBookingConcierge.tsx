import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Mic, MicOff, Trash2, Filter, Radio, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import logomark from "@/assets/logomark-seal-gold.png";
import { RealtimeVoiceChat } from "@/utils/VoiceUtils";
import { WakeWordDetector } from "@/utils/WakeWordDetector";
import { HoldMusicGenerator } from "@/utils/HoldMusicGenerator";
import { HoldMusicController } from "@/utils/HoldMusicController";
import { BackgroundMusicController } from "@/utils/BackgroundMusicController";
import { CompactFlightCard } from "./CompactFlightCard";
import { CompactHotelCard } from "./CompactHotelCard";
import { CompactCarCard } from "./CompactCarCard";
import { CompactActivityCard } from "./CompactActivityCard";
import { TravelPackageCard } from "./TravelPackageCard";
import { UberProductCard } from "./UberProductCard";
import { UberBookingModal } from "./UberBookingModal";
import { AIChatSettingsPanel, DEFAULT_PREFERENCES, type ChatPreferences, countNonDefaultPreferences } from "./AIChatSettingsPanel";
import { VoiceDiagnosticsPanel } from "./VoiceDiagnosticsPanel";
import { WelcomeCard } from "./concierge/WelcomeCard";
import { VoiceStatusChip } from "./concierge/VoiceStatusChip";
import { VoiceStatusMessage } from "./concierge/VoiceStatusMessage";
import { ResultCards } from "./concierge/ResultCards";
import { useLanguage } from "@/contexts/LanguageContext";
import { StartStoryboardFromChat } from "./concierge/StartStoryboardFromChat";
import { ConciergeIntroModal } from "./concierge/ConciergeIntroModal";
import { MusicIndicator } from "./concierge/MusicIndicator";
import { useMadisonConversation } from "@/hooks/useMadisonConversation";

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'needs-user-gesture'>('disconnected');
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [selectedUberProduct, setSelectedUberProduct] = useState<any>(null);
  const [isUberModalOpen, setIsUberModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showAutoplayPrompt, setShowAutoplayPrompt] = useState(false);
  const [showUnmute, setShowUnmute] = useState(false);
  const [showBgMusicPrompt, setShowBgMusicPrompt] = useState(false);
  const [showWelcomeCard, setShowWelcomeCard] = useState(true);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    return localStorage.getItem('conciergeIntroSeen') === 'true';
  });
  const [preferences, setPreferences] = useState<ChatPreferences>(() => {
    const saved = localStorage.getItem('aiChatPreferences');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });
  const hotelFilter = preferences.hotels.filter;
  const customPrefsCount = countNonDefaultPreferences(preferences);
  
  const handleQuickReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem('aiChatPreferences', JSON.stringify(DEFAULT_PREFERENCES));
    toast({
      title: "Settings Reset",
      description: "All preferences restored to defaults.",
    });
  };
  const pushToTalkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const holdMusicRef = useRef<HoldMusicGenerator | null>(null);
  const musicControllerRef = useRef<HoldMusicController | null>(null);
  const bgMusicRef = useRef<BackgroundMusicController | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const resamplerNodeRef = useRef<AudioWorkletNode | null>(null);
  const keepAliveOscRef = useRef<OscillatorNode | null>(null);
  const [wakeWordPrimed, setWakeWordPrimed] = useState(false);
  const [diagMetrics, setDiagMetrics] = useState({
    micPermission: 'unknown' as PermissionState | 'unknown',
    micStreamActive: false,
    audioContextState: 'suspended' as AudioContextState,
    sampleRate: 0,
    channels: 1,
    bufferSize: 0,
    rms: 0,
    peak: 0,
    score: 0,
    maxScore: 0,
    threshold: 0.35,
    droppedFrames: 0,
    framesToKWS: 0,
    lastKWSSampleRate: 0,
    stateMachine: 'idle',
    modelVersion: 'web-speech-api-v1',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useMadisonConversation();

  /**
   * Check with the madison-chat edge function whether this message
   * should create a trip + storyboard. If so, navigate to the trip page.
   *
   * Returns true if it handled navigation (trip created), false otherwise.
   */
  const checkMadisonTripIntent = async (userMessage: string): Promise<boolean> => {
    try {
      if (!user?.id) {
        console.warn("[AIBookingConcierge] No user ID, skipping madison-chat intent check");
        return false;
      }

      console.log("[AIBookingConcierge] Calling madison-chat for intent detection");

      const { data, error } = await supabase.functions.invoke("madison-chat", {
        body: {
          message: userMessage,
          userId: user.id,
        },
      });

      if (error) {
        console.error("[AIBookingConcierge] madison-chat error:", error);
        return false;
      }

      console.log("[AIBookingConcierge] madison-chat response:", data);

      if (data && data.action === "create_trip" && data.trip) {
        const destination =
          (data.trip as any).destination || "your destination";

        // Extract Madison's response message
        const assistantMessage: string =
          data.message ??
          `Amazing choice! I've started planning your trip to ${destination}. I've also created a storyboard so we can design your itinerary.`;

        // Show Madison's confirmation in the chat UI
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: assistantMessage,
          },
        ]);

        toast({
          title: "Trip created",
          description: `Planning your trip to ${destination}`,
        });

        // Navigate to storyboard editor with concierge context
        navigate(`/trip/${(data.trip as any).id}/storyboard?from=concierge`);

        return true;
      }

      return false;
    } catch (err) {
      console.error("[AIBookingConcierge] Error in checkMadisonTripIntent:", err);
      return false;
    }
  };

  const safelyCancelSpeechSynthesis = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch (error) {
      console.warn('Failed to cancel speech synthesis', error);
    }
  };

  const safelyStopHoldMusic = () => {
    try {
      holdMusicRef.current?.stop();
    } catch (error) {
      console.warn('Failed to stop hold music', error);
    }
  };

  // Check if Web Speech API is supported (Safari fallback detection)
  const speechSupported = typeof (window as any).SpeechRecognition !== "undefined" ||
                          typeof (window as any).webkitSpeechRecognition !== "undefined";

  console.log('[AIBookingConcierge] Component rendered, isOpen:', isOpen);

  // Handle Shift+D to open diagnostics panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setShowDiagnostics(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle hold music unmute events
  useEffect(() => {
    const handleUnmuteNeeded = () => setShowUnmute(true);
    window.addEventListener("holdmusic-needs-gesture", handleUnmuteNeeded);
    return () => window.removeEventListener("holdmusic-needs-gesture", handleUnmuteNeeded);
  }, []);

  // Load user's AI agent profile and restore conversation
  useEffect(() => {
    const loadAgentProfile = async () => {
      if (!user) {
        // Set default greeting even without user
        setMessages([{
          role: 'assistant',
          content: `Welcome — I'm Madison, your Goldsainte travel concierge.\nI'm here to help you turn inspiration into something bookable.\n\nTell me what sparked the idea — a TikTok, a photo, a vibe, a mood—\nand I'll shape it into a visual storyboard you can refine, share, and book.\n\nWhen you're ready, I can also match you with creators whose style matches yours, and certified agents who can bring the journey to life with five-star precision.`
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
        console.log('Setting Madison\'s intro greeting');
        setMessages([{
          role: 'assistant',
          content: `Welcome — I'm Madison, your Goldsainte travel concierge.\nI'm here to help you turn inspiration into something bookable.\n\nTell me what sparked the idea — a TikTok, a photo, a vibe, a mood—\nand I'll shape it into a visual storyboard you can refine, share, and book.\n\nWhen you're ready, I can also match you with creators whose style matches yours, and certified agents who can bring the journey to life with five-star precision.`
        }]);
      }
    };

    loadAgentProfile();
  }, [user]);

  // Initialize or load concierge session
  useEffect(() => {
    if (!isOpen || sessionId) return;
    
    const initSession = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      
      // Try to load existing session
      const { data: existing } = await supabase
        .from('concierge_sessions')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('mode', 'voice')
        .order('last_active_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existing?.id) {
        setSessionId(existing.id);
      } else {
        // Create new session
        const { data: created } = await supabase
          .from('concierge_sessions')
          .insert({
            user_id: currentUser.id,
            mode: 'voice',
            title: 'Chat with Madison'
          })
          .select('id')
          .single();
        
        if (created) setSessionId(created.id);
      }
    };
    
    initSession();
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize hold music controller
  useEffect(() => {
    if (!musicControllerRef.current) {
      musicControllerRef.current = new HoldMusicController();
    }
  }, []);

  // Initialize background music controller
  useEffect(() => {
    console.log('[Concierge] Initializing background music controller');
    const bgMusicUrl = import.meta.env.VITE_BG_MUSIC_URL || 
      "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3";
    
    // Ensure HTTPS URL (force https for production)
    const secureUrl = bgMusicUrl.replace(/^http:/, 'https:');
    console.log('[Concierge] Background music URL:', secureUrl);
    
    bgMusicRef.current = new BackgroundMusicController(secureUrl);
    // Note: Don't arm here - wait for user gesture (widget open)

    const handleBgMusicGesture = () => {
      console.log('[Concierge] Background music needs gesture, showing prompt');
      setShowBgMusicPrompt(true);
    };
    window.addEventListener("bgmusic-needs-gesture", handleBgMusicGesture);

    return () => {
      window.removeEventListener("bgmusic-needs-gesture", handleBgMusicGesture);
      bgMusicRef.current?.stop();
    };
  }, []);

  // Start background music when widget opens
  useEffect(() => {
    console.log('[Concierge] Widget open state changed:', isOpen);
    if (isOpen && bgMusicRef.current) {
      console.log('[Concierge] Starting background music...');
      
      // Show intro modal on first open
      if (!hasSeenIntro) {
        setShowIntroModal(true);
      } else {
        // Arm and start music directly if user has seen intro
        bgMusicRef.current.arm().then(() => {
          bgMusicRef.current?.start();
          setIsMusicPlaying(true);
        }).catch(err => {
          console.warn('[Concierge] Failed to start background music:', err);
        });
      }
    } else if (!isOpen && bgMusicRef.current) {
      console.log('[Concierge] Stopping background music...');
      bgMusicRef.current.stop();
      setIsMusicPlaying(false);
    }
  }, [isOpen, hasSeenIntro]);

  // Play/stop hold music based on voice status
  useEffect(() => {
    const music = musicControllerRef.current;
    if (!music) return;

    if (voiceStatus === 'connecting' || isProcessing) {
      music.play();
    } else if (voiceStatus === 'connected' && !isProcessing) {
      music.stop();
    } else if (voiceStatus === 'disconnected') {
      music.stop();
    }
  }, [voiceStatus, isProcessing]);

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
    
    // Reset to Madison's intro greeting
    setMessages([{
      role: 'assistant',
      content: `Hi, I'm Madison — your Goldsainte travel concierge. Think of me as your friendly, well-connected travel insider. I can help you explore destinations, find the best flights and hotels, and even recommend great spots to eat, sip, or unwind. To get started, just say something like: "Find me a flight to Miami next weekend," or "Show me boutique hotels in Paris." Ready to plan something amazing?`
    }]);
    
    // Reset intro flag so it plays again if voice mode is reactivated
    setHasPlayedIntro(false);

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
    
    // Dismiss welcome card on first interaction
    setShowWelcomeCard(false);
    
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    saveConversationData();

    try {
      console.log('[AIBookingConcierge] Calling madison edge function with conversationId:', conversationId);

      // Call the madison edge function for natural conversation
      const { data, error } = await supabase.functions.invoke("madison", {
        body: {
          message: userMessage,
          userId: user?.id,
          inputType: 'text',
          conversationId: conversationId
        }
      });

      if (error) {
        console.error('[AIBookingConcierge] madison error:', error);
        throw new Error("Failed to get response. Please try again.");
      }

      console.log('[AIBookingConcierge] madison response:', data);

      // Extract the assistant's message
      const assistantContent = data?.message || "I apologize, I encountered an issue. Please try again.";
      
      // Add assistant message to chat
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);

      // Check if madison created a trip
      if (data?.action === 'create_trip' && data?.trip) {
        const destination = data.trip.destination || "your destination";
        toast({
          title: "Trip created",
          description: `Planning your trip to ${destination}`,
        });
        
        // Navigate to storyboard editor with concierge context
        navigate(`/trip/${data.trip.id}/storyboard?from=concierge`);
      }

      saveConversationData();
    } catch (error) {
      console.error('[AIBookingConcierge] Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I apologize, but ${errorMessage.toLowerCase()}` 
      }]);
      
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
    
    // Dismiss welcome card on interaction
    setShowWelcomeCard(false);
    
    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    saveConversationData();

    try {
      console.log('[AIBookingConcierge] Sending programmatic message to madison with conversationId:', conversationId);

      // Call the madison edge function for natural conversation
      const { data, error } = await supabase.functions.invoke("madison", {
        body: {
          message: messageContent,
          userId: user?.id,
          inputType: 'text',
          conversationId: conversationId
        }
      });

      if (error) {
        console.error('[AIBookingConcierge] madison error:', error);
        throw new Error("Failed to get response. Please try again.");
      }

      console.log('[AIBookingConcierge] madison response:', data);

      // Extract the assistant's message
      const assistantContent = data?.message || "I apologize, I encountered an issue. Please try again.";
      
      // Add assistant message to chat
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);

      // Check if madison created a trip
      if (data?.action === 'create_trip' && data?.trip) {
        const destination = data.trip.destination || "your destination";
        toast({
          title: "Trip created",
          description: `Planning your trip to ${destination}`,
        });
        
        // Navigate to storyboard editor with concierge context
        navigate(`/trip/${data.trip.id}/storyboard?from=concierge`);
      }

      saveConversationData();
    } catch (error) {
      console.error('[AIBookingConcierge] Error:', error);
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again."
      }]);
      
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
        console.log('📞 [Step 1/6] Starting voice mode...');
        setVoiceStatus('connecting');

        // Dismiss welcome card on voice interaction
        setShowWelcomeCard(false);

        // Arm hold music and background music on user gesture
        if (musicControllerRef.current) {
          await musicControllerRef.current.arm();
        }
        if (bgMusicRef.current) {
          await bgMusicRef.current.arm();
        }

        // Pause wake word while in active voice call to avoid mic conflicts
        if (wakeWordDetectorRef.current) {
          console.log('⏸️ Pausing wake word detection during voice call');
          wakeWordDetectorRef.current.stop();
          setWakeWordActive(false);
        }

        // Step 1: Proactively request microphone permission
        console.log('🎤 [Step 2/6] Requesting microphone permission...');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop tracks immediately - we just wanted to check permission
          stream.getTracks().forEach(track => track.stop());
          console.log('✅ Microphone permission granted');
        } catch (permError: any) {
          console.error('❌ Microphone permission denied:', permError);
          let errorMsg = "Microphone access denied";
          if (permError.name === 'NotAllowedError') {
            errorMsg = "Microphone access denied. Please allow microphone access in your browser settings.";
          } else if (permError.name === 'NotFoundError') {
            errorMsg = "No microphone found. Please connect a microphone and try again.";
          } else if (permError.name === 'NotReadableError') {
            errorMsg = "Microphone is being used by another application. Please close other apps and try again.";
          }
          toast({
            title: "Microphone Error",
            description: errorMsg,
            variant: "destructive",
          });
          startWakeWordDetection();
          return;
        }
        
        const getSessionToken = async () => {
          console.log('🔑 [Step 3/6] Fetching session token...');
          try {
            const { data, error } = await supabase.functions.invoke('realtime-voice-session', {
              body: { agentProfile }
            });
            if (error) {
              console.error('❌ Session token error:', error);
              throw new Error('Failed to connect to voice service. Please try again.');
            }
            if (!data?.token) {
              console.error('❌ Invalid session token received:', data);
              throw new Error('Invalid session token received');
            }
            console.log('✅ Session token obtained');
            return { token: data.token, expiresAt: data.expiresAt };
          } catch (err) {
            console.error('❌ Token fetch error:', err);
            throw new Error('Unable to connect to voice service');
          }
        };

        let currentAssistantMessage = '';
        let isAssistantSpeaking = false;

        console.log('🔌 [Step 4/6] Creating voice chat connection...');
        voiceChatRef.current = new RealtimeVoiceChat(
          async (message) => {
            console.log('📨 Voice message:', message.type);
            
            // Handle tool calls from Realtime API
            if (message.type === 'response.function_call_arguments.done') {
              const toolName = message.name;
              const callId = message.call_id;
              let args: any = {};
              
              try {
                args = JSON.parse(message.arguments || '{}');
              } catch (e) {
                console.error('[ToolCall] Parse error:', e);
              }
              
              // Enhanced logging format matching user spec
              console.log('[ToolCall]', toolName, args);
              console.log('📊 [TELEMETRY] voice_tool_call', { tool: toolName, args, timestamp: new Date().toISOString() });
              
              try {
                // Call amadeus-proxy
                const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/amadeus-proxy`;
                const proxyType = toolName === 'search_flights' ? 'flights' : 'hotels';
                const proxyPayload = { type: proxyType, ...args };
                
                // Log proxy call in requested format
                console.log('[Proxy] POST', proxyType, 
                  args.depart_date || args.check_in || '', 
                  args.origin || args.city || '', 
                  args.destination || args.city || ''
                );
                
                const proxyResp = await fetch(proxyUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
                  },
                  body: JSON.stringify(proxyPayload)
                });
                
                if (!proxyResp.ok) {
                  const errorText = await proxyResp.text();
                  console.error('[Proxy] Error - status:', proxyResp.status, errorText);
                  throw new Error(`Proxy error ${proxyResp.status}`);
                }
                
                const proxyData = await proxyResp.json();
                const cardCount = proxyData.cards?.length || 0;
                
                // Log in requested format
                console.log('[Proxy] Response - status:', proxyResp.status, ', cards.length:', cardCount);
                console.log('📊 [TELEMETRY] amadeus_proxy_success', { 
                  tool: toolName, 
                  cardCount, 
                  timestamp: new Date().toISOString() 
                });
                
                // Send tool result back to Realtime API
                if (voiceChatRef.current?.dc?.readyState === 'open') {
                  const toolResult = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: callId,
                      output: JSON.stringify({ success: true, card_count: proxyData.cards?.length || 0 })
                    }
                  };
                  voiceChatRef.current.dc.send(JSON.stringify(toolResult));
                  console.log('📤 Sent tool result back to AI');
                  
                  // Trigger response continuation
                  voiceChatRef.current.dc.send(JSON.stringify({ type: 'response.create' }));
                }
                
                // Render cards in UI immediately
                const section = toolName === 'search_flights' ? 'Flights' : 'Hotels';
                
                if (cardCount > 0) {
                  // Log in requested format
                  console.log('[UI] cards', section, cardCount);
                  
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '',
                    toolResults: [proxyData]
                  }]);
                  
                  console.log('📊 [TELEMETRY] voice_cards_rendered', { 
                    section, 
                    count: cardCount,
                    timestamp: new Date().toISOString()
                  });
                } else {
                  // Log zero results in requested format
                  console.log('[UI] No results - cards.length: 0');
                  
                  // Add system message to chat
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'No live options found for those dates.'
                  }]);
                  
                  toast({
                    title: "No Results",
                    description: "No options found for those dates. Try different dates or locations.",
                  });
                }
                
              } catch (error) {
                console.error('[ToolCall] Execution error:', error);
                console.log('[Proxy] Error -', error instanceof Error ? error.message : 'Unknown');
                console.log('📊 [TELEMETRY] voice_tool_error', { 
                  tool: toolName, 
                  error: error instanceof Error ? error.message : 'Unknown',
                  timestamp: new Date().toISOString()
                });
                
                // Send error back to AI
                if (voiceChatRef.current?.dc?.readyState === 'open') {
                  const errorResult = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: callId,
                      output: JSON.stringify({ error: 'lookup_failed' })
                    }
                  };
                  voiceChatRef.current.dc.send(JSON.stringify(errorResult));
                  voiceChatRef.current.dc.send(JSON.stringify({ type: 'response.create' }));
                }
                
                toast({
                  title: "Search Failed",
                  description: "Unable to fetch results. Please try again.",
                  variant: "destructive"
                });
              }
            }
            
            if (message.type === 'response.audio_transcript.delta' || message.type === 'response.audio.delta') {
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
              console.log('✅ AI finished speaking');
              isAssistantSpeaking = false;
              setIsProcessing(false);
              saveConversationData();
            } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
              console.log('👤 User finished speaking:', message.transcript);
              setIsProcessing(true);
              setMessages(prev => [...prev, { role: 'user', content: message.transcript }]);
              saveConversationData();
              
              // Detect Uber intent and bridge to text mode
              const transcript = message.transcript.toLowerCase();
              const hasUberIntent = 
                transcript.includes('uber') || 
                transcript.includes('ride') || 
                transcript.includes('lyft') ||
                transcript.includes('transport') ||
                transcript.includes('get me to') ||
                transcript.includes('take me to') ||
                transcript.includes('airport transfer');
                
              const hasLocationInfo = 
                (transcript.includes('from') && transcript.includes('to')) ||
                (transcript.match(/\b(lax|jfk|sfo|ord|atl|dfw|den|las|sea|mia|airport)\b/i));
              
              if (hasUberIntent && hasLocationInfo) {
                let fromLocation = '';
                let toLocation = '';
                
                const fromToMatch = transcript.match(/from\s+([^,.]+?)\s+to\s+([^,.]+?)(?:\.|$|,)/i);
                if (fromToMatch) {
                  fromLocation = fromToMatch[1].trim();
                  toLocation = fromToMatch[2].trim();
                }
                
                if (!fromLocation) {
                  const toFromMatch = transcript.match(/to\s+([^,.]+?)\s+from\s+([^,.]+?)(?:\.|$|,)/i);
                  if (toFromMatch) {
                    toLocation = toFromMatch[1].trim();
                    fromLocation = toFromMatch[2].trim();
                  }
                }
                
                if (!fromLocation && !toLocation) {
                  const getMatch = transcript.match(/(?:get|take)\s+me\s+to\s+([^,.]+?)(?:\.|$|,)/i);
                  if (getMatch) {
                    toLocation = getMatch[1].trim();
                    fromLocation = "my current location";
                  }
                }
                
                if (fromLocation || toLocation) {
                  toast({
                    title: "Getting Uber Options",
                    description: "Check the chat below for live pricing!",
                    duration: 3000
                  });
                  
                  setTimeout(() => {
                    const uberRequest = fromLocation && toLocation 
                      ? `Get Uber price estimates from ${fromLocation} to ${toLocation} and show me the options.`
                      : `Get Uber options for: ${transcript}`;
                      
                    sendProgrammaticMessage(uberRequest);
                  }, 1000);
                }
              }
            } else if (message.type === 'input_audio_buffer.speech_stopped') {
              console.log('🛑 Speech stopped');
              setIsProcessing(true);
            } else if (message.type === 'response.created') {
              console.log('🤔 AI is thinking');
              setIsProcessing(true);
            }
          },
          (status) => {
            console.log('📡 Connection status:', status);
            setVoiceStatus(status as any);
          }
        );

        console.log('🔗 [Step 5/6] Connecting to OpenAI Realtime API...');
        await voiceChatRef.current.init(getSessionToken);
        console.log('✅ OpenAI connection established');

        // Step 6: Start hold music IMMEDIATELY after successful connection (within user gesture)
        console.log('🎵 [Step 6/6] Starting hold music...');
        // Start hold music
        try {
          await holdMusicRef.current?.play();
          console.log('✅ Hold music playing successfully');
          console.log('📊 [TELEMETRY] hold_music_started', { timestamp: new Date().toISOString() });
        } catch (playError: any) {
          console.warn('⚠️ Hold music error:', playError);
          if (playError.message === 'AUTOPLAY_BLOCKED') {
            console.log('📊 [TELEMETRY] hold_music_autoplay_blocked', { timestamp: new Date().toISOString() });
            setShowAutoplayPrompt(true);
          } else {
            console.log('📊 [TELEMETRY] hold_music_error', { error: playError.message, timestamp: new Date().toISOString() });
          }
        }
        
        setVoiceMode(true);
        console.log('✅ Voice mode fully activated');
        console.log('📊 [TELEMETRY] voice_mode_activated', { timestamp: new Date().toISOString() });
        
        // Play Madison's intro greeting voice once on first activation
        if (!hasPlayedIntro && voiceChatRef.current?.dc?.readyState === 'open') {
          console.log('🎙️ Playing Madison\'s intro greeting voice...');
          setHasPlayedIntro(true);
          
          const madisonIntro = `Hi, I'm Madison — your Goldsainte travel concierge. Think of me as your friendly, well-connected travel insider. I can help you explore destinations, find the best flights and hotels, and even recommend great spots to eat, sip, or unwind. To get started, just say something like: "Find me a flight to Miami next weekend," or "Show me boutique hotels in Paris." Ready to plan something amazing?`;
          
          // Send intro to voice session to be spoken (text already in chat from initial greeting)
          const introMessage = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'assistant',
              content: [
                {
                  type: 'input_text',
                  text: madisonIntro
                }
              ]
            }
          };
          
          voiceChatRef.current.dc.send(JSON.stringify(introMessage));
          voiceChatRef.current.dc.send(JSON.stringify({ type: 'response.create' }));
          
          console.log('📊 [TELEMETRY] madison_intro_voice_played', { timestamp: new Date().toISOString() });
        }
        
        toast({
          title: "Voice Mode Active",
          description: "Speak naturally - Madison is listening",
        });
      } catch (error: any) {
        console.error('❌ Voice activation error:', error);
        console.log('📊 [TELEMETRY] voice_activation_error', { 
          error: error?.message || 'Unknown error', 
          errorName: error?.name,
          timestamp: new Date().toISOString() 
        });
        setVoiceStatus('error');
        
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
        
        // Resume wake word detection after error with delay
        console.log('🔄 Resuming wake word detection after voice error');
        setTimeout(async () => {
          safelyCancelSpeechSynthesis();
          safelyStopHoldMusic();
          await new Promise(r => setTimeout(r, 200));
          await startWakeWordDetection();
        }, 200);
      }
    } else {
      console.log('📴 Ending voice mode...');
      console.log('📊 [TELEMETRY] voice_mode_deactivated', { timestamp: new Date().toISOString() });
      voiceChatRef.current?.disconnect();
      setVoiceMode(false);
      setVoiceStatus('disconnected');
      setIsProcessing(false);
      if (holdMusicRef.current) {
        holdMusicRef.current.stop();
      }
      console.log('▶️ Resuming wake word detection after delay');
      setTimeout(async () => {
        safelyCancelSpeechSynthesis();
        safelyStopHoldMusic();
        await new Promise(r => setTimeout(r, 200));
        await startWakeWordDetection();
      }, 200);
    }
  };

  const startWakeWordDetection = async () => {
    try {
      // Check browser support first
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('⚠️ [WAKE_WORD] Not supported (Safari/iOS)');
        // Don't show toast on every re-arm attempt
        return;
      }

      console.log('🎤 [WAKE_WORD] Starting detection...');
      
      // CRITICAL: Stop all audio before starting recognition
      safelyCancelSpeechSynthesis();
      safelyStopHoldMusic();
      
      // Wait for audio to settle
      await new Promise(r => setTimeout(r, 100));
      
      // Initialize detector if not exists
      if (!wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current = new WakeWordDetector(() => {
          console.log('🎯 [WAKE_WORD] Wake word detected!');
          console.log('📊 [TELEMETRY] wake_word_detected', { timestamp: new Date().toISOString() });
          
          // Recognition already stopped inside detector
          setWakeWordActive(false);
          
          // Open widget if not already open
          if (!isOpen) {
            console.log('🪟 [WAKE_WORD] Opening widget');
            setIsOpen(true);
          }
          
          // Activate voice mode (cleaner than toggleVoiceMode)
          if (!voiceMode) {
            console.log('🎤 [WAKE_WORD] Activating voice mode');
            toggleVoiceMode();
          }
        });
      }
      
      // Start the detector
      await wakeWordDetectorRef.current.start();
      
      setWakeWordActive(true);
      console.log('✅ [WAKE_WORD] Detection started');
      
    } catch (error: any) {
      console.error('❌ [WAKE_WORD] Error:', error);
      console.log('📊 [TELEMETRY] wake_word_error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.name,
        timestamp: new Date().toISOString() 
      });
      
      // Only show toast if it's a permission error
      if (error?.name === 'NotAllowedError') {
        toast({
          title: "Microphone Permission Required",
          description: "Please allow microphone access to use wake word",
          variant: "destructive",
        });
      }
    }
  };

  // One-time user gesture to enable wake word pipeline (simplified)
  const enableWakeWordPipeline = async () => {
    try {
      console.log('🎤 [ENABLE_WAKE] Starting wake word detection');
      
      // 1) Stop any hold music / TTS
      safelyCancelSpeechSynthesis();
      safelyStopHoldMusic();
      
      // 2) Wait for audio to settle
      await new Promise(r => setTimeout(r, 100));
      
      // 3) Initialize WakeWordDetector if not exists
      if (!wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current = new WakeWordDetector(() => {
          console.log('🎯 Wake word callback fired');
          // Detection stopped inside detector; now activate voice
          if (!isOpen) setIsOpen(true);
          if (!voiceMode) toggleVoiceMode();
        });
      }
      
      // 4) Start detection
      await wakeWordDetectorRef.current.start();
      
      setWakeWordPrimed(true);
      setWakeWordActive(true);
      
      toast({
        title: "Wake Word Active",
        description: "Say 'Hey Goldsainte' to activate voice mode (Chrome only)",
      });
    } catch (error: any) {
      console.error('❌ [ENABLE_WAKE] Error:', error);
      toast({
        title: "Wake Word Error",
        description: error?.message || "Failed to enable wake word",
        variant: "destructive",
      });
    }
  };

  // Loopback test: Feed test WAV through KWS pipeline
  const runLoopbackTest = async () => {
    try {
      console.log('🧪 [LOOPBACK] Starting loopback test');
      toast({ title: 'Loopback Test', description: 'Testing KWS with sample audio...' });

      const resp = await fetch('/test/hey-goldsainte.wav', { cache: 'reload' });
      if (!resp.ok) throw new Error('Test WAV not found');
      
      const arrayBuffer = await resp.arrayBuffer();
      console.log('🧪 [LOOPBACK] Loaded test WAV:', arrayBuffer.byteLength, 'bytes');
      
      // For this test, just verify the audio pipeline is loaded
      if (!workletNodeRef.current) {
        toast({ 
          title: 'Loopback Test Failed', 
          description: 'Enable wake word first', 
          variant: 'destructive' 
        });
        return;
      }

      toast({ 
        title: 'Loopback Test Complete', 
        description: 'KWS pipeline is loaded. Check diagnostics for live metrics.' 
      });
    } catch (e: any) {
      console.error('❌ [LOOPBACK] Test failed:', e);
      toast({ 
        title: 'Loopback Test Failed', 
        description: e?.message || 'Failed to run test', 
        variant: 'destructive' 
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

  const handleEnableFeatures = async () => {
    // Mark intro as seen
    localStorage.setItem('conciergeIntroSeen', 'true');
    setHasSeenIntro(true);
    
    // Arm and start background music
    try {
      await bgMusicRef.current?.arm();
      await bgMusicRef.current?.start();
      setIsMusicPlaying(true);
      console.log('[Concierge] Background music started after intro');
    } catch (err) {
      console.warn('[Concierge] Failed to start background music:', err);
    }
  };

  const handleMusicToggle = async () => {
    if (isMusicPlaying) {
      bgMusicRef.current?.stop();
      setIsMusicPlaying(false);
    } else {
      try {
        await bgMusicRef.current?.arm();
        await bgMusicRef.current?.start();
        setIsMusicPlaying(true);
      } catch (err) {
        console.warn('[Concierge] Failed to toggle music:', err);
      }
    }
  };

  // Start wake word detection globally on component mount (not tied to widget open state)
  useEffect(() => {
    console.log('🎤 [GLOBAL] Starting wake word detection on mount');
    startWakeWordDetection();

    return () => {
      console.log('🧹 [GLOBAL] Component unmounting - stopping voice and wake word');
      voiceChatRef.current?.disconnect();
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.stop();
        wakeWordDetectorRef.current = null;
      }
      if (pushToTalkTimerRef.current) {
        clearTimeout(pushToTalkTimerRef.current);
      }
    };
  }, []); // Empty deps - run once on mount, cleanup on unmount

  if (!isOpen) {
    return (
      <>
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
                {wakeWordActive && (
                  <Badge 
                    variant="secondary" 
                    className="hidden md:flex absolute -top-8 right-0 text-xs whitespace-nowrap animate-pulse"
                  >
                    <Radio className="w-3 h-3 mr-1" />
                    Listening for "Hey Goldsainte"
                  </Badge>
                )}
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
            <div className="space-y-1">
              <p className="font-semibold">Goldsainte AI Concierge</p>
              {wakeWordActive && (
                <p className="text-xs text-muted-foreground">Say "Hey Goldsainte" or click to start</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        
        {/* Diagnostics Panel */}
        <VoiceDiagnosticsPanel
          isOpen={showDiagnostics}
          onClose={() => setShowDiagnostics(false)}
          voiceChatRef={voiceChatRef}
          wakeWordDetectorRef={wakeWordDetectorRef}
          holdMusicRef={holdMusicRef}
          metrics={diagMetrics}
          onLoopbackTest={runLoopbackTest}
        />
      </>
    );
  }

  return (
    <Card 
      className={`font-serif fixed bottom-20 md:bottom-28 right-3 md:right-6 z-50 shadow-2xl border-2 border-primary/20 transition-all ${
        isMinimized ? 'w-[calc(100vw-1.5rem)] sm:w-80 md:w-80' : 'w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)] md:w-96 max-w-md'
      } ${isMinimized ? 'h-16' : 'h-[65vh] sm:h-[70vh] md:h-[600px] max-h-[65vh] sm:max-h-[70vh] md:max-h-[600px]'}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-3 sm:p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <img src={logomark} alt="Goldsainte" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold text-primary-foreground truncate">AI Concierge</h3>
            <p className="text-[10px] sm:text-xs text-primary-foreground/80 truncate hidden sm:block">Powered by Goldsainte</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <MusicIndicator
            isPlaying={isMusicPlaying}
            onToggle={handleMusicToggle}
            className="text-primary-foreground border-primary-foreground/20"
          />
          <VoiceStatusChip
            state={
              voiceMode || wakeWordActive ? 'listening' : 
              wakeWordPrimed ? 'idle' : 
              'muted'
            }
            onClick={enableWakeWordPipeline}
            className="text-primary-foreground border-primary-foreground/20"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearConversation}
                className="text-primary-foreground hover:bg-white/10 h-7 w-7 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] -m-2"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
            className="text-primary-foreground hover:bg-white/10 h-7 w-7 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] -m-2"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          <ScrollArea className="h-[calc(65vh-160px)] sm:h-[calc(70vh-180px)] md:h-[calc(600px-180px)] p-2 sm:p-3 overflow-x-hidden w-full max-w-full" ref={scrollRef}>
            <div className="space-y-2 sm:space-y-3">
              {/* Welcome Card - Shows before first interaction */}
              {showWelcomeCard && messages.length <= 1 && (
                <WelcomeCard 
                  onDismiss={() => setShowWelcomeCard(false)}
                  onPromptClick={(prompt) => {
                    setInput(prompt);
                    setTimeout(() => handleSend(), 100);
                  }}
                  onStartVoice={toggleVoiceMode}
                />
              )}

              {/* Voice Status Message */}
              {wakeWordActive && !voiceMode && (
                <VoiceStatusMessage status="wake-active" />
              )}
              {voiceMode && isProcessing && (
                <VoiceStatusMessage status="responding" />
              )}
              {voiceMode && !isProcessing && (
                <VoiceStatusMessage status="listening" />
              )}

              {messages.map((msg, idx) => {
                const isAssistant = msg.role === 'assistant';
                // Find if this is the last assistant message
                const laterAssistantExists = messages.slice(idx + 1).some(m => m.role === 'assistant');
                const isLastAssistant = isAssistant && !laterAssistantExists;
                
                return (
                  <div key={idx} className="w-full">
                    <div
                      className={`flex gap-1.5 sm:gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <img 
                            src={logomark} 
                            alt="Goldsainte" 
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-full bg-gradient-to-br from-primary to-accent p-0.5 sm:p-1"
                          />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] sm:max-w-[75%] break-words rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-[11px] sm:text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                    
                    {/* Add storyboard CTA after last assistant message */}
                    {isLastAssistant && sessionId && msg.content && (
                      <div className="mt-2 ml-7 sm:ml-8 pt-2 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground/80 mb-2">
                          Want me to open a storyboard with these ideas?
                        </p>
                        <StartStoryboardFromChat sessionId={sessionId} ownerRole="traveler" />
                        
                        <button
                          onClick={() => navigate(`/concierge?sessionId=${sessionId}`)}
                          className="mt-2 text-[10px] text-primary underline underline-offset-2 hover:text-primary/80"
                        >
                          Open full trip planner →
                        </button>
                      </div>
                    )}
                  
                  {/* Display tool results */}
                  {msg.toolResults && msg.toolResults.length > 0 && msg.toolResults.map((result, resultIdx) => {
                    // Handle Amadeus card results from voice mode (direct format)
                    if (result.type === 'cards' && Array.isArray(result.cards)) {
                      return (
                        <div key={resultIdx} className="mt-1.5 sm:mt-2 ml-6 sm:ml-8">
                          <ResultCards section={result.section || 'Results'} cards={result.cards} />
                        </div>
                      );
                    }
                    
                    // Handle Amadeus card results from text mode (nested in data)
                    if (result.data?.type === 'cards' && result.data?.cards) {
                      return (
                        <div key={resultIdx} className="mt-1.5 sm:mt-2 ml-6 sm:ml-8">
                          <ResultCards section={result.data.section} cards={result.data.cards} />
                        </div>
                      );
                    }
                    
                    // Handle agent inquiry confirmation
                    if (result.success && result.inquiryId) {
                      return (
                        <div key={resultIdx} className="mt-1.5 sm:mt-2 ml-6 sm:ml-8">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                            <p className="text-xs sm:text-sm text-green-800 font-medium">
                              ✓ {result.message || "Your request has been received! A Goldsainte agent will contact you shortly."}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Display flight search results
                    if (result.data && Array.isArray(result.data) && result.data.length > 0 && result.data[0].itineraries) {
                      return (
                        <div key={resultIdx} className="mt-1.5 sm:mt-2 ml-6 sm:ml-8 space-y-1.5 sm:space-y-2">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">Top {Math.min(3, result.data.length)} flight options:</p>
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
                          <div key={resultIdx} className="mt-1.5 sm:mt-2 ml-6 sm:ml-8 space-y-1.5 sm:space-y-2">
                            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">Top {Math.min(3, result.results.length)} hotel options:</p>
                            {result.results.slice(0, 3).map((hotel: any, hotelIdx: number) => (
                              <CompactHotelCard 
                                key={hotelIdx} 
                                property={hotel}
                                searchDates={{
                                  checkIn: result.checkIn || '',
                                  checkOut: result.checkOut || ''
                                }}
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
                    
                    // Display activity search results (check for unique activity properties)
                    if (result.data && Array.isArray(result.data) && result.data.length > 0 && 
                        result.data[0].geoCode && result.data[0].categories && !result.data[0].vehicle && !result.data[0].hotelName) {
                      return (
                        <div key={resultIdx} className="mt-2 ml-8 space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">Top {Math.min(5, result.data.length)} activities:</p>
                          {result.data.slice(0, 5).map((activity: any, actIdx: number) => (
                            <CompactActivityCard 
                              key={actIdx} 
                              activity={activity}
                              searchParams={result.searchParams}
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
              );
            })}
              {isLoading && (
                <div className="flex justify-start gap-1.5 sm:gap-2">
                  <div className="flex-shrink-0">
                    <img 
                      src={logomark} 
                      alt="Goldsainte" 
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-full bg-gradient-to-br from-primary to-accent p-0.5 sm:p-1"
                    />
                  </div>
                  <div className="bg-muted rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-2.5 sm:p-3 md:p-3 border-t border-border bg-background">
            {showUnmute && (
              <Button
                onClick={() => {
                  musicControllerRef.current?.play();
                  setShowUnmute(false);
                }}
                variant="outline"
                size="sm"
                className="w-full mb-2 text-xs sm:text-sm min-h-[44px]"
              >
                🔈 Tap to enable hold music
              </Button>
            )}
            {showBgMusicPrompt && (
              <Button
                onClick={() => {
                  bgMusicRef.current?.start();
                  setShowBgMusicPrompt(false);
                }}
                variant="outline"
                size="sm"
                className="w-full mb-2 gap-2 text-xs sm:text-sm min-h-[44px]"
              >
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Tap to enable background music
              </Button>
            )}
            <div className="flex gap-1.5 sm:gap-2">
              {!voiceMode && (
                <>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your travel request..."
                    className="flex-1 h-11 sm:h-12 md:h-11 text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 h-11 w-11 sm:h-12 sm:w-12 md:h-11 md:w-11 shrink-0 min-h-[44px] min-w-[44px]"
                  >
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </>
              )}
              {voiceMode && (
                <div className="flex-1 flex items-center justify-center gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse" />
                  {isProcessing ? 'Processing your request...' : 'Voice mode active - speak naturally'}
                </div>
              )}
              
              {/* Voice mode toggle (microphone) */}
              <Button
                onClick={toggleVoiceMode}
                size="icon"
                variant={voiceMode ? "default" : "outline"}
                className={`h-11 w-11 sm:h-12 sm:w-12 md:h-11 md:w-11 shrink-0 min-h-[44px] min-w-[44px] ${voiceMode ? "bg-gradient-to-r from-green-500 to-green-600" : ""}`}
                disabled={voiceStatus === 'connecting'}
                title={voiceMode ? "End voice" : "Start voice"}
              >
                {voiceMode ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
              
              {/* Unmute button for autoplay block */}
              {voiceStatus === 'needs-user-gesture' && (
                <Button
                  onClick={() => {
                    if (voiceChatRef.current?.audioEl) {
                      voiceChatRef.current.audioEl.play().catch(console.error);
                      setVoiceStatus('connected');
                    }
                  }}
                  variant="secondary"
                  size="sm"
                  className="ml-2"
                >
                  🔊 Tap to unmute
                </Button>
              )}
            </div>
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

      <AIChatSettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onPreferencesChange={setPreferences}
      />
      
      {/* Autoplay Prompt */}
      {showAutoplayPrompt && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Enable Audio</h3>
                  <p className="text-sm text-muted-foreground">Click to enable hold music during your call</p>
                </div>
              </div>
              <Button 
                onClick={async () => {
                  setShowAutoplayPrompt(false);
                  try {
                    await holdMusicRef.current?.play();
                  } catch (e) {
                    console.error('Still blocked:', e);
                  }
                }}
                className="w-full"
              >
                Enable Audio
              </Button>
              <Button 
                onClick={() => setShowAutoplayPrompt(false)}
                variant="ghost"
                className="w-full"
              >
                Continue Without Music
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unmute Music Prompt */}
      {showUnmute && (
        <div className="fixed bottom-24 right-4 z-[9999]">
          <Button
            onClick={async () => {
              setShowUnmute(false);
              await musicControllerRef.current?.play();
            }}
            size="sm"
            className="shadow-lg"
          >
            Tap to unmute music
          </Button>
        </div>
      )}
      
      {/* Diagnostics Panel - Press Shift+D to open */}
      <VoiceDiagnosticsPanel
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        voiceChatRef={voiceChatRef}
        wakeWordDetectorRef={wakeWordDetectorRef}
        holdMusicRef={holdMusicRef}
      />

      {/* Intro Modal */}
      <ConciergeIntroModal
        open={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        onEnableFeatures={handleEnableFeatures}
      />
    </Card>
  );
};
