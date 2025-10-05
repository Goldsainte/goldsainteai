// Temporary types for Phase 9 features until Supabase types regenerate

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
