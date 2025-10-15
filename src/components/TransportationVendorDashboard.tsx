import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MapPin, Car, Star, DollarSign, TrendingUp, Calendar, Settings, FileText, Users, AlertCircle, CheckCircle, Clock, Upload, Plus, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import VendorAnalyticsDashboard from "@/components/VendorAnalyticsDashboard";
import VendorPaymentDashboard from "@/components/VendorPaymentDashboard";
import FleetManagementDashboard from "@/components/FleetManagementDashboard";
import VendorBookingCalendar from "@/components/VendorBookingCalendar";
import DriverManagementPanel from "@/components/DriverManagementPanel";

interface VendorData {
  id: string;
  name: string;
  rating: number;
  total_bookings: number;
  total_revenue: number;
  total_vehicles: number;
  service_areas: string[];
  vehicle_types: string[];
  base_hourly_rate: number;
  on_time_percentage: number;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  commercial_license_number?: string;
  commercial_license_expiry?: string;
}

interface VettingStatus {
  vetting_status: string;
  background_check_status: string;
  license_check_status: string;
  insurance_check_status: string;
  reference_check_status: string;
  admin_notes: string | null;
  approval_decision: string;
}

interface PromotionData {
  tier: string;
  status: string;
  monthly_price: number;
}

export default function TransportationVendorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [vettingStatus, setVettingStatus] = useState<VettingStatus | null>(null);
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVendorData();
  }, [user]);

  const loadVendorData = async () => {
    try {
      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Fetch supplier first
      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .select("*, transportation_vendors(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (supplierError) throw supplierError;

      if (!supplier) {
        setError("No vendor profile found. Please apply to become a transportation vendor.");
        return;
      }

      const transportVendor = supplier.transportation_vendors?.[0] ?? null;

      // Load dependent data in parallel using correct IDs
      const [vettingResult, promotionResult] = await Promise.all([
        supabase
          .from("supplier_vetting")
          .select("*")
          .eq("supplier_id", supplier.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        transportVendor
          ? supabase
              .from("vendor_promotion_subscriptions")
              .select("*")
              .eq("vendor_id", transportVendor.id)
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }) as any
      ]);

      if (!transportVendor) {
        setError("No transportation vendor profile found");
        return;
      }

      setVendor({
        id: transportVendor.id,
        name: (supplier.business_name || (supplier as any).name || transportVendor.supplier_name || "Transportation Vendor"),
        rating: supplier.rating || 0,
        total_bookings: transportVendor.total_bookings || 0,
        total_revenue: transportVendor.total_revenue || 0,
        total_vehicles: transportVendor.total_vehicles || 0,
        service_areas: transportVendor.service_areas || [],
        vehicle_types: transportVendor.vehicle_types || [],
        base_hourly_rate: transportVendor.base_hourly_rate || 0,
        on_time_percentage: transportVendor.on_time_percentage || 0,
        insurance_policy_number: transportVendor.insurance_policy_number,
        insurance_expiry_date: transportVendor.insurance_expiry_date,
        commercial_license_number: transportVendor.commercial_license_number,
        commercial_license_expiry: transportVendor.commercial_license_expiry,
      });

      if (vettingResult.data) {
        setVettingStatus(vettingResult.data as any);
      }

      if (promotionResult.data) {
        setPromotionData(promotionResult.data);
      }

    } catch (err: any) {
      console.error("Error loading vendor data:", err);
      setError("Failed to load vendor data");
      toast({
        title: "Error",
        description: "Failed to load vendor dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVettingStatusBadge = () => {
    if (!vettingStatus) return null;
    
    const statusConfig = {
      pending: { label: "Pending Review", variant: "secondary" as const, icon: Clock },
      approved: { label: "Verified Vendor", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Application Rejected", variant: "destructive" as const, icon: AlertCircle },
    };

    const config = statusConfig[vettingStatus.vetting_status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-4">Failed to Load Dashboard</h2>
            <p className="text-muted-foreground mb-6">{error || "No vendor profile found"}</p>
            <Button onClick={() => window.location.href = "/transportation-vendor-application"}>
              Apply as Vendor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            <p className="text-muted-foreground">Transportation Vendor Dashboard</p>
          </div>
          {getVettingStatusBadge()}
          {promotionData && (
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {promotionData.tier.charAt(0).toUpperCase() + promotionData.tier.slice(1)} Tier
            </Badge>
          )}
        </div>
      </div>

      {/* Vetting Status Alert */}
      {vettingStatus && vettingStatus.vetting_status !== 'approved' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {vettingStatus.vetting_status === 'pending' && (
              <div>
                <p className="font-medium mb-2">Your application is under review</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {vettingStatus.background_check_status === 'passed' ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3" />}
                    Background Check: {vettingStatus.background_check_status}
                  </div>
                  <div className="flex items-center gap-2">
                    {vettingStatus.license_check_status === 'verified' ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3" />}
                    License Verification: {vettingStatus.license_check_status}
                  </div>
                  <div className="flex items-center gap-2">
                    {vettingStatus.insurance_check_status === 'verified' ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3" />}
                    Insurance Verification: {vettingStatus.insurance_check_status}
                  </div>
                </div>
              </div>
            )}
            {vettingStatus.vetting_status === 'rejected' && vettingStatus.admin_notes && (
              <div>
                <p className="font-medium mb-1">Application Rejected</p>
                <p className="text-sm">{vettingStatus.admin_notes}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendor.total_bookings}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${vendor.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Size</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendor.total_vehicles}</div>
            <p className="text-xs text-muted-foreground mt-1">Total vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendor.rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendor.on_time_percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">Performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          View Bookings
        </Button>
        <Button variant="outline" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Request Payout
        </Button>
        <Button variant="outline" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Upgrade Tier
        </Button>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
                <CardDescription>Your coverage and offerings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Service Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.service_areas.map((area, index) => (
                      <Badge key={index} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.vehicle_types.map((type, index) => (
                      <Badge key={index} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Base Hourly Rate</span>
                    <span className="text-lg font-bold">${vendor.base_hourly_rate}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium">On-Time Percentage</span>
                    <span className="text-lg font-bold">{vendor.on_time_percentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Performance overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Total Bookings</span>
                  <span className="text-lg font-bold">{vendor.total_bookings}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Total Revenue</span>
                  <span className="text-lg font-bold">${vendor.total_revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Active Vehicles</span>
                  <span className="text-lg font-bold">{vendor.total_vehicles}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Customer Rating</span>
                  <span className="text-lg font-bold">{vendor.rating.toFixed(1)} ★</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <VendorAnalyticsDashboard />
        </TabsContent>

        {/* Fleet Tab */}
        <TabsContent value="fleet">
          <FleetManagementDashboard />
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <VendorBookingCalendar />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <VendorPaymentDashboard />
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions & Marketing</CardTitle>
              <CardDescription>Manage your vendor tier and visibility</CardDescription>
            </CardHeader>
            <CardContent>
              {promotionData ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h3 className="font-semibold mb-2">Current Tier</h3>
                    <Badge variant="default" className="mb-2">
                      {promotionData.tier.toUpperCase()} TIER
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Monthly: ${promotionData.monthly_price}
                    </p>
                  </div>
                  <Button className="w-full">Upgrade Tier</Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Boost your visibility with a promotion tier
                  </p>
                  <Button>Get Started</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents & Compliance</CardTitle>
              <CardDescription>Manage your insurance, licenses, and compliance documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Insurance Policy
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Policy: {vendor.insurance_policy_number || "Not provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {vendor.insurance_expiry_date ? new Date(vendor.insurance_expiry_date).toLocaleDateString() : "Not set"}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Commercial License
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    License: {vendor.commercial_license_number || "Not provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {vendor.commercial_license_expiry ? new Date(vendor.commercial_license_expiry).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
              <Button className="w-full gap-2">
                <Upload className="h-4 w-4" />
                Upload New Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers">
          <DriverManagementPanel />
        </TabsContent>

        {/* Settings Tab */}
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
