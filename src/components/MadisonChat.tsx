import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMadisonConversation } from "@/hooks/useMadisonConversation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MadisonChatProps {
  initialDestination?: string | null;
  initialContext?: string | null;
  initialNights?: string | null;
  initialVibes?: string | null;
}

export function MadisonChat({ 
  initialDestination, 
  initialContext, 
  initialNights,
  initialVibes 
}: MadisonChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const { conversationId, setConversationId } = useMadisonConversation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-send initial message if context is provided
  useEffect(() => {
    if (initialContext && initialDestination && !hasAutoSent && messages.length === 0) {
      const vibesText = initialVibes ? ` The vibe I'm looking for is ${initialVibes.split(',').join(', ')}.` : '';
      const nightsText = initialNights ? ` for ${initialNights} nights` : '';
      
      const autoMessage = `I'm interested in the "${initialContext}" trip to ${initialDestination}${nightsText}.${vibesText} Can you tell me more about this itinerary and help me customize it?`;
      
      setHasAutoSent(true);
      setInput(autoMessage);
      
      // Auto-send after a brief delay so user can see the message
      setTimeout(() => {
        sendMessageDirect(autoMessage);
      }, 500);
    }
  }, [initialContext, initialDestination, hasAutoSent, messages.length]);

  const sendMessageDirect = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage = messageText.trim();
    setInput("");

    const now = new Date();

    // Immediate local echo
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: now },
    ]);

    setIsLoading(true);

    try {
    const { data, error } = await supabase.functions.invoke("madison", {
      body: {
        message: userMessage,
        userId: user?.id || null,
        inputType: "text",
        conversationId,
      },
    });

      if (error) throw error;

      const response: any = data;

      if (response?.conversationId && response.conversationId !== conversationId) {
        setConversationId(response.conversationId);
      }

      // Build message content with storyboard link if available
      let messageContent = response?.message ?? "I'm having trouble responding right now. Can you try again?";
      
      if (response?.action === "trip_created" && response.storyboard?.id && response.trip?.id) {
        const storyboardUrl = `/trip/${response.trip.id}/storyboard?from=madison`;
        messageContent += `\n\n[View your storyboard →](${storyboardUrl})`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: messageContent,
          timestamp: new Date(),
        },
      ]);

      if (response?.action === "auth_required") {
        toast({
          title: "Sign up to continue",
          description: "Create an account to save trips and storyboards.",
        });
        return;
      }

      if (response?.action === "trip_created" && response.trip) {
        const destination =
          response.trip.destination || "your new destination";

        toast({
          title: "Trip created ✨",
          description: `Planning your ${destination} adventure.`,
        });

        const tripId = response.trip.id;
        // If storyboard exists, send straight to storyboard editor
        if (response.storyboard?.id) {
          navigate(`/trip/${tripId}/storyboard?from=madison`);
        } else {
          navigate(`/trip/${tripId}`);
        }
      }
    } catch (err) {
      console.error("[MadisonChat] Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble right now. Can you try again?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageDirect(input);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="flex flex-col bg-white border border-[#E5DFC6] rounded-2xl shadow-sm overflow-hidden h-[500px]">
      {/* Header */}
      <div className="border-b border-[#E5DFC6] px-5 py-3 bg-[#FDFBF7] flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#C7A962]" />
        <h2 className="text-base font-secondary text-[#0a2225]">Madison</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-5 py-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.length === 0 && !initialContext && (
            <div className="py-16 text-center">
              <Sparkles className="h-5 w-5 text-[#C7A962] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">Morocco in May, 7 days</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-[#0a2225] text-white"
                    : "bg-[#F6F0E4] text-[#0a2225] border border-[#E5DFC6]"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content.split(/(\[.*?\]\(.*?\))/).map((part, i) => {
                    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (linkMatch) {
                      return (
                        <a
                          key={i}
                          href={linkMatch[2]}
                          className={`underline font-semibold hover:opacity-80 transition-opacity ${
                            msg.role === "user" ? "text-white" : "text-[#C7A962]"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(linkMatch[2]);
                          }}
                        >
                          {linkMatch[1]}
                        </a>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </p>
                <p className={`mt-2 text-[10px] ${
                  msg.role === "user" ? "text-white/60" : "text-[#6B7280]"
                }`}>
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-[#F6F0E4] border border-[#E5DFC6] px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-[#C7A962]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-[#E5DFC6] px-5 py-4 bg-[#FDFBF7]">
        <div className="flex gap-3">
          <Input
            placeholder="Where would you like to go?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="bg-white border-[#E5DFC6] rounded-full px-4 text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#C7A962] focus-visible:border-[#C7A962]"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-[#0a2225] hover:bg-[#0a2225]/90 rounded-full h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
