import { useState, useEffect } from "react";
import { Shield, Users, Eye, Ban, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MessageSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageSettingsModal({ open, onOpenChange }: MessageSettingsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    who_can_message: "everyone",
    filter_requests: true,
    show_read_receipts: true,
    allow_message_requests: true,
  });

  useEffect(() => {
    if (open && user) {
      loadSettings();
    }
  }, [open, user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("message_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSettings({
          who_can_message: data.who_can_message,
          filter_requests: data.filter_requests,
          show_read_receipts: data.show_read_receipts,
          allow_message_requests: data.allow_message_requests,
        });
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("message_settings")
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast({ title: "Settings saved" });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Failed to save",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-secondary">Message Settings</DialogTitle>
          <DialogDescription>
            Control who can message you and your privacy preferences.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Who can message */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Who can message you
              </Label>
              <Select
                value={settings.who_can_message}
                onValueChange={(value) =>
                  setSettings((s) => ({ ...s, who_can_message: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="verified_only">Verified users only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Allow message requests */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Allow message requests
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive messages from people you don't follow
                </p>
              </div>
              <Checkbox
                checked={settings.allow_message_requests}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, allow_message_requests: checked}))
                }
              />
            </div>

            {/* Filter requests */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Filter low-quality requests
                </Label>
                <p className="text-xs text-muted-foreground">
                  Hide requests that may contain spam
                </p>
              </div>
              <Checkbox
                checked={settings.filter_requests}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, filter_requests: checked}))
                }
              />
            </div>

            {/* Read receipts */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Show read receipts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Let others know when you've read their messages
                </p>
              </div>
              <Checkbox
                checked={settings.show_read_receipts}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, show_read_receipts: checked}))
                }
              />
            </div>

            <Button onClick={saveSettings} className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
