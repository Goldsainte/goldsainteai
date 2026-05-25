# Goldsainte AI - Technical Documentation

## Overview
Goldsainte AI is a luxury travel marketplace platform connecting customers with verified travel agents through AI-powered matching, real-time bidding, and secure escrow payments.

## Tech Stack

### Frontend
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Routing**: React Router DOM v6
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Maps**: Mapbox GL
- **Charts**: Recharts
- **Date Handling**: date-fns

### Backend (Lovable Cloud/Supabase)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Authentication**: Supabase Auth (email/password, JWT tokens)
- **Edge Functions**: Deno-based serverless functions
- **Storage**: Supabase Storage (file uploads)
- **Real-time**: PostgreSQL real-time subscriptions

### External Integrations
- **Payment Processing**: Stripe (Connect, PaymentIntents, Checkout)
- **Email**: Resend
- **AI**: Lovable AI Gateway (Gemini models)
- **Travel APIs**: 
  - Amadeus (flights, hotels, cars, seat maps)
  - Expedia (hotel search)
  - TripAdvisor (hotels, restaurants)
  - Ticketmaster (events)
- **SMS**: Twilio
- **Geolocation**: Google Places API, Mapbox

---

## Architecture

### Application Structure
```
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Route-level components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── integrations/       # Supabase client (auto-generated)
│   └── contexts/           # React contexts (Auth)
├── supabase/
│   ├── functions/          # Edge functions (API endpoints)
│   ├── config.toml         # Function configuration
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

### Authentication Flow
1. User signs up via `/auth` page (email/password)
2. Supabase Auth creates user in `auth.users` table
3. Trigger automatically creates profile in `public.profiles` table
4. JWT token stored in localStorage, managed by Supabase client
5. All authenticated requests include `Authorization: Bearer <token>` header
6. RLS policies enforce data access based on `auth.uid()`

### User Roles System
- Roles stored in `user_roles` table (separate from profiles for security)
- Available roles: `customer`, `agent`, `admin`
- Security definer function `has_role(user_id, role)` checks permissions
- RLS policies use `has_role()` to enforce role-based access

---

## Database Schema

### Core Tables

#### Users & Auth
- `profiles` - User profile data (linked to auth.users)
- `user_roles` - Role assignments (customer, agent, admin)
- `travel_agents` - Agent-specific data (agency info, specializations, Stripe Connect)
- `customer_verifications` - Identity/payment verification for customers
- `agent_verification_requests` - Document uploads for agent approval

#### Marketplace
- `marketplace_jobs` - Customer job postings
- `agent_bids` - Agent proposals on jobs
- `marketplace_messages` - Real-time messaging between parties
- `marketplace_job_attachments` - File uploads for jobs
- `marketplace_disputes` - Dispute management system
- `marketplace_invoices` - Invoice generation for completed jobs

#### Payments
- `payments` - Payment records (linked to Stripe)
- `payment_plans` - Installment payment schedules
- `payment_milestones` - Milestone-based payment tracking

#### Bookings
- `bookings` - Travel bookings (flights, hotels, etc.)
- `booking_modifications` - Cancellations, changes, refunds
- `guests` - Guest passenger information

#### Agent Performance
- `agent_performance_metrics` - KPIs (response time, completion rate)
- `agent_badges` - Achievement badges (quick_responder, top_rated)
- `agent_response_tracking` - Response time analytics
- `agent_reviews` - Customer ratings and reviews
- `agent_availability` - Agent calendar availability

#### System
- `activity_logs` - Audit trail
- `notifications` - In-app notification system
- `favorites` - User saved items
- `loyalty_points` - Customer rewards system
- `points_transactions` - Points earning/spending history
- `currency_exchange_rates` - Multi-currency support
- `ai_matching_scores` - AI agent matching results
- `auto_assignment_rules` - Agent auto-accept preferences
- `emergency_contacts` - Customer emergency contacts
- `custom_reports` - Custom report builder

### Key Database Functions
- `award_loyalty_points()` - Award points to users
- `calculate_loyalty_tier()` - Determine tier based on points
- `update_agent_rating()` - Recalculate agent ratings
- `update_agent_performance_metrics()` - Update agent KPIs
- `evaluate_agent_badges()` - Award/revoke badges
- `calculate_bid_pricing()` - Calculate fees and payouts
- `search_marketplace_jobs()` - Full-text search for jobs
- `search_travel_agents()` - Advanced agent search
- `find_matching_agents()` - AI-powered agent matching
- `expire_old_marketplace_jobs()` - Cron job for expiring jobs

---

## API Endpoints (Edge Functions)

### Authentication & Users
None (handled by Supabase Auth built-in endpoints)

### Marketplace

#### `search-destinations`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search for travel destinations
- **Request**: `{ query: string, type?: string }`
- **Response**: Array of destination results with images

#### `search-events`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search for events via Ticketmaster
- **Request**: `{ location: string, startDate?: string, endDate?: string }`
- **Response**: Event listings with venue info

#### `ai-agent-matching`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Match agents to job requirements using AI
- **Request**: `{ jobId: uuid }`
- **Response**: Ranked list of matching agents with scores

#### `notify-agents-new-job`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Notify qualified agents of new job postings
- **Trigger**: After job creation
- **Response**: Notification count

#### `notify-new-bid`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Notify customer of new agent bid
- **Request**: `{ jobId: uuid, bidId: uuid }`
- **Response**: Success status

#### `notify-bid-accepted`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Notify agent their bid was accepted
- **Request**: `{ bidId: uuid }`
- **Response**: Success status

#### `submit-job-completion`
- **Method**: POST
- **Auth**: Required (Agent)
- **Purpose**: Agent submits job as complete
- **Request**: `{ jobId: uuid, notes: string, attachments: [] }`
- **Response**: Submission record

#### `approve-job-completion`
- **Method**: POST
- **Auth**: Required (Customer)
- **Purpose**: Customer approves completion, releases escrow
- **Request**: `{ submissionId: uuid, feedback?: string }`
- **Response**: Transfer details

#### `reject-job-completion`
- **Method**: POST
- **Auth**: Required (Customer)
- **Purpose**: Customer rejects completion
- **Request**: `{ submissionId: uuid, reason: string }`
- **Response**: Updated submission

#### `notify-job-completed`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Notify customer of job completion
- **Request**: `{ jobId: uuid }`
- **Response**: Success status

#### `notify-milestone-approved`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Notify agent of milestone approval
- **Request**: `{ milestoneId: uuid }`
- **Response**: Success status

#### `expire-jobs`
- **Method**: POST
- **Auth**: System (cron job)
- **Purpose**: Mark expired jobs as 'expired'
- **Schedule**: Daily via pg_cron
- **Response**: Count of expired jobs

### Payments

#### `process-marketplace-payment`
- **Method**: POST
- **Auth**: Required (Customer)
- **Purpose**: Create escrow payment for accepted job
- **Request**: `{ jobId: uuid, bidId: uuid }`
- **Response**: `{ clientSecret: string, paymentIntentId: string }`
- **Notes**: Funds held in escrow until job completion

#### `create-checkout`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Create Stripe Checkout session
- **Request**: `{ priceId?: string, amount?: number }`
- **Response**: `{ url: string }` (redirect URL)

#### `verify-payment`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Verify payment status
- **Request**: `{ sessionId: string }`
- **Response**: Payment details

#### `customer-portal`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Access Stripe Customer Portal
- **Response**: `{ url: string }`

#### `stripe-connect-onboarding`
- **Method**: POST
- **Auth**: Required (Agent)
- **Purpose**: Create Stripe Connect account for agent
- **Response**: `{ url: string }` (onboarding link)

#### `check-stripe-connect-status`
- **Method**: POST
- **Auth**: Required (Agent)
- **Purpose**: Check agent's Stripe Connect status
- **Response**: `{ connected: boolean, charges_enabled: boolean, payouts_enabled: boolean }`

#### `notify-payment-received`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Notify agent of escrow payment
- **Request**: `{ paymentId: uuid }`
- **Response**: Success status

### Travel Booking

#### `unified-search-flights`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search flights across multiple providers
- **Request**: `{ origin, destination, departureDate, returnDate?, adults, children?, cabin }`
- **Response**: Unified flight offers with 15% markup

#### `amadeus-search-flights`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search Amadeus flight offers
- **Request**: Same as unified search
- **Response**: Amadeus flight offers

#### `amadeus-book-flight`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Book selected flight
- **Request**: `{ flightOffer, travelers, contactInfo }`
- **Response**: Booking confirmation with PNR

#### `amadeus-cancel-flight`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Cancel flight booking
- **Request**: `{ bookingId: uuid }`
- **Response**: Cancellation confirmation

#### `amadeus-modify-flight`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Modify existing flight booking
- **Request**: `{ bookingId: uuid, newFlightOffer }`
- **Response**: Modified booking details

#### `amadeus-get-seatmap`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Get seat map for flight
- **Request**: `{ flightOffer }`
- **Response**: Seat availability map

#### `unified-search-hotels`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search hotels across providers
- **Request**: `{ destination, checkIn, checkOut, adults, rooms }`
- **Response**: Unified hotel results with markup

#### `amadeus-search-hotels`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search Amadeus hotels
- **Response**: Hotel offers

#### `amadeus-book-hotel`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Book hotel room
- **Request**: `{ hotelOffer, guestInfo }`
- **Response**: Booking confirmation

#### `amadeus-cancel-hotel`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Cancel hotel booking
- **Request**: `{ bookingId: uuid }`
- **Response**: Cancellation status

#### `expedia-search-hotels`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search Expedia hotels
- **Response**: Hotel listings

#### `expedia-get-availability`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Check room availability
- **Request**: `{ hotelId, checkIn, checkOut }`
- **Response**: Available rooms

#### `expedia-book-hotel`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Book via Expedia
- **Response**: Booking confirmation

#### `tripadvisor-search-hotels`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search TripAdvisor hotels
- **Response**: Hotel listings with reviews

#### `tripadvisor-search-restaurants`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search restaurants
- **Request**: `{ location, cuisine?, priceLevel? }`
- **Response**: Restaurant listings

#### `amadeus-search-cars`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Search car rentals
- **Request**: `{ pickupLocation, dropoffLocation, pickupDate, dropoffDate }`
- **Response**: Car rental offers

#### `get-hotel-details`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Get detailed hotel information
- **Request**: `{ hotelId, provider }`
- **Response**: Full hotel details, photos, amenities

### AI & Assistance

#### `travel-ai-agent`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Conversational AI travel assistant
- **Request**: `{ message: string, conversationHistory?: [] }`
- **Response**: AI-generated travel advice
- **Model**: google/gemini-2.5-flash

#### `ai-booking-assistant`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Streaming AI booking assistant
- **Request**: `{ messages: [] }`
- **Response**: Server-sent events (SSE) stream
- **Model**: google/gemini-2.5-flash

### Visa Services

#### `check-visa-requirements`
- **Method**: POST
- **Auth**: Optional
- **Purpose**: Check visa requirements
- **Request**: `{ citizenship: string, destination: string }`
- **Response**: Visa requirements and process

#### `submit-visa-request`
- **Method**: POST
- **Auth**: Required
- **Purpose**: Submit visa application
- **Request**: `{ destination, documents, travelDates }`
- **Response**: Application confirmation

### Notifications & Communications

#### `send-notification`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Generic notification sender
- **Request**: `{ userId: uuid, title: string, message: string, type: string }`
- **Response**: Notification record

#### `send-job-notification`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Job-specific notifications
- **Request**: `{ jobId: uuid, recipientId: uuid, notificationType: string }`
- **Response**: Success status

#### `send-confirmation-email`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Send booking confirmation email
- **Request**: `{ email, bookingData }`
- **Response**: Email sent confirmation
- **Provider**: Resend

#### `send-cancellation-email`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Send cancellation confirmation
- **Request**: `{ email, bookingData }`
- **Response**: Email sent confirmation
- **Provider**: Resend

### Loyalty & Rewards

#### `award-loyalty-points`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Award points to customer
- **Request**: `{ userId: uuid, points: number, reason: string }`
- **Response**: Updated points balance

### Analytics & Performance

#### `update-agent-metrics`
- **Method**: POST
- **Auth**: System (cron job)
- **Purpose**: Recalculate agent performance metrics
- **Schedule**: Daily via pg_cron
- **Response**: Updated metrics count

### Webhooks

#### `trigger-webhook`
- **Method**: POST
- **Auth**: System (service_role)
- **Purpose**: Send webhook to configured endpoints
- **Request**: `{ event: string, data: object }`
- **Response**: Webhook delivery status

---

## Key Features & Implementation

### 1. AI Agent Matching
**Flow:**
1. Customer posts job with requirements
2. `ai-agent-matching` function analyzes job details
3. Queries agents with matching specializations/destinations
4. Uses Lovable AI to score matches based on:
   - Specialization overlap
   - Destination expertise
   - Rating and reviews
   - Availability
   - Response time history
5. Stores scores in `ai_matching_scores` table
6. Notifies top-matched agents via `notify-agents-new-job`

**Database:**
- `marketplace_jobs` stores job requirements
- `travel_agents` stores agent capabilities
- `ai_matching_scores` stores AI-generated match scores

### 2. Bidding System
**Flow:**
1. Agent views open jobs (filtered by `status = 'open'`)
2. Agent submits bid via UI → inserts into `agent_bids`
3. System calculates pricing:
   - `agent_quoted_price`: What agent charges
   - `platform_service_fee`: 3% of agent price (paid by customer)
   - `platform_success_fee`: 15% of agent price (paid by agent after completion)
   - `customer_facing_price`: agent_price + 3%
   - `agent_payout_amount`: agent_price - 15%
4. Customer receives notification via `notify-new-bid`
5. Customer reviews bids and accepts one
6. Job status changes to `in_progress`, `assigned_agent_id` and `winning_bid_id` set

**Database:**
- `agent_bids` stores all proposals
- `calculate_bid_pricing()` function handles fee calculations

### 3. Escrow Payment System
**Flow:**
1. Customer accepts bid → triggers payment flow
2. Frontend calls `process-marketplace-payment` edge function
3. Function creates Stripe PaymentIntent with metadata:
   ```json
   {
     "job_id": "uuid",
     "agent_id": "uuid",
     "platform_service_fee": "amount",
     "platform_success_fee": "amount",
     "agent_payout_amount": "amount"
   }
   ```
4. Customer completes payment via Stripe Checkout
5. Funds held in platform Stripe account (escrow)
6. `payments` table record created with `escrow_held: true`
7. Job `payment_status` set to `pending` or `escrowed`
8. Agent notified via `notify-payment-received`

**Completion & Payout:**
1. Agent completes work → calls `submit-job-completion`
2. Customer reviews → calls `approve-job-completion`
3. Function retrieves PaymentIntent and agent's Stripe Connect account
4. Creates Stripe Transfer to agent's Connect account:
   ```typescript
   stripe.transfers.create({
     amount: agent_payout_amount,
     currency: 'USD',
     destination: agent_stripe_account_id,
     transfer_group: job_id,
     metadata: { job_id, success_fee }
   })
   ```
5. Updates payment record: `transferred_to_agent: true`, `escrow_held: false`
6. Job status → `completed`
7. Platform retains service fee (3%) + success fee (15%) = 18% total

**Database:**
- `payments` tracks payment status
- `job_completion_submissions` tracks approval flow
- `marketplace_jobs.funds_released` indicates payout status

### 4. Stripe Connect (Agent Payouts)
**Setup:**
1. Agent completes onboarding form in UI
2. Frontend calls `stripe-connect-onboarding`
3. Function creates Stripe Express Connect account:
   ```typescript
   stripe.accounts.create({
     type: 'express',
     country: 'US',
     email: agent_email,
     capabilities: {
       card_payments: { requested: true },
       transfers: { requested: true }
     }
   })
   ```
4. Returns onboarding link for KYC verification
5. Agent completes Stripe onboarding (identity, bank account)
6. `stripe_account_id` saved to `travel_agents` table
7. Periodic status checks via `check-stripe-connect-status`

**Payout Flow:**
- Uses Stripe Transfers (not separate charges)
- Funds go from platform account → agent Connect account
- Agent can withdraw to bank via Stripe dashboard
- Platform handles all compliance and tax reporting

### 5. Real-time Messaging
**Implementation:**
1. Uses Supabase Realtime with PostgreSQL LISTEN/NOTIFY
2. `marketplace_messages` table has `REPLICA IDENTITY FULL`
3. Table added to `supabase_realtime` publication
4. Frontend subscribes to channel:
   ```typescript
   supabase
     .channel('messages')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'marketplace_messages',
       filter: `job_id=eq.${jobId}`
     }, (payload) => {
       // Update UI with new message
     })
     .subscribe()
   ```
5. Messages render in real-time for both parties
6. Read receipts via `is_read` column updates

**Database:**
- `marketplace_messages` stores all messages
- RLS policies ensure users only see their conversations
- Indexed on `job_id` and `created_at` for performance

### 6. Multi-API Travel Search
**Unified Search Strategy:**
1. Frontend calls `unified-search-flights` or `unified-search-hotels`
2. Edge function makes parallel requests to multiple providers:
   - Amadeus
   - Expedia
   - TripAdvisor
3. Normalizes responses into consistent format
4. Applies 15% markup to all prices
5. Deduplicates results by hotel ID / flight number
6. Sorts by price and relevance
7. Returns unified array to frontend

**Booking Flow:**
1. User selects offer (includes provider identifier)
2. Frontend calls provider-specific booking function:
   - `amadeus-book-flight`
   - `expedia-book-hotel`
3. Function makes API call to provider
4. Creates `bookings` record with:
   - `booking_reference`: Provider confirmation code
   - `booking_data`: Full booking details (JSONB)
   - `booking_type`: 'flight', 'hotel', 'car', etc.
   - `base_cost`: Provider cost
   - `markup_percentage`: 15%
   - `total_price`: Customer-facing price
5. Returns confirmation to user

**Markup Calculation:**
```typescript
const basePrice = providerPrice;
const markupAmount = basePrice * 0.15;
const totalPrice = basePrice + markupAmount;
const stripeFee = totalPrice * 0.029 + 0.30; // 2.9% + $0.30
const netProfit = markupAmount - stripeFee;
```

### 7. Agent Performance Tracking
**Metrics Collected:**
- Response time (first message to job post)
- Bid acceptance rate
- Job completion rate
- Average customer rating
- On-time delivery rate

**Implementation:**
1. `agent_response_tracking` logs all response times
2. `update-agent-metrics` cron job runs daily
3. Function calls `update_agent_performance_metrics(agent_id)`
4. SQL function calculates all KPIs
5. Inserts/updates `agent_performance_metrics` table
6. `evaluate_agent_badges()` awards badges based on thresholds:
   - `quick_responder`: <60 min avg response
   - `high_acceptance`: >80% bid acceptance
   - `top_rated`: >4.8 avg rating
   - `reliable`: >95% completion rate

**Badge Display:**
- Badges shown on agent profile
- Filter agents by badge in search
- Badges have expiration dates (90 days)

### 8. Dispute Resolution
**Flow:**
1. Either party raises dispute via UI → inserts into `marketplace_disputes`
2. Status: `open`
3. Both parties can upload evidence (JSONB array)
4. Admin reviews in admin dashboard
5. Admin updates:
   - `status`: `resolved` or `escalated`
   - `resolution_notes`: Explanation
   - `resolved_by`: Admin user ID
6. If resolved in customer's favor:
   - Refund issued via Stripe
   - Job marked as `cancelled`
7. If resolved in agent's favor:
   - Escrow released
   - Job marked as `completed`

**RLS Policies:**
- Only admins can update dispute status
- Both parties can view their disputes
- Evidence uploads allowed by both parties

### 9. Admin Approval System
**Agent Verification:**
1. Agent submits documents via `AgentVerificationUpload` component
2. Files uploaded to `verification-documents` storage bucket
3. Record created in `agent_verification_requests`
4. Admin views in `/admin-agent-approvals` page
5. Admin reviews documents and updates:
   - `status`: `approved` or `rejected`
   - `rejection_reason`: If rejected
   - `reviewed_by`: Admin ID
   - `reviewed_at`: Timestamp
6. If approved, updates `travel_agents` table:
   - `identity_verified: true` or relevant field
   - `is_verified: true` (if all checks complete)
7. Agent notified via notification system

**Admin Access:**
- Checked via `has_role(auth.uid(), 'admin')` function
- RLS policies on admin-only tables use this function
- Admin routes protected by `useUserRole()` hook

---

## Security Measures

### Row-Level Security (RLS)
- **All tables have RLS enabled**
- Policies enforce data access based on:
  - User ID (`auth.uid()`)
  - User role (`has_role()` function)
  - Related entity ownership (e.g., job owner, assigned agent)

**Example Policies:**
```sql
-- Users can only view their own bookings
CREATE POLICY "Users view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- Agents can view jobs they're assigned to
CREATE POLICY "Agents view assigned jobs"
ON marketplace_jobs FOR SELECT
USING (
  assigned_agent_id IN (
    SELECT id FROM travel_agents 
    WHERE user_id = auth.uid()
  )
);

