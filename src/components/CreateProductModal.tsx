import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, MapPin, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProductModal({ open, onOpenChange }: CreateProductModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("product");
  const [loading, setLoading] = useState(false);
  
  // Product form state
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    product_type: "gear",
    inventory_count: "",
    images: [] as string[],
  });

  // Package form state
  const [packageForm, setPackageForm] = useState({
    title: "",
    description: "",
    destination: "",
    duration_days: "",
    price: "",
    currency: "USD",
    max_travelers: "",
    included_services: "",
    itinerary: "",
    images: [] as string[],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "product" | "package") => {
    const files = e.target.files;
    if (!files || !user) return;

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}-${i}.${fileExt}`;

      try {
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload image');
      }
    }

    if (type === "product") {
      setProductForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } else {
      setPackageForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    }
  };

  const removeImage = (index: number, type: "product" | "package") => {
    if (type === "product") {
      setProductForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      setPackageForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCreateProduct = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!productForm.title || !productForm.price) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('products').insert({
        creator_id: user.id,
        title: productForm.title,
        description: productForm.description,
        price: parseFloat(productForm.price),
        currency: productForm.currency,
        product_type: productForm.product_type,
        inventory_count: productForm.inventory_count ? parseInt(productForm.inventory_count) : null,
        images: productForm.images,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Product created successfully!");
      onOpenChange(false);
      resetForms();
    } catch (error: any) {
      console.error('Create product error:', error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!packageForm.title || !packageForm.destination || !packageForm.duration_days || !packageForm.price) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('travel_packages').insert({
        creator_id: user.id,
        title: packageForm.title,
        description: packageForm.description,
        destination: packageForm.destination,
        duration_days: parseInt(packageForm.duration_days),
        price: parseFloat(packageForm.price),
        currency: packageForm.currency,
        max_travelers: packageForm.max_travelers ? parseInt(packageForm.max_travelers) : null,
        included_services: packageForm.included_services ? packageForm.included_services.split(',').map(s => s.trim()) : [],
        itinerary: packageForm.itinerary ? JSON.parse(packageForm.itinerary) : {},
        images: packageForm.images,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Travel package created successfully!");
      onOpenChange(false);
      resetForms();
    } catch (error: any) {
      console.error('Create package error:', error);
      toast.error(error.message || "Failed to create package");
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setProductForm({
      title: "",
      description: "",
      price: "",
      currency: "USD",
      product_type: "gear",
      inventory_count: "",
      images: [],
    });
    setPackageForm({
      title: "",
      description: "",
      destination: "",
      duration_days: "",
      price: "",
      currency: "USD",
      max_travelers: "",
      included_services: "",
      itinerary: "",
      images: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Listing</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="product">
              <Package className="h-4 w-4 mr-2" />
              Product
            </TabsTrigger>
            <TabsTrigger value="package">
              <MapPin className="h-4 w-4 mr-2" />
              Travel Package
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-title">Title *</Label>
              <Input
                id="product-title"
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                placeholder="e.g., Premium Travel Backpack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Describe your product..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price *</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="99.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-currency">Currency</Label>
                <Select value={productForm.currency} onValueChange={(value) => setProductForm({ ...productForm, currency: value })}>
                  <SelectTrigger id="product-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-type">Product Type</Label>
                <Select value={productForm.product_type} onValueChange={(value) => setProductForm({ ...productForm, product_type: value })}>
                  <SelectTrigger id="product-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gear">Travel Gear</SelectItem>
                    <SelectItem value="guide">Travel Guide</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-inventory">Inventory Count</Label>
                <Input
                  id="product-inventory"
                  type="number"
                  value={productForm.inventory_count}
                  onChange={(e) => setProductForm({ ...productForm, inventory_count: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {productForm.images.map((url, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img src={url} alt="" className="w-full h-full object-cover rounded" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => removeImage(index, "product")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, "product")}
                className="cursor-pointer"
              />
            </div>

            <Button onClick={handleCreateProduct} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Product"}
            </Button>
          </TabsContent>

          <TabsContent value="package" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="package-title">Title *</Label>
              <Input
                id="package-title"
                value={packageForm.title}
                onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })}
                placeholder="e.g., 7-Day Bali Adventure"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-description">Description</Label>
              <Textarea
                id="package-description"
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                placeholder="Describe your travel package..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package-destination">Destination *</Label>
                <Input
                  id="package-destination"
                  value={packageForm.destination}
                  onChange={(e) => setPackageForm({ ...packageForm, destination: e.target.value })}
                  placeholder="e.g., Bali, Indonesia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="package-duration">Duration (days) *</Label>
                <Input
                  id="package-duration"
                  type="number"
                  value={packageForm.duration_days}
                  onChange={(e) => setPackageForm({ ...packageForm, duration_days: e.target.value })}
                  placeholder="7"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package-price">Price *</Label>
                <Input
                  id="package-price"
                  type="number"
                  step="0.01"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                  placeholder="1999.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="package-currency">Currency</Label>
                <Select value={packageForm.currency} onValueChange={(value) => setPackageForm({ ...packageForm, currency: value })}>
                  <SelectTrigger id="package-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-travelers">Max Travelers</Label>
              <Input
                id="package-travelers"
                type="number"
                value={packageForm.max_travelers}
                onChange={(e) => setPackageForm({ ...packageForm, max_travelers: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-services">Included Services (comma-separated)</Label>
              <Input
                id="package-services"
                value={packageForm.included_services}
                onChange={(e) => setPackageForm({ ...packageForm, included_services: e.target.value })}
                placeholder="Accommodation, Meals, Transportation"
              />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {packageForm.images.map((url, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img src={url} alt="" className="w-full h-full object-cover rounded" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => removeImage(index, "package")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, "package")}
                className="cursor-pointer"
              />
            </div>

            <Button onClick={handleCreatePackage} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Package"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}