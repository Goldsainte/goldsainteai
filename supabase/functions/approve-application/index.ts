import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { resolveAllowedOrigin } from "../_shared/cors.ts";
import {
  sendAgentWelcomeEmail,
  sendBrandWelcomeEmail,
  sendAgentRejectionEmail,
  sendBrandRejectionEmail,
} from "../_shared/email-service.ts";

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://goldsainte.com";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// TYPES
// ============================================================================

interface ApproveApplicationRequest {
  applicationId: string;
  applicationType: "agent" | "brand";
  approvalNotes?: string;
  sendWelcomeEmail?: boolean;
}

interface RejectApplicationRequest {
  applicationId: string;
  applicationType: "agent" | "brand";
  rejectionReason: string;
  allowResubmission?: boolean;
}

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

interface AgentApplication {
  id: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  agency_name: string;
  business_type: string;
  years_experience: number;
  service_types: string[];
  specialties: string[];
  languages: string[];
  commission_rate: number;
  stripe_session_id: string;
  stripe_verification_status: string;
  stripe_verified_at: string;
  website?: string;
}

interface BrandApplication {
  id: string;
  status: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  brand_name: string;
  brand_type: string;
  bio: string;
  regions: string[];
  cities: string[];
  style_tags: string[];
  logo_url: string;
  cover_image_url: string;
  gallery_urls: string[];
  stripe_session_id: string;
  stripe_verification_status: string;
  stripe_verified_at: string;
  website?: string;
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
// CORS HEADERS
// ============================================================================

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * Verify that the requesting user is an admin
 */
async function verifyAdminUser(
  authHeader: string | null,
  logger: Logger
): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  if (!authHeader) {
    logger.warn("Missing authorization header");
    return { authorized: false, error: "Missing authorization header" };
  }

  try {
    // Extract JWT from Bearer token
    const token = authHeader.replace("Bearer ", "");

    // Verify the JWT and get user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.warn("Invalid or expired token", { error: authError });
      return { authorized: false, error: "Invalid or expired token" };
    }

    logger.info("User authenticated", { userId: user.id });

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      logger.error("Failed to fetch user profile", { error: profileError });
      return { authorized: false, error: "User profile not found" };
    }

    if (profile.role !== "admin") {
      logger.warn("User is not an admin", { userId: user.id, role: profile.role });
      return {
        authorized: false,
        error: "Insufficient permissions. Admin role required.",
      };
    }

    logger.info("Admin user verified", { userId: user.id });
    return { authorized: true, userId: user.id };
  } catch (error: any) {
    logger.error("Error verifying admin user", { error: error.message });
    return { authorized: false, error: "Authentication failed" };
  }
}

// ============================================================================
// PASSWORD GENERATION
// ============================================================================

/**
 * Generate a secure temporary password
 */
