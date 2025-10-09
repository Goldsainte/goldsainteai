import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus,
  MapPin,
  Clock,
  Plane,
  Hotel,
  UtensilsCrossed,
  Car,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface ItineraryItem {
  id: string;
  day_number: number;
  item_date: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  item_type: string;
  cost: number | null;
  currency: string;
}

interface ItineraryTimelineProps {
  itineraryId: string;
}

const itemTypeIcons: Record<string, any> = {
  accommodation: Hotel,
  activity: MapPin,
  transportation: Car,
  meal: UtensilsCrossed,
  flight: Plane,
  other: CalendarIcon,
};

const itemTypeColors: Record<string, string> = {
  accommodation: "bg-purple-500",
  activity: "bg-blue-500",
  transportation: "bg-green-500",
  meal: "bg-orange-500",
  flight: "bg-sky-500",
  other: "bg-gray-500",
};

export const ItineraryTimeline = ({ itineraryId }: ItineraryTimelineProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  const [newItem, setNewItem] = useState({
    day_number: 1,
    title: "",
    description: "",
    location: "",
    item_type: "activity",
    start_time: "",
    end_time: "",
    cost: "",
  });

  useEffect(() => {
    fetchItems();
  }, [itineraryId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("itinerary_id", itineraryId)
        .order("day_number", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching itinerary items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      // Get itinerary to calculate item_date
      const { data: itinerary } = await supabase
        .from("trip_itineraries")
        .select("start_date")
        .eq("id", itineraryId)
        .single();

      if (!itinerary) throw new Error("Itinerary not found");

      const startDate = new Date(itinerary.start_date);
      const itemDate = new Date(startDate);
      itemDate.setDate(startDate.getDate() + newItem.day_number - 1);

      const { error } = await supabase
        .from("itinerary_items")
        .insert({
          itinerary_id: itineraryId,
          day_number: newItem.day_number,
          item_date: format(itemDate, "yyyy-MM-dd"),
          title: newItem.title,
          description: newItem.description || null,
          location: newItem.location || null,
          item_type: newItem.item_type,
          start_time: newItem.start_time || null,
          end_time: newItem.end_time || null,
          cost: newItem.cost ? parseFloat(newItem.cost) : null,
          currency: "USD",
        });

      if (error) throw error;

      toast({
        title: "Item added",
        description: "Itinerary item added successfully",
      });

      setNewItem({
        day_number: 1,
        title: "",
        description: "",
        location: "",
        item_type: "activity",
        start_time: "",
        end_time: "",
        cost: "",
      });
      setShowAddForm(false);
      fetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const groupedByDay = items.reduce((acc, item) => {
    if (!acc[item.day_number]) {
      acc[item.day_number] = [];
    }
    acc[item.day_number].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trip Timeline</CardTitle>
            <CardDescription>Day-by-day itinerary details</CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showAddForm && (
          <form onSubmit={handleAddItem} className="space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.day_number}
                  onChange={(e) => setNewItem({ ...newItem, day_number: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Activity Type</Label>
                <Select value={newItem.item_type} onValueChange={(value) => setNewItem({ ...newItem, item_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Visit Uluwatu Temple"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newItem.start_time}
                  onChange={(e) => setNewItem({ ...newItem, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newItem.end_time}
                  onChange={(e) => setNewItem({ ...newItem, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Uluwatu, Bali"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Add details..."
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={adding}>
                {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Item
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-8">
          {Object.keys(groupedByDay)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((day) => {
              const dayItems = groupedByDay[parseInt(day)];
              return (
                <div key={day} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1">
                      Day {day}
                    </Badge>
                    <Separator className="flex-1" />
                  </div>

                  <div className="space-y-3 ml-4">
                    {dayItems.map((item) => {
                      const Icon = itemTypeIcons[item.item_type];
                      const colorClass = itemTypeColors[item.item_type];

                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colorClass)}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{item.title}</h4>
                                {item.location && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.location}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                                )}
                              </div>
                              {(item.start_time || item.end_time) && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.start_time && format(new Date(`2000-01-01T${item.start_time}`), "h:mm a")}
                                  {item.start_time && item.end_time && " - "}
                                  {item.end_time && format(new Date(`2000-01-01T${item.end_time}`), "h:mm a")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {items.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities added yet</p>
            <p className="text-sm">Click "Add Activity" to start building your itinerary</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
