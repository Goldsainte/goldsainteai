import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, Shield, DollarSign, Bell, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TripSettingsProps {
  trip: any;
  members: any[];
  onClose: () => void;
  onUpdate: () => void;
}

export const TripSettings = ({ trip, members, onClose, onUpdate }: TripSettingsProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [spendingLimits, setSpendingLimits] = useState<Record<string, number>>(
    trip.spending_limits || {}
  );
  
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>(
    trip.notification_settings || {
      new_suggestion: true,
      high_votes: true,
      participant_joined: true,
      budget_alert: true,
    }
  );

  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(
    members.reduce((acc, m) => ({ ...acc, [m.user_id]: m.role || 'member' }), {})
  );

  const categories = [
    { value: 'hotel', label: 'Hotels', icon: '🏨' },
    { value: 'activity', label: 'Activities', icon: '🎯' },
    { value: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { value: 'flight', label: 'Flights', icon: '✈️' },
  ];

  const notificationTypes = [
    { key: 'new_suggestion', label: 'New Suggestions', description: 'Get notified when someone adds a new suggestion' },
    { key: 'high_votes', label: 'Popular Activities', description: 'Get notified when suggestions reach 5+ votes' },
    { key: 'participant_joined', label: 'Member Joins Activity', description: 'Get notified when someone confirms an activity' },
    { key: 'budget_alert', label: 'Budget Alerts', description: 'Get notified when spending approaches limits' },
  ];

  const handleSpendingLimitChange = (category: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSpendingLimits(prev => ({ ...prev, [category]: numValue }));
  };

  const handleRemoveLimit = (category: string) => {
    setSpendingLimits(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
  };

  const handleRoleChange = (userId: string, role: string) => {
    setMemberRoles(prev => ({ ...prev, [userId]: role }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update trip settings
      const { error: tripError } = await supabase
        .from('group_trips')
        .update({
          spending_limits: spendingLimits,
          notification_settings: notificationSettings,
        } as any)
        .eq('id', trip.id);

      if (tripError) throw tripError;

      // Update member roles
      for (const [userId, role] of Object.entries(memberRoles)) {
        const { error: memberError } = await supabase
          .from('trip_members')
          .update({ role } as any)
          .eq('trip_id', trip.id)
          .eq('user_id', userId);

        if (memberError) throw memberError;
      }

      toast({
        title: 'Success',
        description: 'Trip settings updated successfully',
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update trip settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Trip Settings</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Member Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Member Permissions
          </CardTitle>
          <CardDescription>
            Manage roles and permissions for trip members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.filter(m => m.status === 'accepted').map((member) => (
            <div key={member.user_id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {member.email?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div>
                  <p className="font-medium">{member.email || 'Member'}</p>
                  {member.user_id === trip.creator_id && (
                    <Badge variant="secondary" className="text-xs">Creator</Badge>
                  )}
                </div>
              </div>
              <Select
                value={memberRoles[member.user_id]}
                onValueChange={(value) => handleRoleChange(member.user_id, value)}
                disabled={member.user_id === trip.creator_id}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="pt-2 text-sm text-muted-foreground">
            <p><strong>Admin:</strong> Can add suggestions, invite members, and modify trip details</p>
            <p><strong>Member:</strong> Can add suggestions and vote on activities</p>
          </div>
        </CardContent>
      </Card>

      {/* Spending Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spending Limits per Category
          </CardTitle>
          <CardDescription>
            Set maximum spending limits for each category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((category) => (
            <div key={category.value} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </Label>
                {spendingLimits[category.value] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLimit(category.value)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={spendingLimits[category.value] || ''}
                  onChange={(e) => handleSpendingLimitChange(category.value, e.target.value)}
                  min="0"
                  step="10"
                />
              </div>
            </div>
          ))}
          <p className="text-sm text-muted-foreground pt-2">
            Leave empty for no limit. Members will be notified when approaching these limits.
          </p>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure which events trigger notifications for all members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((notif) => (
            <div key={notif.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">{notif.label}</Label>
                <p className="text-sm text-muted-foreground">{notif.description}</p>
              </div>
              <Checkbox
                checked={notificationSettings[notif.key] !== false}
                onCheckedChange={(checked) => { const v = checked === true; ((checked) =>
                  setNotificationSettings(prev => ({ ...prev, [notif.key]: checked)(v); }}))
                }
              />
            </div>
          ))}
          
          <Separator className="my-4" />
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Automated Departure Reminders</span>
              <Badge variant="secondary" className="ml-auto">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Members will automatically receive notifications:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 ml-2">
              <li>7 days before departure</li>
              <li>3 days before departure</li>
              <li>1 day before departure</li>
            </ul>
            <p className="text-xs text-muted-foreground italic mt-2">
              Reminders are sent daily at 9:00 AM UTC
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