function generateTemporaryPassword(): string {
  const length = 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each required character type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Special char

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Send welcome email to approved applicant with login credentials
 */
async function sendWelcomeEmail(
  email: string,
  firstName: string,
  temporaryPassword: string,
  applicationType: "agent" | "brand",
  brandName?: string,
  logger?: Logger
): Promise<void> {
  try {
    if (applicationType === "agent") {
      await sendAgentWelcomeEmail(email, firstName, temporaryPassword);
    } else {
      await sendBrandWelcomeEmail(email, firstName, brandName!, temporaryPassword);
    }
    logger?.info("Welcome email sent successfully", { email });
  } catch (error: any) {
    logger?.error("Failed to send welcome email", { error: error.message });
    // Don't throw - email failure shouldn't block approval
  }
}

/**
 * Send rejection email to applicant
 */
async function sendRejectionEmail(
  email: string,
  firstName: string,
  rejectionReason: string,
  applicationType: "agent" | "brand",
  allowResubmission: boolean,
  brandName?: string,
  logger?: Logger
): Promise<void> {
  try {
    if (applicationType === "agent") {
      await sendAgentRejectionEmail(email, firstName, rejectionReason, allowResubmission);
    } else {
      await sendBrandRejectionEmail(
        email,
        firstName,
        brandName!,
        rejectionReason,
        allowResubmission
      );
    }
    logger?.info("Rejection email sent successfully", { email });
  } catch (error: any) {
    logger?.error("Failed to send rejection email", { error: error.message });
    // Don't throw - email failure shouldn't block rejection
  }
}

// ============================================================================
// AGENT APPROVAL
// ============================================================================

/**
 * Approve agent application and create auth account
 */
async function approveAgentApplication(
  applicationId: string,
  adminUserId: string,
  approvalNotes: string | undefined,
  sendWelcome: boolean,
  logger: Logger
): Promise<{ success: boolean; userId?: string; error?: string }> {
  logger.info("Starting agent approval process", { applicationId });

  // 1. Fetch application
  const { data: application, error: fetchError } = await supabaseAdmin
    .from("agent_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (fetchError || !application) {
    logger.error("Failed to fetch application", { error: fetchError });
    return { success: false, error: "Application not found" };
  }

  const app = application as AgentApplication;

  // 2. Validate application status
  if (app.status === "approved") {
    logger.warn("Application already approved", { applicationId });
    return { success: false, error: "Application already approved" };
  }

  if (app.status !== "verified") {
    logger.warn("Application not in verified status", {
      applicationId,
      currentStatus: app.status,
    });
    return {
      success: false,
      error: `Application must be verified before approval. Current status: ${app.status}`,
    };
  }

  // 3. Generate temporary password
  const temporaryPassword = generateTemporaryPassword();
  logger.info("Generated temporary password");

  // 4. Create auth account
  logger.info("Creating auth account", { email: app.email });
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(
    {
      email: app.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email since we verified via Stripe Identity
      user_metadata: {
        first_name: app.first_name,
        last_name: app.last_name,
        account_type: "agent",
        application_id: applicationId,
      },
    }
  );

  if (authError || !authData.user) {
    logger.error("Failed to create auth account", { error: authError });
    return {
      success: false,
      error: `Failed to create auth account: ${authError?.message}`,
    };
  }

  const userId = authData.user.id;
  logger.info("Auth account created", { userId });

  try {
    // 5. Create or update profile (upsert to handle trigger-created profiles)
    logger.info("Upserting profile", { userId });
    
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: app.email,
      username: app.email.split("@")[0],
      first_name: app.first_name,
      last_name: app.last_name,
      phone: app.phone || null, // NULL if empty to avoid unique constraint
      account_type: "agent",
      role: "agent",
      is_verified: true,
      email_verified: true,
      identity_verified: true,
      is_profile_complete: false,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (profileError) {
      logger.error("Failed to upsert profile", { error: profileError });
      throw new Error(`Failed to upsert profile: ${profileError.message}`);
    }

    // 6. Create travel_agents record
    logger.info("Creating travel agent profile", { userId });
    
    const { error: agentError } = await supabaseAdmin
      .from("travel_agents")
      .insert({
        user_id: userId,
        agency_name: app.agency_name,
        business_type: app.business_type,
        bio: `${app.years_experience} years of experience specializing in ${app.specialties.slice(0, 3).join(", ")}`,
        website: app.website,
        status: "active",
        is_accepting_requests: true,
        onboarded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (agentError) {
      logger.error("Failed to create agent profile", { error: agentError });
      throw new Error(`Failed to create agent profile: ${agentError.message}`);
    }

    // 7. Assign role
    logger.info("Assigning agent role", { userId });
    
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "agent",
    });

    if (roleError) {
      logger.error("Failed to assign role", { error: roleError });
      // Non-fatal, continue
    }

    // 8. Update application status
    logger.info("Updating application status", { applicationId });
    
    const { error: updateError } = await supabaseAdmin
      .from("agent_applications")
      .update({
        status: "approved",
        user_id: userId,
        admin_reviewer_id: adminUserId,
        reviewed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      logger.error("Failed to update application", { error: updateError });
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    // 9. Log audit event
    await supabaseAdmin.from("application_audit_log").insert({
      application_id: applicationId,
      application_type: "agent",
      action: "approved",
      actor_id: adminUserId,
      actor_type: "admin",
      details: {
        user_id: userId,
        approval_notes: approvalNotes,
        approved_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    // 10. Create success notification for applicant
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "application_update",
      title: "🎉 Application Approved!",
      message: "Your travel agent application has been approved. Welcome to Goldsainte!",
      priority: "high",
      created_at: new Date().toISOString(),
    });

    // 11. Send welcome email
    if (sendWelcome) {
      await sendWelcomeEmail(
        app.email,
        app.first_name,
        temporaryPassword,
        "agent",
        undefined,
        logger
      );
    }

    logger.info("Agent approval completed successfully", {
      applicationId,
      userId,
    });

    return { success: true, userId };
  } catch (error: any) {
    // Rollback: Delete auth account if profile creation failed
    logger.error("Error during approval, attempting rollback", {
      error: error.message,
    });

    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      logger.info("Auth account deleted (rollback)", { userId });
    } catch (rollbackError: any) {
      logger.error("Failed to rollback auth account", {
        error: rollbackError.message,
      });
    }

    return { success: false, error: error.message };
  }
}

// ============================================================================
// BRAND APPROVAL
// ============================================================================

/**
 * Approve brand application and create auth account
 */
async function approveBrandApplication(
  applicationId: string,
  adminUserId: string,
  approvalNotes: string | undefined,
  sendWelcome: boolean,
  logger: Logger
): Promise<{ success: boolean; userId?: string; brandId?: string; error?: string }> {
  logger.info("Starting brand approval process", { applicationId });

  // 1. Fetch application
  const { data: application, error: fetchError } = await supabaseAdmin
    .from("brand_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (fetchError || !application) {
    logger.error("Failed to fetch application", { error: fetchError });
    return { success: false, error: "Application not found" };
  }

  const app = application as BrandApplication;

  // 2. Validate application status
  if (app.status === "approved") {
    logger.warn("Application already approved", { applicationId });
    return { success: false, error: "Application already approved" };
  }

  if (app.status !== "verified") {
    logger.warn("Application not in verified status", {
      applicationId,
      currentStatus: app.status,
    });
    return {
      success: false,
      error: `Application must be verified before approval. Current status: ${app.status}`,
    };
  }

  // 3. Generate temporary password
  const temporaryPassword = generateTemporaryPassword();
  logger.info("Generated temporary password");

  // 4. Create auth account
  logger.info("Creating auth account", { email: app.primary_contact_email });
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(
    {
      email: app.primary_contact_email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: app.primary_contact_name,
        account_type: "brand",
        brand_name: app.brand_name,
        application_id: applicationId,
      },
    }
  );

  if (authError || !authData.user) {
    logger.error("Failed to create auth account", { error: authError });
    return {
      success: false,
      error: `Failed to create auth account: ${authError?.message}`,
    };
  }

  const userId = authData.user.id;
  logger.info("Auth account created", { userId });

  try {
    // 5. Create or update profile (upsert to handle trigger-created profiles)
    logger.info("Upserting profile", { userId });
    
    const nameParts = app.primary_contact_name.split(" ");
    const firstName = nameParts[0] || app.primary_contact_name;
    const lastName = nameParts.slice(1).join(" ") || "";

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: app.primary_contact_email,
      username: app.brand_name.toLowerCase().replace(/\s+/g, "-"),
      first_name: firstName,
      last_name: lastName,
      phone: app.primary_contact_phone || null, // NULL if empty to avoid unique constraint
      account_type: "brand",
      role: "brand",
      is_verified: true,
      email_verified: true,
      identity_verified: true,
      is_profile_complete: false,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (profileError) {
      logger.error("Failed to upsert profile", { error: profileError });
      throw new Error(`Failed to upsert profile: ${profileError.message}`);
    }

    // 6. Create brand_profiles record
    logger.info("Creating brand profile", { userId });
    
    const { data: brandProfile, error: brandError } = await supabaseAdmin
      .from("brand_profiles")
      .insert({
        owner_user_id: userId,
        brand_name: app.brand_name,
        brand_type: app.brand_type,
        bio: app.bio,
        website: app.website,
        regions: app.regions,
        cities: app.cities,
        style_tags: app.style_tags,
        logo_url: app.logo_url,
        cover_image_url: app.cover_image_url,
        gallery_urls: app.gallery_urls,
        status: "active",
        is_featured: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (brandError || !brandProfile) {
      logger.error("Failed to create brand profile", { error: brandError });
      throw new Error(`Failed to create brand profile: ${brandError?.message}`);
    }

    const brandId = brandProfile.id;
    logger.info("Brand profile created", { brandId });

    // 7. Assign role
    logger.info("Assigning brand role", { userId });
    
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "brand",
    });

    if (roleError) {
      logger.error("Failed to assign role", { error: roleError });
      // Non-fatal, continue
    }

    // 8. Update application status
    logger.info("Updating application status", { applicationId });
    
    const { error: updateError } = await supabaseAdmin
      .from("brand_applications")
      .update({
        status: "approved",
        user_id: userId,
        brand_profile_id: brandId,
        admin_reviewer_id: adminUserId,
        reviewed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      logger.error("Failed to update application", { error: updateError });
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    // 9. Log audit event
    await supabaseAdmin.from("application_audit_log").insert({
      application_id: applicationId,
      application_type: "brand",
      action: "approved",
      actor_id: adminUserId,
      actor_type: "admin",
      details: {
        user_id: userId,
        brand_id: brandId,
        approval_notes: approvalNotes,
        approved_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    // 10. Create success notification
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "application_update",
      title: "🎉 Brand Application Approved!",
      message: `${app.brand_name} has been approved. Welcome to Goldsainte!`,
      priority: "high",
      created_at: new Date().toISOString(),
    });

    // 11. Send welcome email
    if (sendWelcome) {
      await sendWelcomeEmail(
        app.primary_contact_email,
        firstName,
        temporaryPassword,
        "brand",
        app.brand_name,
        logger
      );
    }

    logger.info("Brand approval completed successfully", {
      applicationId,
      userId,
      brandId,
    });

    return { success: true, userId, brandId };
  } catch (error: any) {
    // Rollback: Delete auth account
    logger.error("Error during approval, attempting rollback", {
      error: error.message,
    });

    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      logger.info("Auth account deleted (rollback)", { userId });
    } catch (rollbackError: any) {
      logger.error("Failed to rollback auth account", {
        error: rollbackError.message,
      });
    }

    return { success: false, error: error.message };
  }
}

// ============================================================================
// REJECT APPLICATION
// ============================================================================

/**
 * Reject an application
 */
async function rejectApplication(
  applicationId: string,
  applicationType: "agent" | "brand",
  adminUserId: string,
  rejectionReason: string,
  allowResubmission: boolean,
  logger: Logger
): Promise<{ success: boolean; error?: string }> {
  logger.info("Starting rejection process", { applicationId, applicationType });

  const tableName =
    applicationType === "agent" ? "agent_applications" : "brand_applications";

  // 1. Fetch application
  const { data: application, error: fetchError } = await supabaseAdmin
    .from(tableName)
    .select("*")
    .eq("id", applicationId)
    .single();

  if (fetchError || !application) {
    logger.error("Failed to fetch application", { error: fetchError });
    return { success: false, error: "Application not found" };
  }

  if (application.status === "rejected") {
    logger.warn("Application already rejected", { applicationId });
    return { success: false, error: "Application already rejected" };
  }

  // 2. Update application status
  const { error: updateError } = await supabaseAdmin
    .from(tableName)
    .update({
      status: "rejected",
      admin_reviewer_id: adminUserId,
      reviewed_at: new Date().toISOString(),
      rejected_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateError) {
    logger.error("Failed to update application", { error: updateError });
    return {
      success: false,
      error: `Failed to reject application: ${updateError.message}`,
    };
  }

  // 3. Log audit event
  await supabaseAdmin.from("application_audit_log").insert({
    application_id: applicationId,
    application_type: applicationType,
    action: "rejected",
    actor_id: adminUserId,
    actor_type: "admin",
    details: {
      rejection_reason: rejectionReason,
      allow_resubmission: allowResubmission,
      rejected_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  });

  // 4. Send rejection email
  const email =
    applicationType === "agent"
      ? application.email
      : application.primary_contact_email;
  const firstName =
    applicationType === "agent"
      ? application.first_name
      : application.primary_contact_name.split(" ")[0];
  const brandName =
    applicationType === "brand" ? application.brand_name : undefined;

  await sendRejectionEmail(
    email,
    firstName,
    rejectionReason,
    applicationType,
    allowResubmission,
    brandName,
    logger
  );

  logger.info("Application rejected successfully", { applicationId });
  return { success: true };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const logger = createLogger(requestId);

  logger.info("Request received", {
    method: req.method,
    url: req.url,
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed", requestId }),
      {
        status: 405,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("authorization");
    const authCheck = await verifyAdminUser(authHeader, logger);

    if (!authCheck.authorized) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: authCheck.error,
          requestId,
        }),
        {
          status: 401,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const adminUserId = authCheck.userId!;

    // Parse request body
    const body = await req.json();
    const action = body.action as "approve" | "reject";

    if (!action || !["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({
          error: "Invalid action",
          message: 'Action must be "approve" or "reject"',
          requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    logger.info("Processing action", { action, adminUserId });

    if (action === "approve") {
      const approveRequest: ApproveApplicationRequest = {
        applicationId: body.applicationId,
        applicationType: body.applicationType,
        approvalNotes: body.approvalNotes,
        sendWelcomeEmail: body.sendWelcomeEmail !== false, // Default true
      };

      if (!approveRequest.applicationId || !approveRequest.applicationType) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields",
            message: "applicationId and applicationType are required",
            requestId,
          }),
          {
            status: 400,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }

      let result;
      if (approveRequest.applicationType === "agent") {
        result = await approveAgentApplication(
          approveRequest.applicationId,
          adminUserId,
          approveRequest.approvalNotes,
          approveRequest.sendWelcomeEmail ?? true,
          logger
        );
      } else {
        result = await approveBrandApplication(
          approveRequest.applicationId,
          adminUserId,
          approveRequest.approvalNotes,
          approveRequest.sendWelcomeEmail ?? true,
          logger
        );
      }

      if (!result.success) {
        return new Response(
          JSON.stringify({
            error: "Approval failed",
            message: result.error,
            requestId,
          }),
          {
            status: 400,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId: result.userId,
          brandId: (result as any).brandId,
          message: "Application approved successfully",
          requestId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    } else {
      // Reject
      const rejectRequest: RejectApplicationRequest = {
        applicationId: body.applicationId,
        applicationType: body.applicationType,
        rejectionReason: body.rejectionReason,
        allowResubmission: body.allowResubmission !== false, // Default true
      };

      if (
        !rejectRequest.applicationId ||
        !rejectRequest.applicationType ||
        !rejectRequest.rejectionReason
      ) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields",
            message:
              "applicationId, applicationType, and rejectionReason are required",
            requestId,
          }),
          {
            status: 400,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }

      const result = await rejectApplication(
        rejectRequest.applicationId,
        rejectRequest.applicationType,
        adminUserId,
        rejectRequest.rejectionReason,
        rejectRequest.allowResubmission ?? true,
        logger
      );

      if (!result.success) {
        return new Response(
          JSON.stringify({
            error: "Rejection failed",
            message: result.error,
            requestId,
          }),
          {
            status: 400,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Application rejected successfully",
          requestId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    logger.error("Fatal error", {
      error: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        requestId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
