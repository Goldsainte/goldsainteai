import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link2, TrendingUp, DollarSign, MousePointerClick, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AffiliateManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    productName: '',
    productUrl: '',
    commissionRate: '10',
    platform: '',
  });

  // Fetch affiliate links
  const { data: links = [] } = useQuery({
    queryKey: ['affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch commissions
  const { data: commissions = [] } = useQuery({
    queryKey: ['affiliate-commissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select(`
          *,
          affiliate_links (product_name, affiliate_code)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Generate unique code
      const code = `${user.id.substring(0, 8)}-${Date.now()}`;

      const { error } = await supabase
        .from('affiliate_links')
        .insert({
          creator_id: user.id,
          product_name: newLink.productName,
          product_url: newLink.productUrl,
          affiliate_code: code,
          commission_rate: parseFloat(newLink.commissionRate),
          platform: newLink.platform || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-links'] });
      setIsCreateDialogOpen(false);
      setNewLink({ productName: '', productUrl: '', commissionRate: '10', platform: '' });
      toast.success('Affiliate link created!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create link');
    },
  });

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/aff/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const totalEarnings = commissions.reduce((sum, c) => sum + (c.status === 'paid' ? Number(c.commission_amount) : 0), 0);
  const pendingEarnings = commissions.reduce((sum, c) => sum + (c.status === 'pending' ? Number(c.commission_amount) : 0), 0);
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-secondary font-bold mb-2">Affiliate Manager</h1>
            <p className="text-muted-foreground">
              Create and track your affiliate links
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Link2 className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Affiliate Link</DialogTitle>
                <DialogDescription>
                  Generate a trackable link to earn commissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={newLink.productName}
                    onChange={(e) => setNewLink({ ...newLink, productName: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label htmlFor="productUrl">Product URL</Label>
                  <Input
                    id="productUrl"
                    type="url"
                    value={newLink.productUrl}
                    onChange={(e) => setNewLink({ ...newLink, productUrl: e.target.value })}
                    placeholder="https://example.com/product"
                  />
                </div>
                <div>
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newLink.commissionRate}
                    onChange={(e) => setNewLink({ ...newLink, commissionRate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="platform">Platform (Optional)</Label>
                  <Input
                    id="platform"
                    value={newLink.platform}
                    onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                    placeholder="e.g., Amazon, Booking.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createLinkMutation.mutate()}
                  disabled={!newLink.productName || !newLink.productUrl || createLinkMutation.isPending}
                >
                  {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversions}</div>
              {totalClicks > 0 && (
                <p className="text-xs text-muted-foreground">
                  {((totalConversions / totalClicks) * 100).toFixed(1)}% conversion rate
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="links" className="space-y-6">
          <TabsList>
            <TabsTrigger value="links">My Links</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4">
            {links.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No affiliate links yet</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Create Your First Link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {links.map((link: any) => (
                  <Card key={link.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{link.product_name}</CardTitle>
                          <CardDescription className="mt-1">
                            {link.platform && `${link.platform} • `}
                            {link.commission_rate}% commission
                          </CardDescription>
                        </div>
                        <Badge variant={link.is_active ? 'default' : 'secondary'}>
                          {link.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                            {window.location.origin}/aff/{link.affiliate_code}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(link.affiliate_code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Clicks: </span>
                            <span className="font-semibold">{link.clicks}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Conversions: </span>
                            <span className="font-semibold">{link.conversions}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Earned: </span>
                            <span className="font-semibold">${Number(link.total_earnings).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            {commissions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No commissions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {commissions.map((commission: any) => (
                  <Card key={commission.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{commission.affiliate_links?.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ${Number(commission.commission_amount).toFixed(2)}
                        </p>
                        <Badge variant={
                          commission.status === 'paid' ? 'default' :
                          commission.status === 'approved' ? 'secondary' :
                          commission.status === 'rejected' ? 'destructive' :
                          'outline'
                        }>
                          {commission.status}
                        </Badge>
                      </div>
                    </CardContent>
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