-- Only admins can approve verifications
CREATE POLICY "Admins approve verifications"
ON agent_verification_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));
```

### API Security
- **JWT Authentication**: All authenticated endpoints require valid JWT
- **Service Role**: System functions use `SUPABASE_SERVICE_ROLE_KEY`
- **CORS**: Configured in all edge functions
- **Rate Limiting**: Handled by Supabase (default limits)

### Payment Security
- **Escrow**: Funds held until customer approves
- **Stripe Connect**: Agents receive payouts to verified bank accounts
- **Metadata**: All payment metadata stored for audit trail
- **Refunds**: Handled via `booking_modifications` table

### Data Validation
- **Zod schemas**: Frontend form validation
- **Database constraints**: CHECK constraints, foreign keys, NOT NULL
- **Triggers**: Validation triggers for complex rules

---

## Environment Variables

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://iwdevxltjuedijrcdejs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_SUPABASE_PROJECT_ID=iwdevxltjuedijrcdejs
```

### Backend (Supabase Secrets)
All stored in Supabase secrets, accessed via `Deno.env.get()`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `AMADEUS_API_KEY`
- `AMADEUS_API_SECRET`
- `EXPEDIA_API_KEY`
- `TRIPADVISOR_API_KEY`
- `TICKETMASTER_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_PLACES_API_KEY_2`
- `BOOKING_API_KEY`
- `RAPIDAPI_KEY`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `LOVABLE_API_KEY` (auto-provisioned)
- `MAPBOX_PUBLIC_TOKEN`

