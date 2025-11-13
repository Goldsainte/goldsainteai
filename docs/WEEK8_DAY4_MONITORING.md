# Week 8, Day 4: Monitoring & Observability

**Date:** 2025-01-XX  
**Phase:** Production Readiness - Week 8 (Final Polish)  
**Focus:** Sentry Dashboard Configuration & Production Monitoring

---

## 📋 Overview

Week 8 Day 4 focuses on validating and configuring the comprehensive Sentry monitoring infrastructure already implemented in Week 7. This includes verifying alert rules, testing error capture, and ensuring production-ready observability.

**Note:** Sentry integration was completed in Week 7. This day focuses on validation, testing, and dashboard configuration.

---

## ✅ Already Implemented (Week 7)

### Core Monitoring Features
- ✅ Sentry error capture with breadcrumbs
- ✅ Performance monitoring (LCP, FID, CLS, Long Tasks)
- ✅ Session replay with privacy controls
- ✅ Custom alert rules (8 critical alerts)
- ✅ Source maps upload configuration
- ✅ Release tagging for error tracking

### Files Implemented
- `src/lib/monitoring/sentry-config.ts` - Performance monitoring
- `src/lib/monitoring/session-replay.ts` - Privacy-aware replay
- `src/lib/monitoring/alerts.ts` - Alert rule definitions
- `src/main.tsx` - Sentry initialization
- `docs/MONITORING_RUNBOOK.md` - Complete operational guide
- `src/components/SentryTestButton.tsx` - Dev testing tools

---

## 🎯 Day 4 Tasks: Validation & Configuration

### 1. Verify Sentry DSN Configuration

**Status:** ✅ Complete  
**Location:** Project Settings → Secrets → `VITE_SENTRY_DSN`

**Verification Steps:**
```bash
# Check DSN is configured
echo $VITE_SENTRY_DSN

# Verify Sentry status chip shows "Env" or "Fallback"
# Visit /system-health page to see dev tools
```

### 2. Test Error Capture

**Location:** `/system-health` → Development Tools → Sentry Test Controls

**Test Cases:**
- ✅ Trigger Test Error → Verify appears in Sentry dashboard
- ✅ Trigger Slow Operation → Verify performance metric logged
- ✅ Trigger Warning → Verify warning message captured

**Expected Results:**
- Errors appear in Sentry within 10 seconds
- Stack traces are symbolicated (readable)
- Session replay attached to errors

### 3. Configure Sentry Dashboard Alerts

**Navigate to:** Sentry Dashboard → Alerts → Create Alert Rule

#### Critical Alerts to Configure:

**A. High Error Rate Alert**
```yaml
Type: Issue Alert
Conditions:
  - The issue is seen more than 10 times in 5 minutes
Actions:
  - Send notification to #engineering-alerts Slack
  - Send email to on-call engineer
Priority: Critical
```

**B. Performance Degradation Alert**
```yaml
Type: Metric Alert
Conditions:
  - P95 response time > 1000ms for 5 minutes
Actions:
  - Send notification to #performance Slack
  - Create Jira ticket
Priority: High
```

**C. Payment Failure Alert**
```yaml
Type: Issue Alert
Conditions:
  - Error with tag payment_failed appears
Actions:
  - Send notification to #payments-critical Slack
  - Page on-call engineer
Priority: Critical
```

**D. Webhook Failure Alert**
```yaml
Type: Issue Alert
Conditions:
  - Error with tag webhook_failed appears more than 3 times
Actions:
  - Send notification to #integrations Slack
  - Create incident
Priority: High
```

### 4. Verify Alert Rules in Code

**File:** `src/lib/monitoring/alerts.ts`

**Implemented Alert Rules:**
- ✅ Payment failures → Tag: `payment_failed`
- ✅ API outages >5 min → Tag: `api_outage`
- ✅ Auth errors >10 in 5 min → Tag: `auth_error`
- ✅ High memory >500MB → Tag: `high_memory`
- ✅ Slow DB queries >500ms → Tag: `slow_query`
- ✅ Webhook failures → Tag: `webhook_failed`
- ✅ High error rates >1% → Tag: `high_error_rate`

### 5. Test Session Replay

**Steps:**
1. Trigger test error via Sentry Test Button
2. Open Sentry dashboard
3. Find error event
4. Click "Replay" tab
5. Verify video shows user actions leading to error

**Privacy Validation:**
- ✅ Input fields masked
- ✅ Text blocks masked
- ✅ PII redacted from network logs
- ✅ Auth tokens removed

---

## 📊 Dashboard Configuration

### Sentry Dashboard Widgets

**1. Error Overview**
- Total errors (24h)
- Error rate trend
- Top 5 errors by frequency
- Errors by browser/device

