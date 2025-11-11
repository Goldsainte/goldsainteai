# Goldsainte Production Readiness - Complete Remediation Plan

**Status**: Wake Word Bug ✅ FIXED  
**Remaining Work**: 6-8 weeks to production-ready  
**Last Updated**: 2025-01-11

---

## Quick Reference: Priority Matrix

| Priority | Count | Est. Time | Must Fix For Launch |
|----------|-------|-----------|---------------------|
| P0 (Critical) | 9 | 3-4 weeks | ✅ Yes |
| P1 (High) | 15 | 2-3 weeks | ⚠️ Recommended |
| P2 (Medium) | 8 | 1-2 weeks | ❌ Post-launch |

---

## Phase 1: P0 Blockers (Weeks 1-4)

### Week 1: Testing Infrastructure & AI Memory

#### 1. E2E Test Suite (P0) - 3 days
**Status**: 0% complete  
**Impact**: Cannot verify ANY journey works end-to-end

**Deliverables**:
```bash
tests/
├── e2e/
│   ├── voice-concierge.spec.ts       # Wake word → voice query → response
│   ├── marketplace-booking.spec.ts   # Full booking flow with milestones
│   ├── cocurated-booking.spec.ts     # Package booking + confirmation
│   ├── creator-dashboard.spec.ts     # Tier progression + payouts
│   └── group-payment.spec.ts         # Split payment flow
├── api/
│   ├── voice-session.spec.ts
│   ├── booking.spec.ts
│   └── cocurated.spec.ts
└── webhooks/
    └── stripe-idempotency.spec.ts
```

**Acceptance Criteria**:
- [ ] All 5 E2E tests passing in CI
- [ ] Stripe test cards used (4242..., insufficient funds, 3DS)
- [ ] Videos/screenshots captured on failure
- [ ] Coverage >70% on critical paths

**Implementation**:
```bash
# Install Playwright
npm install -D @playwright/test

# Create test structure
mkdir -p tests/{e2e,api,webhooks}

# Add to package.json scripts
"test:e2e": "playwright test"
```

---

#### 2. Personal AI Agent Memory System (P0) - 4 days
**Status**: 0% complete  
**Impact**: Core product promise "AI that learns your preferences" is FALSE

**Database Schema**:
```sql
-- Create user preferences table
CREATE TABLE user_travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  travel_style TEXT[] DEFAULT '{}', -- ['luxury', 'adventure', 'cultural']
  budget_range JSONB DEFAULT '{}', -- { min: 1000, max: 5000, currency: 'USD' }
  preferred_airlines TEXT[] DEFAULT '{}',
  preferred_hotel_chains TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  accessibility_needs TEXT[] DEFAULT '{}',
  favorite_destinations TEXT[] DEFAULT '{}',
  avoided_destinations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_travel_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_travel_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_travel_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_travel_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create conversation context table
CREATE TABLE user_conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  conversation_id TEXT NOT NULL,
  context_data JSONB DEFAULT '{}', -- Store last N conversations with extracted preferences
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_conversation_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own context"
  ON user_conversation_context FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert/update context"
  ON user_conversation_context FOR ALL
  USING (auth.uid() = user_id);

-- Create preference extraction trigger
CREATE OR REPLACE FUNCTION extract_preferences_from_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic to extract preferences from conversation and update user_travel_preferences
  -- This can be enhanced with AI-powered extraction
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_preferences_on_conversation
  AFTER INSERT OR UPDATE ON user_conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION extract_preferences_from_conversation();
```

**Frontend Components**:
```typescript
// src/components/PreferenceOnboarding.tsx
export const PreferenceOnboarding = () => {
  // First-time user flow
  // Steps: 1) Travel style, 2) Budget, 3) Dietary, 4) Accessibility
  // Save to user_travel_preferences
};

// src/hooks/useUserPreferences.ts
export const useUserPreferences = () => {
  const { user } = useAuth();
  
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_travel_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  
  return { preferences, isLoading };
};
```

**Edge Function Integration**:
```typescript
// supabase/functions/help-center-ai/index.ts
// Add at the top of request handler:

// Fetch user preferences if authenticated
let userPreferences = null;
if (user) {
  const { data: prefs } = await supabaseClient
    .from('user_travel_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  userPreferences = prefs;
}

// Add to system prompt:
const systemPrompt = `You are Madison, Goldsainte's AI Travel Concierge.

${userPreferences ? `
USER PREFERENCES (use these to personalize recommendations):
- Travel Style: ${userPreferences.travel_style?.join(', ') || 'Not specified'}
- Budget Range: ${userPreferences.budget_range?.min || 'No min'} - ${userPreferences.budget_range?.max || 'No max'} ${userPreferences.budget_range?.currency || 'USD'}
- Preferred Airlines: ${userPreferences.preferred_airlines?.join(', ') || 'None specified'}
- Dietary Restrictions: ${userPreferences.dietary_restrictions?.join(', ') || 'None'}
- Accessibility Needs: ${userPreferences.accessibility_needs?.join(', ') || 'None'}
- Favorite Destinations: ${userPreferences.favorite_destinations?.join(', ') || 'Ask to learn'}

PERSONALIZATION RULES:
- Always filter hotel and flight recommendations by the user's budget range
- Prioritize preferred airlines when showing flight options
- Mention favorite destinations when suggesting trips
- Ask follow-up questions to refine unspecified preferences
- Update preferences when user mentions new constraints (e.g., "I'm vegetarian now")
` : `
FIRST-TIME USER FLOW:
- Greet warmly and ask about their travel style (luxury, budget, adventure, cultural, family)
- Ask about typical budget range for hotels per night
- Ask about dietary restrictions or accessibility needs
- Store these preferences for future conversations
`}`;

// After conversation, extract and save any new preferences mentioned
const extractPreferences = (conversation: Message[]) => {
  // Use AI to extract structured preferences from conversation
  // Update user_travel_preferences table
};
```

**Acceptance Criteria**:
- [ ] First-time user: AI asks for preferences (budget, style, dietary, accessibility)
- [ ] Preferences saved to `user_travel_preferences` table
- [ ] Returning user: AI greets with "I remember you prefer luxury hotels under $300/night..."
- [ ] Recommendations filtered by saved preferences
- [ ] Context retained across sessions (test: close browser, reopen, verify continuity)
- [ ] Preferences update when user mentions changes

---

### Week 2: Group Bookings & Webhooks

