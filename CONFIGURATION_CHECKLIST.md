# Configuration Checklist - Goldsainte Platform

## Production Deployment Prerequisites

### Required Environment Variables

#### Frontend (Vite - `.env`)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_SUPABASE_PROJECT_ID=[your-project-id]

# Feature Flags
VITE_ENABLE_VOICE_CONCIERGE=true
VITE_ENABLE_MARKETPLACE=true
VITE_ENABLE_GROUP_BOOKINGS=true
VITE_ENABLE_COCURATED_PACKAGES=true

# Third-party Services
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[your-key]
VITE_MAPBOX_TOKEN=[your-mapbox-token]

# Analytics & Monitoring
VITE_SENTRY_DSN=[your-sentry-dsn]
VITE_GA_MEASUREMENT_ID=[your-ga-id]

# Production Mode
VITE_ENVIRONMENT=production
```

#### Backend (Supabase Edge Functions - Secrets)
```bash
# Stripe (REQUIRED)
STRIPE_SECRET_KEY=sk_live_[your-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]
STRIPE_CONNECT_CLIENT_ID=[your-connect-client-id]

# OpenAI (for voice AI)
OPENAI_API_KEY=sk-[your-openai-key]

# Booking APIs
BOOKING_COM_API_KEY=[if-using-booking-com]
AMADEUS_API_KEY=[if-using-amadeus]
AMADEUS_API_SECRET=[if-using-amadeus]

# Email Service (SendGrid, Resend, or similar)
SENDGRID_API_KEY=[your-sendgrid-key]
EMAIL_FROM=noreply@goldsainte.com

# SMS Service (Twilio or similar)
TWILIO_ACCOUNT_SID=[your-twilio-sid]
TWILIO_AUTH_TOKEN=[your-twilio-token]
TWILIO_PHONE_NUMBER=[your-twilio-phone]

# Monitoring & Logging
SENTRY_DSN=[your-sentry-dsn]

# Application URLs
APP_URL=https://goldsainte.com
API_BASE_URL=https://[your-project-id].supabase.co/functions/v1
```

---

## Supabase Configuration

### Authentication Settings
- [ ] Email confirmation: **Enabled** (or auto-confirm for testing)
- [ ] Password requirements: Minimum 8 characters
- [ ] OAuth providers configured (Google, Apple)
- [ ] Email templates customized
- [ ] Site URL set to production domain
- [ ] Redirect URLs whitelist includes all valid paths

### Database
- [ ] All migrations applied successfully
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] User roles table created (separate from profiles)
- [ ] Webhook idempotency table created
- [ ] Audit logs table created

### Storage
- [ ] Buckets created: `avatars`, `travel-documents`, `package-images`, `chat-attachments`
- [ ] Storage policies configured
- [ ] File size limits set (max 10MB for images, 50MB for docs)
- [ ] Virus scanning enabled (if available)

### Edge Functions
- [ ] All edge functions deployed
- [ ] JWT verification enabled/disabled as appropriate per function
- [ ] CORS headers configured
- [ ] Function timeouts set appropriately
- [ ] Rate limiting configured

### Realtime
- [ ] Realtime enabled on required tables:
  - [ ] `messages` (chat)
  - [ ] `marketplace_milestones` (payment tracking)
  - [ ] `group_participants` (group bookings)
  - [ ] `notifications`

---

## Stripe Configuration

### Test Mode (Staging)
- [ ] Test publishable key: `pk_test_...`
- [ ] Test secret key: `sk_test_...`
- [ ] Test webhook endpoint: `https://staging.goldsainte.com/webhooks/stripe`
- [ ] Test webhook secret: `whsec_...`

### Live Mode (Production)
- [ ] Live publishable key: `pk_live_...`
- [ ] Live secret key: `sk_live_...`
- [ ] Live webhook endpoint: `https://goldsainte.com/webhooks/stripe`
- [ ] Live webhook secret: `whsec_...`
- [ ] Webhook events subscribed:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
  - [ ] `transfer.created`
  - [ ] `payout.paid`
  - [ ] `account.updated`

