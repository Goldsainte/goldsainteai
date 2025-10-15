import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Car, Users, FileText, TrendingUp, Star, Settings } from "lucide-react";

interface VendorData {
  id: string;
  name: string;
  supplier_type: string;
  verification_status: string;
  is_active: boolean;
  rating?: number;
  total_bookings?: number;
  total_revenue?: number;
  total_vehicles?: number;
  service_areas?: string[];
  vehicle_types?: string[];
  base_hourly_rate?: number;
  on_time_percentage?: number;
  is_promoted_vendor?: boolean;
  promoted_until?: string;
  promotion_tier?: string;
  total_drivers?: number;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  commercial_license_number?: string;
  commercial_license_expiry?: string;
}

export default function TransportationVendorDashboard() {
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      // Temporary mock data until types are regenerated
      setVendor({
        id: "temp-id",
        name: "Sample Transportation Vendor",
        supplier_type: "transportation",
        verification_status: "pending",
        is_active: false,
        total_bookings: 0,
        total_revenue: 0,
        total_vehicles: 0
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load vendor data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!vendor) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">No Vendor Profile Found</h2>
        <p className="text-muted-foreground mb-6">
          You haven't applied as a transportation vendor yet.
        </p>
        <Button onClick={() => window.location.href = "/apply-transportation-vendor"}>
          Apply Now
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{vendor.name}</h1>
        <div className="flex gap-2 mt-2">
          {vendor.is_promoted_vendor && (
            <Badge variant="default" className="bg-primary">Promoted Vendor</Badge>
          )}
          {vendor.verification_status === "verified" && (
            <Badge variant="secondary">Verified</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendor.total_bookings || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(vendor.total_revenue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Fleet Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendor.total_vehicles || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendor.rating || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fleet">Fleet Management</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>Your transportation vendor profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service Areas</p>
                  <p className="font-medium">{vendor.service_areas?.join(", ") || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Types</p>
                  <p className="font-medium">{vendor.vehicle_types?.join(", ") || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base Hourly Rate</p>
                  <p className="font-medium">${vendor.base_hourly_rate || "N/A"}/hour</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">On-Time Percentage</p>
                  <p className="font-medium">{vendor.on_time_percentage || 100}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fleet">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Management</CardTitle>
              <CardDescription>Manage your vehicles and their availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fleet management interface coming soon</p>
                <Button className="mt-4">Add Vehicle</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Driver Management</CardTitle>
              <CardDescription>Manage your drivers and their credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Driver management interface coming soon</p>
                <p className="text-sm mt-2">Total Drivers: {vendor.total_drivers || 0}</p>
                <Button className="mt-4">Add Driver</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>View and manage your transportation bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bookings yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions & Marketing</CardTitle>
              <CardDescription>Manage your promoted vendor status and sponsored posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendor.is_promoted_vendor ? (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h3 className="font-semibold mb-2">Active Promotion</h3>
                    <p className="text-sm text-muted-foreground">
                      Your vendor profile is currently promoted until{" "}
                      {vendor.promoted_until ? new Date(vendor.promoted_until).toLocaleDateString() : "N/A"}
                    </p>
                    <Badge className="mt-2">{vendor.promotion_tier || "Basic"} Tier</Badge>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Boost your visibility with promoted vendor status
                    </p>
                    <Button>Become a Promoted Vendor</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents & Compliance</CardTitle>
              <CardDescription>Manage your insurance, licenses, and compliance documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Insurance</h4>
                  <p className="text-sm text-muted-foreground">
                    Policy: {vendor.insurance_policy_number || "Not provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {vendor.insurance_expiry_date ? new Date(vendor.insurance_expiry_date).toLocaleDateString() : "Not set"}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Commercial License</h4>
                  <p className="text-sm text-muted-foreground">
                    License: {vendor.commercial_license_number || "Not provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {vendor.commercial_license_expiry ? new Date(vendor.commercial_license_expiry).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage your vendor profile settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Settings interface coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
