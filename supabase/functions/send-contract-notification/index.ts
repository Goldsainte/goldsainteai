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
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${heading}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <div style="background:linear-gradient(135deg,#0a2225 0%,#0c4d47 100%);padding:40px 20px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:32px;font-weight:600;color:#BFAD72;margin-bottom:10px;">G</div>
      <h1 style="color:#E5DFC6;font-size:24px;margin:0;font-weight:400;">Goldsainte</h1>
    </div>
    <div style="padding:40px 30px;">
      <h2 style="color:#0a2225;font-family:Georgia,serif;font-size:26px;margin-bottom:20px;">${heading}</h2>
      ${bodyHtml}
      <div style="text-align:center;margin:40px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#0c4d47 0%,#BFAD72 100%);color:white;padding:16px 40px;text-decoration:none;border-radius:30px;font-weight:500;font-size:16px;">${ctaLabel} &rarr;</a>
      </div>
      <p style="color:#8D8D8D;font-size:13px;line-height:1.6;margin-top:30px;">
        Your electronic signature is legally binding and equivalent to a handwritten signature.
        If you have questions, reply to your counterparty through the Goldsainte platform.
      </p>
    </div>
    <div style="background:#f7f3ea;padding:30px;text-align:center;border-top:1px solid #E5DFC6;">
      <p style="color:#8D8D8D;font-size:12px;margin:0 0 10px 0;"><strong style="color:#0a2225;">Goldsainte AI</strong><br>Luxury Travel, Beautifully Orchestrated</p>
      <p style="color:#8D8D8D;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} Goldsainte. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
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
        emailSubject = `Fully executed — your ${destination} contract`;
        emailHeading = "Your contract is fully executed";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;">Every party has now signed the contract for <strong>${destination}</strong>. A copy is available for download on the contract page, and the trip can proceed to deposit.</p>`;
        ctaLabel = "View the executed contract";
        break;
      }
      case "revision_proposed": {
        recipients = parties.filter((p) => p.role !== actorRole);
        title = "Changes proposed to your contract";
        message = `${actorName} proposed changes to the contract for ${destination}. Review them to accept or reject.`;
        emailSubject = `Proposed changes — your ${destination} contract`;
        emailHeading = "Changes have been proposed";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;"><strong>${actorName}</strong> has proposed changes to the contract for <strong>${destination}</strong>. Open the contract to review, accept, or reject them.</p>`;
        ctaLabel = "Review proposed changes";
        break;
      }
      case "revision_accepted": {
        recipients = parties.filter((p) => p.role !== actorRole);
        title = "Proposed changes accepted";
        message = `${actorName} accepted the proposed changes to the contract for ${destination}. The contract text has been updated — every party needs to sign again.`;
        emailSubject = `Changes accepted — your ${destination} contract`;
        emailHeading = "Your proposed changes were accepted";
        emailBody = `<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;"><strong>${actorName}</strong> accepted the proposed changes to the contract for <strong>${destination}</strong>. The contract text has been updated, so every party needs to sign the revised version.</p>`;
        ctaLabel = "Review and sign";
        break;
      }
      case "revision_rejected": {
        recipients = parties.filter((p) => p.role !== actorRole);
        title = "Proposed changes declined";
        message = `${actorName} declined the proposed changes to the contract for ${destination}.${note ? ` Note: "${note}"` : ""} The current contract text stands.`;
        emailSubject = `Changes declined — your ${destination} contract`;
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