---

## Deployment

### Frontend
- **Platform**: Lovable (automatic deployment)
- **Build**: Vite production build
- **CDN**: Edge-cached static assets
- **Domain**: Custom domain support via Lovable

### Backend
- **Edge Functions**: Automatically deployed on git push
- **Database**: Managed PostgreSQL (Supabase)
- **Storage**: Supabase Storage with CDN
- **Monitoring**: Supabase dashboard (logs, metrics)

### Cron Jobs
Set up via `pg_cron` extension:
```sql
-- Expire old jobs daily at midnight
SELECT cron.schedule(
  'expire-jobs-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/expire-jobs',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
  $$
);

-- Update agent metrics daily at 1 AM
SELECT cron.schedule(
  'update-metrics-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/update-agent-metrics',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
  $$
);
```

---

## Testing Checklist

### Pre-Production
- [ ] Set Stripe API keys (test mode → production mode)
- [ ] Test complete payment flow (escrow → completion → payout)
- [ ] Disable email auto-confirm in Supabase Auth
- [ ] Create at least one admin user
- [ ] Set up cron jobs for `expire-jobs` and `update-agent-metrics`
- [ ] Test all external APIs with production keys
- [ ] Verify Stripe Connect onboarding flow
- [ ] Test dispute resolution workflow
- [ ] Verify all email templates (Resend)

