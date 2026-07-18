import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// send-notification v2.4 — SELF-CONTAINED (Jul 18). Fixes: (1) email address now
// comes from auth.users via the admin API — the old shared service read
// profiles.email, a column that DOES NOT EXIST, so every email notification
// silently died; (2) a missing email is now a LOUD channel error instead of a
// silent skip; (3) an unknown `type` no longer kills the web notification —
// if the insert fails on the type value we retry once as 'system'.
// DEPLOY: Dashboard → Edge Functions → send-notification → Code →
// select-all-paste this ENTIRE file → Deploy updates. (This file has no
// _shared imports on purpose — it must survive single-file dashboard paste.)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function corsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get("origin") ?? "";
  const allowed =
    /^https:\/\/(www\.)?goldsainte\.ai$/.test(origin) ||
    /\.lovable\.app$/.test(new URL(origin || "https://goldsainte.ai").hostname) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin)
      ? origin
      : "https://goldsainte.ai";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

interface SendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  /** Free string; DB may constrain — unknown values fall back to 'system'. */
  type: string;
  priority?: "low" | "medium" | "high" | "urgent";
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
  /** "What happens next" lines for the email. Defaults per type. */
  steps?: string[];
  channels?: Partial<{ web: boolean; push: boolean; email: boolean; sms: boolean }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const r = (await req.json()) as SendNotificationRequest;
    const priority = r.priority || "medium";

    const defaults = {
      web: true,
      push: priority === "high" || priority === "urgent",
      email: priority === "high" || priority === "urgent",
      sms: priority === "urgent",
    };
    const want = { ...defaults, ...(r.channels || {}) };

    // Per-user preferences (row may not exist — treat as all-on).
    const { data: prefs } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", r.userId)
      .maybeSingle();

    const sent: string[] = [];
    const errors: { channel: string; error: string }[] = [];
    const errText = (e: unknown) =>
      e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);

    // ---- WEB (in-app bell/inbox) -------------------------------------------
    if (want.web && prefs?.web_notifications !== false) {
      // Column names verified against the live schema (Jul 17): the table
      // has `message` + `is_read` — NOT `body`/`read`/`data`, which the old
      // shared service inserted; every web notification 42703'd on those.
      const row = {
        user_id: r.userId,
        title: r.title,
        message: r.body,
        type: r.type,
        priority,
        action_url: r.actionUrl,
        entity_type: r.entityType ?? null,
        entity_id: r.entityId ?? null,
        is_read: false,
      };
      let { error } = await supabase.from("notifications").insert(row);
      if (error && /type/i.test(error.message)) {
        // A DB check rejected the type value — degrade, don't drop.
        ({ error } = await supabase.from("notifications").insert({ ...row, type: "system" }));
        if (!error) errors.push({ channel: "web", error: `type '${r.type}' rejected by DB check; delivered as 'system'` });
      }
      if (error) errors.push({ channel: "web", error: errText(error) });
      else sent.push("web");
    }

    // ---- PUSH (log-only until FCM/APNS wired) ------------------------------
    if (want.push && prefs?.push_notifications !== false) {
      try {
        const { data: tokens } = await supabase
          .from("push_tokens")
          .select("token, platform")
          .eq("user_id", r.userId)
          .eq("active", true);
        if (tokens && tokens.length > 0) {
          console.log(`[PUSH] Sending to ${tokens.length} devices for user ${r.userId}`);
          sent.push("push");
        }
      } catch (e) {
        errors.push({ channel: "push", error: errText(e) });
      }
    }

    // ---- EMAIL — direct Resend send (there is NO email_queue table; the
    // working senders in this codebase call Resend and log to email_send_log,
    // so this does the same). Address comes from auth.users. ------------------
    if (want.email && prefs?.email_notifications !== false) {
      try {
        const { data: u, error: uErr } = await supabase.auth.admin.getUserById(r.userId);
        if (uErr) throw uErr;
        const email = u?.user?.email;
        if (!email) {
          errors.push({ channel: "email", error: "no email address on auth user" });
        } else {
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (!RESEND_API_KEY) {
            errors.push({ channel: "email", error: "RESEND_API_KEY not configured" });
          } else {
            const FROM_DOMAIN = Deno.env.get("EMAIL_FROM_DOMAIN") || "goldsainte.com";
            const link = r.actionUrl
              ? (r.actionUrl.startsWith("http") ? r.actionUrl : `https://goldsainte.ai${r.actionUrl}`)
              : "https://goldsainte.ai";
            const esc = (s: string) =>
              s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
            // Canonical approved Goldsainte shell — inlined verbatim from
            // _shared/brandEmail.ts (this function must survive single-file
            // dashboard paste, so no _shared import). ONE difference: inputs
            // are escaped, because title/body carry request-provided text.
            const steps: string[] =
              Array.isArray(r.steps) && r.steps.length > 0
                ? r.steps
                : r.type === "booking"
                ? [
                    "Open the request and review the dates and scope.",
                    "Reply with your proposal \u2014 total price and terms.",
                    "They accept and pay the deposit \u2014 escrow-protected.",
                  ]
                : [];
            const stepsHtml = steps.length
              ? `<p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8D6B2F;text-align:center;margin:0 0 6px;">What happens next</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 28px;">${steps
                  .map(
                    (s, i) =>
                      `<tr><td style="font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#8a7a3f;font-size:18px;width:36px;padding:14px 14px 14px 0;vertical-align:top;border-bottom:${i === steps.length - 1 ? "0" : "1px solid rgba(10,34,37,0.08)"};">${i + 1}.</td><td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#0a2225;opacity:0.8;padding:14px 0;vertical-align:top;border-bottom:${i === steps.length - 1 ? "0" : "1px solid rgba(10,34,37,0.08)"};">${esc(s)}</td></tr>`
                  )
                  .join("")}</table>`
              : "";
            const SITE = "https://goldsainte.ai";
            const footerHtml = `<div style="background:#FDF9F0;border-top:1px solid #E5DFC6;margin-top:44px;padding:28px 12px 20px;text-align:center;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#0a2225;line-height:2.2;padding:14px 0;border-top:1px solid #E5DFC6;border-bottom:1px solid #E5DFC6;margin-bottom:14px;">
          <a href="${SITE}/marketplace" style="color:#0a2225;text-decoration:none;margin:0 8px;">Browse Trips</a>\u00b7<a href="${SITE}/agents" style="color:#0a2225;text-decoration:none;margin:0 8px;">Specialists</a>\u00b7<a href="${SITE}/about" style="color:#0a2225;text-decoration:none;margin:0 8px;">About</a>\u00b7<a href="${SITE}/help" style="color:#0a2225;text-decoration:none;margin:0 8px;">Help</a>\u00b7<a href="${SITE}/trust-safety" style="color:#0a2225;text-decoration:none;margin:0 8px;">Trust &amp; Safety</a>\u00b7<a href="${SITE}/corporate-contact" style="color:#0a2225;text-decoration:none;margin:0 8px;">Contact</a>
        </div>
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9A9079;margin-bottom:12px;">Follow&nbsp;&nbsp;<a href="https://www.linkedin.com/company/goldsainte/" style="color:#0a2225;text-decoration:none;margin:0 6px;">LinkedIn</a>\u00b7<a href="https://www.instagram.com/goldsainteai/" style="color:#0a2225;text-decoration:none;margin:0 6px;">Instagram</a></div>
        <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9A9079;line-height:1.8;margin:0 0 6px;">\u00a9 Goldsainte \u00b7 <a href="${SITE}/terms" style="color:#9A9079;text-decoration:none;">Terms</a> \u00b7 <a href="${SITE}/privacy" style="color:#9A9079;text-decoration:none;">Privacy</a></p>
        <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;margin:6px 0 0;text-transform:uppercase;">This is an automated message from Goldsainte</p>
      </div>`;
            const logoUrl =
              "https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png";
            const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#f7f3ea;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a2225;">
  <div style="width:100%;background:#f7f3ea;padding:48px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#f7f3ea;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tbody><tr>
        <td align="center" style="padding:8px 0 28px;"><img src="${logoUrl}" alt="Goldsainte" style="height:22px;width:auto;max-width:240px;display:block;margin:0 auto;"/></td>
      </tr></tbody></table>
      <hr style="border:0;border-top:1px solid rgba(10,34,37,0.15);margin:0 0 28px;"/>
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:34px;line-height:1.15;color:#0a2225;margin:0 0 14px;text-align:center;letter-spacing:-0.01em;">${esc(r.title)}</h1>
      <div style="font-size:15px;line-height:1.6;color:#0a2225;opacity:0.85;margin:0 0 32px;text-align:center;">${esc(r.body)}</div>
      ${stepsHtml}<div style="text-align:center;margin:0 0 28px;">
        <a href="${link}" style="display:inline-block;background:#0c4d47;color:#f7f3ea !important;text-decoration:none;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 40px;border-radius:2px;font-weight:500;">Open in Goldsainte</a>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#0a2225;opacity:0.55;text-align:center;margin:0 0 48px;">Or paste this link into your browser:<br/><a href="${link}" style="color:#0c4d47;word-break:break-all;text-decoration:underline;">${link}</a></p>
      <p style="font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:36px 0 0;">If you have any questions, concerns, or require assistance, please contact <a href="mailto:support@goldsainte.com" style="color:#0c4d47;">Goldsainte Support</a>.</p>
      ${footerHtml}
    </div>
  </div>
</body></html>`;
            const resp = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({ from: `Goldsainte <support@${FROM_DOMAIN}>`, to: [email], subject: r.title, html }),
            });
            const respBody = await resp.json().catch(() => ({}));
            // Best-effort send log — never fail the channel over logging.
            try {
              await supabase.from("email_send_log").insert({
                recipient_email: email,
                template_name: "notification",
                status: resp.ok ? "sent" : "failed",
                message_id: (respBody as { id?: string })?.id ?? null,
                error_message: resp.ok ? null : JSON.stringify(respBody),
                metadata: { type: r.type, actionUrl: r.actionUrl },
              });
            } catch (_) { /* logging is best-effort */ }
            if (!resp.ok) throw new Error(`Resend ${resp.status}: ${JSON.stringify(respBody)}`);
            sent.push("email");
          }
        }
      } catch (e) {
        errors.push({ channel: "email", error: errText(e) });
      }
    }

    // ---- SMS (queue; urgent only by default) -------------------------------
    if (want.sms && prefs?.sms_notifications !== false) {
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", r.userId)
          .maybeSingle();
        const phone = (prof as { phone?: string } | null)?.phone;
        if (phone) {
          const { error } = await supabase.from("sms_queue").insert({
            to_phone: phone,
            body: `${r.title}: ${r.body}`,
            priority,
          });
          if (error) throw error;
          sent.push("sms");
        }
      } catch (e) {
        errors.push({ channel: "sms", error: errText(e) });
      }
    }

    console.log(
      `[NOTIFICATION v2.4] user=${r.userId} type=${r.type} sent=[${sent.join(",")}]` +
        (errors.length ? ` errors=${JSON.stringify(errors)}` : "")
    );

    return new Response(
      JSON.stringify({ success: sent.length > 0, channels: sent, errors: errors.length ? errors : undefined }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    const msg = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 400,
    });
  }
});
