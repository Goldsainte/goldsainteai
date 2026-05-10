import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Webhook, Plus, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

const availableEvents = [
  { value: "job.created", label: "Job Created" },
  { value: "job.assigned", label: "Job Assigned" },
  { value: "job.completed", label: "Job Completed" },
  { value: "bid.created", label: "Bid Created" },
  { value: "bid.accepted", label: "Bid Accepted" },
  { value: "payment.completed", label: "Payment Completed" },
  { value: "review.created", label: "Review Created" },
];

export default function WebhookSettings() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    events: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from("webhook_configurations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error("Error loading webhooks:", error);
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingWebhook) {
        const { error } = await supabase
          .from("webhook_configurations")
          .update({
            name: formData.name,
            url: formData.url,
            events: formData.events,
            is_active: formData.is_active,
          })
          .eq("id", editingWebhook.id);

        if (error) throw error;
        toast.success("Webhook updated successfully");
      } else {
        const { error } = await supabase
          .from("webhook_configurations")
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Webhook created successfully");
      }

      setShowDialog(false);
      setEditingWebhook(null);
      setFormData({ name: "", url: "", events: [], is_active: true });
      loadWebhooks();
    } catch (error) {
      console.error("Error saving webhook:", error);
      toast.error("Failed to save webhook");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const { error } = await supabase
        .from("webhook_configurations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Webhook deleted successfully");
      loadWebhooks();
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast.error("Failed to delete webhook");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("webhook_configurations")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Webhook ${!currentStatus ? "enabled" : "disabled"}`);
      loadWebhooks();
    } catch (error) {
      console.error("Error toggling webhook:", error);
      toast.error("Failed to update webhook");
    }
  };

  const openEditDialog = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      is_active: webhook.is_active,
    });
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingWebhook(null);
    setFormData({ name: "", url: "", events: [], is_active: true });
    setShowDialog(true);
  };

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Webhook className="h-8 w-8" />
            Webhook Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks to receive real-time notifications
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No webhooks configured</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {webhook.name}
                      {webhook.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {webhook.url}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(webhook)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Events:</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="secondary">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                {webhook.last_triggered_at && (
                  <p className="text-xs text-muted-foreground">
                    Last triggered: {new Date(webhook.last_triggered_at).toLocaleString()}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Active</span>
                  <Checkbox
                    checked={webhook.is_active}
                    onCheckedChange={(checked) => { const v = checked === true; (() =>
                      handleToggleActive(webhook.id, webhook.is_active))(v); }}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? "Edit Webhook" : "Create Webhook"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Webhook Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="My Integration Webhook"
              />
            </div>

            <div>
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://your-domain.com/webhook"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be a valid HTTPS URL
              </p>
            </div>

            <div>
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableEvents.map((event) => (
                  <div
                    key={event.value}
                    className="flex items-center space-x-2 border rounded p-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleEvent(event.value)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="cursor-pointer"
                    />
                    <label className="text-sm cursor-pointer">
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Checkbox
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => { const v = checked === true; ((checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked)(v); }}))
                }
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingWebhook ? "Update" : "Create"} Webhook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
