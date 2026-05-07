## Reset each "How Goldsainte Works" animation to scene 1 on tab click

Currently `HomeLuxurySections.tsx` mounts all three animation components at once and cross-fades between them on `activeTab` change. Each component owns its own `step` state and an interval that keeps advancing while the component is mounted, so when a user switches tabs the newly visible animation is often mid-loop instead of starting at scene 1.

### Fix

In `src/sections/HomeLuxurySections.tsx`, inside the `Object.entries(tabAnimations).map(...)` block, give each animation wrapper a `key` that changes whenever that tab becomes active. React will unmount the previous instance and mount a fresh one, which resets `useState(0)` back to scene 0 and restarts the `setInterval` loop from the beginning.

Concretely:

```text
key={`${tabId}-${activeTab === tabId ? "active" : "idle"}`}
```

This keeps the existing cross-fade behavior and the existing component map untouched — only the React `key` changes, forcing a remount of the just-activated tab.

### Why not change the components themselves

The three components (`CreatorAIMagic`, `TravelerDiscoveryMagic`, `AgentProposalMagic`) are self-contained and shared between scenes. Adding an external "reset" prop would require threading state into all three. The remount-via-key approach is one line, no API changes, and preserves the reduced-motion fallback inside each component.

### Out of scope

- No changes to scene timing, copy, visuals, or the animation components themselves.
- No changes to other sections or routes.
