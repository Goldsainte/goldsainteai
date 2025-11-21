/**
 * Safe error response builder
 * Prevents leaking sensitive error details to clients
 */

export function buildSafeErrorResponse(
  endpoint: string,
  error: unknown,
  corsHeaders: Record<string, string>,
  status = 500
): Response {
  const correlationId = crypto.randomUUID();

  // Log detailed error server-side with correlation ID
  console.error(`[${endpoint}] error`, {
    correlationId,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
  });

  // Return generic error to client with correlation ID for support
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      correlationId,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Build safe validation error response
 */
export function buildValidationErrorResponse(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}
