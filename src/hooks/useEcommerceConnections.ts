import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";

export function useEcommerceConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['ecommerce-connections', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ecommerce_connections')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const connectShopify = useMutation({
    mutationFn: async (storeUrl: string) => {
      const { data, error } = await invokeEdgeFunction('shopify-oauth-initiate', {
        body: { storeUrl },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Redirect to Shopify OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to connect Shopify');
    },
  });

  const connectEtsy = useMutation({
    mutationFn: async (shopName: string) => {
      const { data, error } = await invokeEdgeFunction('etsy-oauth-initiate', {
        body: { shopName },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Redirect to Etsy OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to connect Etsy');
    },
  });

  const syncProducts = useMutation({
    mutationFn: async (platform: 'shopify' | 'etsy') => {
      const functionName = platform === 'shopify' ? 'sync-shopify-products' : 'sync-etsy-products';
      const { data, error } = await invokeEdgeFunction(functionName, {});

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-connections'] });
      toast.success(`Synced ${data.created} new and ${data.updated} updated products`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Sync failed');
    },
  });

  const disconnect = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('ecommerce_connections')
        .update({ is_active: false })
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-connections'] });
      toast.success('Store disconnected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disconnect');
    },
  });

  const toggleAutoSync = useMutation({
    mutationFn: async ({ connectionId, enabled }: { connectionId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('ecommerce_connections')
        .update({ auto_sync_enabled: enabled })
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-connections'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update auto-sync');
    },
  });

  return {
    connections,
    isLoading,
    connectShopify,
    connectEtsy,
    syncProducts,
    disconnect,
    toggleAutoSync,
  };
}
