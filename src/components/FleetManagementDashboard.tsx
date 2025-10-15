import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Car, AlertCircle, CheckCircle, Calendar, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FleetManagementDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fleet, setFleet] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchFleetData();
  }, []);

  const fetchFleetData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await supabase
        .from('transportation_vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendor) return;

      const { data: fleetData, error: fleetError } = await (supabase as any)
        .from('transportation_fleet')
        .select('id, vehicle_type, license_plate, status')
        .eq('vendor_id', vendor.id);

      if (fleetError) throw fleetError;

      const { data: logsData, error: logsError } = await (supabase as any)
        .from('fleet_maintenance_logs')
        .select('id, maintenance_type, scheduled_date, completed_date, vehicle_id')
        .eq('vendor_id', vendor.id)
        .order('scheduled_date', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;

      // Fetch vehicle details for logs
      const enrichedLogs = await Promise.all((logsData || []).map(async (log: any) => {
        const { data: vehicle } = await (supabase as any)
          .from('transportation_fleet')
          .select('vehicle_type, license_plate')
          .eq('id', log.vehicle_id)
          .maybeSingle();
        
        return {
          ...log,
          transportation_fleet: vehicle
        };
      }));

      setFleet(fleetData || []);
      setMaintenanceLogs(enrichedLogs || []);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      available: "default",
      in_use: "secondary",
      maintenance: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground">Manage your vehicles and maintenance schedules</p>
        </div>
        <Button>Add Vehicle</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleet.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fleet.filter((v) => v.status === 'available').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fleet.filter((v) => v.status === 'maintenance').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>All registered vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fleet.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Car className="h-8 w-8" />
                    <div>
                      <p className="font-semibold">{vehicle.vehicle_type}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
                    </div>
                  </div>
                  {getStatusBadge(vehicle.status)}
                </div>
              ))}
              {fleet.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No vehicles registered yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Schedule</CardTitle>
            <CardDescription>Upcoming and recent maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <Calendar className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-semibold">{log.maintenance_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.transportation_fleet?.vehicle_type} - {log.transportation_fleet?.license_plate}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {log.completed_date ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
              ))}
              {maintenanceLogs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No maintenance scheduled</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}