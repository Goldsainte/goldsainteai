import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.11.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
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

interface CreateVerificationRequest {
  email: string;
  applicationType: "agent" | "brand";
  returnUrl?: string;
  metadata?: Record<string, string>;
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
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate application type
 */
function isValidApplicationType(
  type: string
): type is "agent" | "brand" {
  return type === "agent" || type === "brand";
}

/**
 * Validate return URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate request body
 */
function validateRequest(body: any): {
  valid: boolean;
  errors: string[];
  data?: CreateVerificationRequest;
} {
  const errors: string[] = [];

  if (!body) {
    errors.push("Request body is required");
    return { valid: false, errors };
  }

  if (!body.email) {
    errors.push("Email is required");
  } else if (!isValidEmail(body.email)) {
    errors.push("Invalid email format");
  }

  if (!body.applicationType) {
    errors.push("Application type is required");
  } else if (!isValidApplicationType(body.applicationType)) {
    errors.push('Application type must be "agent" or "brand"');
  }

  if (body.returnUrl && !isValidUrl(body.returnUrl)) {
    errors.push("Invalid return URL format");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      email: body.email,
      applicationType: body.applicationType,
      returnUrl: body.returnUrl,
      metadata: body.metadata || {},
    },
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter
 * Limit: 5 verification sessions per email per hour
 */
function checkRateLimit(email: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const key = `verification:${email}`;
  const limit = 5;
  const windowMs = 60 * 60 * 1000; // 1 hour

  const entry = rateLimitStore.get(key);

  // Clean up expired entries
  if (entry && now > entry.resetAt) {
    rateLimitStore.delete(key);
  }

  if (!entry || now > entry.resetAt) {
    // First request or window expired
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check if user has a recent pending verification session
 * Prevents duplicate submissions within 30 minutes
 */
async function checkForDuplicateSession(
  email: string,
  applicationType: "agent" | "brand",
  logger: Logger
): Promise<{ hasDuplicate: boolean; sessionId?: string }> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const tableName =
    applicationType === "agent" ? "agent_applications" : "brand_applications";
  const emailField =
    applicationType === "agent" ? "email" : "primary_contact_email";

  const { data, error } = await supabaseClient
    .from(tableName)
    .select("stripe_session_id, status, submitted_at")
    .eq(emailField, email)
    .in("status", ["pending_verification", "verified"])
    .gte("submitted_at", thirtyMinutesAgo)
    .order("submitted_at", { ascending: false })
    .limit(1);

  if (error) {
    logger.error("Error checking for duplicate session", { error });
    return { hasDuplicate: false };
  }

  if (data && data.length > 0) {
    logger.warn("Found recent verification session", {
      email,
      applicationType,
      existingSessionId: data[0].stripe_session_id,
      status: data[0].status,
    });
    return {
      hasDuplicate: true,
      sessionId: data[0].stripe_session_id,
    };
  }

  return { hasDuplicate: false };
}

// ============================================================================
// VERIFICATION SESSION CREATION
// ============================================================================

/**
 * Create Stripe Identity Verification Session
 */
async function createVerificationSession(
  request: CreateVerificationRequest,
  logger: Logger
): Promise<{
  client_secret: string;
  verification_session_id: string;
  url: string;
}> {
  const { email, applicationType, returnUrl, metadata } = request;

  logger.info("Creating Stripe Identity verification session", {
    email,
    applicationType,
  });

  try {
    // Create verification session
    const verificationSession = await stripe.identity.verificationSessions.create(
      {
        type: "document", // ID document verification
        metadata: {
          email,
          application_type: applicationType,
          ...metadata,
        },
        options: {
          document: {
            require_id_number: false,
            require_live_capture: true,
            require_matching_selfie: true,
            allowed_types: ["driving_license", "passport", "id_card"],
          },
        },
        return_url: returnUrl || `${SUPABASE_URL}/apply/${applicationType}/verification-complete`,
      }
    );

    logger.info("Verification session created successfully", {
      sessionId: verificationSession.id,
      clientSecret: verificationSession.client_secret,
    });

    return {
      client_secret: verificationSession.client_secret!,
      verification_session_id: verificationSession.id,
      url: verificationSession.url!,
    };
  } catch (error: any) {
    logger.error("Failed to create verification session", {
      error: error.message,
      code: error.code,
      type: error.type,
    });
    throw new Error(`Stripe API error: ${error.message}`);
  }
}

// ============================================================================
// SECURITY CHECKS
// ============================================================================

/**
 * Check if email domain is suspicious
 */
function isSuspiciousDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  
  // List of disposable email domains (this is a small sample)
  const disposableDomains = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "throwaway.email",
    "maildrop.cc",
    "temp-mail.org",
    "getnada.com",
    "trashmail.com",
    "fakeinbox.com",
  ];

  return disposableDomains.includes(domain);
}

/**
 * Perform security checks on request
 */
function performSecurityChecks(
  email: string,
  logger: Logger
): { passed: boolean; reason?: string } {
  // Check for disposable email
  if (isSuspiciousDomain(email)) {
    logger.warn("Disposable email domain detected", { email });
    return {
      passed: false,
      reason: "Disposable email addresses are not allowed",
    };
  }

  // Check email format more strictly
  const parts = email.split("@");
  if (parts[0].length < 2) {
    logger.warn("Email local part too short", { email });
    return {
      passed: false,
      reason: "Invalid email format",
    };
  }

  return { passed: true };
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
      headers: corsHeaders,
    });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    logger.warn("Invalid method", { method: req.method });
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
        requestId,
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      logger.error("Failed to parse request body", { error: parseError });
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    logger.info("Request body parsed", { 
      email: body.email, 
      applicationType: body.applicationType 
    });

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      logger.warn("Request validation failed", { errors: validation.errors });
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          errors: validation.errors,
          requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData = validation.data!;

    // Perform security checks
    const securityCheck = performSecurityChecks(requestData.email, logger);
    if (!securityCheck.passed) {
      return new Response(
        JSON.stringify({
          error: "Security check failed",
          reason: securityCheck.reason,
          requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(requestData.email);
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt);
      logger.warn("Rate limit exceeded", {
        email: requestData.email,
        resetAt: resetDate.toISOString(),
      });
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message:
            "Too many verification requests. Please try again later.",
          retry_after: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          requestId,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
            ),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
          },
        }
      );
    }

    // Check for duplicate sessions
    const duplicateCheck = await checkForDuplicateSession(
      requestData.email,
      requestData.applicationType,
      logger
    );

    if (duplicateCheck.hasDuplicate) {
      logger.info("Returning existing session", {
        sessionId: duplicateCheck.sessionId,
      });
      
      // Retrieve existing session from Stripe
      try {
        const existingSession = await stripe.identity.verificationSessions.retrieve(
          duplicateCheck.sessionId!
        );

        return new Response(
          JSON.stringify({
            client_secret: existingSession.client_secret,
            verification_session_id: existingSession.id,
            url: existingSession.url,
            is_duplicate: true,
            message: "You have a pending verification session. Redirecting to existing session.",
            requestId,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "X-RateLimit-Limit": "5",
              "X-RateLimit-Remaining": String(rateLimit.remaining),
              "X-RateLimit-Reset": String(
                Math.floor(rateLimit.resetAt / 1000)
              ),
            },
          }
        );
      } catch (stripeError: any) {
        logger.error("Failed to retrieve existing session", {
          error: stripeError.message,
        });
        // If we can't retrieve it, create a new one
      }
    }

    // Create new verification session
    const session = await createVerificationSession(requestData, logger);

    logger.info("Verification session created successfully", {
      sessionId: session.verification_session_id,
      email: requestData.email,
      applicationType: requestData.applicationType,
    });

    return new Response(
      JSON.stringify({
        ...session,
        requestId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
        },
      }
    );
  } catch (error: any) {
    logger.error("Fatal error processing request", {
      error: error.message,
      stack: error.stack,
    });

    // Don't expose internal error details to client
    const isStripeError = error.message?.includes("Stripe API error");
    const errorMessage = isStripeError
      ? error.message
      : "An internal error occurred. Please try again later.";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
        requestId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
