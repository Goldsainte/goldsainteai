import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ExpediaWidgetCard } from '@/components/ExpediaWidgetCard';
import { FlightDatePickerCard } from '@/components/FlightDatePickerCard';
import { BookingChoicePrompt } from '@/components/BookingChoicePrompt';
import { AgentIntakeForm } from '@/components/AgentIntakeForm';
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
  choicePrompt?: {
    tripType: 'hotels' | 'flights' | 'hotel+flight';
    prefillData: any;
    defaultChoice?: 'self_service' | 'agent';
  };
  agentIntake?: {
    tripType: 'hotels' | 'flights' | 'hotel+flight';
    prefillData: any;
  };
}

export const HelpCenterChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastQuestionIdRef = useRef<string | null>(null);
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);
  const navigate = useNavigate();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track last assistant question
  useEffect(() => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      lastQuestionIdRef.current = `msg-${messages.indexOf(lastAssistantMsg)}`;
    }
  }, [messages]);

  // Sanitize assistant content to remove any route references
  const sanitizeAssistantContent = (content: string): string => {
    return content
      .replace(/\s*\(\/[^)]+\)/g, '')
      .replace(/\s+(?:at|visit|go to|or visit|or go to)\s+\/[^\s.,)]+/gi, '')
      .replace(/\/[a-z0-9/?=-]+/gi, '')
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
        // PRIORITY 1: Check if we should show booking choice prompt FIRST
        const shouldShowChoice = (
          data.meta?.ui?.showChoicePrompt === true ||
          ((data.meta?.search_type === 'hotels' || data.meta?.search_type === 'flights') && 
           data.meta?.ui?.openWidgetInline !== true && 
           data.meta?.ui?.showAgentIntake !== true) // Don't show choice if direct agent intake
        );

        if (shouldShowChoice) {
          console.log('🎯 [TELEMETRY] booking_choice_rendered', {
            tripType: data.meta.search_type,
            hasParams: !!data.meta.search_params
          });
          const assistantMessage: Message = {
            role: 'assistant',
            content: sanitizeAssistantContent(data.response),
            choicePrompt: {
              tripType: data.meta.search_type,
              prefillData: data.meta.search_params,
              defaultChoice: data.meta.ui?.defaultChoice || 'agent' // Pass default to component
            }
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
        // PRIORITY 2: Check if we should go straight to agent intake
        else if (data.meta?.ui?.showAgentIntake) {
          console.log('🎯 [TELEMETRY] agent_intake_started (auto)');
          const assistantMessage: Message = {
            role: 'assistant',
            content: sanitizeAssistantContent(data.response),
            agentIntake: {
              tripType: data.meta.search_type,
              prefillData: data.meta.search_params
            }
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
        // PRIORITY 3: Check if we should show date picker
        else if (data.meta?.ui?.showDatePicker) {
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
        // PRIORITY 4: Check if we should render inline widget (ONLY if explicit self-service)
        else if (FEATURE_FLAGS.USE_EXPEDIA_WIDGET_INLINE && data.meta?.status === 'OK' && data.meta?.search_params && data.meta?.ui?.openWidgetInline === true) {
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

  const handleBookingChoice = (messageIndex: number, choice: 'self_service' | 'agent', tripType: 'hotels' | 'flights' | 'hotel+flight', prefillData: any) => {
    if (choice === 'self_service') {
      console.log('🎯 [TELEMETRY] expedia_widget_opened');
      console.log('🎯 [TELEMETRY] widget_prefill_applied');
      
      // Replace the choice prompt with Expedia widget
      setMessages(prev => prev.map((msg, idx) => {
        if (idx === messageIndex) {
          let widgetPayload;
          if (tripType === 'hotels') {
            widgetPayload = {
              type: 'hotel_intent' as const,
              provider: 'expedia' as const,
              payload: {
                destination: prefillData.location || '',
                checkIn: prefillData.checkIn || '',
                checkOut: prefillData.checkOut || '',
                adults: Number(prefillData.guests || 2),
                children: 0,
                currency: prefillData.currency || 'USD',
                locale: 'en-US'
              }
            };
          } else if (tripType === 'flights') {
            widgetPayload = {
              type: 'flight_intent' as const,
              provider: 'expedia' as const,
              payload: {
                destination: prefillData.destination || '',
                checkIn: prefillData.departureDate || '',
                checkOut: prefillData.returnDate || '',
                adults: Number(prefillData.adults || 1),
                currency: 'USD',
                locale: 'en-US'
              }
            };
          }
          
          return {
            ...msg,
            choicePrompt: undefined,
            widgetData: widgetPayload
          };
        }
        return msg;
      }));
    } else {
      console.log('🎯 [TELEMETRY] agent_intake_started');
      
      // Replace choice prompt with agent intake form
      setMessages(prev => prev.map((msg, idx) => {
        if (idx === messageIndex) {
          return {
            ...msg,
            choicePrompt: undefined,
            agentIntake: {
              tripType,
              prefillData
            }
          };
        }
        return msg;
      }));
    }
  };

  const handleAgentIntakeComplete = (messageIndex: number, leadId: string) => {
    // Replace intake form with confirmation message
    const confirmationText = `✓ Your request has been submitted! Case ID: ${leadId}\n\nA Goldsainte Certified Travel Agent will reach out within 24 hours to help plan your perfect trip.`;
    
    setMessages(prev => prev.map((msg, idx) => {
      if (idx === messageIndex) {
        return {
          ...msg,
          agentIntake: undefined,
          content: msg.content + '\n\n' + confirmationText
        };
      }
      return msg;
    }));
  };

  const handleDatePickerConfirm = (dates: { depart: string; return?: string }, mode: 'roundTrip' | 'oneWay') => {
    const dateText = mode === 'oneWay'
      ? `Depart: ${dates.depart} (one-way)`
      : `Depart: ${dates.depart}, Return: ${dates.return}`;
    
    // Send dates to backend
    handleSendMessage(dateText);
  };

  // Auto-scroll to last question when composer focuses
  const handleComposerFocus = () => {
    setShowQuestionPreview(true);
    if (lastQuestionIdRef.current && scrollRef.current) {
      const questionElement = document.getElementById(lastQuestionIdRef.current);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleComposerBlur = () => {
    setTimeout(() => setShowQuestionPreview(false), 200);
  };

  const scrollToLastQuestion = () => {
    if (lastQuestionIdRef.current) {
      const questionElement = document.getElementById(lastQuestionIdRef.current);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const renderMessageContent = (msg: Message, index: number) => {
    return (
      <>
        {msg.content && <div className="mb-2 whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>}
        {msg.choicePrompt && (
          <BookingChoicePrompt
            tripType={msg.choicePrompt.tripType}
            prefillData={msg.choicePrompt.prefillData}
            defaultChoice={msg.choicePrompt.defaultChoice}
            onChoice={(choice) => handleBookingChoice(index, choice, msg.choicePrompt!.tripType, msg.choicePrompt!.prefillData)}
          />
        )}
        {msg.agentIntake && (
          <AgentIntakeForm
            tripType={msg.agentIntake.tripType}
            initialData={msg.agentIntake.prefillData}
            onComplete={(leadId) => handleAgentIntakeComplete(index, leadId)}
          />
        )}
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
        className="fixed bottom-6 right-6 h-14 w-14 min-h-[56px] min-w-[56px] rounded-full shadow-lg z-40 touch-manipulation"
        aria-label="Open Help Center Chat to ask travel questions"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[min(92vw,380px)] h-[min(85vh,600px)] bg-background border border-border rounded-lg shadow-2xl flex flex-col z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-primary/5" role="banner">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="font-semibold text-[14px] sm:text-[15px] truncate">Help Center AI</h3>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground truncate">Ask me anything</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="min-h-[44px] min-w-[44px] flex-shrink-0"
          aria-label="Close help center chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* Messages - with padding for sticky composer */}
      <ScrollArea className="flex-1 p-3 sm:p-4 pb-0" ref={scrollRef} role="log" aria-live="polite" aria-atomic="false">
        <div className="space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8" role="status">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-primary/30" aria-hidden="true" />
              <p className="mb-3 font-medium text-[15px]">Hi! I'm your AI Travel Assistant.</p>
              <div className="text-[13px] sm:text-[14px] space-y-1.5 text-left max-w-[280px] mx-auto">
                <p className="text-muted-foreground/80">Ask me about:</p>
                <ul className="space-y-1" role="list">
                  <li>• Destination recommendations</li>
                  <li>• Trip planning & itineraries</li>
                  <li>• Best times to travel</li>
                  <li>• Budget estimates</li>
                  <li>• Booking questions</li>
                </ul>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              id={`msg-${idx}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-lg px-3 py-2.5 text-[14px] sm:text-[15px] bg-primary text-primary-foreground leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className={`${msg.widgetData || msg.choicePrompt || msg.agentIntake ? 'w-full' : 'max-w-[85%]'} rounded-lg ${!msg.widgetData && !msg.choicePrompt && !msg.agentIntake ? 'px-3 py-2.5 bg-muted' : ''} text-[14px] sm:text-[15px] leading-relaxed`}>
                  {renderMessageContent(msg, idx)}
                </div>
              )}
            </div>
          ))}
          
          {/* Spacer for sticky input */}
          <div className="h-[140px]" aria-hidden="true" />

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2.5" role="status" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="AI is thinking" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sticky Input Composer */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border" role="form" aria-label="Send message to AI assistant">
        {/* Reply Preview Chip */}
        {showQuestionPreview && lastQuestionIdRef.current && messages.length > 0 && (
          <button
            onClick={scrollToLastQuestion}
            className="absolute -top-9 left-1/2 -translate-x-1/2 text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg border border-border hover:bg-white dark:hover:bg-gray-800 transition-colors z-10"
            aria-label="Show last question"
          >
            <span className="line-clamp-1 max-w-[250px]">
              {messages[messages.length - 1]?.role === 'assistant' ? messages[messages.length - 1].content.slice(0, 40) + '...' : 'Jump to question'}
            </span>
          </button>
        )}
        
        <div className="p-3 sm:p-4">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleComposerFocus}
              onBlur={handleComposerBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your question..."
              className="min-h-[60px] max-h-[120px] resize-none text-[15px] focus-visible:ring-2 focus-visible:ring-[#0E4B44]"
              disabled={isLoading}
              aria-label="Type your travel question here"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 min-h-[48px] min-w-[48px]"
              aria-label="Send message to AI assistant"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};
