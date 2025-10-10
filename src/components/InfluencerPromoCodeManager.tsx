import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Promotion {
  id: string;
  promo_code: string;
  status: string;
  clicks: number;
  conversions: number;
  created_at: string;
  package: {
    id: string;
    package_name: string;
    destination: string;
    retail_price: number;
    cover_image_url: string | null;
  };
}

export function InfluencerPromoCodeManager() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPromotions();
    }
  }, [user]);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('influencer_promotions')
        .select(`
          id,
          promo_code,
          status,
          clicks,
          conversions,
          created_at,
          package:agent_packages!influencer_promotions_package_id_fkey(
            id,
            package_name,
            destination,
            retail_price,
            cover_image_url
          )
        `)
        .eq('influencer_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data as any || []);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const copyPromoLink = (packageId: string, promoCode: string) => {
    const url = `${window.location.origin}/cocurated-package/${packageId}?promo=${promoCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Promo link copied!');
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied!');
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (promotions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No active promotions yet.</p>
          <p className="text-sm mt-2">Request to promote packages from the marketplace!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {promotions.map((promo) => (
        <Card key={promo.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{promo.package.package_name}</CardTitle>
                <CardDescription>
                  {promo.package.destination} • ${promo.package.retail_price}
                </CardDescription>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Promo Code */}
            <div className="flex items-center gap-2">
              <Input
                value={promo.promo_code}
                readOnly
                className="font-mono text-lg text-center bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyPromoCode(promo.promo_code)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-center">
              <div className="flex-1">
                <p className="text-2xl font-bold">{promo.clicks || 0}</p>
                <p className="text-xs text-muted-foreground">Clicks</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-primary">{promo.conversions || 0}</p>
                <p className="text-xs text-muted-foreground">Bookings</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-green-600">
                  {promo.clicks > 0 ? ((promo.conversions / promo.clicks) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => copyPromoLink(promo.package.id, promo.promo_code)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`/cocurated-package/${promo.package.id}?promo=${promo.promo_code}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>

            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-xs text-green-700 dark:text-green-300">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Customers save 5% • You earn commission on each booking
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
