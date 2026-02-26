

# Proposal System: From Form to Contract-Based Bid

## Current State

The `NewProposalPage.tsx` is a 4-step wizard (Pitch → Pricing → Deliverables → Review) that collects a headline, free-text message, total price, deposit slider, delivery/booking days, and 5 flat toggle checkboxes. It uses almost none of the database columns available.

**Database columns that already exist but are unused:**
- `exclusions` (string array)
- `custom_cancellation_terms` (text)
- `cancellation_policy_id` (FK to `cancellation_policies`)
- `deposit_due_days` (number)
- `payment_schedule` (JSON)
- `price_breakdown` (JSON)
- `itinerary_summary` (text)

**What needs to be created:**
- A storage bucket for proposal attachments (no `proposal_attachments` table or bucket exists)
- A `proposal_attachments` table to track uploaded files

---

## New Step Structure: 4 → 7 Steps

```text
1. Your Pitch           (existing, add itinerary summary)
2. Scope of Services    (NEW — inclusions, exclusions, service level, revisions, support level)
3. Pricing & Payment    (expanded — pricing type, planning fee, deposit due days, payment schedule)
4. Cancellation Policy  (NEW — deposit refundability, cancellation windows, custom terms)
5. Deliverables         (restructured — structured sub-options instead of flat checkboxes)
6. Attachments          (NEW — file uploads for PDFs, mood boards, documents)
7. Review & Submit      (expanded — full contract preview + 3 legal checkboxes)
```

---

## Step-by-Step Design

### Step 1: Your Pitch (minor additions)
- Keep headline + message fields
- Add **Itinerary Summary** textarea → maps to `itinerary_summary` column
- Placeholder: "Brief overview of the proposed trip structure (day-by-day summary)"

### Step 2: Scope of Services (NEW)
- **Inclusions** — multi-line textarea, one item per line → splits into `inclusions[]` array
  - Placeholder: "Airport transfers\nHotel bookings (4-star+)\n2 guided excursions"
- **Exclusions** — multi-line textarea, one item per line → splits into `exclusions[]` array
  - Placeholder: "International flights\nMeals not specified\nVisa fees"
- **Service Level** — radio: "Advisory" / "Full-Service" / "Concierge" → stored in `price_breakdown` JSON as `service_level`
- **Revisions Included** — select: "1 revision" / "2 revisions" / "3 revisions" / "Unlimited within scope" → stored in `price_breakdown` JSON as `revision_count`
- **Support Level** — radio: "Email only" / "Business hours phone" / "24/7 emergency" → stored in `price_breakdown` JSON as `support_level`
- **Supplier Payment Handling** — checkbox: "I handle payments to suppliers on behalf of the traveler" → stored in `price_breakdown` JSON as `handles_supplier_payments`

### Step 3: Pricing & Payment (expanded)
- **Pricing Type** — radio: "Per Person" / "Total Trip Cost" → `price_breakdown.pricing_type`
- **Trip Cost** — numeric input (existing `price_from`)
- **Planning Fee** — toggle "Includes separate planning fee" with amount input → `price_breakdown.planning_fee` and `price_breakdown.planning_fee_refundable` checkbox
- **Deposit** — existing slider (maps to `deposit_percentage`)
- **Deposit Due Within** — numeric input in days → `deposit_due_days`
- **Remaining Balance Due** — select: "Before departure" / "Upon itinerary delivery" / "Custom date" → `price_breakdown.balance_due`
- **Is Pricing Estimate or Confirmed?** — radio: "Confirmed pricing" / "Estimate (subject to availability)" → `price_breakdown.pricing_confirmed`
- **Payment Schedule** — select: "Full on acceptance" / "50/50 split" / "Milestone-based" / "Custom"
  - If milestone or custom: editable rows (milestone name + % of total) → `payment_schedule` JSON array
- **Estimated Earnings** — existing calculation, kept

### Step 4: Cancellation & Refund Policy (NEW)
- **Is Deposit Refundable?** — radio: "Fully refundable" / "Partially refundable" / "Non-refundable" → `price_breakdown.deposit_refundable`
- **Cancellation Windows** — structured inputs with 4 tiers:
  - "60+ days before departure: __% refund"
  - "30–59 days before departure: __% refund"
  - "14–29 days before departure: __% refund"
  - "<14 days before departure: __% refund"
  - Default values: 90%, 50%, 25%, 0%
  - Stored in `price_breakdown.cancellation_windows` as `[{band, refund_pct}]`
