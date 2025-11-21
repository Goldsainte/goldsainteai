/**
 * Server configuration with fail-fast validation
 * Ensures critical environment variables are present at startup
 */

const REQUIRED_ENV_VARS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CSRF_SECRET",
];

/**
 * Load and validate configuration
 * Throws error in production if required vars are missing
 */
export function loadConfig() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (process.env.NODE_ENV === "production" && missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(", ")}`
    );
  }

  return {
    supabaseUrl: process.env.SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    csrfSecret: process.env.CSRF_SECRET ?? "development-csrf-secret",
    port: Number(process.env.PORT || 4100),
    nodeEnv: process.env.NODE_ENV || "development",
  };
}
