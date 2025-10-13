// Temporary types for Phase 9 and Phase 10 features until Supabase types regenerate

export interface MomentReaction {
  id: string;
  moment_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface MomentPollResponse {
  id: string;
  moment_id: string;
  user_id: string;
  response_data: any;
  created_at: string;
}

export interface MomentReply {
  id: string;
  moment_id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  media_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface UserSuggestion {
  id: string;
  user_id: string;
  suggested_user_id: string;
  score: number;
  reason: string | null;
  created_at: string;
}

export interface InstantBookingSettings {
  id: string;
  agent_id: string;
  enabled: boolean;
  auto_accept_threshold: number | null;
  max_concurrent_bookings: number;
  blackout_dates: any[];
  service_types: string[];
  created_at: string;
  updated_at: string;
}

export interface PricingSuggestion {
  id: string;
  job_id: string | null;
  agent_id: string | null;
  suggested_price: number;
  confidence_score: number;
  market_average: number;
  factors: Record<string, any>;
  created_at: string;
  valid_until: string | null;
}

export interface CancellationPolicy {
  id: string;
  name: string;
  description: string | null;
  full_refund_hours: number;
  partial_refund_hours: number | null;
  partial_refund_percentage: number | null;
  no_refund_hours: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobCancellationPolicy {
  id: string;
  job_id: string;
  policy_id: string;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  booking_type: string;
  destination: string | null;
  average_price: number;
  currency: string;
  sample_size: number;
  date_recorded: string;
  created_at: string;
}
