import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Package, MapPin, ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          profiles:creator_id (username, avatar_url)
        `)
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

  // Fetch travel packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['travel-packages', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('travel_packages')
        .select(`
          *,
          profiles:creator_id (username, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,destination.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {user && (
              <Button 
                onClick={() => navigate('/creator-dashboard')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Sell Your Products
              </Button>
            )}
          </div>

          <h1 className="text-4xl font-secondary font-bold mb-4">Travel Shop</h1>
          <p className="text-muted-foreground mb-6">
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

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="packages">
              <MapPin className="h-4 w-4 mr-2" />
              Travel Packages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {productsLoading ? (
              <p>Loading products...</p>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
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
                          <CardDescription className="mt-1">
                            by @{product.profiles?.username}
                          </CardDescription>
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
                <CardContent className="flex flex-col items-center justify-center py-12">
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
                          <CardDescription className="mt-1">
                            by @{pkg.profiles?.username}
                          </CardDescription>
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
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}