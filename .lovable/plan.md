

## Streamline Agent & Brand Applications — Ready to Implement

There is no approval screen blocking you in the app. The previous message presented a plan that was waiting for your confirmation here in the chat. You've confirmed it — I'll now implement both:

1. **Agent Application** (`src/pages/AgentApplicationForm.tsx`) — Consolidate from 11 steps to 5:
   - Step 1: You & Your Business
   - Step 2: Credentials & Expertise
   - Step 3: Sales & Presence
   - Step 4: Insurance & Legal
   - Step 5: Identity Verification

2. **Brand Application** (`src/pages/apply/BrandOnboarding.tsx`) — Consolidate from 8 steps to 5:
   - Step 1: Your Brand
   - Step 2: Details & Location
   - Step 3: Media & Features
   - Step 4: Documents & Legal
   - Step 5: Identity Verification

Same pattern as the creator onboarding streamlining — keep essential fields, defer nice-to-haves to settings, maintain DB compatibility.

