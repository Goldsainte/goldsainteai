CREATE TABLE IF NOT EXISTS public.view_dedup (
  ip_hash text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('trip','product')),
  entity_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ip_hash, kind, entity_id, day)
);

ALTER TABLE public.view_dedup ENABLE ROW LEVEL SECURITY;

-- No client policies: only service role accesses this table.

CREATE INDEX IF NOT EXISTS idx_view_dedup_day ON public.view_dedup(day);