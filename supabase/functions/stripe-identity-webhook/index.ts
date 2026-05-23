import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.11.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { sendVerificationFailedEmail } from "../_shared/email-service.ts";
import { createAgentAccountFromApplication } from "../_shared/createAgentAccount.ts";

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET_IDENTITY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// TYPES
// ============================================================================

interface VerificationSession {
  id: string;
  status: string;
  type: string;
  livemode: boolean;
  metadata: {
    email?: string;
    applicationType?: string;
    applicationId?: string;
  };
  verified_outputs?: {
    first_name?: string;
    last_name?: string;
    dob?: {
      day: number;
      month: number;
      year: number;
    };
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
    id_number?: string;
  };
  last_error?: {
    code?: string;
    reason?: string;
  };
  client_secret?: string;
  url?: string;
}

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

const createLogger = (requestId: string): Logger => {
  const log = (level: string, message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      requestId,
      message,
      ...(data && { data }),
    };
    console.log(JSON.stringify(logEntry));
  };

  return {
    info: (message: string, data?: any) => log("INFO", message, data),
    warn: (message: string, data?: any) => log("WARN", message, data),
    error: (message: string, data?: any) => log("ERROR", message, data),
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if webhook event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found, which is expected for new events
    throw error;
  }

  return !!data;
}

/**
 * Record webhook event for idempotency tracking
 */
async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  payload: any,
  processingDuration: number,
  errorMessage?: string
): Promise<void> {
  const { error } = await supabaseClient.from("webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    event_source: "stripe_identity",
    payload,
    processing_duration_ms: processingDuration,
    error_message: errorMessage || null,
    processed_at: new Date().toISOString(),
  });

  if (error) {
    // If duplicate key error (event already processed by another instance), silently ignore
    if (error.code === "23505") {
      return;
    }
    throw error;
  }
}

/**
 * Log audit event
 */
async function logAuditEvent(
  applicationId: string,
  applicationType: "agent" | "brand",
  action: string,
  details: any
): Promise<void> {
  await supabaseClient.from("application_audit_log").insert({
    application_id: applicationId,
    application_type: applicationType,
    action,
    actor_type: "webhook",
    details,
    created_at: new Date().toISOString(),
  });
}

/**
 * Send notification to applicant
 */
async function sendApplicantNotification(
  email: string,
  name: string,
  status: "verified" | "failed",
  applicationType: "agent" | "brand",
  reason?: string
): Promise<void> {
  try {
    if (status === "failed") {
      await sendVerificationFailedEmail(email, name, applicationType, reason);
    }
    // For verified status, admin will send welcome email after approval
  } catch (error: any) {
    console.error("Failed to send notification email:", error);
    // Don't throw - notification failure shouldn't block webhook processing
  }
}

/**
 * Send notification to admin team
 */
async function sendAdminNotification(
  applicationId: string,
  applicationType: "agent" | "brand",
  applicantName: string,
  email: string
): Promise<void> {
  // Get all admin users
  const { data: admins, error } = await supabaseClient
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "admin");

  if (error) {
    console.error("Failed to fetch admin users:", error);
    return;
  }

  const adminEmails = admins?.map((admin) => admin.email).filter(Boolean) || [];

  if (adminEmails.length === 0) {
    console.warn("No admin users found to notify");
    return;
  }

  const subject = `🔔 New ${applicationType === "agent" ? "Agent" : "Brand"} Application Ready for Review`;
  const message = `
    A new ${applicationType} application has been verified and is ready for review.
    
    Applicant: ${applicantName}
    Email: ${email}
    Application ID: ${applicationId}
    
    Please review the application in the admin dashboard.
  `;

  console.log(
    JSON.stringify({
      action: "send_admin_notification",
      to: adminEmails,
      subject,
      message,
      applicationId,
      applicationType,
    })
  );

  // TODO: Implement actual email sending
  // await sendEmail({ to: adminEmails, subject, body: message });

  // Also create in-app notifications
  const notifications = admins.map((admin) => ({
    user_id: admin.id,
    type: "application_update",
    title: `New ${applicationType === "agent" ? "Agent" : "Brand"} Application`,
    message: `${applicantName} has completed identity verification. Review pending.`,
    entity_type: `${applicationType}_application`,
    entity_id: applicationId,
    action_url: `/admin/applications/${applicationType}s/${applicationId}`,
    action_label: "Review Application",
    priority: "high",
    created_at: new Date().toISOString(),
  }));

  await supabaseClient.from("notifications").insert(notifications);
}

/**
 * Update agent application status after verification
 */
