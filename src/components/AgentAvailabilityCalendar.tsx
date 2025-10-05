import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface AgentAvailabilityCalendarProps {
  agentId: string;
  isOwner?: boolean;
}

export const AgentAvailabilityCalendar = ({ 
  agentId, 
  isOwner = false 
}: AgentAvailabilityCalendarProps) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [agentId]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_availability')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_available', false);

      if (error) throw error;

      const dates = data.map(item => new Date(item.date));
      setUnavailableDates(dates);
    } catch (error: any) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleToggleAvailability = async (date: Date) => {
    if (!isOwner) return;

    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');

      // Check if date already marked as unavailable
      const isCurrentlyUnavailable = unavailableDates.some(
        d => format(d, 'yyyy-MM-dd') === dateStr
      );

      if (isCurrentlyUnavailable) {
        // Mark as available (delete record or update)
        const { error } = await supabase
          .from('agent_availability')
          .delete()
          .eq('agent_id', agentId)
          .eq('date', dateStr);

        if (error) throw error;

        setUnavailableDates(prev => 
          prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr)
        );
        toast.success("Marked as available");
      } else {
        // Mark as unavailable
        const { error } = await supabase
          .from('agent_availability')
          .upsert({
            agent_id: agentId,
            date: dateStr,
            is_available: false
          }, {
            onConflict: 'agent_id,date'
          });

        if (error) throw error;

        setUnavailableDates(prev => [...prev, date]);
        toast.success("Marked as unavailable");
      }
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const modifiers = {
    unavailable: unavailableDates
  };

  const modifiersStyles = {
    unavailable: {
      textDecoration: 'line-through',
      color: '#999',
      backgroundColor: '#f0f0f0'
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Availability Calendar</CardTitle>
          {unavailableDates.length > 0 && (
            <Badge variant="secondary">
              {unavailableDates.length} unavailable day{unavailableDates.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => {
            if (isOwner && dates && dates.length > 0) {
              const latestDate = dates[dates.length - 1];
              handleToggleAvailability(latestDate);
            }
          }}
          disabled={loading || !isOwner}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border"
        />
        {isOwner && (
          <p className="text-xs text-muted-foreground mt-4">
            Click on dates to mark them as unavailable. Click again to mark as available.
          </p>
        )}
        {!isOwner && unavailableDates.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Unavailable Dates:</p>
            <div className="flex flex-wrap gap-2">
              {unavailableDates.map((date, idx) => (
                <Badge key={idx} variant="outline">
                  {format(date, 'MMM d, yyyy')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};