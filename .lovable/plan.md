

## Add Account Type Badge + Dashboard Links to Dropdown Menu

### Changes to `src/components/Header.tsx`

**1. Add account type label in greeting area (both mobile and desktop)**
- Below "Hello, [Name]", add a subtle text line showing account type: "Creator Account", "Traveler Account", "Agent Account", or "Brand Account"
- Derived from existing `accountType` variable — no new queries needed

**2. Add Creator Dashboard link (conditionally for creators only)**
- In the "Account" section (after My Profile), add a `DropdownMenuItem` linking to `/creator-dashboard` with `BarChart3` icon
- Wrapped in `{isCreator && (...)}`

**3. Add Agent Dashboard link (conditionally for agents only)**
- Same section, add a `DropdownMenuItem` linking to `/agent-dashboard` with `LayoutDashboard` icon
- Wrapped in `{isAgentAccount && (...)}`

**4. Add import**
- Add `BarChart3` to the lucide-react import (line 2) — `LayoutDashboard` is already imported

**5. Apply to both mobile and desktop dropdown menus** (duplicate structure exists for both)

### Files to Change
- `src/components/Header.tsx` only

