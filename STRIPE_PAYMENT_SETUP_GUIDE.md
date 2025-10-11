# Stripe Payment Setup Troubleshooting Guide

## Overview
This guide helps diagnose and fix issues with Stripe creator payout setup.

---

## Common Error Scenarios

### 1. "Popup Blocked" Error
**Symptoms**: 
- Clicking "Set Up Payouts" does nothing
- No new tab opens
- Browser shows popup blocked notification

**Solution**:
1. Allow popups for goldsainteai.lovable.app in browser settings
2. Try again after allowing popups
3. Click "Refresh Status" after completing Stripe setup

---

### 2. "Stripe Connect Not Enabled" Error
**Symptoms**:
- Error message: "Haven't signed up for Connect"
- Onboarding fails to start

**Solution** (Platform Owner Only):
1. Log into Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to Connect → Settings
3. Enable Stripe Connect
4. Select "Express" accounts
5. Save settings
6. Try onboarding again

**Note**: This is a one-time platform setup. Individual creators don't need to do this.

---

### 3. "Platform Profile" or "Managing Losses" Error
**Symptoms**:
- Error about "platform-profile" or "managing losses"
- Account creation fails

**Solution** (Platform Owner Only):
1. Go to: https://dashboard.stripe.com/settings/connect/platform-profile
2. Complete the "Losses" section
3. Accept liability for platform losses (standard for marketplaces)
4. Save settings
5. Try onboarding again

---

### 4. Onboarding Incomplete
**Symptoms**:
- Stripe opens but returns showing "Pending" status
- Payouts not enabled

**Solution**:
1. Return to Stripe onboarding link
2. Complete all required fields:
   - Business information
   - Bank account details
   - Identity verification
   - Tax information
3. Submit verification documents if requested
4. Return to Creator Dashboard
5. Click "Refresh Status"

---

## How It Works

### Normal Flow
1. Creator clicks "Set Up Payouts"
2. System creates or retrieves Stripe Connect Express account
3. New tab opens with Stripe onboarding
4. Creator completes Stripe form
5. Stripe redirects back with `?onboarding=complete`
6. System automatically refreshes status
7. Dashboard shows "Active" with payouts enabled

### Technical Details
- **Account Type**: Stripe Connect Express
- **Payout Schedule**: Daily (minimum delay)
- **Commission Split**: Platform keeps 30%, creator receives 70%
- **Transfer Method**: Direct bank transfer via ACH/Wire

---

## Verification Checklist

Before contacting support, verify:

- [ ] User is signed in to Goldsainte
- [ ] Browser allows popups
- [ ] Stable internet connection
- [ ] Stripe Connect is enabled (platform owner)
- [ ] Platform profile is complete (platform owner)
- [ ] All required information ready (SSN, EIN, bank details)
- [ ] Clicked "Refresh Status" after completing Stripe form

---

## Status Meanings

| Status | Meaning | Next Steps |
|--------|---------|------------|
| Not Connected | No Stripe account exists | Click "Set Up Payouts" |
| Pending | Account created but incomplete | Continue Stripe onboarding |
| Active | Fully verified and enabled | Start receiving payouts |
| Restricted | Issues with account | Check Stripe dashboard for details |

---

## Testing the Setup

1. **Check Account Status**: 
   - Creator Dashboard → Payout Setup card
   - Should show "Active" with green checkmarks

2. **Test a Payout**:
   - Have someone send you a virtual gift
   - Check Creator Earnings tab
   - Verify amount shows as "pending"
   - Payout processes next business day

3. **Monitor Transactions**:
   - Check Escrow tab for payment tracking
   - Verify commission calculations
   - Confirm platform fees are correct (30%)

---

## Edge Function Logs

When debugging, check these log patterns:

```
[STRIPE-ONBOARDING] Starting onboarding process...
[STRIPE-ONBOARDING] Received URL: https://connect.stripe.com/...
[STRIPE-ONBOARDING] Error: <error details>
```

Common log errors:
- "User not authenticated" → Sign in required
- "stripe_account_id is null" → Creating new account
- "No onboarding URL received" → Check Stripe Connect setup

---

## Support Contact

If issues persist after following this guide:
1. Check browser console for error messages
2. Note the exact error message shown
3. Screenshot the Payout Setup card
4. Contact platform support with details

---

## Security Notes

- Never share your Stripe account credentials
- Stripe onboarding happens on Stripe's secure servers
- Platform never sees your bank account details
- All sensitive data is encrypted in transit
- PCI DSS compliant payment processing
