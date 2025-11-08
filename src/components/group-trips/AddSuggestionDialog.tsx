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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AddSuggestionDialogProps {
  tripId: string;
  onSuggestionAdded?: () => void;
}

export const AddSuggestionDialog = ({ tripId, onSuggestionAdded }: AddSuggestionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'hotel' as 'hotel' | 'activity' | 'restaurant' | 'flight',
    title: '',
    description: '',
    location: '',
    price: '',
  });

  const handleAdd = async () => {
    if (!user) return;

    if (!formData.title || !formData.type) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('trip_suggestions')
        .insert({
          trip_id: tripId,
          suggested_by: user.id,
          suggestion_type: formData.type,
          title: formData.title,
          description: formData.description,
          location: formData.location || null,
          price: formData.price ? parseFloat(formData.price) : null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Suggestion added!',
        description: 'Your suggestion has been added to the trip',
      });

      setOpen(false);
      setFormData({
        type: 'hotel',
        title: '',
        description: '',
        location: '',
        price: '',
      });

      if (onSuggestionAdded) {
        onSuggestionAdded();
      }
    } catch (error: any) {
      console.error('Error adding suggestion:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add suggestion',
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
          <Plus className="h-4 w-4 mr-2" />
          Add Suggestion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add a Suggestion</DialogTitle>
          <DialogDescription>
            Suggest hotels, activities, restaurants, or flights for the group to vote on
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="flight">Flight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Beachfront Resort"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="South Beach, Miami"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              placeholder="150"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Luxury beachfront resort with amazing ocean views..."
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
          <Button onClick={handleAdd} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};