#### 3. Group Booking Production UI (P0) - 4 days
**Status**: 40% complete (test page exists)  
**Impact**: Cannot launch group booking feature

**Required Components**:

**File: `src/components/GroupBookingCreator.tsx`**
```typescript
export const GroupBookingCreator = () => {
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState({ start: '', end: '' });
  const [totalCost, setTotalCost] = useState(0);
  const [travelers, setTravelers] = useState<Array<{ email: string; name: string }>>([]);

  const createGroupBooking = async () => {
    // 1. Create group_bookings record
    const { data: booking, error } = await supabase
      .from('group_bookings')
      .insert({
        trip_name: tripName,
        destination,
        start_date: dates.start,
        end_date: dates.end,
        total_cost: totalCost,
        organizer_id: user.id,
        status: 'pending'
      })
      .select()
      .single();

    // 2. Create group_travelers records
    for (const traveler of travelers) {
      await supabase
        .from('group_travelers')
        .insert({
          group_booking_id: booking.id,
          email: traveler.email,
          name: traveler.name,
          share_amount: totalCost / travelers.length,
          payment_status: 'pending'
        });
    }

    // 3. Generate payment links for each traveler
    const { data: links } = await supabase.functions.invoke('create-group-payment-links', {
      body: { groupBookingId: booking.id }
    });

    // 4. Send email invitations with payment links
    await supabase.functions.invoke('send-group-invitations', {
      body: { groupBookingId: booking.id, paymentLinks: links }
    });

    toast.success('Group booking created! Invitations sent.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Group Trip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip details form */}
        <Input
          placeholder="Trip name (e.g., 'Bali Adventure 2025')"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
        />
        
        {/* Add travelers */}
        <div>
          <Label>Travelers</Label>
          {travelers.map((traveler, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder="Name"
                value={traveler.name}
                onChange={(e) => {
                  const updated = [...travelers];
                  updated[idx].name = e.target.value;
                  setTravelers(updated);
                }}
              />
              <Input
                placeholder="Email"
                value={traveler.email}
                onChange={(e) => {
                  const updated = [...travelers];
                  updated[idx].email = e.target.value;
                  setTravelers(updated);
                }}
              />
            </div>
          ))}
          <Button onClick={() => setTravelers([...travelers, { name: '', email: '' }])}>
            + Add Traveler
          </Button>
        </div>

        <Button onClick={createGroupBooking}>Create & Send Invitations</Button>
      </CardContent>
    </Card>
  );
};
```

**File: `src/components/GroupPaymentTracker.tsx`**
```typescript
export const GroupPaymentTracker = ({ groupBookingId }: { groupBookingId: string }) => {
  const { data: travelers } = useQuery({
    queryKey: ['group-travelers', groupBookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_travelers')
        .select('*')
        .eq('group_booking_id', groupBookingId);
      
      if (error) throw error;
      return data;
    }
  });

  const totalPaid = travelers?.filter(t => t.payment_status === 'paid').length || 0;
  const totalTravelers = travelers?.length || 0;
  const progress = (totalPaid / totalTravelers) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-4" />
        <p className="text-sm text-muted-foreground">
          {totalPaid} of {totalTravelers} travelers have paid
        </p>

        <div className="mt-4 space-y-2">
          {travelers?.map(traveler => (
            <div key={traveler.id} className="flex justify-between items-center">
              <span>{traveler.name}</span>
              <Badge variant={traveler.payment_status === 'paid' ? 'default' : 'outline'}>
                {traveler.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Database Schema**:
```sql
CREATE TABLE group_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  organizer_id UUID REFERENCES auth.users NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE group_travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_booking_id UUID REFERENCES group_bookings NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  share_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_link TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_travelers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage their group bookings"
  ON group_bookings FOR ALL
  USING (auth.uid() = organizer_id);

