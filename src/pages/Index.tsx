import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Hotel, MapPin, Compass, Search, Send, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { SimplePropertyCard } from "@/components/SimplePropertyCard";
import logomark from "@/assets/logomark-gold.png";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
  filters?: any;
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
      hotels: "Show me popular hotels",
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

  const resetChat = () => {
    setMessages([]);
    setSearchResults([]);
    setConversationHistory([]);
  };

  const showChat = messages.length > 0;

  return (
    <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full h-full flex flex-col">
        {!showChat ? (
          // Initial search view - centered
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Logo and Title */}
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <img src={logomark} alt="Goldsainte" className="h-20 w-20 relative z-10" />
                </div>
                <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Goldsainte AI Travel Assistant
                </h1>
                <p className="text-muted-foreground text-center max-w-md">
                  Your intelligent travel companion powered by AI. Find hotels, destinations, and plan your perfect trip.
                </p>
              </div>

              {/* Main Search */}
              <Card className="relative overflow-hidden border-2 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
                <div className="relative p-2">
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      placeholder="Where would you like to go? Ask me anything..."
                      className="w-full h-14 pl-12 pr-14 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleSearch()}
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">Quick actions</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => handleQuickAction('hotels')}
                    disabled={isLoading}
                  >
                    <Hotel className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Hotels</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => handleQuickAction('flights')}
                    disabled={isLoading}
                  >
                    <Plane className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Flights</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => handleQuickAction('destinations')}
                    disabled={isLoading}
                  >
                    <MapPin className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Destinations</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => handleQuickAction('explore')}
                    disabled={isLoading}
                  >
                    <Compass className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Explore</span>
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <p className="text-xs text-muted-foreground text-center pt-8">
                By using Goldsainte AI, you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">Terms</a>
                {" "}and{" "}
                <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
              </p>
            </div>
          </div>
        ) : (
          // Chat view - full screen
          <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetChat}
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <img src={logomark} alt="Goldsainte" className="h-8 w-8" />
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">Goldsainte AI</h1>
                    <p className="text-xs text-muted-foreground">Your travel assistant</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6">
              <div className="py-6 space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <Card className={`p-4 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-card border-border'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </Card>
                    </div>
                  </div>
                ))}

                {/* Search Results */}
                {searchResults.map((result, idx) => (
                  <div key={`result-${idx}`} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    {result.type === 'hotels' && result.results.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-foreground">
                            {result.filters?.sortBy === 'popularity' && '🔥 Most Popular Hotels'}
                            {result.filters?.sortBy === 'review_score' && '⭐ Top Rated Hotels'}
                            {result.filters?.sortBy === 'price' && '💰 Budget-Friendly Hotels'}
                            {!result.filters?.sortBy && 'Available Hotels'}
                          </h3>
                          {result.filters && (
                            <div className="flex gap-2">
                              {result.filters.minRating && (
                                <Badge variant="secondary">⭐ {result.filters.minRating}+</Badge>
                              )}
                              {result.filters.maxPrice && (
                                <Badge variant="secondary">≤ ${result.filters.maxPrice}</Badge>
                              )}
                            </div>
                          )}
                        </div>
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
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">
                          🌍 Destinations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.results.slice(0, 6).map((dest: any, destIdx: number) => (
                            <Card key={dest.dest_id || destIdx} className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                              <h4 className="font-semibold text-foreground mb-1">{dest.label}</h4>
                              <p className="text-sm text-muted-foreground">{dest.region || dest.dest_type}</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 animate-in fade-in">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <Card className="p-4 bg-card">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Searching for the best options...</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
              <div className="px-6 py-4 max-w-4xl mx-auto">
                <Card className="border-2 shadow-lg">
                  <div className="p-2">
                    <div className="relative">
                      <Input
                        placeholder="Ask me anything about travel..."
                        className="w-full h-12 px-4 pr-14 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
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
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
