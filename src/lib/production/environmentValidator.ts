import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/backendConfig";

/**
 * Environment validation utilities for production readiness
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvironmentCheck {
  name: string;
  check: () => boolean | Promise<boolean>;
  required: boolean;
  errorMessage: string;
}

/**
 * Validate required environment variables
 */
export async function validateEnvironment(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const checks: EnvironmentCheck[] = [
    {
      name: "Supabase URL",
      check: () => !!SUPABASE_URL,
      required: true,
      errorMessage: "Backend URL is not configured",
    },
    {
      name: "Supabase Anon Key",
      check: () => !!SUPABASE_PUBLISHABLE_KEY,
      required: true,
      errorMessage: "Backend publishable key is not configured",
    },
    {
      name: "Production Mode",
      check: () => import.meta.env.PROD === true,
      required: true,
      errorMessage: "Not running in production mode",
    },
    {
      name: "HTTPS Protocol",
      check: () => window.location.protocol === "https:",
      required: true,
      errorMessage: "Site is not using HTTPS",
    },
    {
      name: "Secure Context",
      check: () => window.isSecureContext,
      required: true,
      errorMessage: "Not running in a secure context",
    },
  ];

  for (const check of checks) {
    try {
      const result = await Promise.resolve(check.check());
      if (!result) {
        if (check.required) {
          errors.push(check.errorMessage);
        } else {
          warnings.push(check.errorMessage);
        }
      }
    } catch (error) {
      errors.push(`${check.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

/**
 * Get current environment name
 */
export function getEnvironmentName(): "development" | "staging" | "production" {
  if (isDevelopment()) return "development";
  
  // Check if staging based on URL
  const hostname = window.location.hostname;
  if (hostname.includes("staging") || hostname.includes("lovable.app")) {
    return "staging";
  }

  return "production";
}

/**
 * Validate API endpoints are accessible
 */
export async function validateEndpoints(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const supabaseUrl = SUPABASE_URL;
  
  if (!supabaseUrl) {
    errors.push("Supabase URL not configured");
    return { valid: false, errors, warnings };
  }

  // Check Supabase health
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
    });

    if (!response.ok) {
      errors.push(`Supabase API returned ${response.status}`);
    }
  } catch (error) {
    errors.push(`Failed to reach Supabase: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate browser compatibility
 */
export function validateBrowserSupport(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required APIs
  const requiredAPIs = [
    { name: "Fetch API", check: () => "fetch" in window },
    { name: "Local Storage", check: () => "localStorage" in window },
    { name: "Session Storage", check: () => "sessionStorage" in window },
    { name: "Web Crypto", check: () => "crypto" in window && "subtle" in window.crypto },
  ];

  const optionalAPIs = [
    { name: "Web Speech API", check: () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window },
    { name: "Notifications API", check: () => "Notification" in window },
    { name: "Service Worker", check: () => "serviceWorker" in navigator },
  ];

  for (const api of requiredAPIs) {
    if (!api.check()) {
      errors.push(`${api.name} not supported`);
    }
  }

  for (const api of optionalAPIs) {
    if (!api.check()) {
      warnings.push(`${api.name} not supported (optional feature may not work)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run all validation checks
 */
export async function runAllValidations(): Promise<{
  environment: ValidationResult;
  endpoints: ValidationResult;
  browser: ValidationResult;
  overall: boolean;
}> {
  const [environment, endpoints, browser] = await Promise.all([
    validateEnvironment(),
    validateEndpoints(),
    Promise.resolve(validateBrowserSupport()),
  ]);

  return {
    environment,
    endpoints,
    browser,
    overall: environment.valid && endpoints.valid && browser.valid,
  };
}
