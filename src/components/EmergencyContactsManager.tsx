import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Plus, Trash2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface EmergencyContact {
  id: string;
  contact_name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  is_primary: boolean;
  country_code?: string;
}

export function EmergencyContactsManager() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: "",
    relationship: "",
    phone_number: "",
    email: "",
    country_code: "+1",
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Failed to load emergency contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("emergency_contacts")
        .insert({
          user_id: user.id,
          ...formData,
          is_primary: contacts.length === 0, // First contact is primary by default
        });

      if (error) throw error;

      toast.success("Emergency contact added");
      setFormData({
        contact_name: "",
        relationship: "",
        phone_number: "",
        email: "",
        country_code: "+1",
      });
      setIsOpen(false);
      loadContacts();
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Failed to add emergency contact");
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      toast.success("Emergency contact removed");
      loadContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to remove emergency contact");
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove primary from all contacts
      await supabase
        .from("emergency_contacts")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      // Set new primary
      const { error } = await supabase
        .from("emergency_contacts")
        .update({ is_primary: true })
        .eq("id", contactId);

      if (error) throw error;

      toast.success("Primary contact updated");
      loadContacts();
    } catch (error) {
      console.error("Error setting primary:", error);
      toast.error("Failed to update primary contact");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Phone className="h-5 w-5 shrink-0" />
              Emergency Contacts
            </CardTitle>
            <CardDescription>
              Add emergency contacts for safety during your travels
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Emergency Contact</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <Label htmlFor="contact_name">Full Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    placeholder="e.g., Spouse, Parent, Sibling"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <div className="flex gap-2">
                    <Input
                      className="w-20"
                      value={formData.country_code}
                      onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    />
                    <Input
                      id="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Add Contact</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No emergency contacts added yet
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 border rounded-lg ${
                  contact.is_primary ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{contact.contact_name}</h4>
                      {contact.is_primary && (
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    <p className="text-sm mt-2">
                      {contact.country_code} {contact.phone_number}
                    </p>
                    {contact.email && (
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!contact.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(contact.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}