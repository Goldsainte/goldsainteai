import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";
import { RecoveryEmail } from "../_shared/email-templates/recovery.tsx";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE_NAME = "Goldsainte";
const SENDER_DOMAIN = "goldsainte.com";
const PASSWORD_RESET_SENDER = `${SITE_NAME} <hello@${SENDER_DOMAIN}>`;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in Edge Function env");
    return new Response(
      JSON.stringify({ error: "Auth service is not configured correctly." }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  try {
    const { email, redirectTo } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log("✅ Environment OK. Generating password reset link for:", email);

    // Generate recovery link using Supabase Admin API
    const generateLinkResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/generate_link`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "recovery",
          email: email,
          options: {
            redirect_to: redirectTo || 'https://goldsainte.ai/reset-password',
          },
        }),
      }
    );

    if (!generateLinkResponse.ok) {
      const errorData = await generateLinkResponse.json().catch(() => null);
      // Silent success for unknown/unregistered emails to prevent enumeration.
      // GoTrue returns 404 with error_code "user_not_found" when no auth.users row exists.
      const isUserNotFound =
        generateLinkResponse.status === 404 ||
        errorData?.error_code === "user_not_found" ||
        errorData?.code === "user_not_found" ||
        /user.*not.*found/i.test(errorData?.message || "");

      if (isUserNotFound) {
        console.log("ℹ️ Password reset requested for unknown email, returning silent success:", email);
        await supabase.from('email_send_log').insert({
          message_id: crypto.randomUUID(),
          template_name: 'recovery',
          recipient_email: email,
          status: 'skipped_user_not_found',
        });
        return new Response(
          JSON.stringify({ success: true, message: "Password reset email sent" }),
          { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      console.error("❌ Failed to generate recovery link:", errorData || generateLinkResponse.statusText);
      throw new Error(
        errorData?.message || `Failed to generate recovery link (status ${generateLinkResponse.status})`
      );
    }

    const { action_link } = await generateLinkResponse.json();
    const actionUrl = new URL(action_link);
    const tokenHash = actionUrl.searchParams.get('token');
    const recoveryType = actionUrl.searchParams.get('type') || 'recovery';

    if (!tokenHash) {
      throw new Error('Failed to generate a valid recovery token');
    }

    const appResetUrl = new URL(redirectTo || 'https://goldsainte.ai/reset-password');
    appResetUrl.searchParams.set('token_hash', tokenHash);
    appResetUrl.searchParams.set('type', recoveryType);

    console.log("Recovery link generated successfully");

    const emailHtml = await renderAsync(
      React.createElement(RecoveryEmail, {
        siteName: SITE_NAME,
        confirmationUrl: appResetUrl.toString(),
      })
    );
    const emailText = await renderAsync(
      React.createElement(RecoveryEmail, {
        siteName: SITE_NAME,
        confirmationUrl: appResetUrl.toString(),
      }),
      { plainText: true }
    );

    const messageId = crypto.randomUUID();
    const idempotencyKey = `password-reset-${messageId}`;
    const normalizedEmail = email.trim().toLowerCase();
    let unsubscribeToken = generateToken();

    const { data: existingToken, error: tokenLookupError } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (tokenLookupError) {
      throw new Error('Failed to prepare password reset email');
    }

    if (existingToken?.token) {
      unsubscribeToken = existingToken.token;
    } else {
      const { error: tokenInsertError } = await supabase
        .from('email_unsubscribe_tokens')
        .upsert({ email: normalizedEmail, token: unsubscribeToken }, { onConflict: 'email' });

      if (tokenInsertError) {
        throw new Error('Failed to prepare password reset email');
      }
    }

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'recovery',
      recipient_email: email,
      status: 'pending',
    });

    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: email,
        from: PASSWORD_RESET_SENDER,
        sender_domain: SENDER_DOMAIN,
        subject: 'Reset your Goldsainte password',
        html: emailHtml,
        text: emailText,
        purpose: 'transactional',
        label: 'recovery',
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error('❌ Failed to enqueue password reset email:', enqueueError);
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'recovery',
        recipient_email: email,
        status: 'failed',
        error_message: 'Failed to enqueue recovery email',
      });
      throw new Error('Failed to queue password reset email');
    }

    console.log('Password reset email queued successfully:', { email, messageId });

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
