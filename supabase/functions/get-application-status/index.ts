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
    const { applicationId, sessionId, applicationType, self } = await req.json().catch(() => ({}));

    // SELF MODE (Jul 26). The /application/status page runs with the user's
    // SESSION, but agent_applications RLS only exposes rows where
    // user_id = auth.uid(). Provisioning links the application to the
    // provisioned account, which is not necessarily the account the person is
    // signed in with (Andre: signed in as his original account, application
    // linked to the newly provisioned one) — so the page said "We couldn't
    // find an application linked to your account" about an application that
    // plainly exists. In self mode we verify the caller's JWT and look their
    // application up BY THE VERIFIED EMAIL with the service role. No email is
    // accepted from the request body, so this can't be used to probe other
    // people's applications.
    let selfEmail: string | null = null;
    if (self) {
      const authHeader = req.headers.get("Authorization") || "";
      const jwt = authHeader.replace(/^Bearer\s+/i, "");
      if (!jwt) return json(req, { error: "auth_required" }, 401);
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
      if (userErr || !userData?.user?.email) {
        return json(req, { error: "auth_required" }, 401);
      }
      selfEmail = userData.user.email.toLowerCase().trim();
    }

    if (!applicationId && !sessionId && !selfEmail) {
      return json(req, { error: "applicationId, sessionId, or self is required" }, 400);
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
      "id, first_name, status, stripe_verification_status, stripe_verification_session_id, rejection_reason, created_at";

    let query = supabase.from(table).select(columns);
    if (applicationId) {
      query = query.eq("id", applicationId);
    } else if (sessionId) {
      query = query.eq("stripe_verification_session_id", sessionId);
    } else {
      const emailColumn = table === "brand_applications" ? "primary_contact_email" : "email";
      query = query
        .eq(emailColumn, selfEmail!)
        .order("created_at", { ascending: false })
        .limit(1);
    }

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
