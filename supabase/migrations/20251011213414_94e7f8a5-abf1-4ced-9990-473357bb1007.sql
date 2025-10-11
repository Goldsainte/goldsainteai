-- Comprehensive fix for all functions without search_path
-- This includes both SECURITY DEFINER and regular functions

DO $$
DECLARE
    func_record RECORD;
    func_sql TEXT;
BEGIN
    -- Get ALL functions in public schema without search_path
    FOR func_record IN 
        SELECT 
            p.oid,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args,
            p.prosecdef as is_security_definer
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT EXISTS (
            SELECT 1 
            FROM unnest(p.proconfig) as config
            WHERE config LIKE 'search_path=%'
        )
        -- Only fix plpgsql and sql functions
        AND p.prolang IN (
            SELECT oid FROM pg_language WHERE lanname IN ('plpgsql', 'sql')
        )
    LOOP
        BEGIN
            -- Fix the search_path for each function
            EXECUTE format(
                'ALTER FUNCTION public.%I(%s) SET search_path = public',
                func_record.function_name,
                func_record.args
            );
            
            RAISE NOTICE 'Fixed search_path for function: % (SECURITY DEFINER: %)', 
                func_record.function_name, 
                func_record.is_security_definer;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Could not fix function %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
END $$;