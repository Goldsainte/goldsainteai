// ============================================================================
// advance-booking-stage v1.0 (2026-07-21)
// Lets the ASSIGNED partner (creator OR agent) advance a booking through the
// WORK phase of its journey — timeline steps 4, 5, 6 — and notifies the
// traveler (in-app bell + email) on every advance.
//
// This function NEVER touches money. It writes only trip_bookings.fulfillment_
// stage (0..3). Payment status (confirmed / paid_in_full / completed) and all
// escrow/Stripe logic are entirely separate and untouched.
//
// Guarantees:
//   • Auth: caller must be the booking's partner_id (verified from their JWT).
//   • Forward-only: the new stage must be strictly greater than the current one
//     (the DB also enforces this via trigger — this is the friendly-error layer).
//   • Notification: on success we call send-notification, which fires the
//     traveler's in-app bell AND email (respecting their preferences). The
//     copy is persona-aware so a photographer's traveler reads "gallery" while
//     a trip specialist's traveler reads "journey".
//
// Request body: { tripBookingId: string, toStage: 1 | 2 | 3 }
//
// DEPLOY: via the "Deploy Supabase Backend" GitHub workflow (supabase functions
// deploy). Uses _shared/cors.ts, which the workflow deploys alongside it.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

interface RequestBody {
  tripBookingId: string;
  toStage: number; // 1, 2, or 3
}

// ---------------------------------------------------------------------------
// Persona → traveler-facing labels for the notification copy ONLY. The visual
// timeline on the pages is still driven by src/lib/bookingDeliverables.ts; this
// compact mirror exists so the bell/email wording matches the booking's nature.
// Keep the wording here roughly in sync with the traveler journey table.
//   index 0 => stage 1 (step 4), index 1 => stage 2 (step 5), index 2 => stage 3 (step 6)
// ---------------------------------------------------------------------------
type Persona = "creative" | "family" | "trip" | "generic";

function personaFromCapabilities(caps: string[]): Persona {
  const c = (caps ?? []).filter(Boolean);
  if (c.length === 0) return "generic";
  if (c.some((x) => x === "photography" || x === "content")) return "creative";
  if (c.some((x) => x === "family")) return "family";
  return "trip";
}

// Traveler-facing headline per persona per stage (1..3).
const STAGE_HEADLINE: Record<Persona, [string, string, string]> = {
  creative: [
    "Your shoot has begun",
    "Your gallery is being edited",
    "Your gallery has been delivered",
  ],
  family: [
    "Your support has begun",
    "Your trip is underway",
    "Your trip is complete",
  ],
  trip: [
    "Your specialist is designing your days",
    "Your journey is underway",
    "Your journey is complete",
  ],
  generic: [
    "Your specialist is putting your trip together",
    "Your journey is underway",
    "Your journey is complete",
  ],
};

