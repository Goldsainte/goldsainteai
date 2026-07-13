import "../_shared/resend-guard.ts";
// Supabase Edge Function: send-contract-notification (v3, rebuilt Jul 10)
//
// Contract lifecycle notifications. Accepts two payload shapes:
//
//   A) Send flow (AgentContractBuilder):
//      { contractId, tripId, recipientEmail, recipientType: "traveler" | "creator" }
//      -> treated as event "sent". Response includes { emailDelivered } which the
//         builder checks (email is best-effort; the auto-DM is its reliable channel).
//
//   B) Lifecycle events (ContractSignPage):
//      { contractId, event: "signed" | "executed" | "revision_proposed", actorRole }
//
// Every event writes bell notifications (with action_url deep links) as the
// reliable channel, and attempts a branded email as best-effort. Email failures
// never fail the request (Resend domain may be unverified; the resend-guard
// import also drops suppressed recipients for compliance).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

type PartyRole = "traveler" | "agent" | "creator";
type LifecycleEvent = "sent" | "signed" | "executed" | "revision_proposed" | "revision_accepted" | "revision_rejected";

interface Party {
  role: PartyRole;
  userId: string;
  name: string;
  email: string | null;
  signLink: string;
}

const APP_URL = Deno.env.get("APP_URL") || "https://goldsainte.ai";

// ---------------------------------------------------------------------------
// Branded email shell (best-effort; failures are logged, never thrown)
// ---------------------------------------------------------------------------
function emailShell(heading: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  // Matches the approved Goldsainte layout (_shared/email-templates/_layout.tsx):
  // cream background, wordmark, Playfair serif headline, dark-green uppercase
  // CTA, fallback link, help footer.
  const logoUrl =
    "https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png";
  return `<!DOCTYPE html>
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
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:34px;line-height:1.15;color:#0a2225;margin:0 0 14px;text-align:center;letter-spacing:-0.01em;">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#0a2225;opacity:0.85;margin:0 0 32px;text-align:center;">${bodyHtml}</div>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#0c4d47;color:#f7f3ea !important;text-decoration:none;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 40px;border-radius:2px;font-weight:500;">${ctaLabel}</a>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#0a2225;opacity:0.55;text-align:center;margin:0 0 48px;">Or paste this link into your browser:<br/><a href="${ctaUrl}" style="color:#0c4d47;word-break:break-all;text-decoration:underline;">${ctaUrl}</a></p>
      <p style="font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:36px 0 0;">If you have any questions, concerns, or require assistance, please contact <a href="mailto:support@goldsainte.com" style="color:#0c4d47;">Goldsainte Support</a>.</p>
      <p style="font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;text-align:center;text-transform:uppercase;padding:8px 0 0;">This is an automated message from Goldsainte</p>
    </div>
  </div>
</body></html>`;
}

