import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CreateGroupTripDialogProps {
  onTripCreated?: (tripId: string) => void;
}

export const CreateGroupTripDialog = ({ onTripCreated }: CreateGroupTripDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    budgetPerPerson: '',
  });

  const handleCreate = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a group trip',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title || !formData.destination || !startDate || !endDate) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create the group trip
      const { data: trip, error: tripError } = await supabase
        .from('group_trips')
        .insert({
          creator_id: user.id,
          title: formData.title,
          destination: formData.destination,
          description: formData.description,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          budget_per_person: formData.budgetPerPerson ? parseFloat(formData.budgetPerPerson) : null,
          status: 'planning',
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Add creator as a member
      const { error: memberError } = await supabase
        .from('trip_members')
        .insert({
          trip_id: trip.id,
          user_id: user.id,
          role: 'creator',
          status: 'accepted',
        });

      if (memberError) throw memberError;

      toast({
        title: 'Trip created!',
        description: 'Your group trip has been created successfully',
      });

      setOpen(false);
      setFormData({ title: '', destination: '', description: '', budgetPerPerson: '' });
      setStartDate(undefined);
      setEndDate(undefined);
      
      if (onTripCreated) {
        onTripCreated(trip.id);
      }
    } catch (error: any) {
      console.error('Error creating trip:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create trip',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Create Group Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a Group Trip</DialogTitle>
          <DialogDescription>
            Invite friends to plan and vote on trip activities together
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title *</Label>
            <Input
              id="title"
              placeholder="Summer Beach Getaway"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination *</Label>
            <Input
              id="destination"
              placeholder="Miami, Florida"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget Per Person (USD)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="500"
              value={formData.budgetPerPerson}
              onChange={(e) => setFormData({ ...formData, budgetPerPerson: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Let's plan an amazing beach vacation together!"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};