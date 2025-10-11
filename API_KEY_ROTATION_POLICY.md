# API Key Rotation Policy

## Overview
This document outlines the procedures for managing and rotating API keys used in edge functions to maintain security and prevent unauthorized access.

## API Keys in Use

### External Service APIs
- **Amadeus API** (Flight & Hotel Search)
  - Keys: `AMADEUS_API_KEY`, `AMADEUS_API_SECRET`
  - Location: Supabase Secrets
  - Usage: Flight search, hotel search, booking operations
  
- **Expedia API** (Hotel Search & Booking)
  - Keys: `EXPEDIA_API_KEY`, `EXPEDIA_API_SECRET`
  - Location: Supabase Secrets
  - Usage: Hotel search, availability, bookings

- **Stripe API** (Payment Processing)
  - Key: `STRIPE_SECRET_KEY`
  - Location: Supabase Secrets
  - Usage: Payment processing, customer management

- **TripAdvisor API** (Restaurant & Hotel Search)
  - Key: `TRIPADVISOR_API_KEY`
  - Location: Supabase Secrets
  - Usage: Restaurant search, hotel reviews

- **OpenAI API** (AI Features)
  - Key: `OPENAI_API_KEY`
  - Location: Supabase Secrets
  - Usage: AI booking assistant, content generation

## Rotation Schedule

### Quarterly Rotation (Every 3 Months)
- All external API keys should be rotated
- Schedule rotations for low-traffic periods
- Maintain overlap period with old keys active

### Immediate Rotation Triggers
Rotate keys immediately if:
- Key appears in logs or error messages
- Suspicious API usage detected
- Team member with key access leaves
- Security incident or breach suspected
- Unusual API charges or rate limit hits

## Rotation Procedure

### 1. Generate New Key
1. Log into the API provider's dashboard
2. Generate a new API key
3. Document the key generation date
4. Keep old key active temporarily

### 2. Update Supabase Secrets
1. Access Lovable Cloud backend (use the "View Backend" button)
2. Navigate to Project Settings > Edge Functions > Secrets
3. Update the secret with the new key value
4. Test immediately after update

### 3. Validation Period
1. Monitor edge function logs for 24-48 hours
2. Check for authentication errors
3. Verify API calls succeed with new key
4. Monitor API usage patterns

### 4. Deactivate Old Key
1. After validation period, revoke old key
2. Document deactivation date
3. Update rotation log

### 5. Post-Rotation Checklist
- [ ] New key tested in all edge functions using it
- [ ] No errors in edge function logs
- [ ] API usage patterns normal
- [ ] Old key revoked
- [ ] Rotation documented

## Monitoring & Alerts

### API Usage Monitoring
Set up alerts for:
- Unexpected spike in API calls
- Failed authentication attempts
- Rate limit warnings
- Unusual geographic access patterns
- Cost threshold breaches

### Recommended Alert Thresholds
- **Amadeus API**: > 1000 calls/hour
- **Expedia API**: > 500 calls/hour
- **Stripe API**: > 200 calls/hour
- **OpenAI API**: > $100/day in costs

### Monitoring Tools
1. **Edge Function Logs**: Check Supabase edge function logs daily
2. **API Provider Dashboards**: Review usage weekly
3. **Cost Monitoring**: Set budget alerts in each provider

## Key Compromise Response Plan

### If a Key is Compromised:

#### Immediate Actions (Within 1 Hour)
1. **Revoke** the compromised key in provider dashboard
2. **Generate** new key immediately
3. **Update** Supabase secret with new key
4. **Notify** team of the incident
5. **Monitor** API usage for unauthorized activity

#### Follow-up Actions (Within 24 Hours)
1. Review edge function logs for suspicious activity
2. Check for unusual API charges
3. Audit recent API calls
4. Document incident and response
5. Update security procedures if needed

#### Long-term Actions
1. Investigate how key was compromised
2. Implement additional security measures
3. Review access controls
4. Consider short-lived tokens where possible

## Best Practices

### Key Storage
- ✅ Store keys in Supabase Secrets only
- ✅ Never commit keys to code repositories
- ✅ Never log keys in edge functions
- ✅ Use environment variables in edge functions
- ❌ Never hardcode keys in source files
- ❌ Never share keys via email or chat

### Key Access
- Limit team members with secret access
- Use principle of least privilege
- Audit secret access logs regularly
- Revoke access when team members leave

### Key Usage
- Use separate keys for development/production when possible
- Implement request signing where supported
- Use OAuth 2.0 tokens instead of API keys when available
- Rotate credentials after major provider security updates

## Rotation Log Template

| Date | API Provider | Key Rotated | Performed By | Reason | Notes |
|------|-------------|-------------|--------------|--------|-------|
| YYYY-MM-DD | Amadeus | AMADEUS_API_KEY | Name | Quarterly | Successful |
| YYYY-MM-DD | Stripe | STRIPE_SECRET_KEY | Name | Quarterly | Successful |

## Contact Information

### API Provider Support
- **Amadeus**: developer.support@amadeus.com
- **Expedia**: rapidapi.com/support
- **Stripe**: support.stripe.com
- **TripAdvisor**: developer.tripadvisor.com/support

### Internal Escalation
- Security Incidents: Notify admin immediately
- Key Compromise: Follow response plan above

## Review Schedule
- Review this policy quarterly
- Update procedures after any security incident
- Audit compliance monthly

---

**Last Updated**: 2025-10-11
**Next Review**: 2026-01-11
**Policy Owner**: Project Administrator
