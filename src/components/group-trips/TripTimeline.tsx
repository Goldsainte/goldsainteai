import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, DollarSign, GripVertical, Save, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TripTimelineProps {
  trip: any;
  suggestions: any[];
  members: any[];
  participants: any[];
  onUpdate: () => void;
}

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  suggestion_type: string;
  scheduled_date: string | null;
  day_number: number | null;
  display_order: number;
  upvotes: number;
  participantCount: number;
}

const SortableItem = ({ item, onDateChange }: { item: TimelineItem; onDateChange: (id: string, date: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(item.scheduled_date || '');

  const handleSaveDate = () => {
    onDateChange(item.id, tempDate);
    setIsEditingDate(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              className="mt-1 cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <Badge variant="outline">{item.suggestion_type}</Badge>
              </div>

              {item.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{item.location}</span>
                </div>
              )}

              {item.price && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    ${item.price.toFixed(2)}
                    {item.participantCount > 0 && (
                      <span className="ml-2 text-xs">
                        (${(item.price / item.participantCount).toFixed(2)}/person with {item.participantCount} {item.participantCount === 1 ? 'participant' : 'participants'})
                      </span>
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isEditingDate ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="h-8 w-40"
                    />
                    <Button size="sm" onClick={handleSaveDate}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingDate(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingDate(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {item.scheduled_date 
                      ? format(new Date(item.scheduled_date), 'MMM d, yyyy')
                      : 'Set date'}
                  </Button>
                )}
                <Badge variant="secondary">{item.upvotes} votes</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const TripTimeline = ({ trip, suggestions, members, participants, onUpdate }: TripTimelineProps) => {
  const { toast } = useToast();
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [groupedByDate, setGroupedByDate] = useState<Record<string, TimelineItem[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Filter finalized suggestions (3+ upvotes or majority approval)
    const acceptedMembersCount = members.filter(m => m.status === 'accepted').length;
    const majorityThreshold = Math.ceil(acceptedMembersCount / 2);

    const finalizedSuggestions = suggestions.filter(s => 
      s.upvotes >= 3 || s.upvotes >= majorityThreshold
    );

    // Transform to timeline items
    const items: TimelineItem[] = finalizedSuggestions.map(s => {
      const participantCount = participants.filter(
        p => p.suggestion_id === s.id && p.status !== 'declined'
      ).length;

      return {
        id: s.id,
        title: s.title,
        description: s.description,
        location: s.location,
        price: s.price,
        suggestion_type: s.suggestion_type,
        scheduled_date: s.scheduled_date,
        day_number: s.day_number,
        display_order: s.display_order || 0,
        upvotes: s.upvotes,
        participantCount,
      };
    });

    // Sort by scheduled_date and display_order
    items.sort((a, b) => {
      if (a.scheduled_date && b.scheduled_date) {
        const dateCompare = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        if (dateCompare !== 0) return dateCompare;
      }
      if (a.scheduled_date && !b.scheduled_date) return -1;
      if (!a.scheduled_date && b.scheduled_date) return 1;
      return a.display_order - b.display_order;
    });

    setTimelineItems(items);

    // Group by date
    const grouped: Record<string, TimelineItem[]> = {};
    items.forEach(item => {
      const dateKey = item.scheduled_date || 'unscheduled';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    setGroupedByDate(grouped);
  }, [suggestions, members, participants]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = timelineItems.findIndex(item => item.id === active.id);
    const newIndex = timelineItems.findIndex(item => item.id === over.id);

    const newItems = arrayMove(timelineItems, oldIndex, newIndex);
    
    // Update display_order for all affected items
    const updates = newItems.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    setTimelineItems(newItems);

    try {
      // Update all items in database
      for (const update of updates) {
        await supabase
          .from('trip_suggestions')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      toast({
        title: 'Timeline updated',
        description: 'Activity order has been saved',
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update timeline order',
        variant: 'destructive',
      });
    }
  };

  const handleDateChange = async (id: string, date: string) => {
    try {
      // Calculate day_number based on trip start date
      const dayNumber = date 
        ? Math.floor((new Date(date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : null;

      await supabase
        .from('trip_suggestions')
        .update({ 
          scheduled_date: date || null,
          day_number: dayNumber,
        })
        .eq('id', id);

      toast({
        title: 'Date updated',
        description: 'Activity date has been saved',
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating date:', error);
      toast({
        title: 'Error',
        description: 'Failed to update date',
        variant: 'destructive',
      });
    }
  };

  const renderDateSection = (dateKey: string, items: TimelineItem[]) => {
    const isUnscheduled = dateKey === 'unscheduled';
    const sectionTitle = isUnscheduled 
      ? 'Unscheduled Activities' 
      : format(new Date(dateKey), 'EEEE, MMMM d, yyyy');

    const dayNumber = !isUnscheduled && items[0]?.day_number
      ? `Day ${items[0].day_number}`
      : null;

    return (
      <div key={dateKey} className="mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{sectionTitle}</h3>
          {dayNumber && (
            <Badge variant="outline" className="mt-1">{dayNumber}</Badge>
          )}
        </div>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortableItem key={item.id} item={item} onDateChange={handleDateChange} />
          ))}
        </SortableContext>
      </div>
    );
  };

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No finalized activities yet</p>
            <p className="text-sm mt-2">Activities with 3+ votes or majority approval will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Trip Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Drag activities to reorder them. Click on dates to schedule activities.
          </p>
        </CardHeader>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {Object.keys(groupedByDate)
          .sort((a, b) => {
            if (a === 'unscheduled') return 1;
            if (b === 'unscheduled') return -1;
            return new Date(a).getTime() - new Date(b).getTime();
          })
          .map(dateKey => renderDateSection(dateKey, groupedByDate[dateKey]))}
      </DndContext>
    </div>
  );
};
