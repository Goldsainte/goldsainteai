import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Shield, Check, X, Search, Building2, Plane, Hotel, Utensils, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  supplier_type: string;
  description: string;
  rating: number;
  total_reviews: number;
  trust_score: number;
  verification_status: string;
  insurance_verified: boolean;
  license_verified: boolean;
  services_offered: string[];
  commission_rate: number;
  is_featured: boolean;
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
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .eq('verification_status', 'verified')
        .order('rating', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('supplier_type', typeFilter as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      hotel: Hotel,
      activity_provider: Plane,
      tour_guide: Building2,
      restaurant: Utensils,
      transportation: Car,
    };
    const Icon = icons[type] || Building2;
    return <Icon className="h-5 w-5" />;
  };

  const getTrustBadge = (trustScore: number) => {
    if (trustScore >= 4.5) return { label: 'Highly Trusted', color: 'bg-green-500' };
    if (trustScore >= 3.5) return { label: 'Trusted', color: 'bg-blue-500' };
    if (trustScore >= 2.5) return { label: 'Verified', color: 'bg-yellow-500' };
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
            <SelectItem value="activity_provider">Activities</SelectItem>
            <SelectItem value="tour_guide">Tour Guides</SelectItem>
            <SelectItem value="restaurant">Restaurants</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div>Loading suppliers...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map(supplier => {
            const trustBadge = getTrustBadge(supplier.trust_score);
            return (
              <Card key={supplier.id} className={supplier.is_featured ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(supplier.supplier_type)}
                      <CardTitle className="text-base">{supplier.name}</CardTitle>
                    </div>
                    {supplier.is_featured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {supplier.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
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

                  {supplier.services_offered && supplier.services_offered.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {supplier.services_offered.slice(0, 3).map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {supplier.services_offered.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{supplier.services_offered.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

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
