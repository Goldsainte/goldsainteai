import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageSquare, Send, Settings } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function BookingPreferences() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchPreferences();
  }, [user, navigate]);

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

  const handleSavePreferences = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const preferredAmenities = (formData.get('preferred_amenities') as string).split(',').map(s => s.trim()).filter(Boolean);
    const dietaryRestrictions = (formData.get('dietary_restrictions') as string).split(',').map(s => s.trim()).filter(Boolean);
    const preferredAirlines = (formData.get('preferred_airlines') as string).split(',').map(s => s.trim()).filter(Boolean);

    const prefsData = {
      user_id: user?.id,
      preferred_hotel_rating: parseInt(formData.get('preferred_hotel_rating') as string),
      max_price_per_night: parseFloat(formData.get('max_price_per_night') as string),
      preferred_amenities: preferredAmenities,
      dietary_restrictions: dietaryRestrictions,
      preferred_airlines: preferredAirlines,
      seat_preference: formData.get('seat_preference') as string,
      meal_preference: formData.get('meal_preference') as string,
      special_requests: formData.get('special_requests') as string,
      auto_booking_enabled: formData.get('auto_booking_enabled') === 'on'
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-booking-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to start stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

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
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
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
              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferred_hotel_rating">Preferred Hotel Rating</Label>
                    <Input 
                      id="preferred_hotel_rating" 
                      name="preferred_hotel_rating" 
                      type="number" 
                      min="1" 
                      max="5" 
                      defaultValue={preferences?.preferred_hotel_rating || 4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max_price_per_night">Max Price Per Night ($)</Label>
                    <Input 
                      id="max_price_per_night" 
                      name="max_price_per_night" 
                      type="number" 
                      step="0.01"
                      defaultValue={preferences?.max_price_per_night || ""}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="preferred_amenities">Preferred Amenities</Label>
                  <Input 
                    id="preferred_amenities" 
                    name="preferred_amenities" 
                    placeholder="Pool, Spa, Gym, WiFi (comma-separated)"
                    defaultValue={preferences?.preferred_amenities?.join(', ') || ""}
                  />
                </div>

                <div>
                  <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                  <Input 
                    id="dietary_restrictions" 
                    name="dietary_restrictions" 
                    placeholder="Vegetarian, Gluten-free, Halal (comma-separated)"
                    defaultValue={preferences?.dietary_restrictions?.join(', ') || ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seat_preference">Seat Preference</Label>
                    <select 
                      id="seat_preference" 
                      name="seat_preference" 
                      defaultValue={preferences?.seat_preference || "window"}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="window">Window</option>
                      <option value="aisle">Aisle</option>
                      <option value="middle">Middle</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="meal_preference">Meal Preference</Label>
                    <select 
                      id="meal_preference" 
                      name="meal_preference" 
                      defaultValue={preferences?.meal_preference || "regular"}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="regular">Regular</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="kosher">Kosher</option>
                      <option value="halal">Halal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="preferred_airlines">Preferred Airlines</Label>
                  <Input 
                    id="preferred_airlines" 
                    name="preferred_airlines" 
                    placeholder="Emirates, Qatar Airways (comma-separated)"
                    defaultValue={preferences?.preferred_airlines?.join(', ') || ""}
                  />
                </div>

                <div>
                  <Label htmlFor="special_requests">Special Requests</Label>
                  <Textarea 
                    id="special_requests" 
                    name="special_requests" 
                    placeholder="Any special requests or requirements..."
                    defaultValue={preferences?.special_requests || ""}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="auto_booking_enabled" 
                    name="auto_booking_enabled"
                    defaultChecked={preferences?.auto_booking_enabled || false}
                  />
                  <Label htmlFor="auto_booking_enabled">
                    Enable Auto-Booking <Badge variant="secondary" className="ml-2">Beta</Badge>
                  </Label>
                </div>

                <Button type="submit" className="w-full">Save Preferences</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