### Key User Flows
1. **Customer Journey**: Sign up → Post job → Review bids → Accept → Pay → Message agent → Approve completion → Leave review
2. **Agent Journey**: Sign up → Complete verification → Browse jobs → Submit bid → Get accepted → Complete work → Submit for approval → Receive payout
3. **Admin Journey**: Log in → Review agent applications → Approve/reject → Review disputes → Resolve

---

## Performance Optimizations

### Database
- Indexes on frequently queried columns (`user_id`, `job_id`, `created_at`)
- JSONB GIN indexes for metadata searches
- Composite indexes for multi-column filters
- Materialized views for analytics (not yet implemented)

### Frontend
- React Query caching (5-minute stale time)
- Lazy loading for routes (React.lazy)
- Image optimization (WebP format, responsive sizes)
- Debounced search inputs (300ms)

### API
- Parallel API requests in unified search
- Response caching in edge functions (not yet implemented)
- Connection pooling (Supabase handles)

---

## Known Limitations

1. **Manual Agent Payouts**: Stripe transfers must be initiated by customer approval (not automatic)
2. **No Password Reset Flow**: Users must contact support
3. **Single Currency**: Escrow system only supports USD (multi-currency in roadmap)
4. **No Subscription Billing**: Payment plans are manual installments
5. **No Automated Disputes**: All disputes require admin review

