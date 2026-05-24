import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ALLOWED_FIELDS = new Set([
  'business_license',
  'insurance_certificate',
  'government_id',
  'headshot',
]);
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
]);
const MAX_SIZE = 50 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const userId = String(form.get('userId') ?? '');
    const applicationEmail = String(form.get('applicationEmail') ?? '').toLowerCase().trim();
    const fieldName = String(form.get('fieldName') ?? '');

    if (!file || !(file instanceof File)) {
      return json({ error: 'Missing file' }, 400);
    }
    if (!userId || !applicationEmail || !ALLOWED_FIELDS.has(fieldName)) {
      return json({ error: 'Invalid request parameters' }, 400);
    }
    if (file.size > MAX_SIZE) {
      return json({ error: `File exceeds 50MB limit` }, 400);
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return json(
        {
          error: `Unsupported file type for ${file.name}: ${file.type}. Please upload a PDF, JPG, PNG, or HEIC file.`,
        },
        400,
      );
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Authorization: verify the userId belongs to an auth user whose email
    // matches the application email submitted. This blocks writes into
    // arbitrary user folders during the unauthenticated signup window.
    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(userId);
    if (userErr || !userRes?.user) {
      return json({ error: 'User not found' }, 403);
    }
    if ((userRes.user.email ?? '').toLowerCase() !== applicationEmail) {
      return json({ error: 'Email does not match user' }, 403);
    }

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${userId}/agent-applications/${Date.now()}_${fieldName}.${ext}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from('application-documents')
      .upload(path, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (upErr) return json({ error: upErr.message }, 500);

    return json({ path }, 200);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}