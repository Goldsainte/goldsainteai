# Goldsainte Environment Variables Checklist

## ✅ Status Legend
- ✅ **Configured** - Already set up in Supabase
- ⚠️ **Required but Missing** - Needed for core functionality
- 📋 **Optional** - Enhances features but not required
- 🔄 **Needs Update** - Configured but may need production values

---

## 🔴 Critical (Required for Core Functionality)

### Supabase Database & Auth
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `SUPABASE_URL` | ✅ Configured | Supabase project URL | All edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configured | Admin access to database | Edge functions requiring admin access |
| `SUPABASE_ANON_KEY` | ✅ Configured | Public key for client-side | Frontend React app |

### Stripe Payments
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `STRIPE_SECRET_KEY` | ✅ Configured | Stripe API secret key | Payment processing, subscriptions |
| `STRIPE_WEBHOOK_SECRET_IDENTITY` | ✅ Configured | Webhook signature verification | Stripe Identity webhooks |
| `STRIPE_RETURN_URL` | ✅ Configured | Redirect after Stripe Connect | Agent/brand onboarding |
| `STRIPE_REFRESH_URL` | ✅ Configured | Redirect if Connect abandoned | Agent/brand onboarding |

### Email Service
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `RESEND_API_KEY` | ✅ Configured | Resend email API key | Welcome emails, notifications |
| `EMAIL_PROVIDER` | 📋 Optional (defaults to "resend") | Email service provider | email-service.ts |
| `FROM_EMAIL` | 📋 Optional (defaults to noreply@goldsainte.com) | Sender email address | All outgoing emails |
| `FROM_NAME` | 📋 Optional (defaults to "Goldsainte") | Sender display name | All outgoing emails |
| `SUPPORT_EMAIL` | 📋 Optional (defaults to support@goldsainte.com) | Support contact email | Email templates |

