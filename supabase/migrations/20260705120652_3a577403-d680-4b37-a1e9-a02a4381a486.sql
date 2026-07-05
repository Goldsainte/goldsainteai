
-- Restrict PII column access via column-level GRANTs for anon/authenticated.
-- Service role retains full access for edge functions/admin RPCs.

-- === marketplace_jobs ===
-- Hide: group_organizer_email, additional_emails, contact_info
REVOKE SELECT ON public.marketplace_jobs FROM anon, authenticated;
GRANT SELECT (
  id, user_id, title, description, booking_type, requirements,
  budget_min, budget_max, currency, travel_dates, destination,
  number_of_travelers, status, assigned_agent_id, winning_bid_id,
  created_at, updated_at, expires_at, payment_status, payment_intent_id,
  paid_at, total_paid_amount, service_fee_collected, success_fee_collected,
  agent_payout_amount, agent_payout_status, completed_at, customer_approved_at,
  completion_notes, rejection_reason, funds_released, funds_released_at,
  dispute_reason, dispute_opened_at, dispute_resolved_at, dispute_resolution,
  payment_plan_enabled, installment_plan_id, refund_guarantee_enabled,
  refund_guarantee_id, is_group_booking, group_payment_mode, total_travelers,
  payments_collected, stripe_payment_intent_id, stripe_transfer_id,
  payment_captured_at, payout_processed_at, notify_all_emails,
  inquiry_source, ai_matched_agents
) ON public.marketplace_jobs TO anon, authenticated;

-- === newsroom_authors ===
-- Hide: email
REVOKE SELECT ON public.newsroom_authors FROM anon, authenticated;
GRANT SELECT (
  id, slug, full_name, title, bio, avatar_url,
  linkedin_url, twitter_url, quote, expertise,
  created_at, updated_at, signature_image_url
) ON public.newsroom_authors TO anon, authenticated;

-- === suppliers ===
-- Hide: contact_email, contact_phone
REVOKE SELECT ON public.suppliers FROM anon, authenticated;
GRANT SELECT (
  id, user_id, supplier_type, name, verification_status, is_verified,
  is_active, rating, total_reviews, commission_rate, insurance_verified,
  license_verified, created_at, updated_at, business_name,
  business_address, description
) ON public.suppliers TO anon, authenticated;

-- === travel_agents ===
-- Hide: email, phone
REVOKE SELECT ON public.travel_agents FROM anon, authenticated;
GRANT SELECT (
  id, user_id, agency_name, business_type, bio, website, status,
  suspension_reason, suspended_at, total_bookings, completed_bookings,
  cancelled_bookings, disputed_bookings, total_revenue_cents,
  average_rating, review_count, response_time_avg_minutes,
  acceptance_rate, completion_rate, is_accepting_requests,
  max_concurrent_bookings, current_booking_count,
  stripe_connect_account_id, stripe_onboarding_complete, stripe_payouts_enabled,
  onboarded_at, last_active_at, created_at, updated_at, terms_accepted,
  identity_verified, background_check_status, professional_license_verified,
  insurance_verified, trust_score, business_address, destinations,
  is_verified, is_active, rating, total_reviews, regions,
  specializations, service_types, primary_contact_name, profile_image_url,
  languages, min_budget, max_budget, experience_years
) ON public.travel_agents TO anon, authenticated;
