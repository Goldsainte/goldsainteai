

# Remove All "Ask Madison" / Concierge Functionality

## Summary
Remove all references to "Madison," "Ask Madison," voice concierge, and the `/concierge` route across the entire codebase. This is a broad cleanup touching ~15 files.

## Changes

### 1. Remove concierge component files entirely
Delete these files (no longer needed):
- `src/components/concierge/WelcomeCard.tsx`
- `src/components/concierge/VoiceStatusMessage.tsx`
- `src/components/concierge/VoiceStatusChip.tsx`
- `src/components/concierge/MusicIndicator.tsx`
- `src/components/concierge/ResultCards.tsx`
- `src/components/concierge/ConciergeIntroModal.tsx`
- `src/components/concierge/StartStoryboardFromChat.tsx`
- `src/components/VoiceConciergeButton.tsx`
- `src/ai/prompts/goldsainteConciergePrompt.ts`

### 2. Remove the `/concierge` route
In `src/routes/AppRoutes.tsx`: remove the `<Route path="/concierge" .../>` line.

### 3. Remove "Ask Madison" button from Traveler Dashboard
In `src/pages/traveler/TravelerDashboardPage.tsx` (lines 158-164): remove the "Ask Madison" button entirely, keeping only the "Post Trip" button.

### 4. Remove Madison accordion + card from TravelerOverviewTab
In `src/pages/traveler/components/TravelerOverviewTab.tsx`:
- Remove the "madison" AccordionItem (lines 135-151) from mobile view
- Remove the "Ask Madison" Card (lines 211-227) from desktop grid, leaving 3 stat cards

### 5. Remove "Ask Madison" links from other pages
- `src/pages/CollectionsPage.tsx` (lines 235-245): Remove the "Ask Madison" button
- `src/pages/TripInboxPage.tsx` (lines 70-72): Remove the "Ask Madison" button
- `src/pages/CreatorTripPage.tsx` (lines 161-166): Remove the "Open in Madison" link
- `src/components/collections/ItineraryDetailDialog.tsx` (lines 199-208): Remove the "Ask Madison" button

### 6. Remove concierge session link from StoryboardEditorPage
In `src/pages/TikTokLab/StoryboardEditorPage.tsx` (lines 370-379): Remove the "Created from your conversation with Madison" banner.

### 7. Remove AI concierge onboarding tour step
In `src/components/OnboardingTour.tsx` (lines 36-41): Remove the `ai-widget` tour step.

### 8. Clean up App.tsx comments
In `src/App.tsx`: Remove the leftover comments about AIBookingConcierge and HIDE_CONCIERGE_WIDGET_PAGES (lines 26, 41).

### 9. Update marketing/text references
- `src/sections/HomeLuxurySections.tsx` (line 311): Rewrite "Hey Goldsainte" voice activation description to remove Madison reference
- `src/components/partners/ValueProposition.tsx` (line 10): Rewrite to remove "Hey Goldsainte" voice concierge reference
- `src/components/partners/PricingTiers.tsx` (line 12): Change "AI concierge" to "AI matching"
- `src/components/home/HowItWorksTimeline.tsx` (line 14): Rewrite step 2 to remove "Madison" name
- `src/components/SocialProof.tsx` (line 16): Rewrite quote to remove "AI concierge"
- `src/pages/onboarding/CreatorOnboardingPage.tsx`: Update Madison references in AI identity section

### 10. Remove test files
- `tests/06-voice-concierge.spec.ts`: Delete entirely
- `e2e/critical-flows.spec.ts` (line 156): Remove concierge URL assertion
- `e2e/critical-voice.spec.ts`: Delete entirely