---

## Future Enhancements

### Planned Features
- [ ] Multi-currency escrow support
- [ ] Automated dispute resolution (AI-powered)
- [ ] Agent calendar integration (Google Calendar, iCal)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] White-label agent portals
- [ ] API for third-party integrations
- [ ] Subscription plans for agents
- [ ] Video consultation feature
- [ ] Travel insurance integration

### Technical Debt
- [ ] Migrate to TypeScript strict mode
- [ ] Add comprehensive unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Implement rate limiting on edge functions
- [ ] Add Redis caching layer
- [ ] Set up monitoring (Sentry)
- [ ] Add performance tracking (Web Vitals)

---

## Support & Maintenance

### Logs & Monitoring
- **Edge Function Logs**: Supabase Dashboard → Edge Functions → View Logs
- **Database Logs**: Supabase Dashboard → Logs → Postgres
- **Error Tracking**: Console logs (consider adding Sentry)

### Backup Strategy
- **Database**: Supabase auto-backups (daily)
- **Storage**: Versioned file storage
- **Code**: Git repository with tags for releases

### Scaling Considerations
- **Database**: Supabase scales automatically
- **Edge Functions**: Auto-scale with traffic
- **Storage**: CDN-backed, unlimited bandwidth
- **Bottlenecks**: External API rate limits (Amadeus, Stripe)

---

## Contact

For technical questions or support:
- Documentation: This file
- Audit Reports: `PRODUCTION_READINESS_AUDIT.md`, `AUDIT_FIXES_SUMMARY.md`
- Database Schema: See Supabase Dashboard → Database → Schema
- API Logs: Supabase Dashboard → Edge Functions

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production Ready (98%)
