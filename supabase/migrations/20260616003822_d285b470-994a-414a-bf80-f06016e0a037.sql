
-- newsroom_authors.email: not for anon or authenticated; admin RPC only
REVOKE SELECT (email) ON public.newsroom_authors FROM anon;
REVOKE SELECT (email) ON public.newsroom_authors FROM authenticated;

-- suppliers contact fields: anon cannot read PII
REVOKE SELECT (contact_email, contact_phone) ON public.suppliers FROM anon;

-- travel_agents contact fields: anon cannot read PII
REVOKE SELECT (email, phone) ON public.travel_agents FROM anon;

-- marketplace_jobs contact fields: anon cannot read PII on open jobs
REVOKE SELECT (additional_emails, contact_info, group_organizer_email)
  ON public.marketplace_jobs FROM anon;
