# Goldsainte Security & Resilience Implementation

## Overview

This document describes the comprehensive security hardening implemented for production 1M-user scale. All measures follow the security blueprint and address 6 critical blockers.

---

## 1. Rate Limiting Strategy

### Supabase Edge Functions

**Implementation**: Deno KV-based rate limiting via `supabase/functions/_utils/rate-limit.ts`

**Default Limits**:
- `keyType: "api"` - 20 requests/minute per IP or user
- `keyType: "ai"` - 5 requests/minute per IP or user  
- `keyType: "auth"` - 10 requests/minute per IP or user

**Protected Functions** (all use `enforceRateLimit`):
- `amadeus-proxy` - Expensive Amadeus API calls
- `viator-search` - Viator API search
- `unsplash-search` - Unsplash image search
- `unified-search-hotels` - Hotel search aggregation
- `unified-search-flights` - Flight search aggregation
- `tripadvisor-search-hotels` - TripAdvisor hotel search
- `tripadvisor-search-restaurants` - TripAdvisor restaurant search
- `booking-com-rapid-search` - Booking.com API
- `hotelbeds-search-hotels` - Hotelbeds API
- `hotelbeds-search-activities` - Hotelbeds activities

**Response when rate limit exceeded**:
```json
{
  "error": "rate_limit_exceeded",
  "retry_after": 45
}
```

**Headers**:
- `Retry-After`: seconds until next allowed request
- `X-RateLimit-Limit`: max requests per window
- `X-RateLimit-Remaining`: requests left in current window
- `X-RateLimit-Reset`: ISO timestamp when window resets

### Node Server

**Implementation**: In-memory rate limiting per IP + path in `server/app.js`

**Limits**:
- `/api/presence/heartbeat` - 60 req/min per IP
- `/api/csrf-token` - 30 req/min per IP
- `/api/auth/session` - 30 req/min per IP

**Implementation**: `checkNodeRateLimit(req, pathname)` helper applied before all route handlers

---

## 2. Error Handling Pattern

### Safe Error Responses

**Problem**: Raw `error.message` exposure leaks sensitive information (internal IDs, stack traces, API keys in error strings)

**Solution**: `supabase/functions/_shared/httpError.ts`

**Pattern**:
```typescript
import { buildSafeErrorResponse } from "../_shared/httpError.ts";

try {
  // ... function logic
} catch (error) {
  return buildSafeErrorResponse("function-name", error, corsHeaders);
}
```

**Client Response**:
```json
{
  "error": "Internal server error",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Server Logs**:
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "message": "Amadeus API returned 503",
    "stack": "Error: ...",
    "name": "Error"
  }
}
```

**Applied to**: All 60+ Supabase edge functions and Node server error handlers

---

## 3. Cron Job Schedule

### Daily Maintenance Runner

**Function**: `supabase/functions/run-daily-maintenance/index.ts`

**Schedule**: 2:00 AM UTC daily

**Tasks**:
1. Expire old marketplace jobs (`expire_old_marketplace_jobs()`)
2. Clean expired OAuth states (`cleanup_expired_oauth_states()`)
3. Clean expired search cache (`cleanup_expired_cache()`)
4. Check expiring subscriptions (invoke `check-expiring-subscriptions` function)
5. [Future] Prune old presence heartbeats

**Setup** (run once in Supabase SQL Editor):
```sql
SELECT cron.schedule(
  'daily-maintenance',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/run-daily-maintenance',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Monitoring**: Function logs results for each task with status and duration

---

## 4. Input Validation Approach

### Centralized Validators

**Location**: `supabase/functions/_shared/inputValidation.ts`

**Available Functions**:
- `isValidEmail(email: string)` - Email format validation
- `isValidUUID(uuid: string)` - UUID format validation
- `isValidURL(url: string)` - URL format validation
- `sanitizeText(text: string)` - Remove HTML tags, limit length
- `sanitizeHTML(html: string)` - DOMPurify with allowed tags
- `validateNumber(value, min, max)` - Numeric range validation
- `validateStringLength(value, min, max)` - String length validation
- `validateRequestBody(body, requiredFields)` - Required field validation
- `containsSQLInjection(input: string)` - SQL injection pattern detection

### Applied Validation

**User-Input Functions**:
- `ai-booking-concierge` - Validates message arrays (1-50 entries, max 10k chars per message)
- `ai-booking-assistant` - Similar chat validation
- Trip request creation - Validates UUIDs, sanitizes notes/descriptions
- Brand profile updates - Validates URLs, sanitizes text fields
- All functions accepting IDs - `isValidUUID()` checks

**Pattern**:
```typescript
import { isValidUUID, sanitizeText } from "../_shared/inputValidation.ts";

const { userId, notes } = await req.json();

if (!isValidUUID(userId)) {
  return buildValidationErrorResponse("Invalid user ID format", corsHeaders);
}

