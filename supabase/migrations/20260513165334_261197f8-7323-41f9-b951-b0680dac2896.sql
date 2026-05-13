-- Returns true if the named vault secret exists. Never returns the value.
CREATE OR REPLACE FUNCTION public.email_infra_vault_secret_exists(_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT EXISTS (SELECT 1 FROM vault.secrets WHERE name = _name);
$$;

REVOKE ALL ON FUNCTION public.email_infra_vault_secret_exists(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_infra_vault_secret_exists(text) TO service_role;