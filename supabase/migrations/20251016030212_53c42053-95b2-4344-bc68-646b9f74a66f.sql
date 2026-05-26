-- Create ecommerce_connections table
CREATE TABLE IF NOT EXISTS public.ecommerce_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('shopify', 'etsy', 'amazon')),
  store_url TEXT NOT NULL,
  store_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  auto_sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'success')),
  sync_error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creator_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_connections_creator ON public.ecommerce_connections(creator_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_connections_platform ON public.ecommerce_connections(platform);

-- Enable RLS
ALTER TABLE public.ecommerce_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can manage their own connections
CREATE POLICY "Creators can manage their own connections" ON public.ecommerce_connections
  FOR ALL USING (auth.uid() = creator_id);

-- Extend products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS external_product_id TEXT,
  ADD COLUMN IF NOT EXISTS external_store_id UUID REFERENCES ecommerce_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'manual' CHECK (sync_source IN ('manual', 'shopify', 'etsy', 'amazon')),
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS external_url TEXT;

CREATE INDEX IF NOT EXISTS idx_products_external_id ON public.products(external_product_id);
CREATE INDEX IF NOT EXISTS idx_products_sync_source ON public.products(sync_source);

-- Create sync_history table
CREATE TABLE IF NOT EXISTS public.sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ecommerce_connections(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'cancelled')),
  products_fetched INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sync_history_connection ON public.sync_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_started ON public.sync_history(started_at DESC);

-- Enable RLS
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can view their own sync history
CREATE POLICY "Creators can view their own sync history" ON public.sync_history
  FOR SELECT USING (connection_id IN (
    SELECT id FROM public.ecommerce_connections WHERE creator_id = auth.uid()
  ));

-- Trigger for updated_at on ecommerce_connections
CREATE OR REPLACE FUNCTION public.update_ecommerce_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ecommerce_connections_updated_at
BEFORE UPDATE ON public.ecommerce_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_ecommerce_connections_updated_at();
