# Environment Setup Guide

## Overview
This document describes all environment variables required for the Goldsainte platform to function correctly in production.

---

## Client-Side Variables (VITE_*)

### Core Supabase Configuration
```bash
VITE_SUPABASE_URL="https://[project-id].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_PROJECT_ID="[project-id]"
```
**Purpose**: Connect frontend to Lovable Cloud (Supabase) backend
**Required**: ✅ Yes
**How to get**: Automatically provided by Lovable Cloud integration

---

### Monitoring & Observability
```bash
VITE_SENTRY_DSN="https://[key]@o[org].ingest.us.sentry.io/[project]"
```
**Purpose**: Enable error tracking, performance monitoring, and session replay
**Required**: ✅ Yes (for production)
**How to get**: 
1. Create Sentry account at https://sentry.io
2. Create new project
3. Copy DSN from Project Settings → Client Keys (DSN)
4. Add to Lovable secrets: Project Settings → Manage Secrets → Add Secret

**Fallback**: If environment variable fails, DSN can be loaded from `public/config/sentry.json`

---

### Third-Party Integrations

#### Mapbox (Maps & Geolocation)
```bash
VITE_MAPBOX_PUBLIC_TOKEN="pk.eyJ1IjoiZHJlMzAwMGFwIiwiYSI6ImNtZzZiNjZxNTBkN3gya..."
```
**Purpose**: Display maps in hotel details, location search
**Required**: ⚠️ Optional (maps will not display if missing)
**How to get**:
1. Create Mapbox account at https://mapbox.com
2. Navigate to Account → Tokens
3. Create public token with Maps API scope
4. Add to project settings

---

#### Instagram Integration
```bash
VITE_INSTAGRAM_APP_ID="31629118926736516"
```
**Purpose**: Instagram embed support for creator content
**Required**: ⚠️ Optional (Instagram embeds will not work if missing)
**How to get**:
1. Create Meta Developer account at https://developers.facebook.com
2. Create new app with Instagram Graph API
3. Copy App ID
4. Add to project settings

---

#### Google Places API
```bash
VITE_GOOGLE_PLACES_API_KEY="YOUR_GOOGLE_PLACES_API_KEY_HERE"
```
**Purpose**: Location autocomplete, place search
**Required**: ⚠️ Optional (autocomplete features limited if missing)
**How to get**:
1. Create Google Cloud project at https://console.cloud.google.com
2. Enable Places API
3. Create API key with Places API restriction
4. Add to project settings

---

## Server-Side Variables (Edge Functions)

### Core Supabase Configuration
```bash
SUPABASE_URL="https://[project-id].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
**Purpose**: Edge functions backend access
**Required**: ✅ Yes
**How to get**: Automatically configured by Lovable Cloud
**⚠️ Security**: SERVICE_ROLE_KEY bypasses RLS - only use in edge functions when admin privileges required

---

### Stripe Payment Processing
```bash
STRIPE_SECRET_KEY="sk_test_... or sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```
**Purpose**: Payment processing, subscription management, Connect payouts
**Required**: ✅ Yes (for payment features)
**How to get**:
1. Create Stripe account at https://stripe.com
2. Secret Key: Dashboard → Developers → API Keys
3. Webhook Secret: Dashboard → Developers → Webhooks → Add endpoint → Reveal signing secret
4. Add to Lovable secrets (secure secret management)

**Webhook URL**: `https://[project-id].supabase.co/functions/v1/stripe-webhook`

**⚠️ Important**: 
- Use test keys (sk_test_) for development
- Switch to live keys (sk_live_) for production
- Update webhook endpoint in Stripe Dashboard to production URL

---

### Stripe Connect Onboarding
```bash
STRIPE_RETURN_URL="https://goldsainte.ai/creator-dashboard?stripe=success"
STRIPE_REFRESH_URL="https://goldsainte.ai/creator-dashboard?stripe=refresh"
```
**Purpose**: Redirect URLs after creator Stripe Connect onboarding
**Required**: ✅ Yes (for creator payment setup)
**How to set**: Must match primary production domain (goldsainte.ai)
**⚠️ Important**: URLs must be whitelisted in Stripe Dashboard → Settings → Connect

---

### Site Configuration
```bash
SITE_URL="https://goldsainte.ai"
```
**Purpose**: Fallback origin for Stripe redirect URLs when browser doesn't send Origin header
**Required**: ✅ Yes (for production)
**Default**: Falls back to "https://goldsainte.ai" if not set
**Why needed**: Prevents redirects pointing to localhost in production

---

### Amadeus Flight & Hotel Search
```bash
AMADEUS_API_KEY="your_api_key"
AMADEUS_API_SECRET="your_api_secret"
```
**Purpose**: Real-time flight and hotel search within AI Concierge
**Required**: ⚠️ Optional (AI Concierge search features limited if missing)
**How to get**:
1. Create Amadeus Self-Service account at https://developers.amadeus.com
2. Create new app
3. Copy API Key and API Secret
4. Add to Lovable secrets

