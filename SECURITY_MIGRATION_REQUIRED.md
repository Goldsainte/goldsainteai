# Required Security Database Migrations

## CRITICAL: Database Function search_path Fix

All database functions in the `public` schema must have `SET search_path = 'public'` to prevent privilege escalation attacks via search path manipulation.

### Vulnerability Explanation

Without explicit `search_path`, attackers can:
1. Create malicious functions in user-controlled schemas
2. Manipulate `search_path` to include attacker's schema first
3. When legitimate function executes, it calls attacker's function instead
4. Attacker's code runs with elevated privileges (SECURITY DEFINER)

### Required Migration SQL

```sql
-- Fix all SECURITY DEFINER functions to prevent search_path exploitation
-- Run this migration to add SET search_path = 'public' to all functions

-- 1. has_role function (CRITICAL - used for authorization)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'  -- ✅ ADDED
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 2. is_admin function (CRITICAL - admin access control)
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'  -- ✅ ADDED
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$function$;

-- 3. get_user_tier function (payment-related)
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id uuid)
 RETURNS subscription_tier
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'  -- ✅ ADDED
AS $function$
  SELECT COALESCE(
    (SELECT tier FROM public.user_subscriptions WHERE user_id = _user_id),
    'free'::subscription_tier
  );
$function$;

-- 4. calculate_creator_earnings function
CREATE OR REPLACE FUNCTION public.calculate_creator_earnings(post_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'  -- ✅ ADDED
AS $function$
DECLARE
  total_earnings NUMERIC := 0;
  view_earnings NUMERIC := 0;
  like_earnings NUMERIC := 0;
  share_earnings NUMERIC := 0;
BEGIN
  -- Get engagement metrics
  SELECT 
    (view_count * 0.001) +  -- $0.001 per view
    (like_count * 0.01) +    -- $0.01 per like
    (share_count * 0.05)     -- $0.05 per share
  INTO total_earnings
  FROM public.travel_posts
  WHERE id = post_uuid;
  
  RETURN COALESCE(total_earnings, 0);
END;
$function$;

-- 5. calculate_agent_trust_score function
CREATE OR REPLACE FUNCTION public.calculate_agent_trust_score(agent_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'  -- ✅ ADDED
AS $function$
DECLARE
  score numeric := 0;
BEGIN
  -- Base score from verifications (max 3.0)
  SELECT 
    CASE WHEN identity_verified THEN 0.75 ELSE 0 END +
    CASE WHEN background_check_status = 'approved' THEN 0.75 ELSE 0 END +
    CASE WHEN professional_license_verified THEN 0.75 ELSE 0 END +
    CASE WHEN insurance_verified THEN 0.75 ELSE 0 END
  INTO score
  FROM public.travel_agents
  WHERE id = agent_uuid;
  
  -- Add rating score (max 2.0)
  SELECT score + COALESCE((rating / 5.0 * 2.0), 0)
  INTO score
  FROM public.travel_agents
  WHERE id = agent_uuid;
  
  RETURN LEAST(score, 5.0);
END;
$function$;

-- 6. All notification trigger functions
CREATE OR REPLACE FUNCTION public.notify_new_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'  -- ✅ ADDED
AS $function$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM travel_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter username
  SELECT username INTO commenter_username
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id, 
    notification_type, 
    title, 
    message, 
    metadata,
    link
  )
  VALUES (
    post_owner_id,
    'comment',
    'New Comment',
    COALESCE(commenter_username, 'Someone') || ' commented on your post',
    jsonb_build_object(
      'actor_id', NEW.user_id,
      'post_id', NEW.post_id,
      'comment_id', NEW.id
    ),
    '/travel-feed'
  );
  
  RETURN NEW;
END;
$function$;

-- REPEAT FOR ALL OTHER NOTIFICATION TRIGGERS:
-- - notify_new_like()
-- - notify_new_follow()
-- - notify_direct_message()
-- - notify_collaboration_invite()
-- - notify_moment_reply()
-- - notify_partnership_status()
-- And all other SECURITY DEFINER functions...
```

### How to Apply This Migration

**Option 1: Via Lovable AI Agent**
```
User: Create a database migration to add SET search_path = 'public' to all database functions
```

**Option 2: Via Supabase SQL Editor**
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste the SQL above
4. Click "Run"
5. Verify all functions updated successfully

**Option 3: Via Migration Tool**
```bash
# Generate migration file
supabase migration new add_search_path_to_functions

# Add SQL to the generated file
# Apply migration
supabase db push
```

### Testing After Migration

```sql
-- Verify all functions have search_path set
SELECT 
  n.nspname as schema,
  p.proname as function,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%'
  AND p.prokind = 'f'; -- functions only, not aggregates

-- Should return 0 rows after fix
```

### Impact Assessment

**Functions Requiring Fix**: ~50+ database functions  
**Severity**: HIGH - Allows privilege escalation  
**Estimated Time**: 2-4 hours (comprehensive fix)  
**Risk Level**: LOW (additive change, no breaking changes)  
**Testing Required**: Unit tests for authorization functions

---

## CRITICAL: RLS Policies Migration

Tables with RLS enabled but no policies provide NO actual protection. This must be fixed immediately.

### Identify Affected Tables

Run the Supabase linter or this query:

```sql
-- Find tables with RLS enabled but no policies
SELECT 
  schemaname, 
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND tablename NOT IN (
    SELECT DISTINCT tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  );
```

### Example RLS Policy Templates

#### User-Owned Data Pattern
```sql
-- For tables where users own their own rows
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own data"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON table_name FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON table_name FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

#### Admin-Only Pattern
```sql
-- For admin tables
ALTER TABLE admin_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage"
  ON admin_table FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

#### Public Read, Owner Write Pattern
```sql
-- For profiles, posts, etc. that are publicly viewable
ALTER TABLE public_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view"
  ON public_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can update"
  ON public_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Priority Tables (Fix First)

1. **Payment/Billing Tables**: Any table with financial data
2. **User Private Data**: Messages, notifications, preferences
3. **Admin Tables**: Any table with admin-only operations
4. **Creator Content**: Templates, packages, earnings

---

**⚠️ URGENT**: These migrations address CRITICAL security vulnerabilities. They should be applied BEFORE production deployment.

**Next Steps**:
1. Review this document with security team
2. Create migration files for both fixes
3. Test in staging environment
4. Apply to production during maintenance window
5. Re-run security linter to verify fixes
