export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_availability: {
        Row: {
          agent_id: string
          created_at: string
          date: string
          id: string
          is_available: boolean
          notes: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          notes?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_availability_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_badges: {
        Row: {
          agent_id: string
          badge_type: string
          created_at: string
          criteria_met: Json | null
          earned_at: string
          id: string
          valid_until: string | null
        }
        Insert: {
          agent_id: string
          badge_type: string
          created_at?: string
          criteria_met?: Json | null
          earned_at?: string
          id?: string
          valid_until?: string | null
        }
        Update: {
          agent_id?: string
          badge_type?: string
          created_at?: string
          criteria_met?: Json | null
          earned_at?: string
          id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_badges_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_bids: {
        Row: {
          agent_id: string
          agent_payout_amount: number | null
          agent_quoted_price: number
          created_at: string
          currency: string
          customer_facing_price: number
          estimated_completion_days: number | null
          id: string
          job_id: string
          platform_service_fee: number | null
          platform_success_fee: number | null
          proposal_details: string
          proposed_price: number
          service_fee_percentage: number | null
          status: string
          success_fee_percentage: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_payout_amount?: number | null
          agent_quoted_price?: number
          created_at?: string
          currency?: string
          customer_facing_price?: number
          estimated_completion_days?: number | null
          id?: string
          job_id: string
          platform_service_fee?: number | null
          platform_success_fee?: number | null
          proposal_details: string
          proposed_price: number
          service_fee_percentage?: number | null
          status?: string
          success_fee_percentage?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_payout_amount?: number | null
          agent_quoted_price?: number
          created_at?: string
          currency?: string
          customer_facing_price?: number
          estimated_completion_days?: number | null
          id?: string
          job_id?: string
          platform_service_fee?: number | null
          platform_success_fee?: number | null
          proposal_details?: string
          proposed_price?: number
          service_fee_percentage?: number | null
          status?: string
          success_fee_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_bids_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_bids_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_performance_metrics: {
        Row: {
          acceptance_rate_percentage: number | null
          agent_id: string
          avg_customer_rating: number | null
          avg_first_response_minutes: number | null
          avg_response_time_minutes: number | null
          bids_accepted: number | null
          bids_declined: number | null
          completion_rate_percentage: number | null
          created_at: string
          id: string
          jobs_cancelled: number | null
          jobs_completed: number | null
          on_time_delivery_rate: number | null
          period_end: string | null
          period_start: string | null
          response_rate_percentage: number | null
          total_bids_sent: number | null
          updated_at: string
        }
        Insert: {
          acceptance_rate_percentage?: number | null
          agent_id: string
          avg_customer_rating?: number | null
          avg_first_response_minutes?: number | null
          avg_response_time_minutes?: number | null
          bids_accepted?: number | null
          bids_declined?: number | null
          completion_rate_percentage?: number | null
          created_at?: string
          id?: string
          jobs_cancelled?: number | null
          jobs_completed?: number | null
          on_time_delivery_rate?: number | null
          period_end?: string | null
          period_start?: string | null
          response_rate_percentage?: number | null
          total_bids_sent?: number | null
          updated_at?: string
        }
        Update: {
          acceptance_rate_percentage?: number | null
          agent_id?: string
          avg_customer_rating?: number | null
          avg_first_response_minutes?: number | null
          avg_response_time_minutes?: number | null
          bids_accepted?: number | null
          bids_declined?: number | null
          completion_rate_percentage?: number | null
          created_at?: string
          id?: string
          jobs_cancelled?: number | null
          jobs_completed?: number | null
          on_time_delivery_rate?: number | null
          period_end?: string | null
          period_start?: string | null
          response_rate_percentage?: number | null
          total_bids_sent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_response_tracking: {
        Row: {
          agent_id: string
          created_at: string
          first_response_at: string | null
          id: string
          inquiry_received_at: string
          job_id: string | null
          message_id: string | null
          response_time_minutes: number | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          first_response_at?: string | null
          id?: string
          inquiry_received_at: string
          job_id?: string | null
          message_id?: string | null
          response_time_minutes?: number | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          first_response_at?: string | null
          id?: string
          inquiry_received_at?: string
          job_id?: string | null
          message_id?: string | null
          response_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_response_tracking_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_response_tracking_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_response_tracking_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "marketplace_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reviews: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          job_id: string
          rating: number
          review_text: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          job_id: string
          rating: number
          review_text?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          job_id?: string
          rating?: number
          review_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_verification_requests: {
        Row: {
          additional_info: Json | null
          agent_id: string
          created_at: string
          document_urls: Json | null
          expiry_date: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          verification_type: string
        }
        Insert: {
          additional_info?: Json | null
          agent_id: string
          created_at?: string
          document_urls?: Json | null
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          verification_type: string
        }
        Update: {
          additional_info?: Json | null
          agent_id?: string
          created_at?: string
          document_urls?: Json | null
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_verification_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_matching_scores: {
        Row: {
          agent_id: string
          confidence_level: string
          created_at: string
          id: string
          job_id: string
          match_score: number
          matching_factors: Json | null
        }
        Insert: {
          agent_id: string
          confidence_level: string
          created_at?: string
          id?: string
          job_id: string
          match_score: number
          matching_factors?: Json | null
        }
        Update: {
          agent_id?: string
          confidence_level?: string
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number
          matching_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_matching_scores_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_matching_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_assignment_rules: {
        Row: {
          agent_id: string
          auto_accept: boolean | null
          booking_types: string[] | null
          created_at: string
          destinations: string[] | null
          id: string
          is_active: boolean | null
          max_budget: number | null
          min_budget: number | null
          priority: number | null
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          auto_accept?: boolean | null
          booking_types?: string[] | null
          created_at?: string
          destinations?: string[] | null
          id?: string
          is_active?: boolean | null
          max_budget?: number | null
          min_budget?: number | null
          priority?: number | null
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          auto_accept?: boolean | null
          booking_types?: string[] | null
          created_at?: string
          destinations?: string[] | null
          id?: string
          is_active?: boolean | null
          max_budget?: number | null
          min_budget?: number | null
          priority?: number | null
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_assignment_rules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_modifications: {
        Row: {
          amadeus_order_id: string | null
          booking_id: string
          cancellation_fee: number | null
          change_fee: number | null
          created_at: string
          fare_difference: number | null
          id: string
          modification_type: string
          new_booking_data: Json | null
          notes: string | null
          original_booking_data: Json
          processed_at: string | null
          reason: string | null
          refund_amount: number | null
          refund_currency: string | null
          refund_status: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amadeus_order_id?: string | null
          booking_id: string
          cancellation_fee?: number | null
          change_fee?: number | null
          created_at?: string
          fare_difference?: number | null
          id?: string
          modification_type: string
          new_booking_data?: Json | null
          notes?: string | null
          original_booking_data: Json
          processed_at?: string | null
          reason?: string | null
          refund_amount?: number | null
          refund_currency?: string | null
          refund_status?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amadeus_order_id?: string | null
          booking_id?: string
          cancellation_fee?: number | null
          change_fee?: number | null
          created_at?: string
          fare_difference?: number | null
          id?: string
          modification_type?: string
          new_booking_data?: Json | null
          notes?: string | null
          original_booking_data?: Json
          processed_at?: string | null
          reason?: string | null
          refund_amount?: number | null
          refund_currency?: string | null
          refund_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_modifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          base_cost: number | null
          booking_data: Json
          booking_reference: string | null
          booking_type: string
          commission_earned: number | null
          created_at: string
          currency: string
          guest_id: string | null
          id: string
          markup_amount: number | null
          markup_percentage: number | null
          net_profit: number | null
          status: string
          stripe_fee: number | null
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          base_cost?: number | null
          booking_data: Json
          booking_reference?: string | null
          booking_type: string
          commission_earned?: number | null
          created_at?: string
          currency?: string
          guest_id?: string | null
          id?: string
          markup_amount?: number | null
          markup_percentage?: number | null
          net_profit?: number | null
          status?: string
          stripe_fee?: number | null
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          base_cost?: number | null
          booking_data?: Json
          booking_reference?: string | null
          booking_type?: string
          commission_earned?: number | null
          created_at?: string
          currency?: string
          guest_id?: string | null
          id?: string
          markup_amount?: number | null
          markup_percentage?: number | null
          net_profit?: number | null
          status?: string
          stripe_fee?: number | null
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          preview: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          preview?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          preview?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      currency_exchange_rates: {
        Row: {
          created_at: string
          effective_date: string
          from_currency: string
          id: string
          rate: number
          source: string | null
          to_currency: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_date?: string
          from_currency: string
          id?: string
          rate: number
          source?: string | null
          to_currency: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          from_currency?: string
          id?: string
          rate?: number
          source?: string | null
          to_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_reports: {
        Row: {
          columns: string[] | null
          created_at: string
          description: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          last_generated_at: string | null
          name: string
          report_type: string
          schedule: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          columns?: string[] | null
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          name: string
          report_type: string
          schedule?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          columns?: string[] | null
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          name?: string
          report_type?: string
          schedule?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_verifications: {
        Row: {
          created_at: string
          document_url: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          rejection_reason: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          contact_name: string
          country_code: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          phone_number: string
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name: string
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone_number: string
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone_number?: string
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          favorite_data: Json
          favorite_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_data: Json
          favorite_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_data?: Json
          favorite_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          country: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_completion_submissions: {
        Row: {
          agent_id: string
          attachments: Json | null
          completion_notes: string | null
          created_at: string
          customer_response: string | null
          customer_response_at: string | null
          deliverables_description: string | null
          id: string
          job_id: string
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          attachments?: Json | null
          completion_notes?: string | null
          created_at?: string
          customer_response?: string | null
          customer_response_at?: string | null
          deliverables_description?: string | null
          id?: string
          job_id: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          attachments?: Json | null
          completion_notes?: string | null
          created_at?: string
          customer_response?: string | null
          customer_response_at?: string | null
          deliverables_description?: string | null
          id?: string
          job_id?: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_completion_submissions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          created_at: string
          id: string
          lifetime_points: number
          points_balance: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_disputes: {
        Row: {
          created_at: string
          description: string
          dispute_type: string
          evidence: Json | null
          id: string
          job_id: string
          raised_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          dispute_type: string
          evidence?: Json | null
          id?: string
          job_id: string
          raised_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          dispute_type?: string
          evidence?: Json | null
          id?: string
          job_id?: string
          raised_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_invoices: {
        Row: {
          agent_id: string
          amount_paid: number | null
          billing_address: Json | null
          created_at: string
          currency: string
          customer_id: string
          customer_notes: string | null
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          job_id: string
          line_items: Json
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_terms: string | null
          sent_at: string | null
          status: string
          stripe_invoice_id: string | null
          subtotal: number
          tax_amount: number | null
          tax_details: Json | null
          tax_rate: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          amount_paid?: number | null
          billing_address?: Json | null
          created_at?: string
          currency?: string
          customer_id: string
          customer_notes?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          job_id: string
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subtotal: number
          tax_amount?: number | null
          tax_details?: Json | null
          tax_rate?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amount_paid?: number | null
          billing_address?: Json | null
          created_at?: string
          currency?: string
          customer_id?: string
          customer_notes?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          job_id?: string
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_details?: Json | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_invoices_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_job_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          job_id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          job_id: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          job_id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_jobs: {
        Row: {
          agent_payout_amount: number | null
          agent_payout_status: string | null
          assigned_agent_id: string | null
          booking_type: string
          budget_max: number | null
          budget_min: number | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          currency: string
          customer_approved_at: string | null
          description: string
          destination: string | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_resolution: string | null
          dispute_resolved_at: string | null
          expires_at: string
          funds_released: boolean | null
          funds_released_at: string | null
          id: string
          installment_plan_id: string | null
          number_of_travelers: number | null
          paid_at: string | null
          payment_intent_id: string | null
          payment_plan_enabled: boolean | null
          payment_status: string | null
          refund_guarantee_enabled: boolean | null
          refund_guarantee_id: string | null
          rejection_reason: string | null
          requirements: Json
          service_fee_collected: number | null
          status: string
          success_fee_collected: number | null
          title: string
          total_paid_amount: number | null
          travel_dates: Json | null
          updated_at: string
          user_id: string
          winning_bid_id: string | null
        }
        Insert: {
          agent_payout_amount?: number | null
          agent_payout_status?: string | null
          assigned_agent_id?: string | null
          booking_type: string
          budget_max?: number | null
          budget_min?: number | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          currency?: string
          customer_approved_at?: string | null
          description: string
          destination?: string | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          expires_at?: string
          funds_released?: boolean | null
          funds_released_at?: string | null
          id?: string
          installment_plan_id?: string | null
          number_of_travelers?: number | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_plan_enabled?: boolean | null
          payment_status?: string | null
          refund_guarantee_enabled?: boolean | null
          refund_guarantee_id?: string | null
          rejection_reason?: string | null
          requirements: Json
          service_fee_collected?: number | null
          status?: string
          success_fee_collected?: number | null
          title: string
          total_paid_amount?: number | null
          travel_dates?: Json | null
          updated_at?: string
          user_id: string
          winning_bid_id?: string | null
        }
        Update: {
          agent_payout_amount?: number | null
          agent_payout_status?: string | null
          assigned_agent_id?: string | null
          booking_type?: string
          budget_max?: number | null
          budget_min?: number | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          currency?: string
          customer_approved_at?: string | null
          description?: string
          destination?: string | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          expires_at?: string
          funds_released?: boolean | null
          funds_released_at?: string | null
          id?: string
          installment_plan_id?: string | null
          number_of_travelers?: number | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_plan_enabled?: boolean | null
          payment_status?: string | null
          refund_guarantee_enabled?: boolean | null
          refund_guarantee_id?: string | null
          rejection_reason?: string | null
          requirements?: Json
          service_fee_collected?: number | null
          status?: string
          success_fee_collected?: number | null
          title?: string
          total_paid_amount?: number | null
          travel_dates?: Json | null
          updated_at?: string
          user_id?: string
          winning_bid_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_jobs_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_jobs_installment_plan_id_fkey"
            columns: ["installment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_jobs_refund_guarantee_id_fkey"
            columns: ["refund_guarantee_id"]
            isOneToOne: false
            referencedRelation: "refund_guarantees"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          job_id: string
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          job_id: string
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          job_id?: string
          message_text?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_milestones: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          deliverables: Json | null
          description: string | null
          due_date: string | null
          id: string
          job_id: string
          milestone_number: number
          notes: string | null
          paid_at: string | null
          payment_intent_id: string | null
          percentage: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          deliverables?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          job_id: string
          milestone_number: number
          notes?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          percentage?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          deliverables?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          job_id?: string
          milestone_number?: number
          notes?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          percentage?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestones_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          auto_charge: boolean | null
          created_at: string
          currency: string
          end_date: string
          frequency: string
          id: string
          installment_amount: number
          installments_paid: number | null
          job_id: string
          next_payment_date: string | null
          number_of_installments: number
          start_date: string
          status: string
          stripe_subscription_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          auto_charge?: boolean | null
          created_at?: string
          currency?: string
          end_date: string
          frequency: string
          id?: string
          installment_amount: number
          installments_paid?: number | null
          job_id: string
          next_payment_date?: string | null
          number_of_installments: number
          start_date: string
          status?: string
          stripe_subscription_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          auto_charge?: boolean | null
          created_at?: string
          currency?: string
          end_date?: string
          frequency?: string
          id?: string
          installment_amount?: number
          installments_paid?: number | null
          job_id?: string
          next_payment_date?: string | null
          number_of_installments?: number
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          escrow_held: boolean | null
          id: string
          payment_method: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          transfer_id: string | null
          transferred_at: string | null
          transferred_to_agent: boolean | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          escrow_held?: boolean | null
          id?: string
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          transfer_id?: string | null
          transferred_at?: string | null
          transferred_to_agent?: boolean | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          escrow_held?: boolean | null
          id?: string
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          transfer_id?: string | null
          transferred_at?: string | null
          transferred_to_agent?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          created_at: string
          id: string
          points_amount: number
          reason: string
          related_entity_id: string | null
          related_entity_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_amount: number
          reason: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_amount?: number
          reason?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          bio: string | null
          country: string | null
          created_at: string
          email_notifications: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferences: Json | null
          preferred_currency: string | null
          sms_notifications: boolean | null
          tax_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email_notifications?: boolean | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          preferred_currency?: string | null
          sms_notifications?: boolean | null
          tax_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          preferred_currency?: string | null
          sms_notifications?: boolean | null
          tax_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          currency: string
          discount_applied: number
          id: string
          job_id: string | null
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          currency?: string
          discount_applied: number
          id?: string
          job_id?: string | null
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          currency?: string
          discount_applied?: number
          id?: string
          job_id?: string | null
          promo_code_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promotional_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          updated_at: string
          uses_count: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          updated_at?: string
          uses_count?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          updated_at?: string
          uses_count?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_points_earned: number | null
          referrer_id: string
          referrer_points_earned: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_points_earned?: number | null
          referrer_id: string
          referrer_points_earned?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_points_earned?: number | null
          referrer_id?: string
          referrer_points_earned?: number | null
          status?: string
        }
        Relationships: []
      }
      refund_guarantees: {
        Row: {
          claim_amount: number | null
          claim_deadline: string | null
          claim_reason: string | null
          claimed_at: string | null
          claimed_by: string | null
          coverage_percentage: number
          covered_amount: number
          created_at: string
          currency: string
          guarantee_type: string
          id: string
          job_id: string
          refund_processed: boolean | null
          refund_processed_at: string | null
          status: string
          terms_and_conditions: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          claim_amount?: number | null
          claim_deadline?: string | null
          claim_reason?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          coverage_percentage?: number
          covered_amount: number
          created_at?: string
          currency?: string
          guarantee_type: string
          id?: string
          job_id: string
          refund_processed?: boolean | null
          refund_processed_at?: string | null
          status?: string
          terms_and_conditions: string
          updated_at?: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          claim_amount?: number | null
          claim_deadline?: string | null
          claim_reason?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          coverage_percentage?: number
          covered_amount?: number
          created_at?: string
          currency?: string
          guarantee_type?: string
          id?: string
          job_id?: string
          refund_processed?: boolean | null
          refund_processed_at?: string | null
          status?: string
          terms_and_conditions?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_guarantees_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          search_params: Json
          search_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          search_params: Json
          search_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          search_params?: Json
          search_type?: string
          user_id?: string
        }
        Relationships: []
      }
      travel_agents: {
        Row: {
          accepted_gdpr: boolean | null
          accepted_privacy: boolean | null
          accepted_terms: boolean | null
          accepted_vendor: boolean | null
          accreditations: string | null
          agency_name: string
          background_check_date: string | null
          background_check_provider: string | null
          background_check_status: string | null
          beneficiary_name: string | null
          bio: string | null
          business_address: string | null
          business_registration_number: string | null
          business_type: string | null
          cancellation_fee_percentage: number | null
          cancellation_hours_before: number | null
          cancellation_policy: string | null
          commission_rate: number | null
          created_at: string
          destinations: string[] | null
          email: string | null
          email_notifications_enabled: boolean | null
          experience_years: number | null
          id: string
          identity_document_url: string | null
          identity_verification_date: string | null
          identity_verified: boolean | null
          insurance_document_url: string | null
          insurance_expiry: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          insurance_verified: boolean | null
          inventory_management: string | null
          is_active: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          license_number: string | null
          payment_processor: string | null
          phone: string | null
          preferred_currency: string | null
          primary_contact_name: string | null
          primary_contact_title: string | null
          professional_license_document_url: string | null
          professional_license_expiry: string | null
          professional_license_number: string | null
          professional_license_verified: boolean | null
          profile_image_url: string | null
          rating: number | null
          selfie_verification_url: string | null
          service_types: string[] | null
          sms_notifications_enabled: boolean | null
          social_media: string | null
          specializations: string[] | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_completed: boolean | null
          stripe_payouts_enabled: boolean | null
          tax_id: string | null
          time_zone: string | null
          total_reviews: number | null
          trust_score: number | null
          updated_at: string
          user_id: string
          website: string | null
          whatsapp_notifications_enabled: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          accepted_gdpr?: boolean | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          accepted_vendor?: boolean | null
          accreditations?: string | null
          agency_name: string
          background_check_date?: string | null
          background_check_provider?: string | null
          background_check_status?: string | null
          beneficiary_name?: string | null
          bio?: string | null
          business_address?: string | null
          business_registration_number?: string | null
          business_type?: string | null
          cancellation_fee_percentage?: number | null
          cancellation_hours_before?: number | null
          cancellation_policy?: string | null
          commission_rate?: number | null
          created_at?: string
          destinations?: string[] | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          experience_years?: number | null
          id?: string
          identity_document_url?: string | null
          identity_verification_date?: string | null
          identity_verified?: boolean | null
          insurance_document_url?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          insurance_verified?: boolean | null
          inventory_management?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          payment_processor?: string | null
          phone?: string | null
          preferred_currency?: string | null
          primary_contact_name?: string | null
          primary_contact_title?: string | null
          professional_license_document_url?: string | null
          professional_license_expiry?: string | null
          professional_license_number?: string | null
          professional_license_verified?: boolean | null
          profile_image_url?: string | null
          rating?: number | null
          selfie_verification_url?: string | null
          service_types?: string[] | null
          sms_notifications_enabled?: boolean | null
          social_media?: string | null
          specializations?: string[] | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_completed?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tax_id?: string | null
          time_zone?: string | null
          total_reviews?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp_notifications_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          accepted_gdpr?: boolean | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          accepted_vendor?: boolean | null
          accreditations?: string | null
          agency_name?: string
          background_check_date?: string | null
          background_check_provider?: string | null
          background_check_status?: string | null
          beneficiary_name?: string | null
          bio?: string | null
          business_address?: string | null
          business_registration_number?: string | null
          business_type?: string | null
          cancellation_fee_percentage?: number | null
          cancellation_hours_before?: number | null
          cancellation_policy?: string | null
          commission_rate?: number | null
          created_at?: string
          destinations?: string[] | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          experience_years?: number | null
          id?: string
          identity_document_url?: string | null
          identity_verification_date?: string | null
          identity_verified?: boolean | null
          insurance_document_url?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          insurance_verified?: boolean | null
          inventory_management?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          payment_processor?: string | null
          phone?: string | null
          preferred_currency?: string | null
          primary_contact_name?: string | null
          primary_contact_title?: string | null
          professional_license_document_url?: string | null
          professional_license_expiry?: string | null
          professional_license_number?: string | null
          professional_license_verified?: boolean | null
          profile_image_url?: string | null
          rating?: number | null
          selfie_verification_url?: string | null
          service_types?: string[] | null
          sms_notifications_enabled?: boolean | null
          social_media?: string | null
          specializations?: string[] | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_completed?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tax_id?: string | null
          time_zone?: string | null
          total_reviews?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp_notifications_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_booking_preferences: {
        Row: {
          accessibility_needs: string[] | null
          accessible_rooms: boolean | null
          airport_shuttle: boolean | null
          auto_booking_enabled: boolean | null
          baggage_carry_on: boolean | null
          baggage_checked: number | null
          bed_type: string | null
          breakfast_included: boolean | null
          cabin_class: string | null
          car_budget_max: number | null
          car_budget_min: number | null
          car_features: string[] | null
          car_type: string | null
          created_at: string
          cuisine_types: string[] | null
          currency: string | null
          departure_airport: string | null
          destination: string | null
          destination_airport: string | null
          dietary_restrictions: string[] | null
          digital_tickets: boolean | null
          dining_time_flexible: boolean | null
          direct_flights_only: boolean | null
          distance_from_airport: number | null
          distance_from_center: number | null
          dropoff_location: string | null
          event_accessibility: boolean | null
          event_budget_max: number | null
          event_budget_min: number | null
          event_location: string | null
          event_time_preference: string | null
          event_types: string[] | null
          excluded_airlines: string[] | null
          flexible_fare: boolean | null
          flight_type: string | null
          free_cancellation: boolean | null
          free_wifi: boolean | null
          fuel_policy: string | null
          group_friendly: boolean | null
          gym: boolean | null
          id: string
          include_nearby_airports: boolean | null
          include_taxes_fees: boolean | null
          insurance_included: boolean | null
          max_duration_hours: number | null
          max_layover_hours: number | null
          max_price_per_night: number | null
          max_price_per_passenger: number | null
          max_stops: number | null
          meal_preference: string | null
          min_review_score: number | null
          minimum_driver_age: number | null
          nationality: string | null
          near_accommodation: boolean | null
          near_hotel: boolean | null
          neighborhood: string | null
          notification_preferences: Json | null
          number_of_adults: number | null
          number_of_children: number | null
          number_of_infants: number | null
          parking: boolean | null
          passport_expiry: string | null
          passport_issuing_country: string | null
          passport_number: string | null
          pay_at_property: boolean | null
          pet_friendly: boolean | null
          pickup_location: string | null
          pool: boolean | null
          preferred_airlines: string[] | null
          preferred_alliance: string | null
          preferred_amenities: string[] | null
          preferred_arrival_time: string | null
          preferred_departure_time: string | null
          preferred_dining_time: string | null
          preferred_hotel_rating: number | null
          price_range_max: number | null
          price_range_min: number | null
          private_dining: boolean | null
          property_types: string[] | null
          refundable_ticket: boolean | null
          restaurant_experience_type: string[] | null
          restaurant_price_range: string | null
          room_type: string | null
          seat_preference: string | null
          seating_preference: string | null
          seating_type: string | null
          special_requests: string | null
          ticket_type: string | null
          transmission_type: string | null
          travel_insurance: string | null
          unlimited_mileage: boolean | null
          updated_at: string
          use_preferences_in_search: boolean | null
          user_id: string
          visa_assistance_needed: boolean | null
          visa_required_countries: string[] | null
          walkable_distance: boolean | null
          wheelchair_assistance: boolean | null
          young_driver_accepted: boolean | null
        }
        Insert: {
          accessibility_needs?: string[] | null
          accessible_rooms?: boolean | null
          airport_shuttle?: boolean | null
          auto_booking_enabled?: boolean | null
          baggage_carry_on?: boolean | null
          baggage_checked?: number | null
          bed_type?: string | null
          breakfast_included?: boolean | null
          cabin_class?: string | null
          car_budget_max?: number | null
          car_budget_min?: number | null
          car_features?: string[] | null
          car_type?: string | null
          created_at?: string
          cuisine_types?: string[] | null
          currency?: string | null
          departure_airport?: string | null
          destination?: string | null
          destination_airport?: string | null
          dietary_restrictions?: string[] | null
          digital_tickets?: boolean | null
          dining_time_flexible?: boolean | null
          direct_flights_only?: boolean | null
          distance_from_airport?: number | null
          distance_from_center?: number | null
          dropoff_location?: string | null
          event_accessibility?: boolean | null
          event_budget_max?: number | null
          event_budget_min?: number | null
          event_location?: string | null
          event_time_preference?: string | null
          event_types?: string[] | null
          excluded_airlines?: string[] | null
          flexible_fare?: boolean | null
          flight_type?: string | null
          free_cancellation?: boolean | null
          free_wifi?: boolean | null
          fuel_policy?: string | null
          group_friendly?: boolean | null
          gym?: boolean | null
          id?: string
          include_nearby_airports?: boolean | null
          include_taxes_fees?: boolean | null
          insurance_included?: boolean | null
          max_duration_hours?: number | null
          max_layover_hours?: number | null
          max_price_per_night?: number | null
          max_price_per_passenger?: number | null
          max_stops?: number | null
          meal_preference?: string | null
          min_review_score?: number | null
          minimum_driver_age?: number | null
          nationality?: string | null
          near_accommodation?: boolean | null
          near_hotel?: boolean | null
          neighborhood?: string | null
          notification_preferences?: Json | null
          number_of_adults?: number | null
          number_of_children?: number | null
          number_of_infants?: number | null
          parking?: boolean | null
          passport_expiry?: string | null
          passport_issuing_country?: string | null
          passport_number?: string | null
          pay_at_property?: boolean | null
          pet_friendly?: boolean | null
          pickup_location?: string | null
          pool?: boolean | null
          preferred_airlines?: string[] | null
          preferred_alliance?: string | null
          preferred_amenities?: string[] | null
          preferred_arrival_time?: string | null
          preferred_departure_time?: string | null
          preferred_dining_time?: string | null
          preferred_hotel_rating?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          private_dining?: boolean | null
          property_types?: string[] | null
          refundable_ticket?: boolean | null
          restaurant_experience_type?: string[] | null
          restaurant_price_range?: string | null
          room_type?: string | null
          seat_preference?: string | null
          seating_preference?: string | null
          seating_type?: string | null
          special_requests?: string | null
          ticket_type?: string | null
          transmission_type?: string | null
          travel_insurance?: string | null
          unlimited_mileage?: boolean | null
          updated_at?: string
          use_preferences_in_search?: boolean | null
          user_id: string
          visa_assistance_needed?: boolean | null
          visa_required_countries?: string[] | null
          walkable_distance?: boolean | null
          wheelchair_assistance?: boolean | null
          young_driver_accepted?: boolean | null
        }
        Update: {
          accessibility_needs?: string[] | null
          accessible_rooms?: boolean | null
          airport_shuttle?: boolean | null
          auto_booking_enabled?: boolean | null
          baggage_carry_on?: boolean | null
          baggage_checked?: number | null
          bed_type?: string | null
          breakfast_included?: boolean | null
          cabin_class?: string | null
          car_budget_max?: number | null
          car_budget_min?: number | null
          car_features?: string[] | null
          car_type?: string | null
          created_at?: string
          cuisine_types?: string[] | null
          currency?: string | null
          departure_airport?: string | null
          destination?: string | null
          destination_airport?: string | null
          dietary_restrictions?: string[] | null
          digital_tickets?: boolean | null
          dining_time_flexible?: boolean | null
          direct_flights_only?: boolean | null
          distance_from_airport?: number | null
          distance_from_center?: number | null
          dropoff_location?: string | null
          event_accessibility?: boolean | null
          event_budget_max?: number | null
          event_budget_min?: number | null
          event_location?: string | null
          event_time_preference?: string | null
          event_types?: string[] | null
          excluded_airlines?: string[] | null
          flexible_fare?: boolean | null
          flight_type?: string | null
          free_cancellation?: boolean | null
          free_wifi?: boolean | null
          fuel_policy?: string | null
          group_friendly?: boolean | null
          gym?: boolean | null
          id?: string
          include_nearby_airports?: boolean | null
          include_taxes_fees?: boolean | null
          insurance_included?: boolean | null
          max_duration_hours?: number | null
          max_layover_hours?: number | null
          max_price_per_night?: number | null
          max_price_per_passenger?: number | null
          max_stops?: number | null
          meal_preference?: string | null
          min_review_score?: number | null
          minimum_driver_age?: number | null
          nationality?: string | null
          near_accommodation?: boolean | null
          near_hotel?: boolean | null
          neighborhood?: string | null
          notification_preferences?: Json | null
          number_of_adults?: number | null
          number_of_children?: number | null
          number_of_infants?: number | null
          parking?: boolean | null
          passport_expiry?: string | null
          passport_issuing_country?: string | null
          passport_number?: string | null
          pay_at_property?: boolean | null
          pet_friendly?: boolean | null
          pickup_location?: string | null
          pool?: boolean | null
          preferred_airlines?: string[] | null
          preferred_alliance?: string | null
          preferred_amenities?: string[] | null
          preferred_arrival_time?: string | null
          preferred_departure_time?: string | null
          preferred_dining_time?: string | null
          preferred_hotel_rating?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          private_dining?: boolean | null
          property_types?: string[] | null
          refundable_ticket?: boolean | null
          restaurant_experience_type?: string[] | null
          restaurant_price_range?: string | null
          room_type?: string | null
          seat_preference?: string | null
          seating_preference?: string | null
          seating_type?: string | null
          special_requests?: string | null
          ticket_type?: string | null
          transmission_type?: string | null
          travel_insurance?: string | null
          unlimited_mileage?: boolean | null
          updated_at?: string
          use_preferences_in_search?: boolean | null
          user_id?: string
          visa_assistance_needed?: boolean | null
          visa_required_countries?: string[] | null
          walkable_distance?: boolean | null
          wheelchair_assistance?: boolean | null
          young_driver_accepted?: boolean | null
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          evidence_urls: Json | null
          id: string
          report_category: string
          report_type: string
          reported_agent_id: string | null
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          evidence_urls?: Json | null
          id?: string
          report_category: string
          report_type: string
          reported_agent_id?: string | null
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          evidence_urls?: Json | null
          id?: string
          report_category?: string
          report_type?: string
          reported_agent_id?: string | null
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_agent_id_fkey"
            columns: ["reported_agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visa_service_requests: {
        Row: {
          additional_notes: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          from_country: string
          id: string
          status: string
          to_country: string
          travel_dates: Json | null
          updated_at: string
          user_email: string
          user_name: string | null
          user_phone: string | null
          visa_information: Json
        }
        Insert: {
          additional_notes?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          from_country: string
          id?: string
          status?: string
          to_country: string
          travel_dates?: Json | null
          updated_at?: string
          user_email: string
          user_name?: string | null
          user_phone?: string | null
          visa_information: Json
        }
        Update: {
          additional_notes?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          from_country?: string
          id?: string
          status?: string
          to_country?: string
          travel_dates?: Json | null
          updated_at?: string
          user_email?: string
          user_name?: string | null
          user_phone?: string | null
          visa_information?: Json
        }
        Relationships: []
      }
      webhook_configurations: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          retry_attempts: number | null
          secret: string | null
          timeout_seconds: number | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events: string[]
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          retry_attempts?: number | null
          secret?: string | null
          timeout_seconds?: number | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          retry_attempts?: number | null
          secret?: string | null
          timeout_seconds?: number | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_delivery_logs: {
        Row: {
          attempt_number: number | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      platform_analytics: {
        Row: {
          active_agents: number | null
          average_rating: number | null
          completed_jobs: number | null
          in_progress_jobs: number | null
          open_disputes: number | null
          open_jobs: number | null
          pending_reports: number | null
          total_agent_payouts: number | null
          total_jobs: number | null
          total_reviews: number | null
          total_service_fees: number | null
          total_success_fees: number | null
          total_users: number | null
          verified_agents: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_loyalty_points: {
        Args: {
          entity_id?: string
          entity_type?: string
          points: number
          target_user_id: string
          transaction_reason: string
        }
        Returns: boolean
      }
      calculate_agent_trust_score: {
        Args: { agent_uuid: string }
        Returns: number
      }
      calculate_bid_pricing: {
        Args: {
          agent_price: number
          service_fee_pct?: number
          success_fee_pct?: number
        }
        Returns: Json
      }
      calculate_loyalty_tier: {
        Args: { lifetime_points_value: number }
        Returns: string
      }
      convert_currency: {
        Args: { amount: number; from_curr: string; to_curr: string }
        Returns: number
      }
      evaluate_agent_badges: {
        Args: { target_agent_id: string }
        Returns: boolean
      }
      expire_old_marketplace_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_matching_agents: {
        Args: { limit_count?: number; target_job_id: string }
        Returns: {
          agency_name: string
          agent_id: string
          confidence_level: string
          match_score: number
          rating: number
        }[]
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_marketplace_jobs: {
        Args: {
          booking_type_filter?: string
          destination_filter?: string
          job_status?: string
          limit_count?: number
          max_budget?: number
          min_budget?: number
          offset_count?: number
          search_query?: string
          user_id_filter?: string
        }
        Returns: {
          bid_count: number
          booking_type: string
          budget_max: number
          budget_min: number
          created_at: string
          currency: string
          description: string
          destination: string
          expires_at: string
          id: string
          status: string
          title: string
          user_id: string
        }[]
      }
      search_travel_agents: {
        Args: {
          destination_filter?: string[]
          is_verified_filter?: boolean
          language_filter?: string[]
          limit_count?: number
          min_rating?: number
          offset_count?: number
          search_query?: string
          specialization_filter?: string[]
        }
        Returns: {
          agency_name: string
          bio: string
          commission_rate: number
          destinations: string[]
          experience_years: number
          id: string
          is_active: boolean
          is_verified: boolean
          languages: string[]
          profile_image_url: string
          rating: number
          specializations: string[]
          total_reviews: number
        }[]
      }
      update_agent_performance_metrics: {
        Args: { target_agent_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "agent"],
    },
  },
} as const
