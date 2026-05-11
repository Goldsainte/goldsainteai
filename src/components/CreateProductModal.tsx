import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Upload, X, Store, ShoppingBag, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEcommerceConnections } from "@/hooks/useEcommerceConnections";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShopifyLogo } from "@/components/icons/ShopifyLogo";
import { EtsyLogo } from "@/components/icons/EtsyLogo";

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

export function CreateProductModal({ open, onOpenChange, defaultTab = "store" }: CreateProductModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  
  // E-commerce connections
  const { connections, connectShopify, connectEtsy, syncProducts, disconnect, toggleAutoSync } = useEcommerceConnections();
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [etsyShopName, setEtsyShopName] = useState("");
  
  const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.is_active);
  const etsyConnection = connections.find(c => c.platform === 'etsy' && c.is_active);
  
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
    package_summary: "",
    destination: "",
    country: "",
    city: "",
    region: "",
    attractions: "",
    duration_days: "",
    date_type: "flexible",
    fixed_dates: "",
    booking_deadline: "",
    price: "",
    price_per_person: "",
    price_per_couple: "",
    deposit_required: "",
    installment_available: false,
    refund_policy: "",
    early_bird_pricing: "",
    currency: "USD",
    max_travelers: "",
    spots_remaining: "",
    accommodation_details: "",
    transportation_details: "",
    activities_included: "",
    meals_included: "",
    perks: "",
    whats_not_included: "",
    daily_itinerary: "",
    passport_required: false,
    visa_required: false,
    age_minimum: "",
    fitness_level: "",
    accessibility_notes: "",
    creator_story: "",
    video_url: "",
    booking_cta: "Book Now",
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
      toast.error("Please fill in required fields: Title, Destination, Duration, and Price");
      return;
    }

    setLoading(true);
    try {
      // Parse daily itinerary if provided
      let dailyItinerary = [];
      if (packageForm.daily_itinerary) {
        try {
          dailyItinerary = JSON.parse(packageForm.daily_itinerary);
        } catch {
          dailyItinerary = packageForm.daily_itinerary.split('\n').filter(Boolean).map((line, idx) => ({
            day: idx + 1,
            description: line
          }));
        }
      }

      const { error } = await supabase.from('travel_packages').insert({
        creator_id: user.id,
        title: packageForm.title,
        description: packageForm.description,
        package_summary: packageForm.package_summary,
        destination: packageForm.destination,
        duration_days: parseInt(packageForm.duration_days),
        price: parseFloat(packageForm.price),
        currency: packageForm.currency,
        max_travelers: packageForm.max_travelers ? parseInt(packageForm.max_travelers) : null,
        spots_total: packageForm.max_travelers ? parseInt(packageForm.max_travelers) : null,
        spots_remaining: packageForm.spots_remaining ? parseInt(packageForm.spots_remaining) : (packageForm.max_travelers ? parseInt(packageForm.max_travelers) : null),
        images: packageForm.images,
        video_url: packageForm.video_url || null,
        creator_story: packageForm.creator_story || null,
        booking_cta: packageForm.booking_cta || 'Book Now',
        booking_deadline: packageForm.booking_deadline || null,
        is_active: true,
        
        // Location details
        location_details: {
          country: packageForm.country,
          city: packageForm.city,
          region: packageForm.region,
          attractions: packageForm.attractions ? packageForm.attractions.split(',').map(s => s.trim()) : []
        },
        
        // Dates info
        dates_info: {
          type: packageForm.date_type,
          fixed_dates: packageForm.fixed_dates || null,
          booking_deadline: packageForm.booking_deadline || null
        },
        
        // What's included
        whats_included: {
          accommodation: packageForm.accommodation_details || '',
          transportation: packageForm.transportation_details || '',
          activities: packageForm.activities_included ? packageForm.activities_included.split(',').map(s => s.trim()) : [],
          meals: packageForm.meals_included || '',
          perks: packageForm.perks ? packageForm.perks.split(',').map(s => s.trim()) : []
        },
        
        // What's not included
        whats_not_included: packageForm.whats_not_included ? packageForm.whats_not_included.split(',').map(s => s.trim()) : [],
        
        // Pricing details
        pricing_details: {
          per_person: packageForm.price_per_person ? parseFloat(packageForm.price_per_person) : null,
          per_couple: packageForm.price_per_couple ? parseFloat(packageForm.price_per_couple) : null,
          deposit: packageForm.deposit_required ? parseFloat(packageForm.deposit_required) : null,
          installments: packageForm.installment_available,
          refund_policy: packageForm.refund_policy || '',
          early_bird: packageForm.early_bird_pricing || null
        },
        
        // Daily itinerary
        daily_itinerary: dailyItinerary,
        
        // Travel requirements
        travel_requirements: {
          passport: packageForm.passport_required,
          visa: packageForm.visa_required,
          age_minimum: packageForm.age_minimum ? parseInt(packageForm.age_minimum) : null,
          fitness_level: packageForm.fitness_level || null,
          accessibility_notes: packageForm.accessibility_notes || null
        }
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
      package_summary: "",
      destination: "",
      country: "",
      city: "",
      region: "",
      attractions: "",
      duration_days: "",
      date_type: "flexible",
      fixed_dates: "",
      booking_deadline: "",
      price: "",
      price_per_person: "",
      price_per_couple: "",
      deposit_required: "",
      installment_available: false,
      refund_policy: "",
      early_bird_pricing: "",
      currency: "USD",
      max_travelers: "",
      spots_remaining: "",
      accommodation_details: "",
      transportation_details: "",
      activities_included: "",
      meals_included: "",
      perks: "",
      whats_not_included: "",
      daily_itinerary: "",
      passport_required: false,
      visa_required: false,
      age_minimum: "",
      fitness_level: "",
      accessibility_notes: "",
      creator_story: "",
      video_url: "",
      booking_cta: "Book Now",
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="store" className="gap-2">
              <div className="flex items-center gap-1">
                <ShopifyLogo className="h-4 w-4 text-[#95BF47]" />
                <EtsyLogo className="h-4 w-4 text-[#F16521]" />
              </div>
              <span className="hidden sm:inline">Link Store</span>
            </TabsTrigger>
            <TabsTrigger value="product">
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Product</span>
            </TabsTrigger>
            <TabsTrigger value="package">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Package</span>
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
                {productForm.images.filter(url => url && url.trim()).map((url, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img src={url} alt="Product image" className="w-full h-full object-cover rounded" loading="lazy"/>
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

          <TabsContent value="package" className="space-y-4 max-h-[70vh] overflow-y-auto">
            <Accordion type="multiple" className="w-full" defaultValue={["basic"]}>
              {/* Basic Info */}
              <AccordionItem value="basic">
                <AccordionTrigger className="text-lg">Basic Information (Required)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="package-title">Title *</Label>
                    <Input
                      id="package-title"
                      value={packageForm.title}
                      onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })}
                      placeholder="Bali Bliss: 6-Night Luxury Escape for Couples"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="package-summary">Package Summary *</Label>
                    <Textarea
                      id="package-summary"
                      value={packageForm.package_summary}
                      onChange={(e) => setPackageForm({ ...packageForm, package_summary: e.target.value })}
                      placeholder="1-2 paragraph sales pitch. What's included, who it's for, what makes it special..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="package-description">Detailed Description</Label>
                    <Textarea
                      id="package-description"
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                      placeholder="Additional details about the package..."
                      rows={3}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Location */}
              <AccordionItem value="location">
                <AccordionTrigger className="text-lg">Location Details (Required)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="package-destination">Destination *</Label>
                      <Input
                        id="package-destination"
                        value={packageForm.destination}
                        onChange={(e) => setPackageForm({ ...packageForm, destination: e.target.value })}
                        placeholder="Bali, Indonesia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="package-country">Country</Label>
                      <Input
                        id="package-country"
                        value={packageForm.country}
                        onChange={(e) => setPackageForm({ ...packageForm, country: e.target.value })}
                        placeholder="Indonesia"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="package-city">City</Label>
                      <Input
                        id="package-city"
                        value={packageForm.city}
                        onChange={(e) => setPackageForm({ ...packageForm, city: e.target.value })}
                        placeholder="Ubud"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="package-region">Region</Label>
                      <Input
                        id="package-region"
                        value={packageForm.region}
                        onChange={(e) => setPackageForm({ ...packageForm, region: e.target.value })}
                        placeholder="Central Bali"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="package-attractions">Key Attractions (comma-separated)</Label>
                    <Input
                      id="package-attractions"
                      value={packageForm.attractions}
                      onChange={(e) => setPackageForm({ ...packageForm, attractions: e.target.value })}
                      placeholder="Tegallalang Rice Terraces, Monkey Forest, Sacred Springs"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Dates & Duration */}
              <AccordionItem value="dates">
                <AccordionTrigger className="text-lg">Dates & Duration (Required)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="package-duration">Duration (days) *</Label>
                      <Input
                        id="package-duration"
                        type="number"
                        value={packageForm.duration_days}
                        onChange={(e) => setPackageForm({ ...packageForm, duration_days: e.target.value })}
                        placeholder="6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-type">Date Type</Label>
                      <Select value={packageForm.date_type} onValueChange={(value) => setPackageForm({ ...packageForm, date_type: value })}>
                        <SelectTrigger id="date-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flexible">Flexible Dates</SelectItem>
                          <SelectItem value="fixed">Fixed Dates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {packageForm.date_type === "fixed" && (
                    <div className="space-y-2">
                      <Label htmlFor="fixed-dates">Fixed Dates</Label>
                      <Input
                        id="fixed-dates"
                        value={packageForm.fixed_dates}
                        onChange={(e) => setPackageForm({ ...packageForm, fixed_dates: e.target.value })}
                        placeholder="March 15-21, 2025"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="booking-deadline">Booking Deadline</Label>
                    <Input
                      id="booking-deadline"
                      type="date"
                      value={packageForm.booking_deadline}
                      onChange={(e) => setPackageForm({ ...packageForm, booking_deadline: e.target.value })}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* What's Included */}
              <AccordionItem value="included">
                <AccordionTrigger className="text-lg">What's Included</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="accommodation">🏨 Accommodation</Label>
                    <Textarea
                      id="accommodation"
                      value={packageForm.accommodation_details}
                      onChange={(e) => setPackageForm({ ...packageForm, accommodation_details: e.target.value })}
                      placeholder="5-star resort, ocean view room, daily housekeeping..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transportation">🚗 Transportation</Label>
                    <Textarea
                      id="transportation"
                      value={packageForm.transportation_details}
                      onChange={(e) => setPackageForm({ ...packageForm, transportation_details: e.target.value })}
                      placeholder="Airport transfers, private car with driver..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activities">🎯 Activities & Experiences (comma-separated)</Label>
                    <Textarea
                      id="activities"
                      value={packageForm.activities_included}
                      onChange={(e) => setPackageForm({ ...packageForm, activities_included: e.target.value })}
                      placeholder="Temple tour, cooking class, spa treatment, sunset cruise"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meals">🍽️ Meals</Label>
                    <Input
                      id="meals"
                      value={packageForm.meals_included}
                      onChange={(e) => setPackageForm({ ...packageForm, meals_included: e.target.value })}
                      placeholder="Daily breakfast, 2 dinners, welcome drink"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perks">🎁 Special Perks (comma-separated)</Label>
                    <Input
                      id="perks"
                      value={packageForm.perks}
                      onChange={(e) => setPackageForm({ ...packageForm, perks: e.target.value })}
                      placeholder="Welcome gift, spa credit, room upgrade"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* What's Not Included */}
              <AccordionItem value="not-included">
                <AccordionTrigger className="text-lg">What's Not Included</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="not-included">Items Not Included (comma-separated)</Label>
                    <Textarea
                      id="not-included"
                      value={packageForm.whats_not_included}
                      onChange={(e) => setPackageForm({ ...packageForm, whats_not_included: e.target.value })}
                      placeholder="International flights, travel insurance, tips, optional activities"
                      rows={3}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Pricing */}
              <AccordionItem value="pricing">
                <AccordionTrigger className="text-lg">Pricing & Payment (Required)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="package-price">Base Price *</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="deposit">Deposit</Label>
                      <Input
                        id="deposit"
                        type="number"
                        step="0.01"
                        value={packageForm.deposit_required}
                        onChange={(e) => setPackageForm({ ...packageForm, deposit_required: e.target.value })}
                        placeholder="500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="per-person">Price Per Person</Label>
                      <Input
                        id="per-person"
                        type="number"
                        step="0.01"
                        value={packageForm.price_per_person}
                        onChange={(e) => setPackageForm({ ...packageForm, price_per_person: e.target.value })}
                        placeholder="1999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="per-couple">Price Per Couple</Label>
                      <Input
                        id="per-couple"
                        type="number"
                        step="0.01"
                        value={packageForm.price_per_couple}
                        onChange={(e) => setPackageForm({ ...packageForm, price_per_couple: e.target.value })}
                        placeholder="3499"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="installments"
                      checked={packageForm.installment_available}
                      onCheckedChange={(checked) => (checked) => setPackageForm({ ...packageForm, installment_available: checked as boolean})}
                    />
                    <Label htmlFor="installments">Installment Plans Available</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refund-policy">Refund/Cancellation Policy</Label>
                    <Textarea
                      id="refund-policy"
                      value={packageForm.refund_policy}
                      onChange={(e) => setPackageForm({ ...packageForm, refund_policy: e.target.value })}
                      placeholder="Full refund if cancelled 30+ days before, 50% refund 15-30 days..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="early-bird">Early Bird Pricing</Label>
                    <Input
                      id="early-bird"
                      value={packageForm.early_bird_pricing}
                      onChange={(e) => setPackageForm({ ...packageForm, early_bird_pricing: e.target.value })}
                      placeholder="Save $200 if booked before Feb 1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-travelers">Total Spots Available</Label>
                      <Input
                        id="max-travelers"
                        type="number"
                        value={packageForm.max_travelers}
                        onChange={(e) => setPackageForm({ ...packageForm, max_travelers: e.target.value })}
                        placeholder="12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spots-remaining">Spots Remaining</Label>
                      <Input
                        id="spots-remaining"
                        type="number"
                        value={packageForm.spots_remaining}
                        onChange={(e) => setPackageForm({ ...packageForm, spots_remaining: e.target.value })}
                        placeholder="4"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Itinerary */}
              <AccordionItem value="itinerary">
                <AccordionTrigger className="text-lg">Day-by-Day Itinerary</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="itinerary">Daily Itinerary (JSON or one per line)</Label>
                    <Textarea
                      id="itinerary"
                      value={packageForm.daily_itinerary}
                      onChange={(e) => setPackageForm({ ...packageForm, daily_itinerary: e.target.value })}
                      placeholder="Day 1: Arrival & welcome dinner&#10;Day 2: Island tour + beach picnic&#10;Day 3: Spa day & sunset sail"
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter one day per line or valid JSON array
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Travel Requirements */}
              <AccordionItem value="requirements">
                <AccordionTrigger className="text-lg">Travel Requirements</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="passport"
                        checked={packageForm.passport_required}
                        onCheckedChange={(checked) => (checked) => setPackageForm({ ...packageForm, passport_required: checked as boolean})}
                      />
                      <Label htmlFor="passport">Passport Required</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="visa"
                        checked={packageForm.visa_required}
                        onCheckedChange={(checked) => (checked) => setPackageForm({ ...packageForm, visa_required: checked as boolean})}
                      />
                      <Label htmlFor="visa">Visa Required</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age-min">Minimum Age</Label>
                      <Input
                        id="age-min"
                        type="number"
                        value={packageForm.age_minimum}
                        onChange={(e) => setPackageForm({ ...packageForm, age_minimum: e.target.value })}
                        placeholder="18"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fitness">Fitness Level</Label>
                      <Select value={packageForm.fitness_level} onValueChange={(value) => setPackageForm({ ...packageForm, fitness_level: value })}>
                        <SelectTrigger id="fitness">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="challenging">Challenging</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessibility">Accessibility Notes</Label>
                    <Textarea
                      id="accessibility"
                      value={packageForm.accessibility_notes}
                      onChange={(e) => setPackageForm({ ...packageForm, accessibility_notes: e.target.value })}
                      placeholder="Wheelchair accessible, dietary accommodations available..."
                      rows={2}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Creator Story & Media */}
              <AccordionItem value="media">
                <AccordionTrigger className="text-lg">Photos, Video & Your Story</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="creator-story">Your Story (Why you curated this trip)</Label>
                    <Textarea
                      id="creator-story"
                      value={packageForm.creator_story}
                      onChange={(e) => setPackageForm({ ...packageForm, creator_story: e.target.value })}
                      placeholder="Share your connection to this destination and why this trip is special..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video">Video URL (YouTube, Vimeo, etc.)</Label>
                    <Input
                      id="video"
                      value={packageForm.video_url}
                      onChange={(e) => setPackageForm({ ...packageForm, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Images</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {packageForm.images.filter(url => url && url.trim()).map((url, index) => (
                        <div key={index} className="relative w-20 h-20">
                          <img src={url} alt="Package image" className="w-full h-full object-cover rounded" loading="lazy"/>
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
                </AccordionContent>
              </AccordionItem>

              {/* Booking CTA */}
              <AccordionItem value="cta">
                <AccordionTrigger className="text-lg">Booking Call-to-Action</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking-cta">Button Text</Label>
                    <Input
                      id="booking-cta"
                      value={packageForm.booking_cta}
                      onChange={(e) => setPackageForm({ ...packageForm, booking_cta: e.target.value })}
                      placeholder="Book Now"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button onClick={handleCreatePackage} disabled={loading} className="w-full mt-6">
              {loading ? "Creating..." : "Create Travel Package"}
            </Button>
          </TabsContent>

          <TabsContent value="store" className="space-y-6">
            <Tabs defaultValue="shopify">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="shopify" className="gap-2">
                  <Store className="h-4 w-4" />
                  Shopify
                </TabsTrigger>
                <TabsTrigger value="etsy" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Etsy
                </TabsTrigger>
              </TabsList>

              {/* Shopify Tab */}
              <TabsContent value="shopify" className="space-y-4">
                {!shopifyConnection ? (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Connect your Shopify store to automatically sync products. Products will remain linked to your store.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shopify-url">Shopify Store URL *</Label>
                      <Input
                        id="shopify-url"
                        value={shopifyUrl}
                        onChange={(e) => setShopifyUrl(e.target.value)}
                        placeholder="yourstore.myshopify.com"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => connectShopify.mutate(shopifyUrl)}
                      disabled={!shopifyUrl || connectShopify.isPending}
                      className="w-full"
                    >
                      {connectShopify.isPending ? 'Connecting...' : 'Connect Shopify Store'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium">{shopifyConnection.store_name}</p>
                          <p className="text-sm text-muted-foreground">{shopifyConnection.store_url}</p>
                          {shopifyConnection.last_synced_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last synced: {new Date(shopifyConnection.last_synced_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Badge variant={shopifyConnection.sync_status === 'success' ? 'default' : 'destructive'}>
                          {shopifyConnection.sync_status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={shopifyConnection.auto_sync_enabled}
                            onCheckedChange={(checked) => (checked) => 
                              toggleAutoSync.mutate({ 
                                connectionId: shopifyConnection.id, 
                                enabled: checked})
                            }
                          />
                          <Label className="text-sm">Auto-sync daily</Label>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => syncProducts.mutate('shopify')}
                          disabled={syncProducts.isPending || shopifyConnection.sync_status === 'syncing'}
                          className="flex-1"
                        >
                          {syncProducts.isPending ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => disconnect.mutate(shopifyConnection.id)}
                          disabled={disconnect.isPending}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Etsy Tab */}
              <TabsContent value="etsy" className="space-y-4">
                {!etsyConnection ? (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Connect your Etsy shop to automatically sync listings. You'll need to approve access to your shop.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="etsy-shop">Etsy Shop Name *</Label>
                      <Input
                        id="etsy-shop"
                        value={etsyShopName}
                        onChange={(e) => setEtsyShopName(e.target.value)}
                        placeholder="YourShopName"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => connectEtsy.mutate(etsyShopName)}
                      disabled={!etsyShopName || connectEtsy.isPending}
                      className="w-full"
                    >
                      {connectEtsy.isPending ? 'Connecting...' : 'Connect Etsy Shop'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium">{etsyConnection.store_name}</p>
                          <p className="text-sm text-muted-foreground">{etsyConnection.store_url}</p>
                          {etsyConnection.last_synced_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last synced: {new Date(etsyConnection.last_synced_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Badge variant={etsyConnection.sync_status === 'success' ? 'default' : 'destructive'}>
                          {etsyConnection.sync_status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={etsyConnection.auto_sync_enabled}
                            onCheckedChange={(checked) => (checked) => 
                              toggleAutoSync.mutate({ 
                                connectionId: etsyConnection.id, 
                                enabled: checked})
                            }
                          />
                          <Label className="text-sm">Auto-sync daily</Label>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => syncProducts.mutate('etsy')}
                          disabled={syncProducts.isPending || etsyConnection.sync_status === 'syncing'}
                          className="flex-1"
                        >
                          {syncProducts.isPending ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => disconnect.mutate(etsyConnection.id)}
                          disabled={disconnect.isPending}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}