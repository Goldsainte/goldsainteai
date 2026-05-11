import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tag, Plus, Edit, Trash2 } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  currency: string;
  max_uses: number | null;
  uses_count: number;
  min_order_value: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export default function PromoCodeManagement() {
  const navigate = useNavigate();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    currency: "USD",
    max_uses: null as number | null,
    min_order_value: 0,
    valid_until: "",
    is_active: true,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }

    loadPromoCodes();
  };

  const loadPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promotional_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error("Error loading promo codes:", error);
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || formData.discount_value <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingCode) {
        const { error } = await supabase
          .from("promotional_codes")
          .update({
            description: formData.description,
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            currency: formData.currency,
            max_uses: formData.max_uses,
            min_order_value: formData.min_order_value,
            valid_until: formData.valid_until || null,
            is_active: formData.is_active,
          })
          .eq("id", editingCode.id);

        if (error) throw error;
        toast.success("Promo code updated");
      } else {
        const { error } = await supabase
          .from("promotional_codes")
          .insert({
            ...formData,
            code: formData.code.toUpperCase(),
            created_by: user.id,
            valid_until: formData.valid_until || null,
          });

        if (error) throw error;
        toast.success("Promo code created");
      }

      setShowDialog(false);
      resetForm();
      loadPromoCodes();
    } catch (error) {
      console.error("Error saving promo code:", error);
      toast.error("Failed to save promo code");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;

    try {
      const { error } = await supabase
        .from("promotional_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Promo code deleted");
      loadPromoCodes();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Failed to delete promo code");
    }
  };

  const openEditDialog = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || "",
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      currency: code.currency,
      max_uses: code.max_uses,
      min_order_value: code.min_order_value,
      valid_until: code.valid_until ? code.valid_until.split("T")[0] : "",
      is_active: code.is_active,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingCode(null);
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      currency: "USD",
      max_uses: null,
      min_order_value: 0,
      valid_until: "",
      is_active: true,
    });
  };

  if (loading) {
    return <div className="container py-8 max-w-6xl"><div className="animate-pulse h-64 bg-muted rounded" /></div>;
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="h-8 w-8" />
            Promotional Codes
          </h1>
          <p className="text-muted-foreground mt-2">Manage discount codes and promotions</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Code
        </Button>
      </div>

      <div className="grid gap-4">
        {promoCodes.map((code) => (
          <Card key={code.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <code className="text-primary">{code.code}</code>
                    {code.is_active ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{code.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(code)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(code.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Discount</p>
                  <p className="font-semibold">
                    {code.discount_type === "percentage"
                      ? `${code.discount_value}%`
                      : `$${code.discount_value}`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uses</p>
                  <p className="font-semibold">
                    {code.uses_count} {code.max_uses ? `/ ${code.max_uses}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min Order</p>
                  <p className="font-semibold">${code.min_order_value}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-semibold">
                    {code.valid_until ? new Date(code.valid_until).toLocaleDateString() : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit" : "Create"} Promo Code</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2024"
                disabled={!!editingCode}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Summer sale discount"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={formData.max_uses || ""}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <Label>Min Order Value</Label>
                <Input
                  type="number"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Checkbox
                checked={formData.is_active}
                onCheckedChange={(checked) => (checked) => setFormData({ ...formData, is_active: checked})}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingCode ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