const cleanNotes = sanitizeText(notes).slice(0, 2000);
```

---

## 5. Required Environment Variables

### Production Requirements

**Supabase Edge Functions** (`_shared/config.ts` - CONFIG object):
```
SUPABASE_URL (required)
SUPABASE_SERVICE_ROLE_KEY (required)
OPENAI_API_KEY (required)
STRIPE_SECRET_KEY (required)
AMADEUS_API_KEY (required)
AMADEUS_API_SECRET (required)
SITE_URL (defaults to https://goldsainte.ai)
```

**Node Server** (`server/config.js` - loadConfig function):
```
SUPABASE_URL (required)
SUPABASE_ANON_KEY (required)
SUPABASE_SERVICE_ROLE_KEY (required)
CSRF_SECRET (required)
PORT (defaults to 4100)
NODE_ENV (defaults to development)
```

**Optional Keys** (accessed directly via `Deno.env.get()`):
- `VIATOR_API_KEY` - Viator experience search
- `UNSPLASH_ACCESS_KEY` - Unsplash image search
- `RAPIDAPI_KEY` - Worldwide restaurants API
- `SENTRY_DSN` - Error monitoring
- `ALLOWED_ORIGINS` - Stripe redirect allowlist

### Fail-Fast Behavior

**Production Mode**: Missing required environment variables cause immediate startup failure

**Development Mode**: Missing vars logged as warnings, functions proceed with empty strings

**Usage**:
```typescript
import { CONFIG } from "../_shared/config.ts";

const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY);
```

---

## 6. JWT & Token Strategy

### JWT Verification for Expensive APIs

**Enabled `verify_jwt = true` for**:
- `amadeus-proxy` - Amadeus flight/hotel search ($$ per request)
- `unified-search-hotels` - Aggregated hotel search
- `unified-search-flights` - Aggregated flight search
- `tripadvisor-search-hotels` - TripAdvisor API
- `tripadvisor-search-restaurants` - TripAdvisor restaurant search
- `booking-com-rapid-search` - Booking.com API
- `hotelbeds-search-hotels` - Hotelbeds hotel API

**Frontend Pattern**:
```typescript
const { data: { session } } = await supabase.auth.getSession();

await supabase.functions.invoke("amadeus-proxy", {
  headers: {
    Authorization: `Bearer ${session?.access_token}`,
  },
  body: { type: "flights", ... },
});
```

**Unauthenticated requests** to JWT-protected functions return `401 Unauthorized`

### Scoped API Tokens (Future Partner APIs)

**Table**: `public.api_tokens`

**Schema**:
```sql
id UUID PRIMARY KEY
token_hash TEXT NOT NULL UNIQUE  -- SHA-256 hash
owner_user_id UUID REFERENCES auth.users
label TEXT                       -- Human-readable name
scopes TEXT[]                    -- Permission scopes
created_at TIMESTAMPTZ
last_used_at TIMESTAMPTZ         -- Auto-updated on use
revoked_at TIMESTAMPTZ           -- Soft delete
```

**Authentication Helper**: `supabase/functions/_shared/apiTokenAuth.ts`

**Usage Pattern**:
```typescript
import { authenticateApiToken, hasScope } from "../_shared/apiTokenAuth.ts";

