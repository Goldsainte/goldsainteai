import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Shield, Check, Search, Building2, Hotel, Utensils, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  supplier_type: string;
  rating: number;
  total_reviews: number;
  verification_status: string;
  insurance_verified: boolean;
  license_verified: boolean;
  commission_rate: number;
  contact_email: string;
  contact_phone: string | null;
  is_verified: boolean;
  is_active: boolean;
}

export const SupplierDirectory = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadSuppliers();
  }, [typeFilter]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      let query: any = supabase
        .from('suppliers' as any)
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('rating', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('supplier_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuppliers((data || []) as Supplier[]);
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      hotel: Hotel,
      activity: Building2,
      restaurant: Utensils,
      transportation: Car,
      other: Building2,
    };
    const Icon = icons[type] || Building2;
    return <Icon className="h-5 w-5" />;
  };

  const getTrustBadge = (rating: number) => {
    if (rating >= 4.5) return { label: 'Highly Trusted', color: 'bg-green-500' };
    if (rating >= 3.5) return { label: 'Trusted', color: 'bg-blue-500' };
    if (rating >= 2.5) return { label: 'Verified', color: 'bg-yellow-500' };
    return { label: 'New', color: 'bg-gray-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hotel">Hotels</SelectItem>
            <SelectItem value="activity">Activities</SelectItem>
            <SelectItem value="restaurant">Restaurants</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div>Loading suppliers...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map(supplier => {
            const trustBadge = getTrustBadge(supplier.rating);
            return (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(supplier.supplier_type)}
                      <CardTitle className="text-base">{supplier.name}</CardTitle>
                    </div>
                    {supplier.verification_status === 'verified' && (
                      <Badge variant="default">Verified</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {supplier.contact_email}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#C7A962] text-[#C7A962]" />
                      <span className="font-semibold">{supplier.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({supplier.total_reviews} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={trustBadge.color}>
                      <Shield className="h-3 w-3 mr-1" />
                      {trustBadge.label}
                    </Badge>
                    {supplier.insurance_verified && (
                      <span title="Insurance Verified">
                        <Check className="h-4 w-4 text-green-500" />
                      </span>
                    )}
                    {supplier.license_verified && (
                      <span title="License Verified">
                        <Check className="h-4 w-4 text-blue-500" />
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Commission: {supplier.commission_rate}%
                    </p>
                  </div>

                  <Button className="w-full" variant="outline">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No suppliers found matching your criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};