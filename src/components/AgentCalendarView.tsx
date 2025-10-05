import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Plus, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  event_type: string;
  location: string | null;
  color: string;
}

interface AgentCalendarViewProps {
  agentId: string;
}

const eventTypeColors: Record<string, string> = {
  meeting: "bg-blue-500",
  call: "bg-green-500",
  deadline: "bg-red-500",
  trip: "bg-purple-500",
  blocked: "bg-gray-500",
  other: "bg-orange-500",
};

export const AgentCalendarView = ({ agentId }: AgentCalendarViewProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [agentId, currentMonth]);

  const fetchEvents = async () => {
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data, error } = await (supabase as any)
        .from("agent_calendar_events")
        .select("*")
        .eq("agent_id", agentId)
        .gte("start_datetime", monthStart.toISOString())
        .lte("start_datetime", monthEnd.toISOString())
        .order("start_datetime", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportICAL = async () => {
    try {
      const { data, error } = await (supabase as any).rpc("generate_ical_feed", {
        p_agent_id: agentId,
      });

      if (error) throw error;

      const blob = new Blob([String(data)], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "calendar.ics";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting calendar:", error);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) =>
      isSameDay(new Date(event.start_datetime), day)
    );
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agent Calendar
              </CardTitle>
              <CardDescription>
                {format(currentMonth, "MMMM yyyy")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportICAL}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold p-2">
                {day}
              </div>
            ))}

            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "p-2 text-sm rounded-lg hover:bg-accent transition-colors",
                    isToday(day) && "bg-primary/10 font-semibold",
                    isSelected && "ring-2 ring-primary",
                    dayEvents.length > 0 && "border-l-4 border-blue-500"
                  )}
                >
                  <div>{format(day, "d")}</div>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-1 mt-1 justify-center">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            eventTypeColors[event.event_type] || "bg-gray-500"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </CardTitle>
          <CardDescription>
            {selectedDayEvents.length} {selectedDayEvents.length === 1 ? "event" : "events"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((event) => (
              <div key={event.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold">{event.title}</h4>
                  <Badge variant="secondary" className="capitalize">
                    {event.event_type}
                  </Badge>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(event.start_datetime), "h:mm a")} -{" "}
                  {format(new Date(event.end_datetime), "h:mm a")}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                )}
              </div>
            ))
          ) : selectedDate ? (
            <p className="text-center text-muted-foreground py-8">No events for this day</p>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Select a date to view events
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
