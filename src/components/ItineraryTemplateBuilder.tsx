import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Edit, Trash2, Calendar, Clock, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TemplateItem {
  day_number: number;
  time_of_day: string;
  activity_title: string;
  activity_description: string;
  location: string;
  duration_minutes: number;
  activity_type: string;
  estimated_cost: number;
  currency: string;
  booking_required: boolean;
  notes: string;
  order_index: number;
}

export function ItineraryTemplateBuilder() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [totalDays, setTotalDays] = useState(1);
  const [isPublic, setIsPublic] = useState(false);
  const [monetizationType, setMonetizationType] = useState<string>("free");
  const [coinPrice, setCoinPrice] = useState(0);
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<TemplateItem>>({
    day_number: 1,
    time_of_day: "morning",
    activity_title: "",
    activity_description: "",
    location: "",
    duration_minutes: 60,
    activity_type: "activity",
    estimated_cost: 0,
    currency: "USD",
    booking_required: false,
    notes: "",
    order_index: 0,
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["itinerary-templates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("itinerary_templates")
        .select("*, template_day_items(*)")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: template, error: templateError } = await supabase
        .from("itinerary_templates")
        .insert({
          creator_id: user.id,
          template_name: templateName,
          description: templateDescription,
          total_days: totalDays,
          is_public: isPublic,
          monetization_type: monetizationType,
          coin_price: coinPrice,
          commission_percentage: commissionPercentage,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("template_day_items")
          .insert(items.map(item => ({ ...item, template_id: template.id })));

        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary-templates"] });
      toast.success("Template created successfully");
      resetForm();
      setIsCreating(false);
    },
    onError: () => {
      toast.error("Failed to create template");
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("itinerary_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  const resetForm = () => {
    setTemplateName("");
    setTemplateDescription("");
    setTotalDays(1);
    setIsPublic(false);
    setMonetizationType("free");
    setCoinPrice(0);
    setCommissionPercentage(0);
    setItems([]);
    setCurrentItem({
      day_number: 1,
      time_of_day: "morning",
      activity_title: "",
      activity_description: "",
      location: "",
      duration_minutes: 60,
      activity_type: "activity",
      estimated_cost: 0,
      currency: "USD",
      booking_required: false,
      notes: "",
      order_index: 0,
    });
    setEditingTemplate(null);
  };

  const handleAddItem = () => {
    if (!currentItem.activity_title) {
      toast.error("Activity title is required");
      return;
    }

    setItems(prev => [...prev, currentItem as TemplateItem]);
    setCurrentItem({
      ...currentItem,
      activity_title: "",
      activity_description: "",
      location: "",
      notes: "",
      order_index: items.length,
    });
    toast.success("Activity added to template");
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!templateName) {
      toast.error("Template name is required");
      return;
    }

    if (items.length === 0) {
      toast.error("Add at least one activity to the template");
      return;
    }

    createTemplateMutation.mutate();
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.day_number]) {
      acc[item.day_number] = [];
    }
    acc[item.day_number].push(item);
    return acc;
  }, {} as Record<number, TemplateItem[]>);

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-secondary">Itinerary Templates</h2>
          <p className="text-muted-foreground">Create reusable itinerary templates for your packages</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Dialog open={isCreating} onOpenChange={(open) => {
        setIsCreating(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Itinerary Template</DialogTitle>
            <DialogDescription>
              Build a day-by-day itinerary that you can reuse for multiple packages
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template_name">Template Name *</Label>
                <Input
                  id="template_name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., 7-Day Bali Adventure"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_days">Total Days</Label>
                <Input
                  id="total_days"
                  type="number"
                  min="1"
                  value={totalDays}
                  onChange={(e) => setTotalDays(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_description">Description</Label>
              <Textarea
                id="template_description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief description of this itinerary..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={isPublic}
                onCheckedChange={(checked) => { const v = checked === true; (setIsPublic)(v); }}
              />
              <Label htmlFor="is_public">Make template public (other creators can use it)</Label>
            </div>

            {isPublic && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Monetization Settings</CardTitle>
                  <CardDescription>How do you want to earn when others use your template?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monetization_type">Monetization Type</Label>
                    <Select
                      value={monetizationType}
                      onValueChange={setMonetizationType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (no charge)</SelectItem>
                        <SelectItem value="coins">Charge Coins (one-time fee)</SelectItem>
                        <SelectItem value="commission">Commission (% of bookings)</SelectItem>
                        <SelectItem value="both">Both (coins + commission)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(monetizationType === "coins" || monetizationType === "both") && (
                    <div className="space-y-2">
                      <Label htmlFor="coin_price">Coin Price</Label>
                      <Input
                        id="coin_price"
                        type="number"
                        min="0"
                        value={coinPrice}
                        onChange={(e) => setCoinPrice(parseInt(e.target.value) || 0)}
                        placeholder="e.g., 100 coins"
                      />
                      <p className="text-xs text-muted-foreground">
                        You'll receive 70% ({Math.floor(coinPrice * 0.7)} coins) after platform fee
                      </p>
                    </div>
                  )}

                  {(monetizationType === "commission" || monetizationType === "both") && (
                    <div className="space-y-2">
                      <Label htmlFor="commission_percentage">Commission Percentage</Label>
                      <Input
                        id="commission_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commissionPercentage}
                        onChange={(e) => setCommissionPercentage(parseFloat(e.target.value) || 0)}
                        placeholder="e.g., 10%"
                      />
                      <p className="text-xs text-muted-foreground">
                        Earn {commissionPercentage}% of every booking made with your template
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Add Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day_number">Day</Label>
                    <Input
                      id="day_number"
                      type="number"
                      min="1"
                      max={totalDays}
                      value={currentItem.day_number}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, day_number: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_of_day">Time of Day</Label>
                    <Select
                      value={currentItem.time_of_day}
                      onValueChange={(value) => setCurrentItem(prev => ({ ...prev, time_of_day: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="full_day">Full Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity_type">Activity Type</Label>
                    <Select
                      value={currentItem.activity_type}
                      onValueChange={(value) => setCurrentItem(prev => ({ ...prev, activity_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="flight">Flight</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="meal">Meal</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="sightseeing">Sightseeing</SelectItem>
                        <SelectItem value="free_time">Free Time</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity_title">Activity Title *</Label>
                    <Input
                      id="activity_title"
                      value={currentItem.activity_title}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, activity_title: e.target.value }))}
                      placeholder="e.g., Visit Uluwatu Temple"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={currentItem.location}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Uluwatu, Bali"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity_description">Description</Label>
                  <Textarea
                    id="activity_description"
                    value={currentItem.activity_description}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, activity_description: e.target.value }))}
                    placeholder="Details about this activity..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Duration (min)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      min="0"
                      value={currentItem.duration_minutes}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_cost">Est. Cost</Label>
                    <Input
                      id="estimated_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.estimated_cost}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={currentItem.currency}
                      onValueChange={(value) => setCurrentItem(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="booking_required"
                        checked={currentItem.booking_required}
                        onCheckedChange={(checked) => { const v = checked === true; ((checked) => setCurrentItem(prev => ({ ...prev, booking_required: checked)(v); }}))}
                      />
                      <Label htmlFor="booking_required" className="text-xs">Booking Required</Label>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAddItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </CardContent>
            </Card>

            {items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Preview ({items.length} activities)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(groupedItems).map(([day, dayItems]) => (
                      <AccordionItem key={day} value={`day-${day}`}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Day {day} ({dayItems.length} activities)
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {dayItems.map((item, index) => {
                              const globalIndex = items.findIndex(i => i === item);
                              return (
                                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {item.time_of_day}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {item.activity_type}
                                      </Badge>
                                      {item.booking_required && (
                                        <Badge variant="default" className="text-xs">Booking Required</Badge>
                                      )}
                                    </div>
                                    <h4 className="font-semibold">{item.activity_title}</h4>
                                    {item.activity_description && (
                                      <p className="text-sm text-muted-foreground">{item.activity_description}</p>
                                    )}
                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                      {item.location && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {item.location}
                                        </span>
                                      )}
                                      {item.duration_minutes > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {item.duration_minutes} min
                                        </span>
                                      )}
                                      {item.estimated_cost > 0 && (
                                        <span>
                                          {item.currency} {item.estimated_cost}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItem(globalIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => { setIsCreating(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{template.template_name}</CardTitle>
                    {template.is_public && <Badge>Public</Badge>}
                  </div>
                  {template.description && (
                    <CardDescription className="mt-1">{template.description}</CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this template?")) {
                      deleteTemplateMutation.mutate(template.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex gap-4">
                  <span><span className="font-medium">Total Days:</span> {template.total_days}</span>
                  <span><span className="font-medium">Activities:</span> {template.template_day_items?.length || 0}</span>
                  <span><span className="font-medium">Used:</span> {template.usage_count} times</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No templates created yet</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}