import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMadisonConversation } from "@/hooks/useMadisonConversation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function MadisonChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { conversationId } = useMadisonConversation();
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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
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
          conversationId: conversationId || crypto.randomUUID(),
        },
      });

      if (error) throw error;

      const response: any = data;

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

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">Madison</h2>
        <p className="text-xs text-muted-foreground">
          Your AI travel concierge (text & voice)
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div ref={scrollRef} className="space-y-4">
          {messages.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-2 text-sm">👋 Hi, I'm Madison.</p>
              <p className="text-xs">
                Try: "I want to go to Morocco in May for 7 days."
              </p>
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
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">
                  {msg.content.split(/(\[.*?\]\(.*?\))/).map((part, i) => {
                    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (linkMatch) {
                      return (
                        <a
                          key={i}
                          href={linkMatch[2]}
                          className="underline font-semibold hover:opacity-80 transition-opacity"
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
                <p className="mt-1 text-[10px] opacity-70">
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
              <div className="rounded-lg bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <Input
            placeholder='Type a message... (e.g., "I want to go to Morocco")'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="bg-background"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
