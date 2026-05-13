import "../_shared/resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

interface NotifyBody {
  tripRequestId: string;
}

interface AssignmentRow {
  assignee_profile_id: string;
  role: string;
  status: string;
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const siteUrl = Deno.env.get("SITE_URL") || "";
function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const { tripRequestId } = (await req.json()) as NotifyBody;
    if (!tripRequestId) {
      return new Response(JSON.stringify({ error: "Missing tripRequestId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(req) },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: trip } = await supabase
      .from("trip_requests")
      .select("id, destination, date_range, travelers_count, budget_range")
      .eq("id", tripRequestId)
      .maybeSingle();

    const { data: assignments, error: assignError } = await supabase
      .from("trip_assignments")
      .select("assignee_profile_id, role, status")
      .eq("trip_request_id", tripRequestId)
      .in("status", ["pending", "accepted"]);

    if (assignError) throw assignError;

    const emails: { email: string; role: string }[] = [];
    for (const assignment of (assignments as AssignmentRow[] | null) ?? []) {
      const { data: userRes } = await supabase.auth.admin.getUserById(
        assignment.assignee_profile_id
      );
      const email = userRes?.user?.email;
      if (email) {
        emails.push({ email, role: assignment.role });
      }
    }

    if (!resendApiKey || emails.length === 0) {
      console.log("send-match-notifications: skipping email send", {
        hasKey: !!resendApiKey,
        recipientCount: emails.length,
      });
      return new Response(JSON.stringify({ ok: true, recipients: emails.length }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req) },
      });
    }

    const subject = "New Goldsainte trip opportunity";
    const html = `
      <div style="font-family:Arial, sans-serif; color:#0a2225;">
        <p>You have been matched to a new trip request.</p>
        <ul>
          <li><strong>Destination:</strong> ${trip?.destination ?? "Flexible"}</li>
          <li><strong>Dates:</strong> ${trip?.date_range ?? "Flexible"}</li>
          <li><strong>Travelers:</strong> ${trip?.travelers_count ?? "Not specified"}</li>
          <li><strong>Budget:</strong> ${trip?.budget_range ?? "Not specified"}</li>
        </ul>
        <p>Sign in to review the request and accept or decline.</p>
        ${siteUrl ? `<p><a href="${siteUrl}" target="_blank" rel="noreferrer">Open Goldsainte</a></p>` : ""}
      </div>
    `;

    for (const recipient of emails) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Goldsainte Concierge <concierge@notify.goldsainte.com>",
          to: [recipient.email],
          subject,
          html,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, recipients: emails.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    });
  } catch (err) {
    console.error("send-match-notifications error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    });
  }
});
