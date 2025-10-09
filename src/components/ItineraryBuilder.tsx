import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Loader2, MapPin, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ItineraryBuilderProps {
  jobId?: string;
  userId: string;
  onComplete?: () => void;
}

export const ItineraryBuilder = ({ jobId, userId, onComplete }: ItineraryBuilderProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    destination: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("trip_itineraries")
        .insert({
          job_id: jobId || null,
          user_id: userId,
          title: formData.title,
          description: formData.description,
          destination: formData.destination,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          status: "draft",
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Itinerary created",
        description: "Your trip itinerary has been created successfully",
      });

      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error creating itinerary:", error);
      toast({
        title: "Error",
        description: "Failed to create itinerary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const totalDays = startDate && endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Create Trip Itinerary
        </CardTitle>
        <CardDescription>
          Build a detailed day-by-day plan for your trip
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="e.g., Bali, Indonesia"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
            />
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add any notes or special details about this trip..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Itinerary
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
