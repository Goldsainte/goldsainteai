

# Remove "Hey Goldsainte" Wake Word Feature

## Scope
Strip out the wake word detection system entirely — the `WakeWordDetector` utility, all references in `AIBookingConcierge`, the settings toggle, the voice status message for wake-active state, the test WAV file, and related test specs.

## Files to Delete (2 files)
1. `src/utils/WakeWordDetector.ts` — the wake word detector class
2. `public/test/hey-goldsainte.wav` — test audio file for loopback testing

## Files to Edit

### 1. `src/components/AIBookingConcierge.tsx`
- Remove import of `WakeWordDetector`
- Remove `wakeWordDetectorRef`, `wakeWordActive` state, `wakeWordPrimed` state
- Remove all wake word initialization logic (the `WakeWordDetector` constructor calls, `.start()`, `.stop()`)
- Remove wake word pause/resume during voice calls
- Remove the loopback test that fetches `hey-goldsainte.wav`
- Remove wake-active `VoiceStatusMessage` rendering
- Remove `wakeWordDetectorRef` prop passed to `VoiceDiagnosticsPanel`
- Clean up the unmount effect that stops wake word

### 2. `src/components/AIChatSettingsPanel.tsx`
- Remove `wakeWordEnabled` from the `ChatPreferences` type and `DEFAULT_PREFERENCES`
- Remove the "Wake Word Detection" toggle UI block

### 3. `src/components/concierge/VoiceStatusMessage.tsx`
- Remove the `'wake-active'` status option and its message string

### 4. `src/components/VoiceDiagnosticsPanel.tsx`
- Remove `wakeWordDetectorRef` prop
- Remove wake word status detection logic

### 5. `src/components/partners/PartnersFAQ.tsx`
- Update the FAQ answer that mentions "Hey Goldsainte" to remove that reference

### 6. Test files (cleanup)
- `e2e/critical-voice.spec.ts` — remove or update the wake word test
- `tests/04-homepage.spec.ts` and `tests/06-voice-concierge.spec.ts` — remove `Hey Goldsainte` selectors from locator strings

