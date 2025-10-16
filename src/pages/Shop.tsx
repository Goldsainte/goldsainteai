import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Package, MapPin, ArrowLeft, Plus, AlertTriangle, RefreshCw, Store, Unplug } from "lucide-react";
import { CreateProductModal } from "@/components/CreateProductModal";
import { PackageDisputeModal } from "@/components/PackageDisputeModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";
import { useEcommerceConnections } from "@/hooks/useEcommerceConnections";
import { formatDistanceToNow } from "date-fns";

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputePackageId, setDisputePackageId] = useState<string>("");
  const [disputeCreatorId, setDisputeCreatorId] = useState<string>("");

  const { connections, syncProducts, disconnect } = useEcommerceConnections();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  // Fetch products
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch travel packages with user's purchase status
  const { data: packages = [], isLoading: packagesLoading, refetch: refetchPackages } = useQuery({
    queryKey: ['travel-packages', searchQuery, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('travel_packages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,destination.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Check if user has purchased each package
      if (user && data) {
        const packageIds = data.map(p => p.id);
        const { data: bookings } = await supabase
          .from('package_bookings')
          .select('package_id')
          .eq('customer_id', user.id)
          .in('package_id', packageIds)
          .or('status.eq.confirmed,status.eq.pending');

        const purchasedIds = new Set((bookings || []).map(b => b.package_id));
        return data.map(pkg => ({
          ...pkg,
          hasPurchased: purchasedIds.has(pkg.id)
        }));
      }

      return data || [];
    },
  });

  const handlePurchase = async (item: any, isPackage: boolean) => {
    if (!user) {
      toast.error("Please sign in to make a purchase");
      return;
    }

    try {
      const { data, error } = await invokeEdgeFunction('purchase-product', {
        body: {
          productId: isPackage ? null : item.id,
          packageId: isPackage ? item.id : null,
          quantity: 1,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in new window
      window.open(`https://checkout.stripe.com/pay/${data.clientSecret}`, '_blank');
      
      toast.success("Checkout opened in new window");
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || "Failed to process purchase");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="gap-2 self-start"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {user && (
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Sell Your Products</span>
                <span className="sm:hidden">Sell</span>
              </Button>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-secondary font-bold mb-3 md:mb-4">The Sainte Creator Travel Collection</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Discover travel gear, packages, and experiences from creators
          </p>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products and packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Connected Stores */}
        {user && connections.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5" />
                Connected Stores
              </CardTitle>
              <CardDescription>
                Manage your connected ecommerce platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connections.map((connection: any) => (
                <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{connection.platform}</span>
                      <Badge variant={connection.is_active ? "default" : "secondary"}>
                        {connection.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {connection.sync_status === 'syncing' && (
                        <Badge variant="outline" className="animate-pulse">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Syncing...
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {connection.store_name || connection.store_url}
                    </p>
                    {connection.last_synced_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last synced {formatDistanceToNow(new Date(connection.last_synced_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncProducts.mutate(connection.platform as 'shopify' | 'etsy')}
                      disabled={syncProducts.isPending || connection.sync_status === 'syncing'}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncProducts.isPending ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => disconnect.mutate(connection.id)}
                      disabled={disconnect.isPending}
                    >
                      <Unplug className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="products" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="products" className="text-xs md:text-sm">
              <Package className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="packages" className="text-xs md:text-sm">
              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Travel Packages</span>
              <span className="sm:hidden">Packages</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {productsLoading ? (
              <p>Loading products...</p>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No products found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any) => (
                  <Card key={product.id} className="overflow-hidden">
                    {product.images && product.images.length > 0 && (
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{product.title}</CardTitle>
                          {/* Creator attribution intentionally omitted until relation is added */}
                        </div>
                        <Badge variant="secondary">{product.product_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {product.currency} ${product.price}
                        </span>
                        {product.inventory_count !== null && (
                          <span className="text-xs text-muted-foreground">
                            {product.inventory_count} in stock
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => handlePurchase(product, false)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            {packagesLoading ? (
              <p>Loading packages...</p>
            ) : packages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No packages found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg: any) => (
                  <Card key={pkg.id} className="overflow-hidden">
                    {pkg.images && pkg.images.length > 0 && (
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <img
                          src={pkg.images[0]}
                          alt={pkg.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{pkg.title}</CardTitle>
                          {/* Creator attribution intentionally omitted until relation is added */}
                        </div>
                        <Badge variant="secondary">{pkg.destination}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {pkg.description}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{pkg.duration_days} days</span>
                        </div>
                        {pkg.max_travelers && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max travelers:</span>
                            <span>{pkg.max_travelers}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <span className="text-2xl font-bold">
                          {pkg.currency} ${pkg.price}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => handlePurchase(pkg, true)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Book Package
                      </Button>
                      {(pkg as any).hasPurchased && (
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => {
                            setDisputePackageId(pkg.id);
                            setDisputeCreatorId(pkg.creator_id);
                            setDisputeModalOpen(true);
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          File Dispute
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateProductModal 
        open={createModalOpen} 
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) {
            refetchProducts();
            refetchPackages();
          }
        }} 
      />

      {/* Package Dispute Modal */}
      <PackageDisputeModal
        open={disputeModalOpen}
        onOpenChange={setDisputeModalOpen}
        packageId={disputePackageId}
        packageType="creator_package"
        creatorId={disputeCreatorId}
        onSuccess={() => {
          toast.success('Dispute submitted successfully');
          setDisputeModalOpen(false);
        }}
      />
    </div>
  );
}