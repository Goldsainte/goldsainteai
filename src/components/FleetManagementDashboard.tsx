import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Car, CheckCircle, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FleetVehicle {
  id: string;
  vehicle_type: string;
  license_plate: string;
  status: string;
}

export default function FleetManagementDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);

  useEffect(() => {
    // Simulated data - will be replaced with actual API call
    setFleet([]);
    setLoading(false);
  }, []);

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
    </div>
  );
}