const token = await authenticateApiToken(req);
if (!token || !hasScope(token, "read_trips")) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: corsHeaders }
  );
}
```

**Scopes** (examples for future use):
- `read_trips` - View trip data
- `create_trips` - Create trip requests
- `read_analytics` - Access analytics
- `manage_bookings` - Update booking status

**RLS Policies**: Users can only view/manage their own tokens

---

## 7. Security Checklist

### Before Production Deployment

- [x] **Rate limiting enabled** on all expensive external API functions
- [x] **Safe error responses** implemented across all functions
- [x] **JWT verification** enabled for paid API proxies
- [x] **Input validation** applied to all user-facing functions
- [x] **Centralized config** with fail-fast validation
- [x] **Daily maintenance** runner scheduled
- [x] **API token system** created for future partner integrations
- [ ] **Playwright E2E tests** covering critical flows
- [ ] **Load testing** validated for 100 concurrent users
- [ ] **Sentry monitoring** dashboard configured
- [ ] **Stripe live mode** enabled with webhook URLs
- [ ] **ALLOWED_ORIGINS** environment variable configured

### Runtime Security Features

✅ **Rate limiting**: Protects against abuse and DoS
✅ **Safe errors**: Prevents information leakage
✅ **JWT auth**: Ensures paid APIs only accessible to authenticated users
✅ **Input sanitization**: Prevents XSS and injection attacks
✅ **CORS validation**: Prevents unauthorized origins
✅ **Fail-fast config**: Catches missing keys at startup
✅ **Correlation IDs**: Enables support debugging without exposing internals
✅ **Hashed API tokens**: Secure partner credential storage

---

## 8. Monitoring & Observability

### Error Correlation

**Pattern**: Every error response includes a `correlationId` UUID

**Client sees**:
```json
{ "error": "Internal server error", "correlationId": "abc-123" }
```

**Support searches** server logs for `correlationId: "abc-123"` to find full error context

### Structured Logging

**Pattern**: All functions log structured JSON with:
- Timestamp
- Function name
- Correlation ID
- Error details (server-side only)
- Request metadata

**Example**:
```json
{
  "[amadeus-proxy] error": {
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "error": {
      "message": "Failed to get Amadeus token: 401",
      "stack": "..."
    }
  }
}
```

### Rate Limit Monitoring

**Headers expose metrics**:
- `X-RateLimit-Remaining`: Track how close users are to limits
- `X-RateLimit-Reset`: When limits refresh

**Alert on**: Frequent 429 responses (may indicate need for limit adjustments)

---

## 9. Common Security Patterns

### Pattern 1: Safe External API Call
```typescript
import { enforceRateLimit } from "../_utils/rate-limit.ts";
import { buildSafeErrorResponse } from "../_shared/httpError.ts";
import { CONFIG } from "../_shared/config.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const limited = await enforceRateLimit({ keyType: "api", req, corsHeaders });
  if (limited) return limited;

  try {
    const response = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${CONFIG.EXTERNAL_API_KEY}` },
    });
    // ... handle response
  } catch (error) {
    return buildSafeErrorResponse("function-name", error, corsHeaders);
  }
});
```

### Pattern 2: Validated User Input
```typescript
import { isValidUUID, sanitizeText, validateStringLength } from "../_shared/inputValidation.ts";
import { buildValidationErrorResponse } from "../_shared/httpError.ts";

const { userId, notes } = await req.json();

if (!isValidUUID(userId)) {
  return buildValidationErrorResponse("Invalid user ID", corsHeaders);
}

const validation = validateStringLength(notes, 10, 5000);
if (!validation.valid) {
  return buildValidationErrorResponse(validation.error!, corsHeaders);
}

const cleanNotes = sanitizeText(notes);
```

### Pattern 3: JWT-Protected Endpoint
```toml
# supabase/config.toml
[functions.expensive-api]
verify_jwt = true
```

```typescript
// Frontend call
const { data: { session } } = await supabase.auth.getSession();
await supabase.functions.invoke("expensive-api", {
  headers: { Authorization: `Bearer ${session?.access_token}` },
  body: { ... },
});
```

---

## 10. Production Deployment Checklist

### Environment Variables

- [ ] Verify all required vars set in production Supabase project settings
- [ ] Set `SITE_URL` to primary production domain
- [ ] Set `ALLOWED_ORIGINS` comma-separated allowlist
- [ ] Set `NODE_ENV=production` for Node server
- [ ] Rotate all API keys (Stripe live mode, Amadeus production, etc.)

### Cron Jobs

- [ ] Schedule `run-daily-maintenance` in Supabase dashboard (2 AM UTC)
- [ ] Verify cron job executes successfully (check logs next day)
- [ ] Set up alerts for failed maintenance runs

### Testing

- [ ] Run full Playwright suite (`pnpm playwright test`)
- [ ] Load test with 100 concurrent users
- [ ] Verify rate limiting returns 429 under load
- [ ] Test error correlation IDs work in logs
- [ ] Confirm JWT-protected functions reject unauthenticated requests

### Monitoring

- [ ] Configure Sentry dashboard alerts
- [ ] Set up log aggregation for correlation ID searches
- [ ] Monitor 429 response rates for limit tuning
- [ ] Track P95 response times for all API functions

---

## 11. Incident Response

### Rate Limit Hit

**Symptom**: Users see "rate_limit_exceeded" error

**Resolution**:
1. Check `X-RateLimit-Reset` header for when limits refresh
2. Review logs for abuse patterns (same IP hammering)
3. Consider increasing limits for legitimate high-volume users
4. Implement user-tier-based limits if needed

### Error Correlation

**Symptom**: User reports "Internal server error" with correlation ID

**Resolution**:
1. Search server logs for `correlationId: "<id>"`
2. Review full error context (message, stack, request params)
3. Fix root cause
4. Respond to user with resolution

### Missing Environment Variable

**Symptom**: Function fails at startup with "Missing required env var"

**Resolution**:
1. Check Supabase project settings → Edge Functions → Environment Variables
2. Add missing variable
3. Redeploy function (automatic on next push)

---

## 12. Future Enhancements

### Planned
- [ ] Partner API scoped token system (table exists, auth helper ready)
- [ ] Distributed rate limiting with Redis for multi-region
- [ ] Advanced monitoring with custom metrics
- [ ] Automated security scanning in CI/CD
- [ ] Penetration testing before major releases

### Under Consideration
- [ ] Web Application Firewall (WAF)
- [ ] DDoS protection layer
- [ ] API request signing for webhook security
- [ ] Granular permission system beyond JWT scopes

---

## 13. Contact

For security concerns or questions:
- Review this doc first
- Check `docs/CRON_SCHEDULE.md` for maintenance timing
- Check `docs/ENVIRONMENT_SETUP.md` for configuration
- Escalate P0 security issues immediately

**Last Updated**: 2025-01-21
**Security Version**: 1.0.0