async function updateAgentApplication(
  sessionId: string,
  verificationSession: VerificationSession,
  logger: Logger
): Promise<void> {
  const { status, verified_outputs, last_error, metadata } =
    verificationSession;

  // Find application by Stripe session ID
  const { data: application, error: fetchError } = await supabaseClient
    .from("agent_applications")
    .select("*")
    .eq("stripe_verification_session_id", sessionId)
    .single();

  if (fetchError || !application) {
    logger.error("Agent application not found", {
      sessionId,
      error: fetchError,
    });
    throw new Error(`Agent application not found for session ${sessionId}`);
  }

  logger.info("Found agent application", { applicationId: application.id });

  // Determine new status
  let newStatus: string;
  const verificationReport: any = {
    stripe_session_id: sessionId,
    verified_at: new Date().toISOString(),
    verification_status: status,
    verified_outputs,
    last_error,
  };

  if (status === "verified") {
    newStatus = "verified";
    logger.info("Verification successful", {
      applicationId: application.id,
    });

    // Update application
    const { error: updateError } = await supabaseClient
      .from("agent_applications")
      .update({
        status: newStatus,
        stripe_verification_status: status,
        stripe_verified_at: new Date().toISOString(),
        stripe_verification_report: verificationReport,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateError) {
      logger.error("Failed to update agent application", {
        error: updateError,
      });
      throw updateError;
    }

    // Log audit event
    await logAuditEvent(
      application.id,
      "agent",
      "identity_verified",
      verificationReport
    );

    // Auto-provision the live agent account. No admin in the loop.
    // Failures are surfaced via application_audit_log
    // (action='account_provision_failed') so an admin can re-run via
    // approve-application if needed.
    const provisionResult = await createAgentAccountFromApplication(
      application.id,
      { logger },
    );
    if (!provisionResult.success) {
      logger.error("Auto-provisioning failed after verification", {
        applicationId: application.id,
        error: provisionResult.error,
      });
      // Don't throw — application is still marked verified. Admin can
      // re-run approve-application to retry provisioning.
    } else {
      logger.info("Agent account auto-provisioned", {
        applicationId: application.id,
        userId: provisionResult.userId,
        alreadyExists: provisionResult.alreadyExists,
      });
    }

    // Fire post-verification "Welcome — Specialist" email via fanout
    try {
      await supabaseClient.functions.invoke('email-fanout', {
        body: { event: 'agent_application.identity_verified', record: application },
      });
    } catch (e) {
      logger.warn('Failed to dispatch welcome-pro fanout (agent)', { error: String(e) });
    }

    logger.info("Agent application updated to verified", {
      applicationId: application.id,
    });
  } else if (
    status === "requires_input" ||
    status === "processing" ||
    status === "canceled"
  ) {
    newStatus = "failed";
    logger.warn("Verification failed or requires input", {
      applicationId: application.id,
      status,
      lastError: last_error,
    });

    // Update application
    const { error: updateError } = await supabaseClient
      .from("agent_applications")
      .update({
        status: newStatus,
        stripe_verification_status: status,
        stripe_verification_report: verificationReport,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateError) {
      logger.error("Failed to update agent application", {
        error: updateError,
      });
      throw updateError;
    }

    // Log audit event
    await logAuditEvent(application.id, "agent", "identity_failed", {
      reason: last_error?.reason || "Unknown",
      code: last_error?.code || "Unknown",
      status,
    });

    // Send failure notification
    await sendApplicantNotification(
      application.email,
      `${application.first_name} ${application.last_name}`,
      "failed",
      "agent",
      last_error?.reason
    );

    logger.info("Agent application updated to failed", {
      applicationId: application.id,
      reason: last_error?.reason,
    });
  }
}

/**
 * Update brand application status after verification
 */
async function updateBrandApplication(
  sessionId: string,
  verificationSession: VerificationSession,
  logger: Logger
): Promise<void> {
  const { status, verified_outputs, last_error, metadata } =
    verificationSession;

  // Find application by Stripe session ID
  const { data: application, error: fetchError } = await supabaseClient
    .from("brand_applications")
    .select("*")
    .eq("stripe_verification_session_id", sessionId)
    .single();

  if (fetchError || !application) {
    logger.error("Brand application not found", {
      sessionId,
      error: fetchError,
    });
    throw new Error(`Brand application not found for session ${sessionId}`);
  }

  logger.info("Found brand application", { applicationId: application.id });

  // Determine new status
  let newStatus: string;
  const verificationReport: any = {
    stripe_session_id: sessionId,
    verified_at: new Date().toISOString(),
    verification_status: status,
    verified_outputs,
    last_error,
  };

  if (status === "verified") {
    newStatus = "verified";
    logger.info("Verification successful", {
      applicationId: application.id,
    });

    // Update application
    const { error: updateError } = await supabaseClient
      .from("brand_applications")
      .update({
        status: newStatus,
        stripe_verification_status: status,
        stripe_verified_at: new Date().toISOString(),
        stripe_verification_report: verificationReport,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateError) {
      logger.error("Failed to update brand application", {
        error: updateError,
      });
      throw updateError;
    }

    // Log audit event
    await logAuditEvent(
      application.id,
      "brand",
      "identity_verified",
      verificationReport
    );

    // Send notifications
    await sendApplicantNotification(
      application.primary_contact_email,
      application.brand_name,
      "verified",
      "brand"
    );
    await sendAdminNotification(
      application.id,
      "brand",
      application.brand_name,
      application.primary_contact_email
    );

    // Fire post-verification "Welcome — Specialist" email via fanout
    try {
      await supabaseClient.functions.invoke('email-fanout', {
        body: { event: 'brand_application.identity_verified', record: application },
      });
    } catch (e) {
      logger.warn('Failed to dispatch welcome-pro fanout (brand)', { error: String(e) });
    }

    logger.info("Brand application updated to verified", {
      applicationId: application.id,
    });
  } else if (
    status === "requires_input" ||
    status === "processing" ||
    status === "canceled"
  ) {
    newStatus = "failed";
    logger.warn("Verification failed or requires input", {
      applicationId: application.id,
      status,
      lastError: last_error,
    });

    // Update application
    const { error: updateError } = await supabaseClient
      .from("brand_applications")
      .update({
        status: newStatus,
        stripe_verification_status: status,
        stripe_verification_report: verificationReport,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateError) {
      logger.error("Failed to update brand application", {
        error: updateError,
      });
      throw updateError;
    }

    // Log audit event
    await logAuditEvent(application.id, "brand", "identity_failed", {
      reason: last_error?.reason || "Unknown",
      code: last_error?.code || "Unknown",
      status,
    });

    // Send failure notification
    await sendApplicantNotification(
      application.primary_contact_email,
      application.brand_name,
      "failed",
      "brand",
      last_error?.reason
    );

    logger.info("Brand application updated to failed", {
      applicationId: application.id,
      reason: last_error?.reason,
    });
  }
}

/**
 * Update traveler verification status
 */
async function updateTravelerVerification(
  sessionId: string,
  verificationSession: VerificationSession,
  logger: Logger
): Promise<void> {
  const { status, verified_outputs, last_error } = verificationSession;

  // Find verification record by Stripe session ID
  const { data: verification, error: fetchError } = await supabaseClient
    .from("customer_verifications")
    .select("*")
    .eq("stripe_verification_session_id", sessionId)
    .single();

  if (fetchError || !verification) {
    logger.error("Traveler verification not found", {
      sessionId,
      error: fetchError,
    });
    throw new Error(`Traveler verification not found for session ${sessionId}`);
  }

  logger.info("Found traveler verification", { verificationId: verification.id, userId: verification.user_id });

  const verificationReport: any = {
    stripe_session_id: sessionId,
    verified_at: new Date().toISOString(),
    verification_status: status,
    verified_outputs,
    last_error,
  };

  if (status === "verified") {
    // Update customer_verifications record
    const { error: updateError } = await supabaseClient
      .from("customer_verifications")
      .update({
        status: "approved",
        verified_at: new Date().toISOString(),
        metadata: verificationReport,
      })
      .eq("id", verification.id);

    if (updateError) {
      logger.error("Failed to update traveler verification", { error: updateError });
      throw updateError;
    }

    // Update user profile to mark as verified
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", verification.user_id);

    if (profileError) {
      logger.error("Failed to update traveler profile", { error: profileError });
      // Don't throw - verification record is already updated
    }

    // Create notification for the user
    await supabaseClient.from("notifications").insert({
      user_id: verification.user_id,
      type: "verification",
      title: "Identity Verified ✓",
      message: "Your identity has been verified! You now have a verified badge on your profile.",
      action_url: "/profile",
      created_at: new Date().toISOString(),
    });

    logger.info("Traveler verification approved", { userId: verification.user_id });
  } else {
    // Verification failed
    const { error: updateError } = await supabaseClient
      .from("customer_verifications")
      .update({
        status: "rejected",
        rejection_reason: last_error?.reason || "Verification could not be completed",
        metadata: verificationReport,
      })
      .eq("id", verification.id);

    if (updateError) {
      logger.error("Failed to update failed traveler verification", { error: updateError });
      throw updateError;
    }

    // Create notification for the user
    await supabaseClient.from("notifications").insert({
      user_id: verification.user_id,
      type: "verification",
      title: "Verification Update",
      message: `Your identity verification was not successful. ${last_error?.reason || "Please try again."}`,
      action_url: "/customer-verification",
      created_at: new Date().toISOString(),
    });

    logger.info("Traveler verification rejected", { 
      userId: verification.user_id, 
      reason: last_error?.reason 
    });
  }
}

/**
 * Process verification session completed event
 */
async function processVerificationCompleted(
  verificationSession: VerificationSession,
  logger: Logger
): Promise<void> {
  const sessionId = verificationSession.id;

  logger.info("Processing verification session", {
    sessionId,
    status: verificationSession.status,
  });

  // Check if this is an agent, brand, or traveler verification by trying all tables
  const { data: agentApp } = await supabaseClient
    .from("agent_applications")
    .select("id, email, first_name, last_name")
    .eq("stripe_verification_session_id", sessionId)
    .single();

  const { data: brandApp } = await supabaseClient
    .from("brand_applications")
    .select("id, primary_contact_email, brand_name")
    .eq("stripe_verification_session_id", sessionId)
    .single();

  const { data: travelerVerification } = await supabaseClient
    .from("customer_verifications")
    .select("id, user_id")
    .eq("stripe_verification_session_id", sessionId)
    .single();

  if (agentApp) {
    logger.info("Identified as agent application", {
      applicationId: agentApp.id,
    });
    await updateAgentApplication(sessionId, verificationSession, logger);
  } else if (brandApp) {
    logger.info("Identified as brand application", {
      applicationId: brandApp.id,
    });
    await updateBrandApplication(sessionId, verificationSession, logger);
  } else if (travelerVerification) {
    logger.info("Identified as traveler verification", {
      verificationId: travelerVerification.id,
      userId: travelerVerification.user_id,
    });
    await updateTravelerVerification(sessionId, verificationSession, logger);
  } else {
    logger.error("No application found for verification session", {
      sessionId,
    });
    throw new Error(
      `No application found for verification session ${sessionId}`
    );
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const logger = createLogger(requestId);
  const startTime = Date.now();

  logger.info("Webhook request received", {
    method: req.method,
    url: req.url,
  });

  // Only accept POST requests
  if (req.method !== "POST") {
    logger.warn("Invalid method", { method: req.method });
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logger.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
      logger.info("Webhook signature verified", { eventType: event.type });
    } catch (err: any) {
      logger.error("Webhook signature verification failed", {
        error: err.message,
      });
      return new Response(
        JSON.stringify({ error: "Invalid signature", details: err.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate events (idempotency)
    const isProcessed = await isEventProcessed(event.id);
    if (isProcessed) {
      logger.info("Event already processed (duplicate)", { eventId: event.id });
      return new Response(
        JSON.stringify({ received: true, duplicate: true, requestId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle the event
    let errorMessage: string | undefined;

    try {
      switch (event.type) {
        case "identity.verification_session.verified":
        case "identity.verification_session.requires_input":
        case "identity.verification_session.processing":
        case "identity.verification_session.canceled": {
          logger.info("Processing verification session event", {
            eventType: event.type,
            sessionId: event.data.object.id,
          });

          const verificationSession =
            event.data.object as VerificationSession;
          await processVerificationCompleted(verificationSession, logger);
          break;
        }

        default:
          logger.warn("Unhandled event type", { eventType: event.type });
      }
    } catch (processingError: any) {
      errorMessage = processingError.message;
      logger.error("Error processing webhook event", {
        error: processingError.message,
        stack: processingError.stack,
      });
      throw processingError;
    } finally {
      // Record webhook event for idempotency (even if processing failed)
      const processingDuration = Date.now() - startTime;
      await recordWebhookEvent(
        event.id,
        event.type,
        event.data.object,
        processingDuration,
        errorMessage
      );
    }

    const processingDuration = Date.now() - startTime;
    logger.info("Webhook processed successfully", {
      processingDuration,
      eventType: event.type,
    });

    return new Response(
      JSON.stringify({
        received: true,
        requestId,
        processingDuration,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    const processingDuration = Date.now() - startTime;
    logger.error("Fatal error processing webhook", {
      error: error.message,
      stack: error.stack,
      processingDuration,
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        requestId,
        processingDuration,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
