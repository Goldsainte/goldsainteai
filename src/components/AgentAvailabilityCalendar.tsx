import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Loader2 } from "lucide-react";

interface AgentAvailabilityCalendarProps {
  agentId: string;
}

export function AgentAvailabilityCalendar({ agentId }: AgentAvailabilityCalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<Record<string, { available: boolean; notes?: string }>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [agentId]);

  useEffect(() => {
    if (selectedDate) {
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      setNotes(availability[dateKey]?.notes || "");
    }
  }, [selectedDate, availability]);

  const loadAvailability = async () => {
    try {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());

      const { data, error } = await supabase
        .from("agent_availability")
        .select("*")
        .eq("agent_id", agentId)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"));

      if (error) throw error;

      const availabilityMap: Record<string, { available: boolean; notes?: string }> = {};
      data?.forEach((item) => {
        availabilityMap[item.date] = {
          available: item.is_available,
          notes: item.notes || undefined,
        };
      });

      setAvailability(availabilityMap);
    } catch (error: any) {
      toast({
        title: "Error loading availability",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!selectedDate) return;

    setSaving(true);
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const currentlyAvailable = availability[dateKey]?.available ?? true;

    try {
      const { error } = await supabase.from("agent_availability").upsert({
        agent_id: agentId,
        date: dateKey,
        is_available: !currentlyAvailable,
        notes: notes || null,
      });

      if (error) throw error;

      setAvailability((prev) => ({
        ...prev,
        [dateKey]: {
          available: !currentlyAvailable,
          notes: notes || undefined,
        },
      }));

      toast({
        title: "Availability updated",
        description: `Marked as ${!currentlyAvailable ? "available" : "unavailable"}`,
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedDate) return;

    setSaving(true);
    const dateKey = format(selectedDate, "yyyy-MM-dd");

    try {
      const { error } = await supabase.from("agent_availability").upsert({
        agent_id: agentId,
        date: dateKey,
        is_available: availability[dateKey]?.available ?? true,
        notes: notes || null,
      });

      if (error) throw error;

      setAvailability((prev) => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          notes: notes || undefined,
        },
      }));

      toast({
        title: "Notes saved",
        description: "Your notes have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const modifiers = {
    unavailable: (date: Date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      return availability[dateKey]?.available === false;
    },
  };

  const modifiersStyles = {
    unavailable: {
      textDecoration: "line-through",
      color: "var(--muted-foreground)",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const isAvailable = availability[dateKey]?.available ?? true;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <p>• Available dates shown in default color</p>
            <p>• Unavailable dates shown crossed out</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              onClick={toggleAvailability}
              disabled={saving || !selectedDate}
              className="w-full"
              variant={isAvailable ? "destructive" : "default"}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : isAvailable ? (
                "Mark as Unavailable"
              ) : (
                "Mark as Available"
              )}
            </Button>
          </div>

          <div>
            <Label htmlFor="notes">Notes for this date</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your availability..."
              className="min-h-[100px]"
            />
            <Button
              onClick={saveNotes}
              disabled={saving || !selectedDate}
              className="w-full mt-2"
              variant="outline"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Notes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