### Application URLs
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `FRONTEND_URL` | 📋 Optional (defaults to https://goldsainte.com) | Frontend application URL | Email links, redirects |

---

## 🟡 High Priority (Enhances Core Features)

### AI Features
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `OPENAI_API_KEY` | ✅ Configured | OpenAI API for Madison concierge | AI chat functionality |
| `LOVABLE_API_KEY` | ✅ Configured (cannot be deleted) | Lovable AI services | Internal AI features |

### Travel APIs
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `AMADEUS_API_KEY` | ✅ Configured | Amadeus flight/hotel search | Concierge flight/hotel search |
| `AMADEUS_API_SECRET` | ✅ Configured | Amadeus API authentication | Concierge API calls |
| `VIATOR_API_KEY` | ✅ Configured | Viator experiences API | Activity/experience search |

### Maps & Location
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `GOOGLE_MAPS_API_KEY` | ✅ Configured | Google Maps integration | Location search, maps display |
| `MAPBOX_PUBLIC_TOKEN` | ✅ Configured | Mapbox alternative | Alternative map provider |

### Monitoring & Analytics
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `VITE_SENTRY_DSN` | ✅ Configured | Sentry error tracking | Production error monitoring |

---

## 🟢 Medium Priority (Optional Integrations)

### Social Media Integrations
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `TIKTOK_CLIENT_KEY` | ✅ Configured | TikTok API integration | Content import from TikTok |
| `TIKTOK_CLIENT_SECRET` | ✅ Configured | TikTok API authentication | TikTok OAuth flow |
| `FACEBOOK_APP_ID` | ✅ Configured | Facebook integration | Social sharing features |
| `FACEBOOK_APP_SECRET` | ✅ Configured | Facebook API authentication | Facebook OAuth flow |

### E-commerce Integrations
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `SHOPIFY_CLIENT_ID` | ✅ Configured | Shopify integration | Brand product sync |
| `SHOPIFY_CLIENT_SECRET` | ✅ Configured | Shopify API authentication | Shopify OAuth flow |
| `ETSY_CLIENT_ID` | ✅ Configured | Etsy integration | Creator product listings |
| `ETSY_CLIENT_SECRET` | ✅ Configured | Etsy API authentication | Etsy OAuth flow |

### Content & Media
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `UNSPLASH_ACCESS_KEY` | ✅ Configured | Unsplash photo library | Stock photos for storyboards |
| `APPLE_MUSIC_KEY_ID` | ✅ Configured | Apple Music integration | Music playlist features |
| `APPLE_MUSIC_TEAM_ID` | ✅ Configured | Apple developer team | Apple Music API auth |
| `APPLE_MUSIC_P8_KEY` | ✅ Configured | Apple Music private key | Apple Music JWT signing |

### Communication
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `TWILIO_ACCOUNT_SID` | ✅ Configured | Twilio SMS service | SMS notifications (optional) |
| `TWILIO_AUTH_TOKEN` | ✅ Configured | Twilio API authentication | SMS API calls |
| `TWILIO_PHONE_NUMBER` | ✅ Configured | Twilio sender phone | SMS sender number |

### Event Services
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `TICKETMASTER_API_KEY` | ✅ Configured | Ticketmaster events | Event discovery features |

---

## 📋 Not Yet Configured (May Be Needed)

### Alternative Email Provider
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `SENDGRID_API_KEY` | ⚠️ Not configured | SendGrid email service | Alternative to Resend |

**Note:** Only needed if you switch `EMAIL_PROVIDER` to "sendgrid"

### OAuth Providers
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `GOOGLE_CLIENT_ID` | ✅ Configured | Google OAuth login | Social authentication |
| `GOOGLE_CLIENT_SECRET` | ✅ Configured | Google OAuth secret | Google login flow |

### Security & Rate Limiting
| Variable | Status | Description | Where Used |
|----------|--------|-------------|------------|
| `SEND_EMAIL_HOOK_SECRET` | ✅ Configured | Email webhook security | Email event verification |

---

## 🔧 Production-Specific Configuration Needed

### URLs to Update for Production
```bash
# Frontend
VITE_APP_URL=https://goldsainte.com  # Update from staging
FRONTEND_URL=https://goldsainte.com  # Update from staging

# Email Configuration
FROM_EMAIL=noreply@goldsainte.com    # Verify domain is validated in Resend
SUPPORT_EMAIL=support@goldsainte.com # Set up support inbox

# Stripe
STRIPE_RETURN_URL=https://goldsainte.com/connect/return  # Production URL
STRIPE_REFRESH_URL=https://goldsainte.com/connect/retry  # Production URL
```

### Stripe Webhook Endpoints to Configure
After deploying to production, configure these webhook endpoints in Stripe dashboard:

1. **Stripe Identity Webhook:**
   - URL: `https://ktzsgqrqvwtxlimctkaf.supabase.co/functions/v1/stripe-identity-webhook`
   - Events: `identity.verification_session.verified`, `identity.verification_session.requires_input`, `identity.verification_session.canceled`
   - Secret: Already configured in `STRIPE_WEBHOOK_SECRET_IDENTITY`

---

## 📝 Configuration Priority Checklist

### ✅ Phase 1: Core Platform (Already Complete)
- [x] Supabase database connection
- [x] Stripe payment processing
- [x] Email service (Resend)
- [x] Agent/brand identity verification

### ✅ Phase 2: AI & Search (Already Complete)
- [x] OpenAI for Madison concierge
- [x] Amadeus flight/hotel search
- [x] Viator experiences
- [x] Google Maps/location

### ✅ Phase 3: Monitoring (Already Complete)
- [x] Sentry error tracking

### 📋 Phase 4: Optional Enhancements (Configure as needed)
- [ ] Social media integrations (TikTok, Facebook)
- [ ] E-commerce integrations (Shopify, Etsy)
- [ ] SMS notifications (Twilio)
- [ ] Additional content sources (Unsplash, Apple Music)

---

## 🚀 Quick Setup Commands

### Check Current Configuration
```bash
# View all configured secrets (from Lovable chat)
"Check what secrets are configured"
```

### Add Missing Secrets
```bash
# If you need to add SENDGRID_API_KEY
"Add secret SENDGRID_API_KEY"

# The AI will prompt you with a secure form to enter the value
```

### Update Production URLs
```bash
# Update URL-related environment variables for production
"Update FRONTEND_URL to https://goldsainte.com"
```

---

## ⚠️ Security Notes

1. **Never commit secret keys to git** - All secrets are stored securely in Supabase
2. **Rotate keys regularly** - Especially production Stripe keys
3. **Use different keys for test/production** - Keep test and live environments separate
4. **Monitor secret usage** - Review edge function logs for authentication errors
5. **Validate webhook signatures** - Always verify Stripe webhook signatures

---

## 📚 Related Documentation

- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Resend Email Setup](https://resend.com/docs/send-with-nodejs)
- [Amadeus API Docs](https://developers.amadeus.com/)

---

**Last Updated:** 2025-01-25  
**Status:** Production-Ready ✅  
**Total Secrets Configured:** 33/35 (94%)
