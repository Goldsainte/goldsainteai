import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Users, DollarSign } from 'lucide-react';
import { EmailListManager, EmailEntry } from './EmailListManager';

interface TripRequest {
  id: string;
  destination: string;
  travelers_count: number;
  budget_min?: number;
  budget_max?: number;
  special_requests?: string;
  additional_emails?: EmailEntry[];
  notify_all_emails?: boolean;
}

interface EditTripRequestModalProps {
  open: boolean;
  onClose: () => void;
  tripRequest: TripRequest;
  onSuccess: () => void;
}

export const EditTripRequestModal = ({ open, onClose, tripRequest, onSuccess }: EditTripRequestModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [destination, setDestination] = useState(tripRequest.destination);
  const [travelersCount, setTravelersCount] = useState(tripRequest.travelers_count);
  const [budgetMin, setBudgetMin] = useState(tripRequest.budget_min || 0);
  const [budgetMax, setBudgetMax] = useState(tripRequest.budget_max || 0);
  const [specialRequests, setSpecialRequests] = useState(tripRequest.special_requests || '');
  const [emails, setEmails] = useState<EmailEntry[]>(tripRequest.additional_emails || []);
  const [notifyAll, setNotifyAll] = useState(tripRequest.notify_all_emails ?? true);

  const hasChanges = 
    destination !== tripRequest.destination ||
    travelersCount !== tripRequest.travelers_count ||
    budgetMin !== (tripRequest.budget_min || 0) ||
    budgetMax !== (tripRequest.budget_max || 0) ||
    specialRequests !== (tripRequest.special_requests || '') ||
    JSON.stringify(emails) !== JSON.stringify(tripRequest.additional_emails || []) ||
    notifyAll !== (tripRequest.notify_all_emails ?? true);

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const previousData = {
        destination: tripRequest.destination,
        travelers_count: tripRequest.travelers_count,
        budget_min: tripRequest.budget_min,
        budget_max: tripRequest.budget_max,
        special_requests: tripRequest.special_requests,
        additional_emails: tripRequest.additional_emails,
        notify_all_emails: tripRequest.notify_all_emails
      };

      const newData = {
        destination,
        travelers_count: travelersCount,
        budget_min: budgetMin || null,
        budget_max: budgetMax || null,
        special_requests: specialRequests || null,
        additional_emails: emails,
        notify_all_emails: notifyAll
      };

      // Record modification
      const { error: modError } = await supabase
        .from('trip_request_modifications')
        .insert({
          trip_request_id: tripRequest.id,
          modified_by: user.id,
          previous_data: previousData as any,
          new_data: newData as any,
          modification_reason: 'User edited trip details'
        });

      if (modError) throw modError;

      // Update trip request
      const { error: updateError } = await supabase
        .from('cocurated_trip_requests')
        .update({
          destination,
          travelers_count: travelersCount,
          budget_range_min: budgetMin || null,
          budget_range_max: budgetMax || null,
          special_requests: specialRequests || null,
          additional_emails: emails as any,
          notify_all_emails: notifyAll
        })
        .eq('id', tripRequest.id);

      if (updateError) throw updateError;

      toast({
        title: "Trip Updated",
        description: "Your trip details have been saved successfully."
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: "Failed to update trip details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip Request</DialogTitle>
          <DialogDescription>
            Update your trip details. Changes will be reviewed if an agent is already assigned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="destination" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Destination
            </Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where do you want to go?"
            />
          </div>

          <div>
            <Label htmlFor="travelers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Number of Travelers
            </Label>
            <Input
              id="travelers"
              type="number"
              min="1"
              value={travelersCount}
              onChange={(e) => setTravelersCount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budgetMin" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget Min (USD)
              </Label>
              <Input
                id="budgetMin"
                type="number"
                min="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="budgetMax">Budget Max (USD)</Label>
              <Input
                id="budgetMax"
                type="number"
                min="0"
                value={budgetMax}
                onChange={(e) => setBudgetMax(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="special-requests">Special Requests</Label>
            <Textarea
              id="special-requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requirements or preferences?"
              rows={4}
            />
          </div>

          <div>
            <EmailListManager
              emails={emails}
              onChange={setEmails}
              notifyAll={notifyAll}
              onNotifyAllChange={setNotifyAll}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