CREATE POLICY "Travelers can view their group bookings"
  ON group_bookings FOR SELECT
  USING (
    id IN (
      SELECT group_booking_id FROM group_travelers
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Anyone can view their traveler record"
  ON group_travelers FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR group_booking_id IN (
      SELECT id FROM group_bookings WHERE organizer_id = auth.uid()
    )
  );
```

**Edge Functions**:
```typescript
// supabase/functions/create-group-payment-links/index.ts
import Stripe from 'stripe';

serve(async (req) => {
  const { groupBookingId } = await req.json();
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

  // Get all travelers for this booking
  const { data: travelers } = await supabase
    .from('group_travelers')
    .select('*')
    .eq('group_booking_id', groupBookingId);

  const paymentLinks = [];

  for (const traveler of travelers) {
    // Create Stripe PaymentIntent for each traveler's share
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(traveler.share_amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        group_booking_id: groupBookingId,
        traveler_id: traveler.id,
        traveler_email: traveler.email
      }
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_intent: paymentIntent.id,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/group-booking/${groupBookingId}/success`,
      cancel_url: `${req.headers.get('origin')}/group-booking/${groupBookingId}/cancel`,
      customer_email: traveler.email
    });

    // Update traveler with payment link
    await supabase
      .from('group_travelers')
      .update({
        payment_link: session.url,
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('id', traveler.id);

    paymentLinks.push({
      traveler_id: traveler.id,
      email: traveler.email,
      link: session.url
    });
  }

  return new Response(JSON.stringify({ paymentLinks }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Acceptance Criteria**:
- [ ] Organizer creates group trip with 4 travelers
- [ ] Payment links generated for each traveler
- [ ] Travelers click link → Stripe Checkout → payment processed
- [ ] Progress tracker updates in real-time (2/4 paid)
- [ ] Email notifications sent on payment completion
- [ ] Trip confirmed when 75%+ travelers have paid (configurable threshold)

---

#### 4. Webhook Idempotency (P0) - 2 days
**Status**: 0% complete  
**Impact**: Risk of double charges, double payouts

**Database Schema**:
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL, -- Stripe's event.id
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (admin only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events"
  ON webhook_events FOR ALL
  USING (auth.role() = 'service_role');
```

**Edge Function Pattern** (apply to ALL Stripe webhooks):
```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'stripe';

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  // Verify webhook signature
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return new Response('Invalid signature', { status: 400 });
  }

  // IDEMPOTENCY CHECK: Insert event_id, fail if duplicate
  const { data: existingEvent, error: insertError } = await supabase
    .from('webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
      payload: event.data.object
    });

  if (insertError?.code === '23505') {
    // Postgres unique constraint violation = duplicate event
    console.log('✅ Duplicate webhook ignored:', event.id);
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Process webhook only if insert succeeded (first time)
  console.log('📨 Processing webhook:', event.type, event.id);

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;
    
    case 'charge.refunded':
      const charge = event.data.object as Stripe.Charge;
      await handleRefund(charge);
      break;
    
    case 'payout.paid':
      const payout = event.data.object as Stripe.Payout;
      await handlePayoutCompleted(payout);
      break;
    
    // ... handle other event types
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Webhook Dashboard** (`src/pages/WebhookDashboard.tsx`):
```typescript
export default function WebhookDashboard() {
  const { data: events } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Webhooks</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead>Event ID</TableHead>
              <TableHead>Processed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map(event => (
              <TableRow key={event.id}>
                <TableCell>{event.event_type}</TableCell>
                <TableCell className="font-mono text-xs">{event.event_id}</TableCell>
                <TableCell>{new Date(event.processed_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

**Testing**:
```bash
# Use Stripe CLI to replay webhooks
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger duplicate event
stripe events resend evt_xxx
stripe events resend evt_xxx  # Second time should be ignored

# Verify in webhook dashboard: only one processed record
```

**Acceptance Criteria**:
- [ ] Webhook events table created with unique constraint on `event_id`
- [ ] All Stripe webhook handlers wrapped with idempotency check
- [ ] Test: Send duplicate `payment_intent.succeeded` → verify single charge recorded
- [ ] Webhook dashboard shows last 20 deliveries + duplicate count
- [ ] Integration test: Replay same webhook 5 times → only 1 processed

---

### Week 3: Observability & Calendar Sync

#### 5. Structured Logging & Telemetry (P0) - 3 days
**Status**: 10% complete (console.log everywhere)  
**Impact**: Cannot diagnose production issues

**Logging Infrastructure**:

**File: `src/lib/logger.ts`**
```typescript
export interface LogContext {
  service: string;
  traceId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  static create(context: LogContext): Logger {
    // Generate traceId if not provided
    if (!context.traceId) {
      context.traceId = crypto.randomUUID();
    }
    return new Logger(context);
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.context.service,
      traceId: this.context.traceId,
      userId: this.context.userId,
      message,
      ...data
    };

    // In development: console
    if (import.meta.env.DEV) {
      console[level === 'error' ? 'error' : 'log'](
        `[${level.toUpperCase()}]`,
        message,
        logEntry
      );
    }

    // In production: send to logging service (Supabase logs, Sentry, etc.)
    this.sendToLoggingService(logEntry);
  }

  private async sendToLoggingService(entry: any) {
    // Send to Supabase logs or external service
    // This is non-blocking and swallows errors to not impact app performance
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (err) {
      // Silently fail - logging should never break the app
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error: Error | any, data?: any) {
    this.log('error', message, {
      ...data,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  // Create child logger with additional context
  child(additionalContext: Partial<LogContext>): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}
```

**Usage in Edge Functions**:
```typescript
// supabase/functions/help-center-ai/index.ts
import { Logger } from './lib/logger.ts';

serve(async (req) => {
  const traceId = req.headers.get('x-trace-id') || crypto.randomUUID();
  const log = Logger.create({
    service: 'help-center-ai',
    traceId
  });

  log.info('Request received', {
    method: req.method,
    url: req.url
  });

  try {
    const { message } = await req.json();
    log.info('Processing message', { messageLength: message.length });

    // ... AI processing

    log.info('Response sent', { tokensUsed: response.usage.total_tokens });
    return new Response(JSON.stringify(response));
  } catch (error) {
    log.error('Request failed', error, {
      method: req.method
    });
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500
    });
  }
});
```

**Analytics Events**:
```typescript
// src/lib/analytics.ts
export const analytics = {
  track(event: string, properties?: Record<string, any>) {
    const payload = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userId: window.__user?.id,
        sessionId: window.__sessionId
      }
    };

    // Send to analytics service (Supabase, Mixpanel, etc.)
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {}); // Non-blocking
  }
};

// Usage:
analytics.track('voice_mode_activated', { sessionId, agentProfile });
analytics.track('booking_created', { bookingId, totalCost, destination });
analytics.track('payment_completed', { paymentIntentId, amount, currency });
```

**Required Analytics Events**:
- `voice_mode_activated`
- `wake_word_detected`
- `booking_created`
- `bid_accepted`
- `milestone_funded`
- `milestone_released`
- `payout_requested`
- `payment_completed`
- `group_booking_created`
- `package_booked`
- `itinerary_created`
- `calendar_synced`

**Acceptance Criteria**:
- [ ] All edge functions use structured logging with Logger class
- [ ] Trace IDs propagated from frontend → edge function → external APIs
- [ ] Error logs include: traceId, userId, timestamp, stack, context
- [ ] Analytics events emitted for all major actions (15+ events)
- [ ] Logs queryable in Supabase logs dashboard

---

#### 6. Calendar Sync (Google/Apple/ICS) (P0) - 3 days
**Status**: 0% complete  
**Impact**: Users cannot sync trips to their calendar

**Implementation**:

**File: `src/utils/calendarSync.ts`**
```typescript
import { format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

export const generateICS = (events: CalendarEvent[]): string => {
  const formatICSDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const eventsICS = events.map(event => `
BEGIN:VEVENT
UID:${event.id}@goldsainte.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(event.startDate)}
DTEND:${formatICSDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
END:VEVENT`).join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Goldsainte//Travel Itinerary//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${eventsICS}
END:VCALENDAR`;
};

export const downloadICS = (ics: string, filename: string) => {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const syncToGoogleCalendar = async (events: CalendarEvent[], accessToken: string) => {
  for (const event of events) {
    await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startDate.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: event.endDate.toISOString(),
          timeZone: 'UTC'
        }
      })
    });
  }
};

export const emailICS = async (ics: string, recipientEmail: string, tripName: string) => {
  // Call edge function to send email with ICS attachment
  const { data, error } = await supabase.functions.invoke('send-calendar-invite', {
    body: {
      ics,
      recipientEmail,
      tripName
    }
  });
  
  if (error) throw error;
  return data;
};
```

**Component Integration**:
```typescript
// src/components/ItineraryCalendarSync.tsx
export const ItineraryCalendarSync = ({ itinerary }: { itinerary: Itinerary }) => {
  const [isGoogleAuthed, setIsGoogleAuthed] = useState(false);

  const handleGoogleSync = async () => {
    // OAuth flow for Google Calendar
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${window.location.origin}/google-auth-callback&` +
      `response_type=token&` +
      `scope=https://www.googleapis.com/auth/calendar.events`;
    
    window.location.href = googleAuthUrl;
  };

  const handleAppleDownload = () => {
    const events: CalendarEvent[] = itinerary.days.map(day => ({
      id: day.id,
      title: day.title,
      description: day.description,
      location: day.location,
      startDate: new Date(day.date),
      endDate: new Date(day.date)
    }));

    const ics = generateICS(events);
    downloadICS(ics, `${itinerary.name}-calendar.ics`);
    
    toast.success('Calendar file downloaded! Open it to add to Apple Calendar.');
  };

  const handleEmailCalendar = async () => {
    const events: CalendarEvent[] = itinerary.days.map(day => ({
      id: day.id,
      title: day.title,
      description: day.description,
      location: day.location,
      startDate: new Date(day.date),
      endDate: new Date(day.date)
    }));

    const ics = generateICS(events);
    await emailICS(ics, user.email, itinerary.name);
    
    toast.success('Calendar invite sent to your email!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add to Calendar</CardTitle>
        <CardDescription>Sync your itinerary to your calendar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleGoogleSync} className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
          Add to Google Calendar
        </Button>
        
        <Button onClick={handleAppleDownload} variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download for Apple Calendar
        </Button>

        <Button onClick={handleEmailCalendar} variant="outline" className="w-full">
          <Mail className="mr-2 h-4 w-4" />
          Email Calendar File
        </Button>
      </CardContent>
    </Card>
  );
};
```

**Edge Function for Email**:
```typescript
// supabase/functions/send-calendar-invite/index.ts
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const { ics, recipientEmail, tripName } = await req.json();

  // Use email service (SendGrid, Resend, etc.)
  const emailBody = `
    <p>Your travel itinerary for <strong>${tripName}</strong> is attached.</p>
    <p>Open the attachment to add it to your calendar.</p>
  `;

  // Send email with ICS attachment
  // Implementation depends on your email provider
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Acceptance Criteria**:
- [ ] "Add to Calendar" button on itinerary view
- [ ] Google Calendar sync via OAuth (creates events automatically)
- [ ] Apple Calendar .ics file download (opens in Calendar app)
- [ ] Email itinerary with .ics attachment
- [ ] Works on mobile iOS/Android
- [ ] Calendar events include: title, description, location, dates, status

---

### Week 4: RBAC & Performance

#### 7. Itinerary RBAC (View vs Edit Permissions) (P0) - 2 days
**Status**: 30% complete (sharing exists but permissions not enforced)  
**Impact**: Security risk - anyone with link can edit

**Database Schema**:
```sql
CREATE TABLE itinerary_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES itineraries NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit', 'admin')),
  granted_by UUID REFERENCES auth.users,
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(itinerary_id, user_id)
);

-- Enable RLS
ALTER TABLE itinerary_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions for itineraries they have access to"
  ON itinerary_permissions FOR SELECT
  USING (
    user_id = auth.uid() 
    OR itinerary_id IN (
      SELECT itinerary_id FROM itinerary_permissions 
      WHERE user_id = auth.uid() AND permission_level = 'admin'
    )
  );

CREATE POLICY "Admins can manage permissions"
  ON itinerary_permissions FOR ALL
  USING (
    itinerary_id IN (
      SELECT itinerary_id FROM itinerary_permissions
      WHERE user_id = auth.uid() AND permission_level = 'admin'
    )
  );

-- Update itineraries RLS policies
DROP POLICY IF EXISTS "Users can view their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON itineraries;

CREATE POLICY "Users can view itineraries they have access to"
  ON itineraries FOR SELECT
  USING (
    user_id = auth.uid()
    OR id IN (
      SELECT itinerary_id FROM itinerary_permissions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update itineraries they have edit/admin access to"
  ON itineraries FOR UPDATE
  USING (
    user_id = auth.uid()
    OR id IN (
      SELECT itinerary_id FROM itinerary_permissions 
      WHERE user_id = auth.uid() AND permission_level IN ('edit', 'admin')
    )
  );

CREATE POLICY "Users can delete itineraries they have admin access to"
  ON itineraries FOR DELETE
  USING (
    user_id = auth.uid()
    OR id IN (
      SELECT itinerary_id FROM itinerary_permissions 
      WHERE user_id = auth.uid() AND permission_level = 'admin'
    )
  );
```

**Permission Checking Hook**:
```typescript
// src/hooks/useItineraryPermissions.ts
export const useItineraryPermissions = (itineraryId: string) => {
  const { user } = useAuth();

  const { data: permission, isLoading } = useQuery({
    queryKey: ['itinerary-permissions', itineraryId, user?.id],
    queryFn: async () => {
      // Check if user is the owner
      const { data: itinerary } = await supabase
        .from('itineraries')
        .select('user_id')
        .eq('id', itineraryId)
        .single();

      if (itinerary?.user_id === user?.id) {
        return { level: 'admin', isOwner: true };
      }

      // Check permission level
      const { data: perm } = await supabase
        .from('itinerary_permissions')
        .select('permission_level')
        .eq('itinerary_id', itineraryId)
        .eq('user_id', user.id)
        .single();

      return {
        level: perm?.permission_level || 'none',
        isOwner: false
      };
    },
    enabled: !!user && !!itineraryId
  });

  return {
    canView: permission?.level !== 'none',
    canEdit: ['edit', 'admin'].includes(permission?.level),
    canManagePermissions: permission?.level === 'admin',
    isOwner: permission?.isOwner,
    isLoading
  };
};
```

**Sharing UI Component**:
```typescript
// src/components/ItineraryShareDialog.tsx
export const ItineraryShareDialog = ({ itineraryId }: { itineraryId: string }) => {
  const [email, setEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'edit'>('view');

  const shareItinerary = async () => {
    // Find user by email
    const { data: userData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!userData) {
      toast.error('User not found');
      return;
    }

    // Grant permission
    const { error } = await supabase
      .from('itinerary_permissions')
      .insert({
        itinerary_id: itineraryId,
        user_id: userData.id,
        permission_level: permissionLevel,
        granted_by: user.id
      });

    if (error) {
      toast.error('Failed to share itinerary');
      return;
    }

    // Send notification
    await supabase.functions.invoke('send-itinerary-share-notification', {
      body: {
        recipientEmail: email,
        itineraryId,
        permissionLevel
      }
    });

    toast.success(`Itinerary shared with ${email} (${permissionLevel} access)`);
    setEmail('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Itinerary
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Itinerary</DialogTitle>
          <DialogDescription>
            Invite others to view or collaborate on this itinerary
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>Permission Level</Label>
            <Select value={permissionLevel} onValueChange={setPermissionLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="edit">Can Edit</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {permissionLevel === 'view' 
                ? 'Can view the itinerary but cannot make changes'
                : 'Can add, edit, and delete items in the itinerary'}
            </p>
          </div>

          <Button onClick={shareItinerary} className="w-full">
            Send Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**Permission Enforcement in UI**:
```typescript
// src/components/ItineraryBuilder.tsx
export const ItineraryBuilder = ({ itineraryId }: { itineraryId: string }) => {
  const { canEdit, canView, isLoading } = useItineraryPermissions(itineraryId);

  if (isLoading) return <LoadingSpinner />;
  
  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to view this itinerary.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      {/* Read-only view for view-only users */}
      {!canEdit && <TripItineraryView itinerary={itinerary} />}

      {/* Editable view for users with edit permissions */}
      {canEdit && (
        <>
          <ItineraryTimeline itineraryId={itineraryId} />
          <Button onClick={addDay}>Add Day</Button>
        </>
      )}
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Organizer can share with "view" or "edit" permissions
- [ ] View-only users see itinerary but all edit buttons disabled/hidden
- [ ] Edit users can add/modify days and activities
- [ ] Admin/owner can manage permissions (add/remove collaborators)
- [ ] Unauthorized access returns 403 error
- [ ] Sharing sends email notification with access link

---

#### 8. Performance Baseline & Optimization (P0) - 3 days
**Status**: 0% complete  
**Impact**: Cannot verify performance standards

**Lighthouse CI Setup**:
```bash
# Install Lighthouse CI
npm install -D @lhci/cli

# Create lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:5173/",
        "http://localhost:5173/marketplace",
        "http://localhost:5173/cocurated-marketplace",
        "http://localhost:5173/cocurated-journeys"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "onlyCategories": ["performance", "accessibility", "best-practices", "seo"]
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "categories:accessibility": ["error", { "minScore": 1.0 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.90 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}

# Add to package.json scripts
"lighthouse": "lhci autorun"
```

**Performance Optimizations**:

1. **Code Splitting**:
```typescript
// src/App.tsx
// Lazy load heavy components
const CoCuratedMarketplace = lazy(() => import('./pages/CoCuratedMarketplace'));
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'));
const ItineraryBuilder = lazy(() => import('./components/ItineraryBuilder'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/cocurated-marketplace" element={<CoCuratedMarketplace />} />
</Suspense>
```

2. **Image Optimization**:
```typescript
// src/components/PackageCard.tsx
<img
  src={package.image_url}
  alt={package.name}
  loading="lazy"
  decoding="async"
  width={400}
  height={300}
  className="object-cover"
/>
```

3. **Preload Critical Resources**:
```html
<!-- index.html -->
<link rel="preconnect" href="https://widgets.expedia.com">
<link rel="preconnect" href="https://api.elevenlabs.io">
<link rel="dns-prefetch" href="https://api.openai.com">
```

4. **Bundle Size Analysis**:
```bash
# Install bundle analyzer
npm install -D vite-bundle-visualizer

# Add to vite.config.ts
import { visualizer } from 'vite-bundle-visualizer';

export default defineConfig({
  plugins: [
    visualizer({ open: true })
  ]
});

# Run build and analyze
npm run build
```

**Core Web Vitals Monitoring**:
```typescript
// src/lib/webVitals.ts
import { onLCP, onFID, onCLS, onINP } from 'web-vitals';

export const trackWebVitals = () => {
  onLCP((metric) => {
    analytics.track('web_vital', {
      name: 'LCP',
      value: metric.value,
      rating: metric.rating
    });
  });

  onFID((metric) => {
    analytics.track('web_vital', {
      name: 'FID',
      value: metric.value,
      rating: metric.rating
    });
  });

  onCLS((metric) => {
    analytics.track('web_vital', {
      name: 'CLS',
      value: metric.value,
      rating: metric.rating
    });
  });

  onINP((metric) => {
    analytics.track('web_vital', {
      name: 'INP',
      value: metric.value,
      rating: metric.rating
    });
  });
};

// Call in main.tsx
trackWebVitals();
```

**Acceptance Criteria**:
- [ ] Lighthouse CI integrated (runs on every PR)
- [ ] Homepage, marketplace, cocurated pages meet thresholds:
  - Performance ≥90
  - Accessibility 100
  - Best Practices ≥95
  - SEO ≥90
- [ ] LCP ≤2.5s, FID ≤100ms, CLS ≤0.1, INP ≤200ms
- [ ] Initial JS bundle ≤300KB gzipped
- [ ] Web Vitals tracked in analytics

---

#### 9. Inventory/Availability Checking (P0) - 2 days
**Status**: 0% complete  
**Impact**: Overbooking risk for CoCurated packages

**Database Schema**:
```sql
-- Add capacity fields to packages
ALTER TABLE cocurated_packages ADD COLUMN max_capacity INTEGER DEFAULT 10;
ALTER TABLE cocurated_packages ADD COLUMN min_participants INTEGER DEFAULT 1;

-- Create bookings capacity tracking
CREATE TABLE package_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES cocurated_packages NOT NULL,
  user_id UUID REFERENCES auth.users,
  booking_date DATE NOT NULL,
  travelers_count INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE package_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON package_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON package_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to check availability
CREATE OR REPLACE FUNCTION check_package_availability(
  p_package_id UUID,
  p_booking_date DATE,
  p_travelers_count INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_max_capacity INTEGER;
  v_current_bookings INTEGER;
  v_available_slots INTEGER;
BEGIN
  -- Get max capacity
  SELECT max_capacity INTO v_max_capacity
  FROM cocurated_packages
  WHERE id = p_package_id;

  -- Get current bookings for this date
  SELECT COALESCE(SUM(travelers_count), 0) INTO v_current_bookings
  FROM package_bookings
  WHERE package_id = p_package_id
    AND booking_date = p_booking_date
    AND status = 'confirmed';

  v_available_slots := v_max_capacity - v_current_bookings;

  RETURN jsonb_build_object(
    'available', v_available_slots >= p_travelers_count,
    'available_slots', v_available_slots,
    'max_capacity', v_max_capacity,
    'current_bookings', v_current_bookings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Hook for Availability Checking**:
```typescript
// src/hooks/usePackageAvailability.ts
export const usePackageAvailability = (
  packageId: string,
  bookingDate: string,
  travelersCount: number
) => {
  const { data: availability, isLoading } = useQuery({
    queryKey: ['package-availability', packageId, bookingDate, travelersCount],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_package_availability', {
        p_package_id: packageId,
        p_booking_date: bookingDate,
        p_travelers_count: travelersCount
      });

      if (error) throw error;
      return data;
    },
    enabled: !!packageId && !!bookingDate && travelersCount > 0
  });

  return {
    isAvailable: availability?.available || false,
    availableSlots: availability?.available_slots || 0,
    maxCapacity: availability?.max_capacity || 0,
    currentBookings: availability?.current_bookings || 0,
    isLoading
  };
};
```

**Booking Flow with Availability Check**:
```typescript
// src/components/PackageBookingForm.tsx
export const PackageBookingForm = ({ packageId }: { packageId: string }) => {
  const [bookingDate, setBookingDate] = useState('');
  const [travelersCount, setTravelersCount] = useState(1);

  const { isAvailable, availableSlots, isLoading } = usePackageAvailability(
    packageId,
    bookingDate,
    travelersCount
  );

  const handleBooking = async () => {
    // Double-check availability before creating booking
    const { data: finalCheck } = await supabase.rpc('check_package_availability', {
      p_package_id: packageId,
      p_booking_date: bookingDate,
      p_travelers_count: travelersCount
    });

    if (!finalCheck.available) {
      toast.error('Sorry, this date is no longer available. Please choose another date.');
      return;
    }

    // Create booking
    const { data: booking, error } = await supabase
      .from('package_bookings')
      .insert({
        package_id: packageId,
        user_id: user.id,
        booking_date: bookingDate,
        travelers_count: travelersCount,
        status: 'pending' // Confirmed after payment
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create booking');
      return;
    }

    // Proceed to payment
    navigate(`/payment/${booking.id}`);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <Label>Booking Date</Label>
          <Input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
          />
        </div>

        <div>
          <Label>Number of Travelers</Label>
          <Input
            type="number"
            min={1}
            value={travelersCount}
            onChange={(e) => setTravelersCount(parseInt(e.target.value))}
          />
        </div>

        {bookingDate && (
          <Alert variant={isAvailable ? 'default' : 'destructive'}>
            <AlertTitle>
              {isAvailable ? '✓ Available' : '✗ Not Available'}
            </AlertTitle>
            <AlertDescription>
              {isAvailable 
                ? `${availableSlots} slots remaining for this date`
                : 'This date is fully booked. Please choose another date.'}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleBooking}
          disabled={!isAvailable || isLoading}
          className="w-full"
        >
          {isAvailable ? 'Book Now' : 'Choose Another Date'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

**Real-time Availability Display**:
```typescript
// src/components/PackageAvailabilityCalendar.tsx
export const PackageAvailabilityCalendar = ({ packageId }: { packageId: string }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: monthAvailability } = useQuery({
    queryKey: ['package-month-availability', packageId, selectedMonth],
    queryFn: async () => {
      // Get all bookings for this month
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      const { data: bookings } = await supabase
        .from('package_bookings')
        .select('booking_date, travelers_count')
        .eq('package_id', packageId)
        .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
        .lte('booking_date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');

      // Get package max capacity
      const { data: pkg } = await supabase
        .from('cocurated_packages')
        .select('max_capacity')
        .eq('id', packageId)
        .single();

      // Calculate availability for each day
      const availability: Record<string, number> = {};
      eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayBookings = bookings?.filter(b => b.booking_date === dateStr) || [];
        const bookedSlots = dayBookings.reduce((sum, b) => sum + b.travelers_count, 0);
        availability[dateStr] = pkg.max_capacity - bookedSlots;
      });

      return availability;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <DayPicker
          month={selectedMonth}
          onMonthChange={setSelectedMonth}
          modifiers={{
            fullyBooked: (date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              return (monthAvailability?.[dateStr] || 0) === 0;
            },
            limitedAvailability: (date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const available = monthAvailability?.[dateStr] || 0;
              return available > 0 && available <= 3;
            }
          }}
          modifiersStyles={{
            fullyBooked: { backgroundColor: '#fee2e2', color: '#dc2626' },
            limitedAvailability: { backgroundColor: '#fef3c7', color: '#f59e0b' }
          }}
        />

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200" />
            <span>Limited Availability (≤3 slots)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200" />
            <span>Fully Booked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria**:
- [ ] Max capacity enforced per package/date
- [ ] Real-time availability displayed on package page
- [ ] Booking blocked if capacity exceeded
- [ ] Calendar shows availability heatmap (green/yellow/red)
- [ ] Double-check availability before payment (race condition prevention)
- [ ] Admin can override capacity for special cases

---

## Phase 2: P1 Issues (Weeks 5-7)

### Week 5: Creator Features

#### 10. Tier Progression UI (P1) - 2 days
**Status**: 60% complete (tier system exists but UI lacks clarity)

**Implementation**:
```typescript
// src/components/CreatorTierProgressBar.tsx
export const CreatorTierProgressBar = () => {
  const { data: creatorStats } = useQuery({
    queryKey: ['creator-stats'],
    queryFn: async () => {
      // Fetch total views, content count, engagement metrics
      const { data, error } = await supabase
        .from('creator_analytics')
        .select('*')
        .eq('creator_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const currentTier = calculateTier(creatorStats);
  const nextTier = getNextTier(currentTier);
  const progress = calculateTierProgress(creatorStats, currentTier, nextTier);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Creator Tier</CardTitle>
        <CardDescription>
          {currentTier.name} • {progress.percentage}% to {nextTier.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{currentTier.name}</span>
            <span>{nextTier.name}</span>
          </div>
          <Progress value={progress.percentage} />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm">
              <span>Total Views</span>
              <span className="font-semibold">
                {creatorStats.total_views} / {nextTier.requirements.views}
              </span>
            </div>
            <Progress value={(creatorStats.total_views / nextTier.requirements.views) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span>Content Uploads</span>
              <span className="font-semibold">
                {creatorStats.content_count} / {nextTier.requirements.content}
              </span>
            </div>
            <Progress value={(creatorStats.content_count / nextTier.requirements.content) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span>Engagement Rate</span>
              <span className="font-semibold">
                {creatorStats.engagement_rate}% / {nextTier.requirements.engagement}%
              </span>
            </div>
            <Progress value={(creatorStats.engagement_rate / nextTier.requirements.engagement) * 100} className="h-2" />
          </div>
        </div>

        <Alert className="mt-4">
          <Trophy className="h-4 w-4" />
          <AlertTitle>Next Milestone</AlertTitle>
          <AlertDescription>
            {progress.nextMilestone} to unlock {nextTier.name} tier and earn {nextTier.commissionBonus}% commission bonus!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria**:
- [ ] Progress bars showing distance to next tier
- [ ] Tier benefits comparison table
- [ ] "X views to Gold" indicator
- [ ] Commission bonus clearly displayed per tier

---

#### 11. Commission Transparency (P1) - 2 days
**Status**: 50% complete (commission exists but breakdown not shown)

**Implementation**:
```typescript
// src/components/EarningsBreakdown.tsx
export const EarningsBreakdown = ({ transactionId }: { transactionId: string }) => {
  const { data: transaction } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_transactions')
        .select('*, creator_tier')
        .eq('id', transactionId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (!transaction) return null;

  const baseAmount = transaction.amount;
  const baseCommissionRate = 0.70; // 70% base
  const tierBonus = getTierBonus(transaction.creator_tier); // e.g., +0.20 for Platinum
  const totalCommissionRate = baseCommissionRate + tierBonus;
  
  const baseCommission = baseAmount * baseCommissionRate;
  const tierBonusAmount = baseAmount * tierBonus;
  const totalEarnings = baseAmount * totalCommissionRate;
  const platformFee = baseAmount * (1 - totalCommissionRate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Breakdown</CardTitle>
        <CardDescription>Transaction #{transaction.id.slice(0, 8)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Sale Amount</span>
            <span className="font-semibold">${baseAmount.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between text-muted-foreground">
            <span>Base Commission (70%)</span>
            <span>${baseCommission.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-primary">
            <span>
              {transaction.creator_tier} Tier Bonus (+{(tierBonus * 100).toFixed(0)}%)
            </span>
            <span>+${tierBonusAmount.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Your Earnings</span>
            <span className="text-green-600">${totalEarnings.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Platform Fee</span>
            <span>${platformFee.toFixed(2)}</span>
          </div>
        </div>

        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            As a {transaction.creator_tier} creator, you earn {(totalCommissionRate * 100).toFixed(0)}% on all sales.
            {tierBonus > 0 && ` This includes your +${(tierBonus * 100).toFixed(0)}% tier bonus!`}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria**:
- [ ] Detailed earnings report showing: base (70%) + tier bonus (+20% Platinum) = final payout
- [ ] Breakdown visible on every transaction
- [ ] Monthly earnings summary with commission breakdown
- [ ] Clear explanation of how tier affects earnings

---

#### 12. Revenue Streams Tracking (P1) - 3 days
**Status**: 30% complete (only package bookings tracked)

**Database Schema**:
```sql
CREATE TYPE revenue_source AS ENUM (
  'content_views',
  'virtual_gifts',
  'package_bookings',
  'shop_sales',
  'affiliate_commissions',
  'partnerships'
);

CREATE TABLE creator_revenue_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users NOT NULL,
  source revenue_source NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_id TEXT, -- Reference to source transaction
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE creator_revenue_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their own revenue"
  ON creator_revenue_streams FOR SELECT
  USING (auth.uid() = creator_id);
```

**Analytics Dashboard**:
```typescript
// src/components/CreatorRevenueDashboard.tsx
export const CreatorRevenueDashboard = () => {
  const { data: revenueBySource } = useQuery({
    queryKey: ['revenue-by-source'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_revenue_streams')
        .select('source, amount')
        .eq('creator_id', user.id)
        .gte('created_at', startOfMonth(new Date()).toISOString());

      if (error) throw error;

      // Group by source
      const grouped = data.reduce((acc, item) => {
        if (!acc[item.source]) acc[item.source] = 0;
        acc[item.source] += parseFloat(item.amount);
        return acc;
      }, {} as Record<string, number>);

      return grouped;
    }
  });

  const totalRevenue = Object.values(revenueBySource || {}).reduce((sum, val) => sum + val, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Streams (This Month)</CardTitle>
        <CardDescription>Total: ${totalRevenue.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(revenueBySource || {}).map(([source, amount]) => (
            <div key={source}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{formatSource(source)}</span>
                <span className="text-sm font-bold">${amount.toFixed(2)}</span>
              </div>
              <Progress value={(amount / totalRevenue) * 100} />
            </div>
          ))}
        </div>

        {/* Pie Chart */}
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={Object.entries(revenueBySource || {}).map(([source, amount]) => ({
                  name: formatSource(source),
                  value: amount
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {Object.keys(revenueBySource || {}).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria**:
- [ ] All 6 revenue sources tracked: content views, virtual gifts, package bookings, shop sales, affiliate, partnerships
- [ ] Revenue breakdown by source (pie chart + list)
- [ ] Monthly and yearly revenue reports
- [ ] Export revenue data (CSV)

---

### Week 6: Communication & Notifications

#### 13. Push/Web Notifications (P1) - 2 days
**Status**: 50% complete (in-app notifications work)

**Implementation**:
```typescript
// src/lib/notifications.ts
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/badge.png',
      ...options
    });
  }
};

// Hook to listen for new notifications
export const useNotificationListener = () => {
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new;
          
          // Show browser notification
          sendBrowserNotification(notification.title, {
            body: notification.message,
            data: { notificationId: notification.id }
          });

          // Play sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {}); // Ignore autoplay errors
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);
};
```

**Notification Component**:
```typescript
// src/components/NotificationBell.tsx
export const NotificationBell = () => {
  const [hasPermission, setHasPermission] = useState(Notification.permission === 'granted');

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    
    if (granted) {
      toast.success('Notifications enabled!');
    }
  };

  useNotificationListener(); // Start listening for new notifications

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {!hasPermission && (
              <Button size="sm" variant="outline" onClick={requestPermission}>
                Enable
              </Button>
            )}
          </div>

          {/* Notification list */}
          <NotificationList />
        </div>
      </PopoverContent>
    </Popover>
  );
};
```

**Acceptance Criteria**:
- [ ] Browser notifications shown for new messages, bookings, payments
- [ ] Notification permission prompt on first load
- [ ] Sound plays on new notification (configurable)
- [ ] Notification settings page (toggle categories)
- [ ] Works when app is in background

---

#### 14. Email/SMS Fallback (P1) - 2 days
**Status**: 0% complete

**Edge Function**:
```typescript
// supabase/functions/send-notification/index.ts
import { Resend } from 'resend';
import twilio from 'twilio';

serve(async (req) => {
  const { userId, type, title, message } = await req.json();

  // Get user preferences
  const { data: user } = await supabase
    .from('profiles')
    .select('email, phone, notification_preferences')
    .eq('id', userId)
    .single();

  const prefs = user.notification_preferences || {};

  // Check if user is online (has active websocket connection)
  const isOnline = await checkUserOnlineStatus(userId);

  // Send in-app notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message
    });

  // If offline and email enabled, send email
  if (!isOnline && prefs.email !== false) {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    await resend.emails.send({
      from: 'notifications@goldsainte.com',
      to: user.email,
      subject: title,
      html: `<p>${message}</p>`
    });
  }

  // If urgent and SMS enabled, send SMS
  if (prefs.sms === true && isUrgentNotification(type)) {
    const client = twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID'),
      Deno.env.get('TWILIO_AUTH_TOKEN')
    );
    
    await client.messages.create({
      body: `${title}: ${message}`,
      from: Deno.env.get('TWILIO_PHONE_NUMBER'),
      to: user.phone
    });
  }

  return new Response(JSON.stringify({ success: true }));
});
```

**Acceptance Criteria**:
- [ ] Email sent when user offline for 15+ minutes
- [ ] SMS sent for urgent notifications (payment issues, booking confirmations)
- [ ] User can configure notification preferences (email/SMS on/off per category)
- [ ] Email templates for: booking confirmation, payment receipt, milestone release, message received

---

#### 15. Group Chat (P1) - 2 days
**Status**: 30% complete (1-on-1 messaging works)

**Database Schema**:
```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type TEXT CHECK (type IN ('direct', 'group', 'job')) DEFAULT 'direct',
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rooms they're members of"
  ON chat_rooms FOR SELECT
  USING (
    id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view members of their rooms"
  ON chat_room_members FOR SELECT
  USING (
    room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
  );
```

**Group Chat Component**:
```typescript
// src/components/GroupChat.tsx
export const GroupChat = ({ roomId }: { roomId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const sendMessage = async () => {
    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content: input
      });

    if (!error) {
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Create group chats with multiple participants
- [ ] Add/remove members (admin only)
- [ ] Group chat notifications
- [ ] Typing indicators (optional)
- [ ] Group chat for multi-traveler trips

---

### Week 7: Accessibility, SEO, Security

#### 16-25. Remaining P1 Issues

**Quick Implementation List**:

16. **Accessibility Audit** - Use axe DevTools, fix all violations
17. **SEO Metadata** - Add meta descriptions, OpenGraph tags to all pages
18. **CSRF/XSS/CSP Headers** - Verify in production config
19. **Rate Limiting** - Add to all public edge functions
20. **File Upload Scanning** - Integrate ClamAV or VirusTotal
21. **Error Boundaries** - Wrap all route components
22. **Offline Itinerary Export** - Add PDF generation
23. **Marketplace Lead Integration** - Wire agent intake → POST /api/marketplace/leads
24. **Cancellation/Refund Flow** - Add cancel booking UI with refund policy
25. **Synthetic Monitoring** - Add uptime checks for critical endpoints

---

## Phase 3: Final Polish (Week 8)

### Week 8: Testing, Documentation, Launch Prep

**Deliverables**:
- [ ] Run full E2E test suite (all 5 journeys passing)
- [ ] Run Lighthouse CI on all pages (meet thresholds)
- [ ] Run accessibility audit (no violations)
- [ ] Run load tests (20 concurrent users, no errors)
- [ ] Security scan (OWASP ZAP or similar)
- [ ] Create deployment runbook
- [ ] Create incident response plan
- [ ] Set up monitoring/alerting (Sentry, Datadog, etc.)
- [ ] Final QA pass on staging
- [ ] Beta launch with 10-20 users
- [ ] Monitor for 1 week before full launch

---

## Success Metrics

### Definition of Done (Checklist)

- [ ] **Voice wake word** activates from every page (tested on Chrome, Safari, iOS, Android) ✅ DONE
- [ ] **All 9 critical journeys** have green E2E tests in CI
- [ ] **Personal AI agent** remembers user preferences across sessions
- [ ] **Group booking flow** complete with split payment tracking
- [ ] **Webhook idempotency** verified (duplicate delivery tests pass)
- [ ] **All P0 bugs resolved** (no open blockers)
- [ ] **Lighthouse scores** meet thresholds (Mobile: 90+ perf, 100 a11y)
- [ ] **Observability** dashboards configured (traces, logs, analytics events)
- [ ] **Security headers** verified (CSP, CSRF, rate limits)
- [ ] **Load tests pass** (20 concurrent users, no errors)

### Launch Readiness Score

| Category | Target | Current | Gap |
|----------|--------|---------|-----|
| Core Features | 95% | 70% | -25% |
| Testing | 90% | 10% | -80% |
| Security | 100% | 60% | -40% |
| Performance | 90% | 50% | -40% |
| Accessibility | 100% | 40% | -60% |
| Observability | 90% | 30% | -60% |
| Documentation | 80% | 70% | -10% |
| **TOTAL** | **92%** | **47%** | **-45%** |

**Current Status**: ⚠️ 47% production-ready  
**Target**: ✅ 92% by end of Week 8

---

## Timeline Summary

| Phase | Weeks | Focus | Outcome |
|-------|-------|-------|---------|
| Phase 1: P0 Blockers | 1-4 | Testing, AI Memory, Group Bookings, Webhooks, Logging, Calendar, RBAC, Performance, Inventory | ~70% → 85% |
| Phase 2: P1 Issues | 5-7 | Creator Features, Communication, Notifications, Accessibility, SEO, Security | 85% → 92% |
| Phase 3: Final Polish | 8 | Testing, QA, Beta Launch, Monitoring | 92% → 95% |

**Total Timeline**: 8 weeks from today to production launch

---

## Next Steps

1. ✅ Wake word bug FIXED - test it now!
2. 📋 Review this roadmap and prioritize
3. 🚀 Start Week 1 implementation tomorrow
4. 📊 Track progress weekly (use this doc as your checklist)
5. 🎯 Ship beta by end of Week 8

---

**Questions?** Let me know which critical path you want to start with next!