- **Change Fee** — optional numeric input: "Fee for itinerary changes after acceptance" → `price_breakdown.change_fee`
- **Supplier-Dependent Clause** — checkbox: "Some components are subject to third-party supplier cancellation policies" with optional note → `price_breakdown.supplier_dependent_note`
- **Custom Terms** — textarea for additional cancellation language → `custom_cancellation_terms`

### Step 5: Deliverables (restructured)
Replace flat checkboxes with structured cards containing sub-options:

- **Full Itinerary PDF** — checkbox + description: "Day-by-day PDF with booking confirmations, maps, and contacts"
- **Booking Management** — checkbox → sub-radio if checked:
  - "Advisory only (recommendations)"
  - "Full-service (I book everything)"
  - "Hybrid (I book key components)"
- **On-Trip Support** — checkbox → sub-radio if checked:
  - "Email only"
  - "Business hours phone support"
  - "24/7 emergency line"
- **Revisions** — auto-display from Step 2's revision count selection (read-only confirmation)
- **Concierge Services** — checkbox → text input if checked: "Specify what's included (e.g., restaurant reservations, spa bookings)"

Each stored as structured data in `inclusions[]` with detail suffixes.

### Step 6: Attachments (NEW)
- **File Upload Area** — drag-and-drop or click to upload
  - Accepted types: PDF, JPG, PNG, WEBP
  - Max 5 files, 10MB each
  - Upload to `proposal-attachments` storage bucket under `{user_id}/{proposal_id}/` path
- **External Links** — repeatable input fields for URLs (stored in `price_breakdown.external_links` as string array)
- Labels: "Sample itinerary", "Mood board", "Supporting documents", "Portfolio link"

### Step 7: Review & Submit (contract preview + legal)
Full contract-style preview with sections:
1. **Proposal Summary** — headline, role, itinerary summary
2. **Scope of Services** — inclusions list, exclusions list, service level, revisions, support level
3. **Pricing** — pricing type, total, planning fee, deposit amount + due date, balance due date
4. **Payment Schedule** — milestone table or summary
5. **Cancellation Policy** — deposit refundability, 4-tier window table, change fee, custom terms
6. **Deliverables** — structured list with sub-option details
7. **Attachments** — file list with names

**3 mandatory legal checkboxes before submit:**
- "I agree to Goldsainte's marketplace terms and conditions"
- "I understand deposit handling rules and payment processing terms"
- "I acknowledge that the cancellation policy and refund terms stated above are binding commitments"

Submit button disabled until all 3 checked.

---

## Bid Competitiveness Sidebar (enhanced)
Add to existing sidebar:
- **Price vs budget indicator** — visual bar showing where proposed price falls within traveler's budget range (green if within, amber if above)
- **Proposal deadline** — "Proposal valid for 14 days" (already exists, keep)
- Existing proposal count + budget range + estimated earnings stay

---

## Database Changes Required

### 1. New Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proposal-attachments', 'proposal-attachments', false);
```
With RLS policies for authenticated users to upload/read their own files.

### 2. New Table: `proposal_attachments`
```sql
CREATE TABLE public.proposal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES trip_proposals(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
With RLS: users can insert/select where `uploaded_by = auth.uid()`.

---

## Files Modified/Created

| File | Action |
|------|--------|
| `src/pages/proposals/NewProposalPage.tsx` | **Major rewrite** — expand from 4 to 7 steps, add all new form sections, structured deliverables, file uploads, contract preview, legal acknowledgments |
| Migration SQL | **New** — create `proposal_attachments` table + `proposal-attachments` storage bucket + RLS policies |

---

## Data Mapping Summary

```text
Form Field                      → Database Column / JSON Path
────────────────────────────────────────────────────────────
Itinerary summary               → itinerary_summary
Inclusions (line-separated)     → inclusions[]
Exclusions (line-separated)     → exclusions[]
Service level                   → price_breakdown.service_level
Revision count                  → price_breakdown.revision_count
Support level                   → price_breakdown.support_level
Handles supplier payments       → price_breakdown.handles_supplier_payments
Pricing type (per person/total) → price_breakdown.pricing_type
Planning fee + refundable       → price_breakdown.planning_fee, .planning_fee_refundable
Deposit due days                → deposit_due_days
Balance due timing              → price_breakdown.balance_due
Pricing confirmed vs estimate   → price_breakdown.pricing_confirmed
Payment schedule                → payment_schedule (JSON array)
Deposit refundability           → price_breakdown.deposit_refundable
Cancellation windows            → price_breakdown.cancellation_windows
Change fee                      → price_breakdown.change_fee
Supplier-dependent note         → price_breakdown.supplier_dependent_note
Custom cancellation terms       → custom_cancellation_terms
External links                  → price_breakdown.external_links
Attachments                     → proposal_attachments table + storage bucket
```

