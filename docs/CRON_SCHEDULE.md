# Goldsainte Cron Job Schedule

## Overview

This document describes all scheduled maintenance tasks for the Goldsainte platform.

---

## Daily Maintenance Runner

### Function
`supabase/functions/run-daily-maintenance/index.ts`

### Schedule
**Daily at 2:00 AM UTC**

### Tasks Performed

1. **Expire Old Marketplace Jobs**
   - RPC: `expire_old_marketplace_jobs()`
   - Updates jobs where `status = 'open'` and `expires_at < NOW()` to `status = 'expired'`
   - Prevents stale job listings

2. **Clean Expired OAuth States**
   - RPC: `cleanup_expired_oauth_states()`
   - Deletes `oauth_states` where `expires_at < NOW()`
   - Keeps table size manageable

3. **Clean Expired Search Cache**
   - RPC: `cleanup_expired_cache()`
   - Deletes `search_cache` where `expires_at < NOW()`
   - Frees storage and improves cache hit rate

4. **Check Expiring Subscriptions**
   - Invokes: `check-expiring-subscriptions` function
   - Sends notification emails to users with subscriptions expiring in 7 days
   - Prevents involuntary subscription lapses

5. **[Future] Prune Old Presence Heartbeats**
   - Currently commented out
   - Will delete presence data older than 2 hours
   - Enable when presence is tracked in database

### Setup Instructions

**Step 1**: Run in Supabase SQL Editor

```sql
SELECT cron.schedule(
  'daily-maintenance',           -- Job name
  '0 2 * * *',                   -- Cron expression (2 AM UTC daily)
  $$
  SELECT net.http_post(
    url := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/run-daily-maintenance',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Step 2**: Replace `YOUR_ANON_KEY` with actual Supabase anon key

**Step 3**: Verify job is scheduled
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-maintenance';
```

### Monitoring

**Success Response**:
```json
{
  "ok": true,
  "timestamp": "2025-01-21T02:00:15.234Z",
  "durationMs": 2145,
  "results": {
    "expireJobs": "success",
    "cleanupOAuth": "success",
    "cleanupCache": "success",
    "checkSubscriptions": { "success": true, "notificationsSent": 3 }
  }
}
```

**Error Response**:
```json
{
  "error": "Maintenance run failed",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "durationMs": 1234,
  "results": {
    "expireJobs": "success",
    "cleanupOAuth": { "error": "RPC not found" }
  }
}
```

**Log Search**: `[daily-maintenance]` to view execution history

### Alerts

Set up alerts for:
- ❌ Maintenance run fails 2 consecutive days
- ⚠️ Any task returns error status
- ⚠️ Duration exceeds 10 seconds (indicates performance issue)

---

## Other Scheduled Tasks

### Check Expiring Subscriptions
**Function**: `check-expiring-subscriptions`  
**Schedule**: Called by daily maintenance runner  
**Purpose**: Send email reminders 7 days before subscription expires

### [Future] Update Agent Metrics
**Function**: `update-agent-metrics`  
**Schedule**: TBD (weekly recommended)  
**Purpose**: Recalculate agent performance scores

### [Future] Prune Old Analytics Events
**Function**: TBD  
**Schedule**: Monthly  
**Purpose**: Archive events older than 90 days

---

## Cron Expression Reference

```
*    *    *    *    *
┬    ┬    ┬    ┬    ┬
│    │    │    │    └─ Day of week (0-7, Sunday = 0 or 7)
│    │    │    └────── Month (1-12)
│    │    └─────────── Day of month (1-31)
│    └──────────────── Hour (0-23)
└───────────────────── Minute (0-59)
```

**Examples**:
- `0 2 * * *` - Daily at 2 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on 1st at midnight

---

## Troubleshooting

### Job Not Running

**Check if scheduled**:
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-maintenance';
```

**Check execution history**:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-maintenance')
ORDER BY start_time DESC 
LIMIT 10;
```

**Check function logs**:
- Navigate to Supabase Dashboard → Edge Functions → run-daily-maintenance → Logs
- Search for `[daily-maintenance]` prefix

### Task Failing

**Review results object** in response to identify which task failed

**Common issues**:
- RPC function not found (migration not applied)
- Permission denied (check RLS policies)
- Timeout (increase function timeout in config)

### Unschedule Job

```sql
SELECT cron.unschedule('daily-maintenance');
```

---

**Last Updated**: 2025-01-21
