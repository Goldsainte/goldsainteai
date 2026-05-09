-- Restrict realtime to only broadcast rows the subscriber owns (RLS-enforced)
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.marketplace_jobs; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.agent_bids; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.direct_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Fix mutable search paths on all remaining public functions
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT n.nspname AS schema_name,
           p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) AS cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        func_record.schema_name,
        func_record.function_name,
        func_record.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped %.%(%): %', func_record.schema_name, func_record.function_name, func_record.args, SQLERRM;
    END;
  END LOOP;
END $$;