import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Calendar, Award, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DriverManagementPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await (supabase as any)
        .from('transportation_vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendor) return;

      const { data: driversData, error: driversError } = await (supabase as any)
        .from('transportation_drivers')
        .select('*')
        .eq('vendor_id', vendor.id);

      if (driversError) throw driversError;

      const { data: schedulesData, error: schedulesError } = await (supabase as any)
        .from('driver_schedules')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('shift_start', new Date().toISOString())
        .order('shift_start', { ascending: true })
        .limit(20);

      if (schedulesError) throw schedulesError;

      setDrivers(driversData || []);
      setSchedules(schedulesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Driver Management</h1>
          <p className="text-muted-foreground">Manage your driver roster and schedules</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Driver Roster</CardTitle>
            <CardDescription>Active drivers in your fleet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {drivers.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <User className="h-8 w-8" />
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-sm text-muted-foreground">{driver.license_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {driver.certifications?.map((cert: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        <Award className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {drivers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No drivers registered yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shifts</CardTitle>
            <CardDescription>Next 7 days schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <Calendar className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        {new Date(schedule.shift_start).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(schedule.shift_start).toLocaleTimeString()} - {new Date(schedule.shift_end).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                    {schedule.status}
                  </Badge>
                </div>
              ))}
              {schedules.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No shifts scheduled</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
