import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Hotel, MapPin, Compass, Search, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { SimplePropertyCard } from "@/components/SimplePropertyCard";
import logomark from "@/assets/logomark-gold.png";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SearchResult {
  type: string;
  results: any[];
  location?: any;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  const handleSearch = async (query?: string) => {
    const queryToSend = query || searchQuery;
    if (!queryToSend.trim()) return;
    
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: queryToSend }]);
    setSearchQuery("");

    try {
      const { data, error } = await supabase.functions.invoke('travel-ai-agent', {
        body: { 
          message: queryToSend,
          conversationHistory 
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      if (data.toolResults && data.toolResults.length > 0) {
        setSearchResults(data.toolResults.filter((r: any) => r.results && r.results.length > 0));
      }

      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }
    } catch (err: any) {
      console.error('AI Agent error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const queries = {
      hotels: "Show me hotels in Paris",
      flights: "I need to find flights",
      destinations: "What are some popular travel destinations?",
      explore: "Help me explore new places to visit"
    };
    handleSearch(queries[action as keyof typeof queries]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  const showChat = messages.length > 0;

  return (
    <main className="flex-1 flex items-center justify-center bg-background">
      <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col min-h-[calc(100vh-3.5rem)]">
        {!showChat ? (
          // Initial search view
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center mb-12">
              <img src={logomark} alt="Goldsainte" className="h-16 w-16" />
            </div>

            <div className="w-full max-w-3xl space-y-4">
              <div className="relative">
                <Input
                  placeholder="Where Can Goldsainte AI Help You Travel To"
                  className="w-full h-14 px-6 pr-12 text-base border-border rounded-3xl shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSearch()}
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-4 border-border hover:bg-muted"
                  onClick={() => handleQuickAction('hotels')}
                  disabled={isLoading}
                >
                  <Hotel className="h-4 w-4 mr-2" />
                  Hotels
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-4 border-border hover:bg-muted"
                  onClick={() => handleQuickAction('flights')}
                  disabled={isLoading}
                >
                  <Plane className="h-4 w-4 mr-2" />
                  Flights
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-4 border-border hover:bg-muted"
                  onClick={() => handleQuickAction('destinations')}
                  disabled={isLoading}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Destinations
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-4 border-border hover:bg-muted"
                  onClick={() => handleQuickAction('explore')}
                  disabled={isLoading}
                >
                  <Compass className="h-4 w-4 mr-2" />
                  Explore
                </Button>
              </div>
            </div>

            <div className="mt-auto pt-12">
              <p className="text-sm text-muted-foreground text-center">
                By using Goldsainte AI, you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">
                  Terms
                </a>{" "}
                and have read our{" "}
                <a href="#" className="underline hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        ) : (
          // Chat view
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center mb-6 pb-4 border-b border-border">
              <img src={logomark} alt="Goldsainte" className="h-10 w-10 mr-3" />
              <h1 className="text-xl font-semibold text-foreground">Goldsainte AI Travel Assistant</h1>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <Card className={`max-w-[80%] p-4 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                  </div>
                ))}

                {searchResults.map((result, idx) => (
                  <div key={`result-${idx}`} className="space-y-4">
                    {result.type === 'hotels' && result.results.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground">
                          Available Hotels
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.results.map((hotel: any, hotelIdx: number) => (
                            <SimplePropertyCard
                              key={hotel.hotel_id || hotelIdx}
                              property={hotel}
                              type="hotels"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {result.type === 'destinations' && result.results.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground">
                          Destinations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.results.slice(0, 6).map((dest: any, destIdx: number) => (
                            <Card key={dest.dest_id || destIdx} className="p-4 hover:shadow-md transition-shadow">
                              <h4 className="font-semibold text-foreground">{dest.label}</h4>
                              <p className="text-sm text-muted-foreground">{dest.region || dest.dest_type}</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <Card className="p-4 bg-card">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="relative">
                <Input
                  placeholder="Ask me anything about travel..."
                  className="w-full h-12 px-4 pr-12 border-border rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSearch()}
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                  disabled={isLoading || !searchQuery.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
