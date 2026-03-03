

## Fix: Restrict Welcome Modal to Creator Accounts Only

**Problem**: `useWelcomeModal` triggers for all authenticated users (traveler, creator, agent) who haven't dismissed it yet. It should only appear for **creator** accounts after they first create their account.

**File: `src/hooks/useWelcomeModal.ts`** — line 78

Add an account type guard so the modal only opens for creators:

```typescript
// Current (shows for everyone):
if (!hasSeenWelcome) {
  setOpen(true);
}

// Fixed (creators only):
if (!hasSeenWelcome && profile.account_type === 'creator') {
  setOpen(true);
}
```

This is a single-line change. The `OnboardingWelcomeModal` component already has role-specific content branches, but the hook itself never filters by role — that's the root cause.

Travelers and agents will no longer see any version of this modal.

