-- Content translation cache (messaging translation, phase 1 backend).
--
-- Content-addressed: keyed by SHA-256 of the source text, not by message id,
-- so one cache serves marketplace_messages, conversation_messages,
-- trip_messages, trip_request_messages — and, later, listing content —
-- and identical texts are translated at most once per target language, ever.
--
-- Writes happen ONLY through the translate-content edge function (service
-- role, which bypasses RLS). Authenticated users may read.

CREATE TABLE IF NOT EXISTS public.content_translations (
  source_hash      text        NOT NULL,
  target_lang      text        NOT NULL,
  source_lang      text,
  translated_text  text        NOT NULL,
  char_count       integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_hash, target_lang)
);

COMMENT ON TABLE public.content_translations IS
  'Permanent machine-translation cache, keyed by sha256(source text) + target language. Written only by the translate-content edge function.';

CREATE INDEX IF NOT EXISTS idx_content_translations_created_at
  ON public.content_translations (created_at);

ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

-- Signed-in users can read cached translations directly if ever needed;
-- normal reads still flow through the edge function.
DROP POLICY IF EXISTS "content_translations_select_authenticated" ON public.content_translations;
CREATE POLICY "content_translations_select_authenticated"
  ON public.content_translations
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies: only the service role (edge function)
-- writes, and service role bypasses RLS by design.
