import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ExpediaWidgetCard } from '@/components/ExpediaWidgetCard';
import { FlightDatePickerCard } from '@/components/FlightDatePickerCard';
import { FEATURE_FLAGS } from '@/config/features';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  widgetData?: {
    type: 'hotel_intent' | 'flight_intent';
    provider: 'expedia';
    payload: any;
  };
  datePickerData?: {
    type: 'flight_dates';
    prefill?: { depart?: string; return?: string };
    mode?: 'roundTrip' | 'oneWay';
  };
}

export const HelpCenterChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sanitize assistant content to remove any route references
  const sanitizeAssistantContent = (content: string): string => {
    return content
      .replace(/\s*\(\/[^\)]+\)/g, '')
      .replace(/\s+(?:at|visit|go to|or visit|or go to)\s+\/[^\s\.,)]+/gi, '')
      .replace(/\/[a-z0-9\-\/\?=]+/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('help-center-ai', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) throw error;

      if (data?.response) {
        // Check if we should show date picker
        if (data.meta?.ui?.showDatePicker) {
          console.log('🎯 Rendering inline date picker');
          const assistantMessage: Message = {
            role: 'assistant',
            content: sanitizeAssistantContent(data.response),
            datePickerData: {
              type: 'flight_dates',
              prefill: data.meta.search_params?.dates,
              mode: data.meta.search_params?.mode || 'roundTrip'
            }
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
        // Check if we should render inline widget
        else if (FEATURE_FLAGS.USE_EXPEDIA_WIDGET_INLINE && data.meta?.status === 'OK' && data.meta?.search_params) {
          console.log('🎯 Rendering inline Expedia widget with params:', data.meta.search_params);
          console.log('🎯 [TELEMETRY] chat_expedia_widget_inserted');
          
          let widgetPayload;
          if (data.meta.search_type === 'hotels') {
            widgetPayload = {
              type: 'hotel_intent' as const,
              provider: 'expedia' as const,
              payload: {
                destination: data.meta.search_params.location || '',
                checkIn: data.meta.search_params.checkIn || '',
                checkOut: data.meta.search_params.checkOut || '',
                adults: Number(data.meta.search_params.guests || 2),
                children: 0,
                currency: data.meta.search_params.currency || 'USD',
                locale: 'en-US'
              }
            };
          } else if (data.meta.search_type === 'flights') {
            widgetPayload = {
              type: 'flight_intent' as const,
              provider: 'expedia' as const,
              payload: {
                destination: data.meta.search_params.destination || '',
                checkIn: data.meta.search_params.departureDate || '',
                checkOut: data.meta.search_params.returnDate || '',
                adults: Number(data.meta.search_params.adults || 1),
                currency: 'USD',
                locale: 'en-US'
              }
            };
          }
          
          const assistantMessage: Message = {
            role: 'assistant',
            content: sanitizeAssistantContent(data.response),
            widgetData: widgetPayload
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // Regular text message without widget
          const assistantMessage: Message = {
            role: 'assistant',
            content: sanitizeAssistantContent(data.response)
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      }
    } catch (error: any) {
      console.error('Help Center AI error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact support@goldsainte.com.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    handleSendMessage(input.trim());
    setInput('');
  };

  const handleDatePickerConfirm = (dates: { depart: string; return?: string }, mode: 'roundTrip' | 'oneWay') => {
    const dateText = mode === 'oneWay'
      ? `Depart: ${dates.depart} (one-way)`
      : `Depart: ${dates.depart}, Return: ${dates.return}`;
    
    // Send dates to backend
    handleSendMessage(dateText);
  };

  const renderMessageContent = (msg: Message) => {
    return (
      <>
        {msg.content && <div className="mb-2">{msg.content}</div>}
        {msg.datePickerData && (
          <FlightDatePickerCard
            prefill={msg.datePickerData.prefill}
            mode={msg.datePickerData.mode}
            onConfirm={handleDatePickerConfirm}
          />
        )}
        {msg.widgetData && (
          <ExpediaWidgetCard payload={msg.widgetData.payload} />
        )}
      </>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        aria-label="Open Help Center Chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-background border border-border rounded-lg shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">Help Center AI</h3>
            <p className="text-xs text-muted-foreground">Ask me anything</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-primary/30" />
              <p className="mb-3 font-medium">Hi! I'm your AI Travel Assistant.</p>
              <div className="text-xs space-y-1.5 text-left max-w-[280px] mx-auto">
                <p className="text-muted-foreground/80">Ask me about:</p>
                <p>• Destination recommendations</p>
                <p>• Trip planning & itineraries</p>
                <p>• Best times to travel</p>
                <p>• Budget estimates</p>
                <p>• Booking questions</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
                  {msg.content}
                </div>
              ) : (
                <div className={`${msg.widgetData ? 'w-full' : 'max-w-[85%]'} rounded-lg ${!msg.widgetData ? 'px-3 py-2 bg-muted' : ''} text-sm`}>
                  {renderMessageContent(msg)}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your question..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
