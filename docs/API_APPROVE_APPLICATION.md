# Approve/Reject Application API

## Endpoint
```
POST /functions/v1/approve-application
```

## Authentication
Requires admin JWT token in Authorization header.

## Overview
This endpoint allows admin users to approve or reject agent and brand applications. Upon approval, it automatically creates auth accounts, profiles, and sends welcome emails with temporary credentials.

---

## Approve Application

### Request

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "action": "approve",
  "applicationId": "uuid",
  "applicationType": "agent" | "brand",
  "approvalNotes": "Excellent credentials, strong portfolio",
  "sendWelcomeEmail": true
}
```

**Parameters:**
- `action` (string, required): Must be "approve"
- `applicationId` (string, required): UUID of the application
- `applicationType` (string, required): Either "agent" or "brand"
- `approvalNotes` (string, optional): Admin notes about the approval decision
- `sendWelcomeEmail` (boolean, optional): Whether to send welcome email with credentials (default: true)

### Response

**Success (200):**
```json
{
  "success": true,
  "userId": "uuid",
  "brandId": "uuid",
  "message": "Application approved successfully",
  "requestId": "uuid"
}
```

**Note:** `brandId` is only returned for brand applications.

**Error (400):**
```json
{
  "error": "Approval failed",
  "message": "Application must be verified before approval. Current status: pending_verification",
  "requestId": "uuid"
}
```

**Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "Insufficient permissions. Admin role required.",
  "requestId": "uuid"
}
```

---

## Reject Application

### Request

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "action": "reject",
  "applicationId": "uuid",
  "applicationType": "agent" | "brand",
  "rejectionReason": "Insufficient professional experience in luxury travel",
  "allowResubmission": true
}
```

**Parameters:**
- `action` (string, required): Must be "reject"
- `applicationId` (string, required): UUID of the application
- `applicationType` (string, required): Either "agent" or "brand"
- `rejectionReason` (string, required): Reason for rejection (sent to applicant)
- `allowResubmission` (boolean, optional): Whether applicant can reapply (default: true)

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Application rejected successfully",
  "requestId": "uuid"
}
```

**Error (400):**
```json
{
  "error": "Rejection failed",
  "message": "Application not found",
  "requestId": "uuid"
}
```

**Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "Missing authorization header",
  "requestId": "uuid"
}
```

---

## What Happens on Approval?

When an application is approved, the system automatically:

1. **Validates** the application is in "verified" status (passed Stripe Identity)
2. **Generates** a secure temporary password (16 characters, mixed case, numbers, special chars)
3. **Creates** Supabase auth account with auto-confirmed email
4. **Creates** profile record in `profiles` table
5. **Creates** role-specific record:
   - Agents: Creates `travel_agents` record
   - Brands: Creates `brand_profiles` record
6. **Assigns** role in `user_roles` table
7. **Updates** application status to "approved"
8. **Logs** audit event in `application_audit_log`
9. **Creates** in-app notification for new user
10. **Sends** welcome email with login credentials (if `sendWelcomeEmail: true`)

### Rollback on Failure

If any step fails after auth account creation, the system automatically:
- Deletes the created auth account
- Returns error with details
- Logs the failure for investigation

---

## What Happens on Rejection?

When an application is rejected, the system:

1. **Validates** the application exists and isn't already rejected
2. **Updates** application status to "rejected"
3. **Stores** rejection reason and timestamp
4. **Logs** audit event in `application_audit_log`
5. **Sends** rejection email to applicant
   - Includes rejection reason
   - Shows reapply button if `allowResubmission: true`

---

## Security Features

✅ **Admin-only access**: Requires admin role verification  
✅ **JWT validation**: Verifies token and checks expiry  
✅ **Audit logging**: All actions logged with actor ID and timestamp  
✅ **Transaction safety**: Rollback on failure for approvals  
✅ **Idempotency**: Returns error if application already approved/rejected  
✅ **Status validation**: Ensures application passed Stripe Identity before approval

---

## Email Templates

### Welcome Email (Approval)
- Subject: "🎉 Welcome to Goldsainte - Your [Agent/Brand] Account is Ready!"
- Includes: Login credentials, next steps, resource links
- Password security: 7-day expiry, must change on first login

### Rejection Email
- Subject: "Update on Your [Agent/Brand] Application"
- Includes: Rejection reason, reapply button (if allowed)
- Support contact: support@goldsainte.com

---

## Testing

### Test Approval Flow
```bash
curl -X POST https://your-project.supabase.co/functions/v1/approve-application \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "applicationId": "123e4567-e89b-12d3-a456-426614174000",
    "applicationType": "agent",
    "approvalNotes": "Strong credentials",
    "sendWelcomeEmail": true
  }'
```

### Test Rejection Flow
```bash
curl -X POST https://your-project.supabase.co/functions/v1/approve-application \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "applicationId": "123e4567-e89b-12d3-a456-426614174000",
    "applicationType": "agent",
    "rejectionReason": "Insufficient experience",
    "allowResubmission": true
  }'
```

---

## Environment Variables

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `FRONTEND_URL`: Your frontend URL (default: https://goldsainte.com)

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Application must be verified before approval" | Application status is not "verified" | Wait for Stripe Identity verification to complete |
| "Missing authorization header" | No JWT token provided | Include `Authorization: Bearer <token>` header |
| "Insufficient permissions" | User is not an admin | Ensure user has admin role in `profiles.role` |
| "Application not found" | Invalid applicationId | Verify the UUID exists in agent_applications or brand_applications |
| "Application already approved" | Attempting to approve twice | Application is already processed |

---

## Related Endpoints

- **Create Identity Verification**: `/functions/v1/create-identity-verification`
- **Identity Webhook**: `/functions/v1/stripe-identity-webhook`

---

## Support

For issues or questions:
- Email: dev@goldsainte.com
- Docs: https://docs.goldsainte.com
- Logs: Check Supabase edge function logs for requestId
