
-- Reserved usernames enforcement
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
  username text PRIMARY KEY
);

ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reserved usernames are publicly readable"
ON public.reserved_usernames
FOR SELECT
USING (true);

INSERT INTO public.reserved_usernames (username) VALUES
  ('admin'),('administrator'),('support'),('help'),('info'),('contact'),
  ('official'),('goldsainte'),('billing'),('team'),('hello'),('sales'),
  ('security'),('abuse'),('root'),('system'),('api'),('www'),('mail'),
  ('ftp'),('app'),('m'),('mobile'),('ios'),('android'),('beta'),('alpha'),
  ('dev'),('test'),('staging'),('production'),('news'),('blog'),
  ('careers'),('jobs'),('status'),('moderator'),('mod'),('staff'),
  ('owner'),('founder'),('ceo'),('press'),('legal'),('privacy'),
  ('terms'),('noreply'),('no-reply'),('postmaster')
ON CONFLICT (username) DO NOTHING;

CREATE OR REPLACE FUNCTION public.enforce_reserved_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NULL OR length(trim(NEW.username)) = 0 THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reserved_usernames
    WHERE username = lower(trim(NEW.username))
  ) THEN
    RAISE EXCEPTION 'Username "%" is reserved and cannot be used', NEW.username
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_reserved_username_check ON public.profiles;
CREATE TRIGGER profiles_reserved_username_check
BEFORE INSERT OR UPDATE OF username ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_reserved_username();
