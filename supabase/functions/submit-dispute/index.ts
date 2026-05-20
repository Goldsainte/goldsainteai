import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_DISPUTE_INBOX = Deno.env.get("ADMIN_DISPUTE_INBOX") || "legal@goldsainte.com";

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

interface DisputeBody {
  name: string;
  email: string;
  phone?: string | null;
  bookingReference?: string | null;
  disputeType: "informal" | "mediation" | "arbitration" | "other";
  description: string;
  preferredContactMethod?: string;
}

function validate(body: any): { ok: true; data: DisputeBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid payload" };
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const description = String(body.description || "").trim();
  const disputeType = String(body.disputeType || "").trim();
  if (name.length < 2 || name.length > 200) return { ok: false, error: "Invalid name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Invalid email" };
  if (description.length < 20 || description.length > 5000) return { ok: false, error: "Description must be 20–5000 characters" };
  if (!["informal", "mediation", "arbitration", "other"].includes(disputeType)) return { ok: false, error: "Invalid disputeType" };
  return {
    ok: true,
    data: {
      name,
      email,
      phone: body.phone ? String(body.phone).slice(0, 50) : null,
      bookingReference: body.bookingReference ? String(body.bookingReference).slice(0, 200) : null,
      disputeType: disputeType as DisputeBody["disputeType"],
      description,
      preferredContactMethod: body.preferredContactMethod ? String(body.preferredContactMethod).slice(0, 50) : "email",
    },
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const parsed = validate(body);
  if (!parsed.ok) {
    return new Response(JSON.stringify({ error: parsed.error }), {
      status: 400,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
  const data = parsed.data;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Best-effort: associate to logged-in user if a JWT was passed
  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const { data: u } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = u?.user?.id ?? null;
    } catch { /* ignore */ }
  }

  const { data: inserted, error: insertError } = await admin
    .from("dispute_submissions")
    .insert({
      user_id: userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      booking_reference: data.bookingReference,
      dispute_type: data.disputeType,
      description: data.description,
      preferred_contact_method: data.preferredContactMethod,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("submit-dispute insert failed", insertError);
    return new Response(JSON.stringify({ error: "Failed to submit dispute" }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const disputeId = inserted!.id as string;

  // Fire-and-forget: confirmation email to user + admin notification.
  // Both use the existing send-transactional-email function.
  const sendEmail = (payload: Record<string, unknown>) =>
    fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    }).catch((e) => console.error("email dispatch failed", e));

  // Use the existing 'dispute-opened' template for both parties.
  await Promise.allSettled([
    sendEmail({
      templateName: "dispute-opened",
      recipientEmail: data.email,
      templateData: {
        disputeId,
        disputeOpenedBy: data.name,
        tripName: data.bookingReference || "your booking",
      },
    }),
    sendEmail({
      templateName: "dispute-opened",
      recipientEmail: ADMIN_DISPUTE_INBOX,
      templateData: {
        disputeId,
        disputeOpenedBy: `${data.name} <${data.email}>`,
        tripName: data.bookingReference || "(no booking reference)",
      },
    }),
  ]);

  return new Response(JSON.stringify({ ok: true, id: disputeId }), {
    status: 200,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
});