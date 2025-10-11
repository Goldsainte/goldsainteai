-- Fix search_path for all SECURITY DEFINER functions
-- This prevents privilege escalation attacks

-- List of functions that need search_path fixed (if not already set)
-- We'll use ALTER FUNCTION to ensure they all have search_path = public

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Get all SECURITY DEFINER functions in public schema
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true  -- SECURITY DEFINER
        AND NOT EXISTS (
            SELECT 1 
            FROM unnest(p.proconfig) as config
            WHERE config LIKE 'search_path=%'
        )
    LOOP
        -- Fix the search_path for each function
        EXECUTE format(
            'ALTER FUNCTION public.%I(%s) SET search_path = public',
            func_record.function_name,
            func_record.args
        );
        
        RAISE NOTICE 'Fixed search_path for function: %', func_record.function_name;
    END LOOP;
END $$;