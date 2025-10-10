import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Search, Check } from "lucide-react";
import { toast } from "sonner";

interface PackageTagSelectorProps {
  postId?: string;
  onPackageTagged?: (packageId: string) => void;
  selectedPackageIds?: string[];
}

export function PackageTagSelector({ postId, onPackageTagged, selectedPackageIds = [] }: PackageTagSelectorProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailablePackages();
    }
  }, [open, user]);

  const fetchAvailablePackages = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch packages where user is the agent OR has active promotion
      const { data: agentData } = await supabase
        .from('travel_agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data: promotions } = await supabase
        .from('influencer_promotions')
        .select('package_id')
        .eq('influencer_id', user.id)
        .eq('status', 'active');

      const promotionPackageIds = promotions?.map(p => p.package_id) || [];
      const agentPackageQuery = supabase
        .from('agent_packages')
        .select('*')
        .eq('is_active', true);

      if (agentData) {
        agentPackageQuery.eq('agent_id', agentData.id);
      } else {
        agentPackageQuery.in('id', promotionPackageIds);
      }

      const { data, error } = await agentPackageQuery;

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const tagPackage = async (packageId: string) => {
    if (!postId) {
      toast.error('Post must be created first');
      return;
    }

    try {
      const { error } = await supabase
        .from('package_post_tags')
        .insert({
          post_id: postId,
          package_id: packageId
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Package already tagged in this post');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Package tagged in post!');
      onPackageTagged?.(packageId);
      setOpen(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to tag package');
    }
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          Tag CoCurated<span className="text-xs align-super">™</span> Package
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tag a CoCurated™ Package</DialogTitle>
          <DialogDescription>
            Select a package to promote in this post
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-2 pr-4">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading packages...</p>
            ) : filteredPackages.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No packages available. {!searchQuery && "Create or get approved to promote packages first."}
              </p>
            ) : (
              filteredPackages.map((pkg) => {
                const isSelected = selectedPackageIds.includes(pkg.id);
                return (
                  <Card 
                    key={pkg.id} 
                    className={`cursor-pointer transition-all ${isSelected ? 'border-primary' : ''}`}
                    onClick={() => !isSelected && tagPackage(pkg.id)}
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{pkg.package_name}</CardTitle>
                          <CardDescription className="text-xs">
                            {pkg.destination} • {pkg.duration_days}d
                          </CardDescription>
                        </div>
                        {isSelected ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" />
                            Tagged
                          </Badge>
                        ) : (
                          <Badge variant="outline">${pkg.retail_price}</Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}