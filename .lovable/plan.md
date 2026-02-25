

# Remove Creators, Agents, Brands Tabs from Marketplace

## What changes
Strip the marketplace tabs down to just **Ready to Book** and **Trip Requests**. The Creators, Agents, and Brands tabs (and their corresponding grid rendering logic) will be removed from the marketplace page.

## Files to modify

### 1. `src/components/marketplace/MarketplaceTabs.tsx`
- Remove the Creators, Agents, and Brands tab objects from the `tabs` array
- Keep only "trips" (Ready to Book) and "trip-requests" (Trip Requests)
- Update the `Tab` type union from `"trips" | "creators" | "agents" | "brands" | "trip-requests"` to `"trips" | "trip-requests"`
- Remove unused icon imports (`Users`, `Briefcase`, `Building2`)
- Make Trip Requests always visible (remove the `isTraveler` conditional, remove `accountType` prop)

### 2. `src/pages/Marketplace.tsx`
- Update the `Tab` type from `"trips" | "creators" | "agents" | "brands" | "trip-requests"` to `"trips" | "trip-requests"`
- Remove the conditional rendering blocks for `activeTab === "creators"`, `activeTab === "agents"`, and `activeTab === "brands"`
- Remove unused imports: `CreatorGrid`, `AgentGrid`, `BrandGrid`, `BrandEmptyState`, `BrandSummary`
- Remove the data-fetching logic for creators, agents, and brands (queries, state, effects) since those tabs no longer exist
- Keep all trips and trip-requests data fetching intact

## Technical detail
The `MarketplaceTabs` component type signature changes from accepting 5 tab values to 2. The `accountType` prop becomes unnecessary since Trip Requests will be visible to all users in the marketplace context. Creators, Agents, and Brands remain accessible via their dedicated routes (`/creators`, `/agents`) linked from elsewhere in the app — they are just removed from the marketplace tab bar.

