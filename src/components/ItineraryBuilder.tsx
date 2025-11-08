import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2, MapPin, Sparkles, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TripItineraryView } from "./TripItineraryView";

interface ItineraryBuilderProps {
  jobId?: string;
  userId: string;
  onComplete?: () => void;
}

export const ItineraryBuilder = ({ jobId, userId, onComplete }: ItineraryBuilderProps) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    destination: "",
    destinationCode: "",
    originAirport: "",
    travelers: "2",
    interests: [] as string[],
    pace: "moderate",
    budgetPerDay: "",
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (!formData.destination) {
      toast({
        title: "Missing destination",
        description: "Please enter a destination",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-trip-itinerary', {
        body: {
          destination: formData.destinationCode || formData.destination,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          travelers: parseInt(formData.travelers),
          interests: formData.interests,
          pace: formData.pace,
          budget: formData.budgetPerDay ? { perDay: parseInt(formData.budgetPerDay), currency: 'USD' } : null,
          originAirport: formData.originAirport || null
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error('Failed to generate itinerary');
      }

      setGeneratedItinerary(data);
      
      toast({
        title: "Itinerary generated!",
        description: `Created a ${data.itinerary.length}-day travel plan for ${formData.destination}`,
      });
    } catch (error) {
      console.error("Error generating itinerary:", error);
      toast({
        title: "Error",
        description: "Failed to generate itinerary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const interestOptions = [
    "Culture & History", "Food & Dining", "Adventure", "Nightlife", 
    "Nature & Outdoors", "Shopping", "Art & Museums", "Music & Events"
  ];

  const totalDays = startDate && endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  if (generatedItinerary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setGeneratedItinerary(null)}>
            ← Create New Itinerary
          </Button>
        </div>
        <TripItineraryView 
          itinerary={generatedItinerary.itinerary}
          overview={generatedItinerary.overview}
          destination={formData.destination}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Trip Itinerary
        </CardTitle>
        <CardDescription>
          Generate a complete day-by-day travel plan with real hotels, flights, events, and restaurants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title</Label>
            <Input
              id="title"
              placeholder="e.g., Summer in Bali"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination City</Label>
              <Input
                id="destination"
                placeholder="e.g., Paris, Rome, Tokyo"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationCode">Airport/City Code</Label>
              <Input
                id="destinationCode"
                placeholder="e.g., PAR, ROM, TYO"
                value={formData.destinationCode}
                onChange={(e) => setFormData({ ...formData, destinationCode: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originAirport">Origin Airport (Optional)</Label>
              <Input
                id="originAirport"
                placeholder="e.g., JFK, LAX, LHR"
                value={formData.originAirport}
                onChange={(e) => setFormData({ ...formData, originAirport: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travelers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Travelers
              </Label>
              <Input
                id="travelers"
                type="number"
                min="1"
                max="10"
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {totalDays > 0 && (
            <Badge variant="secondary" className="text-sm">
              {totalDays} {totalDays === 1 ? "day" : "days"}
            </Badge>
          )}

          <div className="space-y-2">
            <Label>Travel Interests</Label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <Badge
                  key={interest}
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pace">Travel Pace</Label>
              <Select value={formData.pace} onValueChange={(value) => setFormData({ ...formData, pace: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">Relaxed - Take it easy</SelectItem>
                  <SelectItem value="moderate">Moderate - Balanced</SelectItem>
                  <SelectItem value="fast">Fast - See everything</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetPerDay" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget per Day (USD)
              </Label>
              <Input
                id="budgetPerDay"
                type="number"
                placeholder="e.g., 150"
                value={formData.budgetPerDay}
                onChange={(e) => setFormData({ ...formData, budgetPerDay: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={generating} className="w-full" size="lg">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Your Perfect Itinerary...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Itinerary
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
