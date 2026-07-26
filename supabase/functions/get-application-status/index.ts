import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

// ============================================================================
// get-application-status — public, read-only status lookup by application id.
//
// WHY THIS EXISTS (Jul 25): Stripe Identity is usually completed on a PHONE
// (you scan a QR code from the desktop). The phone has no Goldsainte session,
// and `agent_applications` is RLS-protected, so the verification-complete page
// queried the row, got nothing back, and told the applicant "We Couldn't
// Locate Your Application" — while the desktop, which did have a session,
// showed "Application Received" for the very same application.
//
// This returns ONLY what the status screen needs. No contact details, no
// documents, no verification report, no user_id. Lookup is by UUID (or the
// Stripe session id from the return URL), both unguessable, which is the same
// posture as get-agent-agreement.
// ============================================================================

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const { applicationId, sessionId, applicationType } = await req.json().catch(() => ({}));

    if (!applicationId && !sessionId) {
      return json(req, { error: "applicationId or sessionId is required" }, 400);
    }
    const table =
      applicationType === "brand" ? "brand_applications" : "agent_applications";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Minimal projection — deliberately excludes PII beyond a first name used
    // to greet the applicant on screen.
    const columns =
      "id, first_name, status, stripe_verification_status, stripe_verification_session_id, rejection_reason";

    let query = supabase.from(table).select(columns);
    query = applicationId
      ? query.eq("id", applicationId)
      : query.eq("stripe_verification_session_id", sessionId);

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("status lookup failed", error);
      return json(req, { error: "lookup_failed" }, 500);
    }
    if (!data) {
      return json(req, { found: false }, 200);
    }

    return json(req, { found: true, application: data }, 200);
  } catch (e) {
    console.error("get-application-status error", e);
    return json(req, { error: "unexpected_error" }, 500);
  }
});
