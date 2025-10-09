import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageSquare, Send, Settings, ArrowLeft } from "lucide-react";
import { ComprehensivePreferencesForm } from "@/components/ComprehensivePreferencesForm";
import { invokeStreamingEdgeFunction } from "@/lib/edgeFunctionHelpers";

type Message = { role: "user" | "assistant"; content: string };

export default function BookingPreferences() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchPreferences();
  }, [user, authLoading, navigate]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_booking_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setPreferences(data);
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSavePreferences = async (formData: any) => {
    const prefsData = {
      user_id: user?.id,
      ...formData
    };

    try {
      const { error } = preferences
        ? await supabase.from('user_booking_preferences').update(prefsData).eq('id', preferences.id)
        : await supabase.from('user_booking_preferences').insert(prefsData as any);

      if (error) throw error;
      toast.success('Preferences saved successfully!');
      fetchPreferences();
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const { error } = await invokeStreamingEdgeFunction('ai-booking-assistant', {
        body: { messages: [...messages, userMsg] },
        timeout: 65000, // 65s timeout (slightly longer than backend 60s)
        showToastOnError: true,
        onChunk: (chunk) => {
          // Parse SSE chunks
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;
            if (!line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                  }
                  return [...prev, { role: "assistant", content: assistantContent }];
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        },
        onComplete: () => {
          setIsLoading(false);
        }
      });

      if (error) {
        // Error already handled by invokeStreamingEdgeFunction with toast
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-chiffon text-primary mb-2">Booking Preferences</h1>
            <p className="text-muted-foreground">Customize your travel booking experience</p>
          </div>
          
          <Button onClick={() => setShowChat(!showChat)} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {showChat ? 'Show Form' : 'AI Assistant'}
          </Button>
        </div>

        {showChat ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Booking Assistant
              </CardTitle>
              <CardDescription>
                Chat with our AI to set up your preferences naturally
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 pr-4 mb-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Start chatting to set up your booking preferences
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="animate-pulse">Thinking...</div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
                  placeholder="Tell me about your travel preferences..."
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manual Preferences
              </CardTitle>
              <CardDescription>Set your travel preferences using the form</CardDescription>
            </CardHeader>
            <CardContent>
            <ComprehensivePreferencesForm 
              onSubmit={handleSavePreferences}
              initialData={preferences}
            />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