### Stripe Connect (for Creator Payouts)
- [ ] Connect platform activated
- [ ] Application name and branding configured
- [ ] Connect Client ID obtained
- [ ] Onboarding flow tested with test accounts
- [ ] Payout schedule set (daily/weekly/monthly)
- [ ] Platform fees configured correctly

---

## DNS & Domain Configuration

### Primary Domain
- [ ] DNS records configured:
  - [ ] A record: `goldsainte.com` → Load balancer IP
  - [ ] CNAME: `www.goldsainte.com` → `goldsainte.com`
  - [ ] CNAME: `api.goldsainte.com` → Supabase functions
- [ ] SSL certificate installed (Let's Encrypt or similar)
- [ ] HTTPS redirect enabled
- [ ] HSTS headers configured

### Subdomains
- [ ] `staging.goldsainte.com` → Staging environment
- [ ] `admin.goldsainte.com` → Admin dashboard (if separate)

---

## CDN Configuration

- [ ] CloudFlare (or similar) configured
- [ ] Static assets cached (images, CSS, JS)
- [ ] Cache invalidation strategy in place
- [ ] DDoS protection enabled
- [ ] Rate limiting rules configured

---

## Monitoring & Observability

### Error Tracking (Sentry)
- [ ] Sentry project created
- [ ] DSN configured in frontend and backend
- [ ] Source maps uploaded for production builds
- [ ] Error alerts configured (email/Slack)
- [ ] Release tracking enabled

### Analytics (Google Analytics / Mixpanel)
- [ ] GA4 property created
- [ ] Measurement ID configured
- [ ] Custom events tracked:
  - [ ] Voice wake word activation
  - [ ] Booking choice (agent vs self-service)
  - [ ] Package booking completion
  - [ ] Marketplace job creation
  - [ ] Group trip creation
  - [ ] Milestone funding/release

### Performance Monitoring
- [ ] Lighthouse CI configured
- [ ] Core Web Vitals tracked
- [ ] Performance budgets set:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

### Logging
- [ ] Supabase logs enabled
- [ ] Edge function logs retention: 7 days minimum
- [ ] Database slow query logging enabled
- [ ] Log aggregation tool configured (optional: Datadog, Loggly)

---

## Security Configuration

### Headers
- [ ] CSP (Content Security Policy) configured:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.stripe.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';
  ```
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy configured

### CORS
- [ ] Allowed origins whitelist:
  - [ ] `https://goldsainte.com`
  - [ ] `https://www.goldsainte.com`
  - [ ] `https://staging.goldsainte.com` (staging only)

### Rate Limiting
- [ ] API endpoints rate limited:
  - [ ] Auth: 5 requests/minute
  - [ ] Search: 20 requests/minute
  - [ ] Chat: 10 requests/minute
  - [ ] Payments: 5 requests/minute

### File Upload Security
- [ ] File type validation (whitelist: jpg, png, pdf, doc, docx)
- [ ] File size limits enforced
- [ ] Virus scanning enabled (ClamAV or similar)
- [ ] Files stored with random UUIDs (not original names)

---

## Permissions & Access Control

### Database RLS Policies
- [ ] All tables have RLS enabled
- [ ] Policies tested for all user roles:
  - [ ] Anonymous visitors
  - [ ] Authenticated travelers
  - [ ] Creators (Bronze, Gold, Platinum)
  - [ ] Agents
  - [ ] Admins

### User Roles
- [ ] `user_roles` table exists (separate from profiles)
- [ ] Security definer function `has_role()` created
- [ ] Role-based policies implemented:
  - [ ] Traveler: Cannot access admin routes
  - [ ] Creator: Cannot edit other creators' packages
  - [ ] Agent: Cannot approve own milestone releases
  - [ ] Admin: Full access to dashboards

### API Permissions
- [ ] Edge functions require authentication (except public endpoints)
- [ ] Service role key never exposed to frontend
- [ ] Anon key used for client-side operations only

---

## Email & SMS Templates

### Email Templates (SendGrid or similar)
- [ ] Welcome email
- [ ] Email verification
- [ ] Password reset
- [ ] Booking confirmation
- [ ] Milestone funded notification
- [ ] Milestone approved notification
- [ ] Payment received
- [ ] Trip reminder (24 hours before)
- [ ] Review request (post-trip)

### SMS Templates (Twilio or similar)
- [ ] Booking confirmation code
- [ ] Trip reminder
- [ ] Emergency contact notification

---

## Backup & Disaster Recovery

- [ ] Database backups: Daily automatic backups enabled
- [ ] Backup retention: 30 days minimum
- [ ] Point-in-time recovery (PITR) enabled
- [ ] Storage backups: Weekly full backups
- [ ] Disaster recovery runbook documented
- [ ] RTO (Recovery Time Objective): 4 hours
- [ ] RPO (Recovery Point Objective): 1 hour

---

## Compliance & Legal

- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie consent banner implemented
- [ ] GDPR compliance (data export, deletion)
- [ ] CCPA compliance (California residents)
- [ ] PCI-DSS compliance (via Stripe)
- [ ] Data retention policy defined
- [ ] User data export feature available

---

## Performance Optimization

### Frontend
- [ ] Code splitting enabled
- [ ] Lazy loading for routes
- [ ] Image optimization (WebP with fallback)
- [ ] Font subsetting
- [ ] Tree shaking enabled
- [ ] Minification enabled
- [ ] Gzip/Brotli compression

### Backend
- [ ] Database indexes on frequently queried columns
- [ ] Query optimization (no N+1 queries)
- [ ] Connection pooling configured
- [ ] Cache layer (Redis) for frequently accessed data (optional)

---

## Feature Flags

```javascript
// Feature flags for staged rollout
const FEATURE_FLAGS = {
  ENABLE_VOICE_CONCIERGE: true,
  ENABLE_MARKETPLACE: true,
  ENABLE_GROUP_BOOKINGS: true,
  ENABLE_COCURATED_PACKAGES: true,
  ENABLE_PUSH_NOTIFICATIONS: false, // Rollout phase
  ENABLE_SMS_NOTIFICATIONS: false,  // Rollout phase
  ENABLE_ADVANCED_ANALYTICS: false, // Premium feature
}
```

---

## Deployment Checklist

### Pre-deployment
- [ ] All E2E tests passing
- [ ] No P0/P1 bugs on critical paths
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Load testing passed
- [ ] Rollback plan documented

### Deployment
- [ ] Database migrations applied (if any)
- [ ] Edge functions deployed
- [ ] Frontend built and deployed
- [ ] DNS propagation complete
- [ ] SSL certificates valid
- [ ] Smoke tests passing

### Post-deployment
- [ ] Monitor error rates (Sentry)
- [ ] Monitor performance (Lighthouse)
- [ ] Check payment flows (test transaction)
- [ ] Verify webhooks firing correctly
- [ ] Review logs for any critical errors
- [ ] Announce launch to users

---

## Support Contacts

- **Technical Lead:** [Name] - [email]
- **DevOps:** [Name] - [email]
- **Product Owner:** [Name] - [email]
- **Stripe Support:** https://support.stripe.com
- **Supabase Support:** https://supabase.com/support
- **On-call Rotation:** [PagerDuty/OpsGenie link]

---

## Sign-off

- [ ] Technical Lead: _____________ Date: _______
- [ ] QA Lead: _____________ Date: _______
- [ ] Product Owner: _____________ Date: _______
- [ ] Security Team: _____________ Date: _______

---

**Last Updated:** 2025-11-11  
**Version:** 1.0  
**Next Review:** Before production deployment