**Test Environment**: Use https://test.api.amadeus.com for development
**⚠️ Containment**: Only accessed by ai-booking-concierge and amadeus-proxy edge functions

---

## Sentry Release Configuration

### Build-Time Variables (Vite Config)
```bash
VITE_SENTRY_AUTH_TOKEN="sntrys_..."
VITE_SENTRY_ORG="your-org-slug"
VITE_SENTRY_PROJECT="your-project-slug"
```
**Purpose**: Upload source maps to Sentry for production error debugging
**Required**: ⚠️ Optional (errors still captured, but stack traces won't be symbolicated)
**How to get**:
1. Sentry Dashboard → Settings → Auth Tokens
2. Create new token with project:releases and project:write scopes
3. Add to Lovable secrets

**Note**: Source maps enable readable stack traces in production errors

---

## Environment Variable Checklist

### Production Launch Requirements

#### ✅ Must Have (P0)
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_PUBLISHABLE_KEY
- [ ] VITE_SUPABASE_PROJECT_ID
- [ ] VITE_SENTRY_DSN
- [ ] STRIPE_SECRET_KEY (live mode)
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] STRIPE_RETURN_URL
- [ ] STRIPE_REFRESH_URL
- [ ] SITE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY

#### ⚠️ Should Have (P1)
- [ ] AMADEUS_API_KEY
- [ ] AMADEUS_API_SECRET
- [ ] VITE_MAPBOX_PUBLIC_TOKEN
- [ ] VITE_SENTRY_AUTH_TOKEN (for source maps)

#### 📝 Nice to Have (P2)
- [ ] VITE_INSTAGRAM_APP_ID
- [ ] VITE_GOOGLE_PLACES_API_KEY

---

## Verification Steps

### 1. Development Environment
Run the EnvironmentValidator component:
- Open app in development mode
- Check fixed overlay in top-right corner
- Verify all required variables show green checkmarks

### 2. Edge Functions
Test edge function environment variables:
```bash
# Test Stripe webhook secret
curl -X POST https://[project-id].supabase.co/functions/v1/stripe-webhook \
  -H "stripe-signature: test"

# Should return error about invalid signature (proves STRIPE_WEBHOOK_SECRET is loaded)
```

### 3. Sentry Integration
- Trigger test error: Click "Trigger Test Error" in SentryTestButton
- Check Sentry Dashboard → Issues
- Verify error appears with session replay

### 4. Stripe Integration
- Test checkout: Upgrade subscription → verify redirect to Stripe
- Test webhook: Complete test payment → verify webhook received in edge function logs
- Test customer portal: Manage subscription → verify redirect works

---

## Troubleshooting

### Environment Variable Not Loading
**Symptom**: Variable is undefined in code  
**Solutions**:
1. Restart development server (full stop + start, not just refresh)
2. Check variable name has VITE_ prefix for client-side variables
3. Verify variable added through Lovable secret management (not .env file)
4. For Sentry DSN: fallback to public/config/sentry.json if environment variable fails

### Stripe Webhook Failing
**Symptom**: Payments succeed but subscriptions not updating  
**Solutions**:
1. Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
2. Check webhook endpoint URL points to production edge function
3. Test signature verification with Stripe CLI: `stripe listen --forward-to`

### CORS Errors in Edge Functions
**Symptom**: "Failed to fetch" errors from frontend  
**Solutions**:
1. Verify edge function includes corsHeaders with "Access-Control-Allow-Methods": "POST, OPTIONS"
2. Check OPTIONS request handler returns 200
3. Ensure function handles preflight requests

### Redirect URLs Pointing to Localhost
**Symptom**: After Stripe checkout, redirected to localhost instead of production  
**Solutions**:
1. Set SITE_URL environment variable to production domain
2. Verify STRIPE_RETURN_URL and STRIPE_REFRESH_URL are set correctly
3. Check edge functions use: `const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://goldsainte.ai"`

---

## Security Best Practices

### ✅ DO
- Store all secrets in Lovable secret management (encrypted)
- Use VITE_ prefix only for truly public keys (anon keys, public tokens)
- Rotate API keys regularly (quarterly for production)
- Use separate Stripe test/live keys for staging/production
- Validate webhook signatures on all incoming webhooks
- Use SERVICE_ROLE_KEY only in edge functions when admin privileges required

### ❌ DON'T
- Commit secrets to git (.env files should be in .gitignore)
- Expose SUPABASE_SERVICE_ROLE_KEY to client code
- Use production Stripe keys in development
- Trust client-passed user_id (always derive from auth token)
- Use select('*') on tables with PII
- Hardcode API keys in component files

---

## Support

For environment configuration issues:
- **Documentation**: https://docs.lovable.dev
- **Security Guide**: https://docs.lovable.dev/features/security
- **Stripe Setup**: https://stripe.com/docs/connect
- **Sentry Setup**: https://docs.sentry.io/platforms/javascript/guides/react/

---

**Last Updated**: Week 8, Day 1 - Production Configuration Validation
