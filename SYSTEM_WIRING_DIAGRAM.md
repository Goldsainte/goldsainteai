# System Wiring Diagram - Goldsainte Platform

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[Web App - React/Vite]
        Mobile[Mobile Browser]
    end
    
    subgraph "CDN/Edge"
        CloudFlare[CloudFlare CDN]
    end
    
    subgraph "Supabase Backend"
        Auth[Supabase Auth]
        Database[(PostgreSQL + RLS)]
        Storage[Supabase Storage]
        Realtime[Supabase Realtime]
        EdgeFunctions[Edge Functions - Deno]
    end
    
    subgraph "External Services"
        Stripe[Stripe Payments]
        OpenAI[OpenAI API]
        Booking[Booking.com API]
        Amadeus[Amadeus Flights API]
        SendGrid[SendGrid Email]
        Twilio[Twilio SMS]
    end
    
    WebApp --> CloudFlare
    Mobile --> CloudFlare
    CloudFlare --> Auth
    CloudFlare --> EdgeFunctions
    CloudFlare --> Storage
    
    EdgeFunctions --> Database
    EdgeFunctions --> Stripe
    EdgeFunctions --> OpenAI
    EdgeFunctions --> Booking
    EdgeFunctions --> Amadeus
    EdgeFunctions --> SendGrid
    EdgeFunctions --> Twilio
    
    WebApp --> Realtime
    WebApp --> Auth
    Auth --> Database
    
    Stripe --> EdgeFunctions
```

---

## Voice AI Concierge Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant WakeWord[Wake Word Detector]
    participant VoiceUI[Voice UI Component]
    participant EdgeFunc[realtime-voice-session]
    participant OpenAI
    participant Database
    
    User->>Browser: Says "Hey Goldsainte"
    Browser->>WakeWord: Speech Recognition API
    WakeWord->>VoiceUI: Wake word detected
    VoiceUI->>Browser: Request mic permission
    Browser->>User: Permission prompt
    User->>Browser: Grant permission
    Browser->>VoiceUI: Mic access granted
    VoiceUI->>EdgeFunc: POST /realtime-voice-session
    EdgeFunc->>OpenAI: WebRTC connection
    OpenAI-->>VoiceUI: Audio stream (voice response)
    VoiceUI->>Database: Save session transcript
    Database-->>VoiceUI: Transcript saved
    VoiceUI->>User: Play audio response
```

---

## Booking Flow - Agent-Assisted vs Self-Service

```mermaid
graph TD
    Start[User asks: Find hotels in Miami] --> ExtractIntent[AI extracts intent]
    ExtractIntent --> CheckParams{All params<br/>collected?}
    CheckParams -->|No| AskQuestions[Ask for missing<br/>destination/dates/guests]
    AskQuestions --> CheckParams
    CheckParams -->|Yes| ShowChoice[Show Booking Choice Prompt]
    ShowChoice --> Choice{User chooses?}
    
    Choice -->|Agent| AgentPath[Start Agent Intake]
    AgentPath --> CollectDetails[Collect hotel preferences<br/>Budget, neighborhoods, etc.]
    CollectDetails --> CreateLead[POST /create-marketplace-lead]
    CreateLead --> Database[(marketplace_jobs)]
    Database --> Confirmation[Show case ID & confirmation]
    
    Choice -->|Self-Service| SelfPath[Open Expedia Widget]
    SelfPath --> ExpediaWidget[Expedia inline widget<br/>with prefilled data]
    ExpediaWidget --> UserBooks[User books on Expedia]
    UserBooks --> Redirect[Redirect to Expedia.com]
    Redirect --> Return[User returns with booking]
```

---

## Marketplace Payment Flow with Milestones

```mermaid
sequenceDiagram
    participant Traveler
    participant Agent
    participant EdgeFunc[release-milestone-payment]
    participant Database
    participant Stripe
    participant Webhook[stripe-webhook-handler]
    
    Traveler->>Database: Post complex trip request
    Database->>Agent: Notify new job available
    Agent->>Database: Place bid with 3 milestones
    Traveler->>Database: Accept bid
    
    Note over Traveler,Stripe: Milestone 1: Fund
    Traveler->>Stripe: Fund Milestone 1 ($1,500)
    Stripe->>Webhook: payment_intent.succeeded
    Webhook->>Database: Update milestone status = 'funded'
    
    Note over Agent,Database: Milestone 1: Complete Work
    Agent->>Database: Mark work complete
    Database->>Traveler: Notify for approval
    Traveler->>EdgeFunc: Approve & release payment
    
    Note over EdgeFunc,Stripe: Milestone 1: Payout
    EdgeFunc->>Stripe: Create transfer to agent
    Stripe->>Webhook: transfer.created
    Webhook->>Database: Update agent balance (pending)
    Stripe->>Webhook: payout.paid
    Webhook->>Database: Move to available balance
    
    Note over Traveler,Agent: Repeat for Milestone 2 & 3
```

---

## Group Booking Split Payment Flow