async function sendBrandedEmail(
  to: string,
  subject: string,
  heading: string,
  bodyHtml: string,
  ctaLabel: string,
  ctaUrl: string,
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — email skipped for:", to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte Contracts <hello@goldsainte.com>",
        to,
        subject,
        html: emailShell(heading, bodyHtml, ctaLabel, ctaUrl),
      }),
    });
    if (!res.ok) {
      console.error("Email soft-failed:", res.status, await res.text());
      return false;
    }
    console.log("Email delivered to:", to);
    return true;
  } catch (e) {
    console.error("Email soft-failed:", e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const body = await req.json();
    const contractId: string | undefined = body.contractId;
    const event: LifecycleEvent = body.event ?? "sent";
    const actorRole: PartyRole | undefined = body.actorRole;
    // Optional free-text note (e.g. the rejection message) — escaped before use in HTML.
    const rawNote: string = typeof body.note === "string" ? body.note : "";
    const note = rawNote.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
    const recipientEmailOverride: string | undefined = body.recipientEmail;
    const recipientType: PartyRole = body.recipientType ?? "traveler";

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: contractId" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Load the contract with its trip
    const { data: contract, error: contractError } = await supabase
      .from("trip_contracts")
      .select("*, trips(id, destination, start_date, end_date)")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      console.error("Contract not found:", contractError);
      return new Response(
        JSON.stringify({ error: `Contract not found: ${contractError?.message ?? contractId}` }),
        { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Resolve all parties on the contract
    const partyIds = [contract.agent_id, contract.traveler_id, contract.creator_id]
      .filter(Boolean) as string[];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", partyIds);
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const travelerInfoName = [contract.traveler_info?.firstName, contract.traveler_info?.lastName]
      .filter(Boolean).join(" ");

    function makeParty(role: PartyRole, userId: string | null): Party | null {
      if (!userId) return null;
      const p: any = byId.get(userId);
      const fallback = role === "traveler" && travelerInfoName
        ? travelerInfoName
        : role.charAt(0).toUpperCase() + role.slice(1);
      return {
        role,
        userId,
        name: p?.full_name || fallback,
        email: p?.email ?? null,
        signLink: `${APP_URL}/contract/${contractId}/sign?type=${role}`,
      };
    }

    const parties: Party[] = [
      makeParty("agent", contract.agent_id),
      makeParty("traveler", contract.traveler_id),
      makeParty("creator", contract.creator_id),
    ].filter(Boolean) as Party[];

    const destination: string =
      contract.trips?.destination || contract.trip_info?.destination || "your trip";
    const agentName = parties.find((p) => p.role === "agent")?.name ?? "Your travel agent";
    const actor = actorRole ? parties.find((p) => p.role === actorRole) : undefined;
    const actorName = actor?.name ?? (actorRole ? actorRole : "A party");
    // Subject-safe destination: avoids "your your trip contract" when the
    // destination falls back to the phrase "your trip".
    const destinationLabel = destination === "your trip" ? "trip" : destination;

    // Decide recipients + copy per event
    let recipients: Party[];
    let title: string;
    let message: string;
    let emailSubject: string;
    let emailHeading: string;
    let emailBody: string;
    let ctaLabel: string;

    switch (event) {
      case "sent": {
        recipients = parties.filter((p) => p.role === recipientType);
        title = "Contract ready for your signature";
        message = `${agentName} has prepared your trip contract for ${destination}. Review and sign to move forward.`;
        emailSubject = `Your Goldsainte trip contract — ${destination}`;
        emailHeading = "Review & sign your trip contract";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;">${agentName} has prepared a service agreement for your upcoming trip to <strong>${destination}</strong>. Please review it carefully — it covers payment terms, cancellation policies, and each party's responsibilities.</p>`;
        ctaLabel = "Review & sign contract";
        break;
      }
      case "signed": {
        recipients = parties.filter((p) => p.role !== actorRole);
        title = `${actorName} signed the contract`;
        message = `${actorName} has signed the contract for ${destination}. Open it to review and add your signature.`;
        emailSubject = `${actorName} signed — your signature is next`;
        emailHeading = "A signature has been added";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;"><strong>${actorName}</strong> has signed the contract for <strong>${destination}</strong>. Once every party has signed, the contract is fully executed and the trip can proceed to deposit.</p>`;
        ctaLabel = "Review the contract";
        break;
      }
      case "executed": {
        recipients = parties; // everyone, including the final signer
        title = "Contract fully executed";
        message = `All parties have signed the contract for ${destination}. The trip can now proceed to deposit.`;
        emailSubject = `Fully executed — your ${destinationLabel} contract`;
        emailHeading = "Your contract is fully executed";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;">Every party has now signed the contract for <strong>${destination}</strong>. A copy is available for download on the contract page, and the trip can proceed to deposit.</p>`;
        ctaLabel = "View the executed contract";
        break;
      }
      case "revision_proposed": {
        recipients = parties.filter((p) => p.role !== actorRole);
        title = "Changes proposed to your contract";
        message = `${actorName} proposed changes to the contract for ${destination}. Review them to accept or reject.`;
        emailSubject = `Proposed changes — your ${destinationLabel} contract`;
        emailHeading = "Changes have been proposed";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;"><strong>${actorName}</strong> has proposed changes to the contract for <strong>${destination}</strong>. Open the contract to review, accept, or reject them.</p>`;
        ctaLabel = "Review proposed changes";
        break;
      }
      case "revision_accepted": {
        recipients = parties.filter((p) => p.role !== actorRole);
        title = "Proposed changes accepted";
        message = `${actorName} accepted the proposed changes to the contract for ${destination}. The contract text has been updated — every party needs to sign again.`;
        emailSubject = `Changes accepted — your ${destinationLabel} contract`;
        emailHeading = "Your proposed changes were accepted";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;"><strong>${actorName}</strong> accepted the proposed changes to the contract for <strong>${destination}</strong>. The contract text has been updated, so every party needs to sign the revised version.</p>`;
        ctaLabel = "Review and sign";
        break;
      }
      case "revision_rejected": {
        recipients = parties.filter((p) => p.role !== actorRole);
        title = "Proposed changes declined";
        message = `${actorName} declined the proposed changes to the contract for ${destination}.${note ? ` Note: "${note}"` : ""} The current contract text stands.`;
        emailSubject = `Changes declined — your ${destinationLabel} contract`;
        emailHeading = "Proposed changes were declined";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;"><strong>${actorName}</strong> declined the proposed changes to the contract for <strong>${destination}</strong>.${note ? ` They added a note: &ldquo;${note}&rdquo;.` : ""} The current contract text stands — you can review it or propose different changes.</p>`;
        ctaLabel = "View the contract";
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown event: ${event}` }),
          { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
        );
    }

    if (!recipients.length) {
      return new Response(
        JSON.stringify({ error: `No recipients resolved for event "${event}" on this contract` }),
        { status: 422, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Bell notifications — the reliable channel
    let bellDelivered = 0;
    for (const r of recipients) {
      const { error: bellError } = await supabase.from("notifications").insert({
        user_id: r.userId,
        type: "system_announcement",
        title,
        message,
        action_url: r.signLink,
        entity_type: "trip_contract",
        entity_id: contractId,
      });
      if (bellError) console.error(`Bell failed for ${r.role}:`, bellError.message);
      else bellDelivered++;
    }

    // Emails — best-effort
    let emailDelivered = false;
    for (const r of recipients) {
      const to = (event === "sent" && r.role === recipientType && recipientEmailOverride)
        ? recipientEmailOverride
        : r.email;
      if (!to) continue;
      const ok = await sendBrandedEmail(to, emailSubject, emailHeading, emailBody, ctaLabel, r.signLink);
      emailDelivered = emailDelivered || ok;
    }

    return new Response(
      JSON.stringify({
        success: true,
        event,
        bellDelivered,
        emailDelivered,
        signingLink: recipients[0].signLink,
        message: `Notified ${bellDelivered}/${recipients.length} by bell; email ${emailDelivered ? "delivered" : "soft-failed or skipped"}.`,
      }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("send-contract-notification error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to send contract notification" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