**2. Performance Metrics**
- P95 response times
- LCP distribution
- FID distribution
- CLS scores

**3. User Impact**
- Affected users count
- Crash-free sessions %
- Session duration distribution

**4. Release Health**
- Latest release errors
- Release comparison
- Adoption rate

---

## 🔧 Production Configuration Checklist

### Environment Variables
- [x] `VITE_SENTRY_DSN` configured in production
- [x] Source maps uploaded (via vite.config.ts)
- [x] Release tags configured (git SHA)
- [x] Environment tag set (production/staging)

### Alert Channels
- [ ] Slack webhook configured for #engineering-alerts
- [ ] PagerDuty integration enabled
- [ ] Email notifications configured
- [ ] Jira integration enabled (optional)

### Data Retention
- [ ] Set retention period (default: 90 days)
- [ ] Configure data scrubbing rules
- [ ] Enable IP address anonymization (GDPR)
- [ ] Configure quota alerts (80% usage)

### Team Access
- [ ] Add team members to Sentry project
- [ ] Configure role permissions
- [ ] Set up on-call rotation
- [ ] Document escalation procedures

---

## 🧪 Testing Procedures

### Manual Testing

```bash
# 1. Start development server
npm run dev

# 2. Navigate to /system-health
# 3. Use Sentry Test Controls:
#    - Click "Trigger Test Error"
#    - Click "Trigger Slow Operation"
#    - Click "Trigger Warning"

# 4. Verify in Sentry Dashboard:
#    - Check Issues tab for test error
#    - Check Performance tab for slow operation
#    - Check Releases tab for current build
```

### Automated Monitoring

```typescript
// Add to CI/CD pipeline
// Example: Monitor production error rate after deploy

import * as Sentry from '@sentry/react';

async function checkProductionHealth() {
  const response = await fetch('https://sentry.io/api/0/projects/:org/:project/stats/', {
    headers: {
      'Authorization': `Bearer ${SENTRY_API_TOKEN}`
    }
  });
  
  const stats = await response.json();
  const errorRate = stats.stats.reduce((sum, s) => sum + s.error_count, 0);
  
  if (errorRate > 100) {
    console.error('⚠️ High error rate detected after deploy!');
    process.exit(1);
  }
}
```

---

## 📈 Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Error Capture Rate** | >95% | TBD | ⏳ |
| **Source Map Success** | 100% | TBD | ⏳ |
| **Alert Response Time** | <5 min | TBD | ⏳ |
| **Session Replay Rate** | 10% on error | ✅ | ✅ |
| **Performance Tracking** | 100% users | ✅ | ✅ |

---

## 🚨 Common Issues & Solutions

### Issue: Errors not appearing in Sentry

**Solution:**
```bash
# Verify DSN is loaded
console.log(import.meta.env.VITE_SENTRY_DSN)

# Check Sentry initialization
# Should see: [Sentry] Initialized successfully

# Test manually
Sentry.captureException(new Error('Test'));
```

### Issue: Source maps not working

**Solution:**
```typescript
// Verify vite.config.ts has:
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    sentryVitePlugin({
      org: "your-org",
      project: "your-project",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

### Issue: Too many alerts (alert fatigue)

**Solution:**
- Increase alert thresholds
- Add rate limiting to alerts
- Group similar errors
- Set up alert schedules (mute during off-hours)

---

## ✅ Acceptance Criteria

- [x] Sentry DSN configured and verified
- [x] Error capture working (test errors appear in dashboard)
- [x] Performance monitoring active (Web Vitals tracked)
- [x] Session replay configured with privacy controls
- [x] Alert rules defined in code
- [ ] Sentry dashboard alerts configured (8 rules)
- [ ] Alert channels connected (Slack/Email/PagerDuty)
- [ ] Team access configured
- [ ] Production monitoring validated

---

## 🔗 Related Documentation

- [Week 7: Monitoring Implementation](./WEEK7_MONITORING.md)
- [Monitoring Runbook](./MONITORING_RUNBOOK.md)
- [Week 8 Day 3: E2E Testing](./WEEK8_DAY3_E2E_TESTS.md)
- [Production Readiness Checklist](./PRODUCTION_READINESS.md)

---

## 📝 Next Steps

1. **Configure Sentry dashboard alerts** (8 critical rules)
2. **Connect alert channels** (Slack, email, PagerDuty)
3. **Test alert delivery** (trigger test alerts)
4. **Move to Week 8 Day 5:** Final Production Checklist & Launch Preparation

---

**Status:** ✅ Sentry Implementation Complete (Week 7)  
**Current Task:** Configure production alerts and validate monitoring  
**Next Milestone:** Week 8 Day 5 - Final Production Checklist