// A short "what this means" line for the email body per persona per stage.
const STAGE_DETAIL: Record<Persona, [string, string, string]> = {
  creative: [
    "Your photographer has started capturing your moments. Previews may appear in your booking Messages as sessions happen.",
    "Your sessions are wrapped and your images are being selected and finished.",
    "Your gallery is ready. Open your booking to view everything, and close it out once you're happy.",
  ],
  family: [
    "Your support is now underway for your trip.",
    "Your trip is in progress — your specialist is a message away throughout.",
    "Everything's wrapped up. Open your booking to confirm and close it out.",
  ],
  trip: [
    "Your specialist has started building your itinerary. Reservations and details will appear in your booking as they're confirmed.",
    "Your trip is underway — your specialist is a message away throughout.",
    "Your journey is complete. Open your booking to confirm and close it out.",
  ],
  generic: [
    "Your specialist has started putting your trip together. Details will appear in your booking as they're confirmed.",
    "Your trip is underway — your specialist is a message away throughout.",
    "Your journey is complete. Open your booking to confirm and close it out.",
  ],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- Authenticate the caller from their JWT ---------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(req, { error: "Not authenticated." }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return json(req, { error: "Not authenticated." }, 401);
    }

    // --- Parse + validate the request -------------------------------------
    const body = (await req.json()) as RequestBody;
    const bookingId = body?.tripBookingId;
    const toStage = Number(body?.toStage);
    if (!bookingId) {
      return json(req, { error: "tripBookingId is required." }, 400);
    }
    if (![1, 2, 3].includes(toStage)) {
      return json(req, { error: "toStage must be 1, 2, or 3." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // --- Load the booking (service role; we do our own authz) -------------
    const { data: booking, error: bErr } = await admin
      .from("trip_bookings")
      .select(
        "id, partner_id, traveler_id, proposal_id, fulfillment_stage, metadata"
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!booking) {
      return json(req, { error: "Booking not found." }, 404);
    }

    // --- Authorize: only the assigned partner may advance -----------------
    if (!booking.partner_id || booking.partner_id !== user.id) {
      return json(
        req,
        { error: "Only the assigned specialist can update this booking's progress." },
        403
      );
    }

    // --- Forward-only guard (friendly layer over the DB trigger) ----------
    const current = Number(booking.fulfillment_stage ?? 0);
    if (toStage <= current) {
      return json(
        req,
        {
          error:
            toStage === current
              ? "This step is already marked done."
              : "Progress can only move forward — an earlier step can't be un-done.",
          currentStage: current,
        },
        409
      );
    }

    // --- Resolve the booking's persona for notification copy --------------
    let capabilities: string[] = [];
    try {
      const pid = (booking as any)?.proposal_id;
      if (pid) {
        const { data: pr } = await admin
          .from("trip_proposals")
          .select("trip_request_id")
          .eq("id", pid)
          .maybeSingle();
        const reqId = (pr as any)?.trip_request_id;
        if (reqId) {
          const { data: tr } = await admin
            .from("trip_requests")
            .select("source_metadata")
            .eq("id", reqId)
            .maybeSingle();
          const caps = (tr as any)?.source_metadata?.hire_capabilities;
          if (Array.isArray(caps)) {
            capabilities = caps.filter((c: any) => typeof c === "string");
          }
        }
      }
    } catch (_e) {
      // Persona is presentational for the notification only — never fatal.
    }
    const persona = personaFromCapabilities(capabilities);

    // --- Perform the update (single field; trigger enforces forward-only) -
    const { error: updErr } = await admin
      .from("trip_bookings")
      .update({ fulfillment_stage: toStage })
      .eq("id", bookingId);
    if (updErr) throw updErr;

    // --- Notify the traveler: in-app bell + email via send-notification ---
    // Non-fatal: the stage advance already succeeded; a notification failure
    // must not fail the request. We surface any channel errors for logging.
    const idx = (toStage - 1) as 0 | 1 | 2;
    const title = STAGE_HEADLINE[persona][idx];
    const detail = STAGE_DETAIL[persona][idx];
    let notify: { ok: boolean; errors?: unknown } = { ok: true };
    try {
      const { data: nr, error: ne } = await admin.functions.invoke(
        "send-notification",
        {
          body: {
            userId: booking.traveler_id,
            title,
            body: detail,
            type: "booking",
            // High priority => email + bell by default in send-notification.
            priority: "high",
            actionUrl: `/bookings/${bookingId}`,
            entityType: "trip_booking",
            entityId: bookingId,
            channels: { web: true, email: true },
          },
        }
      );
      if (ne) notify = { ok: false, errors: ne.message };
      else if ((nr as any)?.errors) notify = { ok: true, errors: (nr as any).errors };
    } catch (e) {
      notify = { ok: false, errors: e instanceof Error ? e.message : String(e) };
    }

    return json(req, {
      success: true,
      bookingId,
      fulfillmentStage: toStage,
      notified: notify.ok,
      notifyErrors: notify.errors ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(req, { error: msg || "Could not update booking progress." }, 500);
  }
});
