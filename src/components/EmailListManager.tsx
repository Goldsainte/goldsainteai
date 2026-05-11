import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Mail } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

export interface EmailEntry {
  email: string;
  name?: string;
  role?: 'organizer' | 'co-traveler' | 'billing-contact';
  notify: boolean;
}

interface EmailListManagerProps {
  emails: EmailEntry[];
  onChange: (emails: EmailEntry[]) => void;
  maxEmails?: number;
  notifyAll?: boolean;
  onNotifyAllChange?: (notifyAll: boolean) => void;
}

export const EmailListManager = ({ 
  emails, 
  onChange, 
  maxEmails = 10,
  notifyAll = true,
  onNotifyAllChange 
}: EmailListManagerProps) => {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'organizer' | 'co-traveler' | 'billing-contact'>('co-traveler');

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return;
    if (emails.length >= maxEmails) return;
    if (emails.some(e => e.email.toLowerCase() === newEmail.toLowerCase())) return;

    const newEntry: EmailEntry = {
      email: newEmail.toLowerCase().trim(),
      name: newName.trim() || undefined,
      role: newRole,
      notify: true
    };

    onChange([...emails, newEntry]);
    setNewEmail('');
    setNewName('');
    setNewRole('co-traveler');
  };

  const handleRemoveEmail = (index: number) => {
    onChange(emails.filter((_, i) => i !== index));
  };

  const handleToggleNotify = (index: number) => {
    const updated = [...emails];
    updated[index] = { ...updated[index], notify: !updated[index].notify };
    onChange(updated);
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'organizer': return 'default';
      case 'co-traveler': return 'secondary';
      case 'billing-contact': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Email Recipients</Label>
        {onNotifyAllChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="notify-all" className="text-sm">Notify all emails</Label>
            <Checkbox
              id="notify-all"
              checked={notifyAll}
              onCheckedChange={(checked) => (onNotifyAllChange)(checked === true)}
            />
          </div>
        )}
      </div>

      {/* Existing emails */}
      {emails.length > 0 && (
        <div className="space-y-2">
          {emails.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{entry.email}</span>
                  {entry.role && (
                    <Badge variant={getRoleColor(entry.role)} className="text-xs capitalize">
                      {entry.role.replace('-', ' ')}
                    </Badge>
                  )}
                </div>
                {entry.name && (
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={entry.notify}
                  onCheckedChange={(checked) => (() => handleToggleNotify(index))(checked === true)}
                  disabled={!notifyAll}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEmail(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new email */}
      {emails.length < maxEmails && (
        <div className="space-y-3 p-4 border rounded-lg">
          <Label className="text-sm font-medium">Add Email Address</Label>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="email" className="text-xs">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
              />
            </div>
            <div>
              <Label htmlFor="name" className="text-xs">Name (Optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-xs">Role</Label>
              <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="co-traveler">Co-Traveler</SelectItem>
                  <SelectItem value="billing-contact">Billing Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddEmail} disabled={!newEmail || !newEmail.includes('@')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Email
            </Button>
          </div>
        </div>
      )}

      {emails.length >= maxEmails && (
        <p className="text-xs text-muted-foreground">
          Maximum of {maxEmails} email addresses reached
        </p>
      )}

      {emails.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No additional emails added yet. Add email addresses to notify multiple people about this booking.
        </p>
      )}
    </div>
  );
};
