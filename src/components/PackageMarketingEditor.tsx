import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, X, Upload, Edit, Trash2, Eye, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface PackageFormData {
  package_name: string;
  tagline: string;
  description: string;
  highlights: string[];
  destination: string;
  duration_days: number;
  starting_price: number;
  currency: string;
  difficulty_level: string;
  best_season: string;
  group_size_min: number;
  group_size_max: number;
  included_items: string[];
  excluded_items: string[];
  requirements: string[];
  tags: string[];
  is_published: boolean;
  allow_resale: boolean;
  resale_commission_percentage: number;
}

export function PackageMarketingEditor() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    package_name: "",
    tagline: "",
    description: "",
    highlights: [],
    destination: "",
    duration_days: 1,
    starting_price: 0,
    currency: "USD",
    difficulty_level: "moderate",
    best_season: "",
    group_size_min: 1,
    group_size_max: 10,
    included_items: [],
    excluded_items: [],
    requirements: [],
    tags: [],
    is_published: false,
    allow_resale: false,
    resale_commission_percentage: 10,
  });
  const [newItem, setNewItem] = useState("");
  const [itemType, setItemType] = useState<"highlights" | "included" | "excluded" | "requirements" | "tags">("highlights");

  const { data: packages, isLoading } = useQuery({
    queryKey: ["package-marketing-materials"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("package_marketing_materials")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("package_marketing_materials")
        .insert({ ...data, creator_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-marketing-materials"] });
      toast.success("Package created successfully");
      resetForm();
      setIsCreating(false);
    },
    onError: () => {
      toast.error("Failed to create package");
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PackageFormData> }) => {
      const { error } = await supabase
        .from("package_marketing_materials")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-marketing-materials"] });
      toast.success("Package updated successfully");
      resetForm();
      setEditingPackage(null);
    },
    onError: () => {
      toast.error("Failed to update package");
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("package_marketing_materials")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-marketing-materials"] });
      toast.success("Package deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete package");
    },
  });

  const resetForm = () => {
    setFormData({
      package_name: "",
      tagline: "",
      description: "",
      highlights: [],
      destination: "",
      duration_days: 1,
      starting_price: 0,
      currency: "USD",
      difficulty_level: "moderate",
      best_season: "",
      group_size_min: 1,
      group_size_max: 10,
      included_items: [],
      excluded_items: [],
      requirements: [],
      tags: [],
      is_published: false,
      allow_resale: false,
      resale_commission_percentage: 10,
    });
    setNewItem("");
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;

    const key = itemType === "highlights" ? "highlights" :
                itemType === "included" ? "included_items" :
                itemType === "excluded" ? "excluded_items" :
                itemType === "requirements" ? "requirements" : "tags";

    setFormData(prev => ({
      ...prev,
      [key]: [...prev[key], newItem.trim()],
    }));
    setNewItem("");
  };

  const handleRemoveItem = (type: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type as keyof Pick<PackageFormData, "highlights" | "included_items" | "excluded_items" | "requirements" | "tags">].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.package_name || !formData.description || !formData.destination) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, data: formData });
    } else {
      createPackageMutation.mutate(formData);
    }
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setFormData({
      package_name: pkg.package_name,
      tagline: pkg.tagline || "",
      description: pkg.description,
      highlights: pkg.highlights || [],
      destination: pkg.destination,
      duration_days: pkg.duration_days,
      starting_price: pkg.starting_price,
      currency: pkg.currency,
      difficulty_level: pkg.difficulty_level || "moderate",
      best_season: pkg.best_season || "",
      group_size_min: pkg.group_size_min || 1,
      group_size_max: pkg.group_size_max || 10,
      included_items: pkg.included_items || [],
      excluded_items: pkg.excluded_items || [],
      requirements: pkg.requirements || [],
      tags: pkg.tags || [],
      is_published: pkg.is_published,
      allow_resale: pkg.allow_resale || false,
      resale_commission_percentage: pkg.resale_commission_percentage || 10,
    });
    setIsCreating(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading packages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-secondary">Package Marketing Materials</h2>
          <p className="text-muted-foreground">Create and manage your travel package offerings</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      <Dialog open={isCreating} onOpenChange={(open) => {
        setIsCreating(open);
        if (!open) {
          resetForm();
          setEditingPackage(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Edit" : "Create"} Package</DialogTitle>
            <DialogDescription>
              Fill in the details to create a stunning package offering
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package_name">Package Name *</Label>
                <Input
                  id="package_name"
                  value={formData.package_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, package_name: e.target.value }))}
                  placeholder="e.g., Luxury Maldives Escape"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="A catchy phrase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the package..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="e.g., Maldives"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_days">Duration (days)</Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty_level">Difficulty</Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="challenging">Challenging</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starting_price">Starting Price</Label>
                <Input
                  id="starting_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.starting_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, starting_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
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
                <Label htmlFor="group_size_min">Min Group Size</Label>
                <Input
                  id="group_size_min"
                  type="number"
                  min="1"
                  value={formData.group_size_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, group_size_min: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group_size_max">Max Group Size</Label>
                <Input
                  id="group_size_max"
                  type="number"
                  min="1"
                  value={formData.group_size_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, group_size_max: parseInt(e.target.value) || 10 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="best_season">Best Season</Label>
              <Input
                id="best_season"
                value={formData.best_season}
                onChange={(e) => setFormData(prev => ({ ...prev, best_season: e.target.value }))}
                placeholder="e.g., Summer, Year-round"
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex gap-2">
                <Select value={itemType} onValueChange={(value: any) => setItemType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highlights">Highlights</SelectItem>
                    <SelectItem value="included">Included Items</SelectItem>
                    <SelectItem value="excluded">Excluded Items</SelectItem>
                    <SelectItem value="requirements">Requirements</SelectItem>
                    <SelectItem value="tags">Tags</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder={`Add ${itemType}...`}
                  onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
                />
                <Button type="button" onClick={handleAddItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {["highlights", "included_items", "excluded_items", "requirements", "tags"].map((type) => {
                const items = formData[type as keyof typeof formData] as string[];
                if (items.length === 0) return null;

                const label = type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <div key={type} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {item}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => handleRemoveItem(type, index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => { const v = checked === true; ((checked) => setFormData(prev => ({ ...prev, is_published: checked)(v); }}))}
                />
                <Label htmlFor="is_published">Publish package (make visible to customers)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_resale"
                  checked={formData.allow_resale}
                  onCheckedChange={(checked) => { const v = checked === true; ((checked) => setFormData(prev => ({ ...prev, allow_resale: checked)(v); }}))}
                />
                <Label htmlFor="allow_resale">Allow other creators to resell this package</Label>
              </div>

              {formData.allow_resale && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="resale_commission">Your Commission Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="resale_commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.resale_commission_percentage}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        resale_commission_percentage: parseFloat(e.target.value) || 10 
                      }))}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      % of every booking through resellers
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When other creators sell your package, you earn {formData.resale_commission_percentage}% commission on each booking
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  resetForm();
                  setEditingPackage(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingPackage ? "Update" : "Create"} Package
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {packages?.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{pkg.package_name}</CardTitle>
                    {pkg.is_published ? (
                      <Badge variant="default">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                  {pkg.tagline && (
                    <CardDescription className="mt-1">{pkg.tagline}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this package?")) {
                        deletePackageMutation.mutate(pkg.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Destination:</span> {pkg.destination}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {pkg.duration_days} days
                  </div>
                  <div>
                    <span className="font-medium">From:</span> {pkg.currency} {pkg.starting_price}
                  </div>
                  <div>
                    <span className="font-medium">Views:</span> {pkg.view_count} | <span className="font-medium">Bookings:</span> {pkg.booking_count}
                  </div>
                </div>

                {pkg.tags && pkg.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {pkg.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {packages?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No packages created yet</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Package
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}