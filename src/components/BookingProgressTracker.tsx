import { MapPin, Calendar, Users, DollarSign, CheckCircle2, Circle, Edit2, Zap, Palmtree, Building2, Mountain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface BookingInfo {
  destination?: string;
  dates?: string;
  guests?: number;
  budget?: string;
}

export interface QuickStartTemplate {
  id: string;
  name: string;
  icon: any;
  description: string;
  destination: string;
  dates: string;
  guests: string;
  budget: string;
}

interface BookingProgressTrackerProps {
  bookingInfo: BookingInfo;
  onEdit: (field: keyof BookingInfo, value: string) => void;
  onQuickStart?: (template: QuickStartTemplate) => void;
}

export const BookingProgressTracker = ({ bookingInfo, onEdit, onQuickStart }: BookingProgressTrackerProps) => {
  const [editingField, setEditingField] = useState<keyof BookingInfo | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const hasDestination = !!bookingInfo.destination;
  const hasDates = !!bookingInfo.dates;
  const hasGuests = !!bookingInfo.guests;
  const hasBudget = !!bookingInfo.budget;

  const templates: QuickStartTemplate[] = [
    {
      id: 'beach',
      name: 'Beach Vacation',
      icon: Palmtree,
      description: 'Relaxing tropical getaway',
      destination: 'Maldives',
      dates: 'June 10 to June 20, 2025',
      guests: '2 people',
      budget: '$5000 per person'
    },
    {
      id: 'city',
      name: 'City Break',
      icon: Building2,
      description: 'Urban exploration and culture',
      destination: 'Paris',
      dates: 'March 15 to March 22, 2025',
      guests: '2 people',
      budget: '$3000 per person'
    },
    {
      id: 'adventure',
      name: 'Adventure Trip',
      icon: Mountain,
      description: 'Outdoor activities and hiking',
      destination: 'New Zealand',
      dates: 'September 5 to September 18, 2025',
      guests: '4 people',
      budget: '$4500 per person'
    }
  ];

  const handleOpenEdit = (field: keyof BookingInfo) => {
    setEditingField(field);
    const currentValue = bookingInfo[field];
    setEditValue(currentValue ? String(currentValue) : "");
  };

  const handleSaveEdit = () => {
    if (editingField && editValue.trim()) {
      onEdit(editingField, editValue.trim());
      setEditingField(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const progressItems = [
    {
      icon: MapPin,
      label: "Destination",
      field: 'destination' as keyof BookingInfo,
      value: bookingInfo.destination,
      completed: hasDestination,
      placeholder: "e.g., Paris, Tokyo, New York",
      inputType: "text" as const,
    },
    {
      icon: Calendar,
      label: "Dates",
      field: 'dates' as keyof BookingInfo,
      value: bookingInfo.dates,
      completed: hasDates,
      placeholder: "e.g., Jan 15 - Jan 22, 2024",
      inputType: "text" as const,
    },
    {
      icon: Users,
      label: "Guests",
      field: 'guests' as keyof BookingInfo,
      value: bookingInfo.guests ? `${bookingInfo.guests} ${bookingInfo.guests === 1 ? 'person' : 'people'}` : undefined,
      completed: hasGuests,
      placeholder: "e.g., 2",
      inputType: "number" as const,
    },
    {
      icon: DollarSign,
      label: "Budget",
      field: 'budget' as keyof BookingInfo,
      value: bookingInfo.budget,
      completed: hasBudget,
      placeholder: "e.g., $2000 per person",
      inputType: "text" as const,
    },
  ];

  const completedCount = [hasDestination, hasDates, hasGuests, hasBudget].filter(Boolean).length;
  const totalCount = 4;

  // Show Quick Start button if no information collected
  if (completedCount === 0) {
    return onQuickStart ? (
      <>
        <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20 mb-3 animate-fade-in">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-accent" />
              <p className="text-xs font-semibold text-foreground">Quick Start Demo</p>
            </div>
            <p className="text-caption text-muted-foreground mb-3 leading-relaxed">
              Try the booking flow with example scenarios
            </p>
            <Button
              onClick={() => setShowTemplateDialog(true)}
              size="sm"
              className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
            >
              <Zap className="h-3 w-3 mr-1" />
              Choose Template
            </Button>
          </div>
        </Card>

        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Choose a Quick Start Template
              </DialogTitle>
              <DialogDescription>
                Select a travel scenario to test the booking flow with example information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      onQuickStart(template);
                      setShowTemplateDialog(false);
                    }}
                    className="group flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary/50 bg-card hover:bg-accent/5 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 text-foreground group-hover:text-primary transition-colors">
                        {template.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-caption">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{template.destination}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{template.guests}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                          <Calendar className="h-3 w-3" />
                          <span>{template.dates}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>{template.budget}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </>
    ) : null;
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 mb-3 animate-fade-in">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground">Booking Information</p>
            <span className="text-caption text-muted-foreground">
              {completedCount}/{totalCount} collected
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {progressItems.map((item) => {
              const Icon = item.icon;
              const StatusIcon = item.completed ? CheckCircle2 : Circle;
              
              return (
                <button
                  key={item.label}
                  onClick={() => handleOpenEdit(item.field)}
                  className={`flex items-start gap-1.5 p-2 rounded-md transition-all group cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    item.completed 
                      ? 'bg-primary/10 border border-primary/20 hover:bg-primary/15' 
                      : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                  }`}
                >
                  <Icon 
                    className={`h-3 w-3 mt-0.5 flex-shrink-0 transition-colors ${
                      item.completed ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-caption font-medium text-muted-foreground mb-0.5">
                      {item.label}
                    </p>
                    <p className={`text-xs sm:text-sm font-semibold truncate ${
                      item.completed ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}>
                      {item.value || 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Edit2 className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    <StatusIcon 
                      className={`h-3 w-3 flex-shrink-0 ${
                        item.completed ? 'text-primary' : 'text-muted-foreground/30'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          
          {completedCount === totalCount && (
            <div className="flex items-center gap-1 justify-center pt-1 animate-fade-in">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <p className="text-caption text-green-600 font-medium">All information collected!</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!editingField} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingField && progressItems.find(i => i.field === editingField)?.label}</DialogTitle>
            <DialogDescription>
              Update your {editingField && progressItems.find(i => i.field === editingField)?.label.toLowerCase()} information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">
                {editingField && progressItems.find(i => i.field === editingField)?.label}
              </Label>
              <Input
                id="edit-value"
                type={editingField && progressItems.find(i => i.field === editingField)?.inputType}
                placeholder={editingField && progressItems.find(i => i.field === editingField)?.placeholder}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