```mermaid
graph TD
    Organizer[Organizer creates<br/>group trip] --> SetTotal[Total: $4,000<br/>4 participants]
    SetTotal --> Generate[POST /create-group-payment-links]
    Generate --> Links[Generate 4 unique<br/>Stripe payment links]
    Links --> Send[Email links to<br/>each participant]
    
    Send --> P1[Participant 1<br/>pays $1,000]
    Send --> P2[Participant 2<br/>pays $1,000]
    Send --> P3[Participant 3<br/>pays $1,000]
    Send --> P4[Participant 4<br/>pays $1,000]
    
    P1 --> Webhook1[Stripe webhook:<br/>checkout.session.completed]
    P2 --> Webhook2[Stripe webhook]
    P3 --> Webhook3[Stripe webhook]
    P4 --> Webhook4[Stripe webhook]
    
    Webhook1 --> UpdateDB1[Update participant 1<br/>payment_status = 'paid']
    Webhook2 --> UpdateDB2[Update participant 2<br/>payment_status = 'paid']
    Webhook3 --> UpdateDB3[Update participant 3<br/>payment_status = 'paid']
    Webhook4 --> UpdateDB4[Update participant 4<br/>payment_status = 'paid']
    
    UpdateDB4 --> Check{All 4 paid?}
    Check -->|Yes| Complete[Group booking<br/>status = 'fully_funded']
    Check -->|No| Partial[Status = 'partially_funded'<br/>Allow trip to proceed]
```

---

## Creator Monetization & Payout Flow

```mermaid
graph LR
    subgraph "Revenue Sources"
        Views[Content Views]
        Gifts[Virtual Gifts]
        Packages[Package Bookings<br/>15-60% commission]
        Shop[Shop Sales]
        Affiliate[Affiliate Revenue]
    end
    
    subgraph "Creator Dashboard"
        Balance[Creator Balance]
        Pending[Pending Balance]
        Available[Available Balance]
    end
    
    subgraph "Stripe Connect"
        Onboarding[Onboarding Flow]
        Transfer[Stripe Transfer]
        Payout[Bank Payout]
    end
    
    Views --> Balance
    Gifts --> Balance
    Packages --> Balance
    Shop --> Balance
    Affiliate --> Balance
    
    Balance --> Pending
    Pending -->|Work Complete| Transfer
    Transfer --> Webhook[stripe-webhook-handler]
    Webhook --> Available
    Available -->|Creator Requests| Payout
```

---

## Real-time Communication Flow

```mermaid
sequenceDiagram
    participant TravelerApp
    participant AgentApp
    participant RealtimeDB[Supabase Realtime]
    participant Database
    participant Notification[Notification Service]
    participant Email[SendGrid]
    participant Push[Push Notification]
    
    TravelerApp->>Database: INSERT message
    Database->>RealtimeDB: Publish change
    RealtimeDB->>AgentApp: Real-time message delivery
    AgentApp->>TravelerApp: Typing indicator
    AgentApp->>Database: INSERT reply
    Database->>RealtimeDB: Publish change
    RealtimeDB->>TravelerApp: Real-time reply delivery
    
    Note over TravelerApp,Push: Agent is offline
    TravelerApp->>Database: INSERT message
    Database->>Notification: Trigger notification
    Notification->>Push: Send push notification
    Notification->>Email: Send email fallback
    Push-->>AgentApp: Notification received
    AgentApp->>TravelerApp: Read receipt
```

---

## Itinerary Management & Calendar Sync

```mermaid
graph TD
    User[User creates itinerary] --> Builder[Day-by-day builder]
    Builder --> SaveDB[(Save to Database)]
    SaveDB --> UploadDocs[Upload travel docs<br/>to Supabase Storage]
    
    UploadDocs --> Share{Share with<br/>companions?}
    Share -->|Yes| RBAC[Set permissions<br/>View or Edit]
    RBAC --> Invite[Send invite emails]
    Share -->|No| CalSync[Calendar Sync]
    
    Invite --> CalSync
    CalSync --> Choice{Choose format}
    Choice --> Google[Google Calendar<br/>OAuth flow]
    Choice --> Apple[Apple Calendar<br/>ICS download]
    Choice --> ICS[Generic ICS export]
    
    Google --> OAuthFunc[sync-calendar-google]
    OAuthFunc --> GoogleAPI[Google Calendar API]
    GoogleAPI --> Events[Events created]
    
    Apple --> ExportFunc[icsExport utility]
    ExportFunc --> Download[Download .ics file]
    
    ICS --> ExportFunc
    
    SaveDB --> Offline[Export for offline]
    Offline --> PDF[Generate PDF]
    PDF --> Print[Printable view]
```

---

## Webhook Processing with Idempotency

