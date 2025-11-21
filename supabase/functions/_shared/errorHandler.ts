// supabase/functions/_shared/errorHandler.ts

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    console.error('Full error:', error.message, error.stack);
    return 'An error occurred while processing your request';
  }

  console.error('Unknown error:', error);
  return 'An unexpected error occurred';
}

export function createErrorResponse(
  error: unknown,
  status: number = 500,
  corsHeaders: Record<string, string>
): Response {
  const message = sanitizeError(error);

  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}
