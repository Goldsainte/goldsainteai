// supabase/functions/_shared/validationSchemas.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Booking Actions Schemas
export const cancellationSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
  role: z.enum(['traveler', 'partner'], {
    errorMap: () => ({ message: 'Role must be traveler or partner' }),
  }),
  reasonShort: z
    .string()
    .min(1, 'Reason is required')
    .max(100, 'Reason must be 100 characters or less')
    .trim(),
  reasonDetails: z
    .string()
    .max(1000, 'Details must be 1000 characters or less')
    .trim()
    .optional()
    .nullable(),
});

export const disputeSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
  type: z.enum(['service', 'payment', 'cancellation', 'other'], {
    errorMap: () => ({ message: 'Invalid dispute type' }),
  }),
  summary: z
    .string()
    .min(1, 'Summary is required')
    .max(200, 'Summary must be 200 characters or less')
    .trim(),
  details: z
    .string()
    .max(2000, 'Details must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
});

// AI Storyboard Schemas
export const storyboardRequestSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format'),
  storyboardId: z.string().uuid('Invalid storyboard ID format'),
});

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);

  return { success: false, errors };
}