```mermaid
sequenceDiagram
    participant Stripe
    participant Webhook[stripe-webhook-handler]
    participant Idempotency[webhookIdempotency]
    participant Database
    participant Business[Business Logic]
    
    Stripe->>Webhook: POST webhook event
    Webhook->>Webhook: Verify signature
    Webhook->>Idempotency: checkAndRecordWebhook(event_id)
    Idempotency->>Database: SELECT from webhook_events
    
    alt Event already processed
        Database-->>Idempotency: Found existing event
        Idempotency-->>Webhook: shouldProcess = false
        Webhook-->>Stripe: 200 OK (duplicate)
    else New event
        Database-->>Idempotency: Not found
        Idempotency->>Database: INSERT webhook_event<br/>status = 'processing'
        Idempotency-->>Webhook: shouldProcess = true
        Webhook->>Business: Handle event
        Business->>Database: Update business tables
        Business-->>Webhook: Success
        Webhook->>Idempotency: updateWebhookStatus(success)
        Idempotency->>Database: UPDATE status = 'success'
        Webhook-->>Stripe: 200 OK
    end
```

---

## AI Preference Learning System

```mermaid
graph TD
    FirstVisit[First-time user<br/>Cold start] --> AskPrefs[AI asks about<br/>travel preferences]
    AskPrefs --> UserResponds[User: I prefer<br/>luxury resorts, $500-800/night]
    UserResponds --> ExtractPrefs[extractPreferencesFromConversation]
    ExtractPrefs --> SavePrefs[saveUserPreferences]
    SavePrefs --> Database[(user_travel_preferences)]
    
    ReturnVisit[Returning user] --> LoadPrefs[getUserPreferences]
    LoadPrefs --> Database
    Database --> BuildContext[buildPreferenceContext]
    BuildContext --> AIPrompt[Inject into AI prompt:<br/>User prefers luxury, $500-800]
    AIPrompt --> PersonalizedRec[AI recommends<br/>5-star beachfront resort<br/>$650/night]
    PersonalizedRec --> UserBooks[User books]
    UserBooks --> UpdatePrefs[Update preferences<br/>with booking history]
    UpdatePrefs --> Database
```

---

## Error Tracking & Observability

```mermaid
graph LR
    subgraph "Application"
        Frontend[Frontend Errors]
        Backend[Backend Errors]
        EdgeFunc[Edge Function Errors]
    end
    
    subgraph "Monitoring"
        Sentry[Sentry Error Tracking]
        Logs[Supabase Logs]
        Metrics[Performance Metrics]
    end
    
    subgraph "Alerting"
        Email[Email Alerts]
        Slack[Slack Notifications]
        PagerDuty[PagerDuty On-call]
    end
    
    Frontend --> Sentry
    Backend --> Sentry
    EdgeFunc --> Logs
    EdgeFunc --> Sentry
    
    Sentry --> Email
    Sentry --> Slack
    Logs --> Metrics
    Metrics --> Dashboard[Grafana Dashboard]
    
    Sentry -->|P0 Error| PagerDuty
    Logs -->|Critical| PagerDuty
```

---

## Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Auth[Supabase Auth]
    participant Database
    participant RLS[RLS Policies]
    participant API[Edge Functions]
    
    User->>Frontend: Login
    Frontend->>Auth: Sign in with email/password
    Auth->>Database: Validate credentials
    Database-->>Auth: User record
    Auth-->>Frontend: JWT token + session
    Frontend->>Database: Query protected data
    Database->>RLS: Check RLS policies
    RLS->>Database: SELECT from user_roles
    Database->>RLS: User has 'creator' role
    RLS-->>Frontend: Authorized data
    
    Frontend->>API: Call edge function
    API->>Auth: Verify JWT
    Auth-->>API: User ID extracted
    API->>Database: Check has_role(user_id, 'creator')
    Database-->>API: true
    API-->>Frontend: Function response
```

---

## Deployment Pipeline (CI/CD)

```mermaid
graph TD
    Dev[Developer commits] --> GitHub[GitHub Repository]
    GitHub --> Trigger[GitHub Actions triggered]
    
    Trigger --> Lint[ESLint + Prettier]
    Lint --> Test[Run E2E tests<br/>Playwright]
    Test --> Build[Build production<br/>Vite bundle]
    Build --> Deploy{Deploy target?}
    
    Deploy -->|Staging| DeployStaging[Deploy to staging<br/>staging.goldsainte.com]
    Deploy -->|Production| Approval[Manual approval required]
    Approval --> DeployProd[Deploy to production<br/>goldsainte.com]
    
    DeployStaging --> RunSmoke[Run smoke tests]
    DeployProd --> RunSmoke
    RunSmoke --> Success{Tests pass?}
    Success -->|Yes| Notify[Notify team: Success]
    Success -->|No| Rollback[Auto-rollback]
    Rollback --> Alert[Alert on-call engineer]
```

---

## Data Flow Summary

### Critical Paths
1. **Voice Activation:** User → Browser → Wake Word → Voice UI → OpenAI → Database
2. **Booking Choice:** User → AI Chat → Intent Extraction → Choice Prompt → Agent/Expedia
3. **Marketplace:** Traveler → Job Post → Agent Bid → Milestone Fund → Work Complete → Release → Payout
4. **Group Booking:** Organizer → Create Trip → Generate Links → Participants Pay → Track Status
5. **Creator Payout:** Revenue Sources → Balance Tracking → Stripe Connect → Bank Transfer

---

**Last Updated:** 2025-11-11  
**Version:** 1.0
