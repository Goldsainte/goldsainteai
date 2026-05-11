import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap } from "lucide-react";

interface InstantBookingSettings {
  enabled: boolean;
  auto_accept_threshold: number | null;
  max_concurrent_bookings: number;
  service_types: string[];
}

export const InstantBookingToggle = ({ agentId }: { agentId: string }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<InstantBookingSettings>({
    enabled: false,
    auto_accept_threshold: null,
    max_concurrent_bookings: 5,
    service_types: [],
  });

  useEffect(() => {
    fetchSettings();
  }, [agentId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("instant_booking_settings")
        .select("*")
        .eq("agent_id", agentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          enabled: data.enabled,
          auto_accept_threshold: data.auto_accept_threshold,
          max_concurrent_bookings: data.max_concurrent_bookings,
          service_types: data.service_types || [],
        });
      }
    } catch (error) {
      console.error("Error fetching instant booking settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("instant_booking_settings")
        .upsert({
          agent_id: agentId,
          enabled: settings.enabled,
          auto_accept_threshold: settings.auto_accept_threshold,
          max_concurrent_bookings: settings.max_concurrent_bookings,
          service_types: settings.service_types,
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your instant booking preferences have been updated.",
      });
    } catch (error) {
      console.error("Error saving instant booking settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Instant Booking
        </CardTitle>
        <CardDescription>
          Allow customers to instantly book your services without waiting for approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="instant-booking">Enable Instant Booking</Label>
            <p className="text-sm text-muted-foreground">
              Bids within your threshold will be auto-accepted
            </p>
          </div>
          <Checkbox
            id="instant-booking"
            checked={settings.enabled}
            onCheckedChange={(checked) => (checked) =>
              setSettings({ ...settings, enabled: checked})
            }
          />
        </div>

        {settings.enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="threshold">Auto-Accept Threshold ($)</Label>
              <Input
                id="threshold"
                type="number"
                placeholder="e.g. 500"
                value={settings.auto_accept_threshold || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    auto_accept_threshold: parseFloat(e.target.value) || null,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Jobs with budgets at or below this amount will be auto-accepted
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-bookings">Max Concurrent Bookings</Label>
              <Input
                id="max-bookings"
                type="number"
                min="1"
                max="20"
                value={settings.max_concurrent_bookings}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_concurrent_bookings: parseInt(e.target.value) || 5,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of jobs you can handle simultaneously
              </p>
            </div>
          </>
        )}

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
