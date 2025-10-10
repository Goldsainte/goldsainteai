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
      affiliate_clicks: {
        Row: {
          affiliate_link_id: string
          clicked_at: string
          conversion_amount: number | null
          converted: boolean | null
          converted_at: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_link_id: string
          clicked_at?: string
          conversion_amount?: number | null
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_link_id?: string
          clicked_at?: string
          conversion_amount?: number | null
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_click_id: string | null
          affiliate_link_id: string
          commission_amount: number
          created_at: string
          creator_id: string
          currency: string
          id: string
          paid_at: string | null
          status: string
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_click_id?: string | null
          affiliate_link_id: string
          commission_amount: number
          created_at?: string
          creator_id: string
          currency?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_click_id?: string | null
          affiliate_link_id?: string
          commission_amount?: number
          created_at?: string
          creator_id?: string
          currency?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_click_id_fkey"
            columns: ["affiliate_click_id"]
            isOneToOne: false
            referencedRelation: "affiliate_clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_code: string
          clicks: number | null
          commission_rate: number
          conversions: number | null
          created_at: string
          creator_id: string
          id: string
          is_active: boolean | null
          platform: string | null
          product_name: string
          product_url: string
          total_earnings: number | null
          updated_at: string
        }
        Insert: {
          affiliate_code: string
          clicks?: number | null
          commission_rate?: number
          conversions?: number | null
          created_at?: string
          creator_id: string
          id?: string
          is_active?: boolean | null
          platform?: string | null
          product_name: string
          product_url: string
          total_earnings?: number | null
          updated_at?: string
        }
        Update: {
          affiliate_code?: string
          clicks?: number | null
          commission_rate?: number
          conversions?: number | null
          created_at?: string
          creator_id?: string
          id?: string
          is_active?: boolean | null
          platform?: string | null
          product_name?: string
          product_url?: string
          total_earnings?: number | null
          updated_at?: string
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
      agent_inquiries: {
        Row: {
          ai_match_score: number | null
          assigned_agent_id: string | null
          contacted_at: string | null
          conversation_data: Json
          converted_to_job_id: string | null
          created_at: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          inquiry_source: string
          notes: string | null
          priority: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_match_score?: number | null
          assigned_agent_id?: string | null
          contacted_at?: string | null
          conversation_data?: Json
          converted_to_job_id?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          inquiry_source?: string
          notes?: string | null
          priority?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_match_score?: number | null
          assigned_agent_id?: string | null
          contacted_at?: string | null
          conversation_data?: Json
          converted_to_job_id?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          inquiry_source?: string
          notes?: string | null
          priority?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_inquiries_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_inquiries_converted_to_job_id_fkey"
            columns: ["converted_to_job_id"]
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
      ai_agent_profiles: {
        Row: {
          agent_name: string
          communication_style: string | null
          created_at: string
          custom_knowledge: Json | null
          id: string
          personality_instructions: string | null
          preferred_language: string | null
          travel_preferences: Json | null
          updated_at: string
          user_id: string
          voice: string
        }
        Insert: {
          agent_name?: string
          communication_style?: string | null
          created_at?: string
          custom_knowledge?: Json | null
          id?: string
          personality_instructions?: string | null
          preferred_language?: string | null
          travel_preferences?: Json | null
          updated_at?: string
          user_id: string
          voice?: string
        }
        Update: {
          agent_name?: string
          communication_style?: string | null
          created_at?: string
          custom_knowledge?: Json | null
          id?: string
          personality_instructions?: string | null
          preferred_language?: string | null
          travel_preferences?: Json | null
          updated_at?: string
          user_id?: string
          voice?: string
        }
        Relationships: []
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
      blocked_keywords: {
        Row: {
          action: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
          severity: string
          updated_at: string | null
        }
        Insert: {
          action?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          severity?: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
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
          agent_id: string | null
          base_cost: number | null
          booking_data: Json
          booking_reference: string | null
          booking_source: string | null
          booking_type: string
          commission_earned: number | null
          created_at: string
          currency: string
          guest_id: string | null
          id: string
          markup_amount: number | null
          markup_percentage: number | null
          net_profit: number | null
          payment_method: string | null
          payment_status: string | null
          status: string
          stripe_fee: number | null
          stripe_payment_intent_id: string | null
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          base_cost?: number | null
          booking_data: Json
          booking_reference?: string | null
          booking_source?: string | null
          booking_type: string
          commission_earned?: number | null
          created_at?: string
          currency?: string
          guest_id?: string | null
          id?: string
          markup_amount?: number | null
          markup_percentage?: number | null
          net_profit?: number | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          base_cost?: number | null
          booking_data?: Json
          booking_reference?: string | null
          booking_source?: string | null
          booking_type?: string
          commission_earned?: number | null
          created_at?: string
          currency?: string
          guest_id?: string | null
          id?: string
          markup_amount?: number | null
          markup_percentage?: number | null
          net_profit?: number | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_partnerships: {
        Row: {
          brand_id: string
          campaign_details: string
          campaign_name: string
          created_at: string
          creator_id: string
          deliverables: string
          id: string
          payment_amount: number
          post_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          campaign_details: string
          campaign_name: string
          created_at?: string
          creator_id: string
          deliverables: string
          id?: string
          payment_amount?: number
          post_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          campaign_details?: string
          campaign_name?: string
          created_at?: string
          creator_id?: string
          deliverables?: string
          id?: string
          payment_amount?: number
          post_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_partnerships_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          agent_id: string
          color: string | null
          created_at: string
          description: string | null
          end_datetime: string
          event_type: string
          id: string
          is_all_day: boolean | null
          location: string | null
          related_itinerary_id: string | null
          related_job_id: string | null
          reminder_minutes: number | null
          start_datetime: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          end_datetime: string
          event_type: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          related_itinerary_id?: string | null
          related_job_id?: string | null
          reminder_minutes?: number | null
          start_datetime: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          end_datetime?: string
          event_type?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          related_itinerary_id?: string | null
          related_job_id?: string | null
          reminder_minutes?: number | null
          start_datetime?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_related_itinerary_id_fkey"
            columns: ["related_itinerary_id"]
            isOneToOne: false
            referencedRelation: "trip_itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      close_friends: {
        Row: {
          created_at: string
          friend_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_purchases: {
        Row: {
          coin_amount: number
          created_at: string
          id: string
          price_usd: number
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          coin_amount: number
          created_at?: string
          id?: string
          price_usd: number
          status?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          coin_amount?: number
          created_at?: string
          id?: string
          price_usd?: number
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      collection_posts: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          post_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          post_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_posts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "post_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_guidelines: {
        Row: {
          category: string
          content: string
          created_at: string | null
          effective_date: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_moderation_flags: {
        Row: {
          ai_analysis: Json | null
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          flag_source: string
          flagged_by_user_id: string | null
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by_admin_id: string | null
          severity: string
          status: string
          updated_at: string | null
          violation_type: string
        }
        Insert: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          flag_source?: string
          flagged_by_user_id?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          severity?: string
          status?: string
          updated_at?: string | null
          violation_type: string
        }
        Update: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          flag_source?: string
          flagged_by_user_id?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          severity?: string
          status?: string
          updated_at?: string | null
          violation_type?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_text: string
          metadata: Json | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text: string
          metadata?: Json | null
          sender_id: string
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text?: string
          metadata?: Json | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
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
      creator_earnings: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          earning_type: string | null
          id: string
          platform_fee: number | null
          post_id: string | null
          status: string | null
          stripe_transfer_id: string | null
          transfer_date: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          earning_type?: string | null
          id?: string
          platform_fee?: number | null
          post_id?: string | null
          status?: string | null
          stripe_transfer_id?: string | null
          transfer_date?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          earning_type?: string | null
          id?: string
          platform_fee?: number | null
          post_id?: string | null
          status?: string | null
          stripe_transfer_id?: string | null
          transfer_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_rewards: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          post_id: string | null
          reward_type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          post_id?: string | null
          reward_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          post_id?: string | null
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_rewards_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_tier_memberships: {
        Row: {
          auto_upgrade_enabled: boolean | null
          created_at: string
          current_tier: string
          id: string
          next_evaluation_date: string | null
          previous_tier: string | null
          tier_since: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_upgrade_enabled?: boolean | null
          created_at?: string
          current_tier: string
          id?: string
          next_evaluation_date?: string | null
          previous_tier?: string | null
          tier_since?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_upgrade_enabled?: boolean | null
          created_at?: string
          current_tier?: string
          id?: string
          next_evaluation_date?: string | null
          previous_tier?: string | null
          tier_since?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_tier_memberships_current_tier_fkey"
            columns: ["current_tier"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["tier_name"]
          },
          {
            foreignKeyName: "creator_tier_memberships_previous_tier_fkey"
            columns: ["previous_tier"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["tier_name"]
          },
        ]
      }
      creator_tiers: {
        Row: {
          analytics_access: boolean | null
          api_access: boolean | null
          benefits: Json | null
          commission_bonus_percentage: number | null
          created_at: string
          custom_branding: boolean | null
          description: string | null
          display_name: string
          early_access_features: boolean | null
          id: string
          min_engagement_rate: number | null
          min_followers: number
          min_monthly_earnings: number | null
          min_posts: number
          priority_support: boolean | null
          tier_level: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          analytics_access?: boolean | null
          api_access?: boolean | null
          benefits?: Json | null
          commission_bonus_percentage?: number | null
          created_at?: string
          custom_branding?: boolean | null
          description?: string | null
          display_name: string
          early_access_features?: boolean | null
          id?: string
          min_engagement_rate?: number | null
          min_followers?: number
          min_monthly_earnings?: number | null
          min_posts?: number
          priority_support?: boolean | null
          tier_level: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          analytics_access?: boolean | null
          api_access?: boolean | null
          benefits?: Json | null
          commission_bonus_percentage?: number | null
          created_at?: string
          custom_branding?: boolean | null
          description?: string | null
          display_name?: string
          early_access_features?: boolean | null
          id?: string
          min_engagement_rate?: number | null
          min_followers?: number
          min_monthly_earnings?: number | null
          min_posts?: number
          priority_support?: boolean | null
          tier_level?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_verification_status: {
        Row: {
          created_at: string | null
          id: string
          is_verified_creator: boolean | null
          last_checked: string | null
          original_content_count: number | null
          total_content_count: number | null
          total_followers: number | null
          updated_at: string | null
          user_id: string
          verification_date: string | null
          views_last_30_days: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_verified_creator?: boolean | null
          last_checked?: string | null
          original_content_count?: number | null
          total_content_count?: number | null
          total_followers?: number | null
          updated_at?: string | null
          user_id: string
          verification_date?: string | null
          views_last_30_days?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified_creator?: boolean | null
          last_checked?: string | null
          original_content_count?: number | null
          total_content_count?: number | null
          total_followers?: number | null
          updated_at?: string | null
          user_id?: string
          verification_date?: string | null
          views_last_30_days?: number | null
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
      gift_transactions: {
        Row: {
          coin_amount: number
          created_at: string
          creator_earnings: number
          gift_id: string
          id: string
          platform_fee: number
          post_id: string | null
          processed_at: string | null
          recipient_id: string
          sender_id: string
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          coin_amount: number
          created_at?: string
          creator_earnings: number
          gift_id: string
          id?: string
          platform_fee: number
          post_id?: string | null
          processed_at?: string | null
          recipient_id: string
          sender_id: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          coin_amount?: number
          created_at?: string
          creator_earnings?: number
          gift_id?: string
          id?: string
          platform_fee?: number
          post_id?: string | null
          processed_at?: string | null
          recipient_id?: string
          sender_id?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "virtual_gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_booking_travelers: {
        Row: {
          amount_owed: number
          created_at: string
          currency: string
          id: string
          job_id: string
          paid_at: string | null
          payment_intent_id: string | null
          payment_reminder_sent_at: string | null
          payment_status: string
          stripe_payment_link: string | null
          traveler_email: string
          traveler_name: string
          traveler_number: number
          updated_at: string
        }
        Insert: {
          amount_owed: number
          created_at?: string
          currency?: string
          id?: string
          job_id: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_reminder_sent_at?: string | null
          payment_status?: string
          stripe_payment_link?: string | null
          traveler_email: string
          traveler_name: string
          traveler_number: number
          updated_at?: string
        }
        Update: {
          amount_owed?: number
          created_at?: string
          currency?: string
          id?: string
          job_id?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_reminder_sent_at?: string | null
          payment_status?: string
          stripe_payment_link?: string | null
          traveler_email?: string
          traveler_name?: string
          traveler_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_booking_travelers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
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
      hashtags: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          tag: string
          use_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          tag: string
          use_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          tag?: string
          use_count?: number | null
        }
        Relationships: []
      }
      itinerary_items: {
        Row: {
          attachments: Json | null
          booking_reference: string | null
          confirmation_number: string | null
          cost: number | null
          created_at: string
          currency: string | null
          day_number: number
          description: string | null
          end_time: string | null
          id: string
          item_date: string
          item_type: string
          itinerary_id: string
          location: string | null
          location_coordinates: Json | null
          notes: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          booking_reference?: string | null
          confirmation_number?: string | null
          cost?: number | null
          created_at?: string
          currency?: string | null
          day_number: number
          description?: string | null
          end_time?: string | null
          id?: string
          item_date: string
          item_type: string
          itinerary_id: string
          location?: string | null
          location_coordinates?: Json | null
          notes?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          booking_reference?: string | null
          confirmation_number?: string | null
          cost?: number | null
          created_at?: string
          currency?: string | null
          day_number?: number
          description?: string | null
          end_time?: string | null
          id?: string
          item_date?: string
          item_type?: string
          itinerary_id?: string
          location?: string | null
          location_coordinates?: Json | null
          notes?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "trip_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_shares: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          itinerary_id: string
          permission_level: string
          shared_by_user_id: string
          shared_with_email: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          itinerary_id: string
          permission_level?: string
          shared_by_user_id: string
          shared_with_email: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          itinerary_id?: string
          permission_level?: string
          shared_by_user_id?: string
          shared_with_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_shares_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "trip_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_templates: {
        Row: {
          coin_price: number | null
          commission_percentage: number | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_public: boolean | null
          monetization_type: string | null
          package_id: string | null
          template_name: string
          total_days: number
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          coin_price?: number | null
          commission_percentage?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          monetization_type?: string | null
          package_id?: string | null
          template_name: string
          total_days: number
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          coin_price?: number | null
          commission_percentage?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          monetization_type?: string | null
          package_id?: string | null
          template_name?: string
          total_days?: number
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_templates_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "package_marketing_materials"
            referencedColumns: ["id"]
          },
        ]
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
      live_shopping_events: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          creator_id: string
          description: string | null
          featured_products: Json | null
          id: string
          scheduled_end: string | null
          scheduled_start: string
          status: string
          stream_url: string | null
          title: string
          total_sales: number | null
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          featured_products?: Json | null
          id?: string
          scheduled_end?: string | null
          scheduled_start: string
          status?: string
          stream_url?: string | null
          title: string
          total_sales?: number | null
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          featured_products?: Json | null
          id?: string
          scheduled_end?: string | null
          scheduled_start?: string
          status?: string
          stream_url?: string | null
          title?: string
          total_sales?: number | null
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: []
      }
      live_shopping_viewers: {
        Row: {
          event_id: string
          id: string
          joined_at: string
          left_at: string | null
          purchases_made: number | null
          user_id: string | null
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          purchases_made?: number | null
          user_id?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          purchases_made?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_shopping_viewers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "live_shopping_events"
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
          platform_fee: number | null
          sent_at: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_transfer_id: string | null
          subtotal: number
          tax_amount: number | null
          tax_details: Json | null
          tax_rate: number | null
          total_amount: number
          transfer_date: string | null
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
          platform_fee?: number | null
          sent_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_transfer_id?: string | null
          subtotal: number
          tax_amount?: number | null
          tax_details?: Json | null
          tax_rate?: number | null
          total_amount: number
          transfer_date?: string | null
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
          platform_fee?: number | null
          sent_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_transfer_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_details?: Json | null
          tax_rate?: number | null
          total_amount?: number
          transfer_date?: string | null
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
          group_organizer_email: string | null
          group_payment_mode: string | null
          id: string
          installment_plan_id: string | null
          is_group_booking: boolean | null
          number_of_travelers: number | null
          paid_at: string | null
          payment_captured_at: string | null
          payment_intent_id: string | null
          payment_plan_enabled: boolean | null
          payment_status: string | null
          payments_collected: number | null
          payout_processed_at: string | null
          refund_guarantee_enabled: boolean | null
          refund_guarantee_id: string | null
          rejection_reason: string | null
          requirements: Json
          service_fee_collected: number | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          success_fee_collected: number | null
          title: string
          total_paid_amount: number | null
          total_travelers: number | null
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
          group_organizer_email?: string | null
          group_payment_mode?: string | null
          id?: string
          installment_plan_id?: string | null
          is_group_booking?: boolean | null
          number_of_travelers?: number | null
          paid_at?: string | null
          payment_captured_at?: string | null
          payment_intent_id?: string | null
          payment_plan_enabled?: boolean | null
          payment_status?: string | null
          payments_collected?: number | null
          payout_processed_at?: string | null
          refund_guarantee_enabled?: boolean | null
          refund_guarantee_id?: string | null
          rejection_reason?: string | null
          requirements: Json
          service_fee_collected?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          success_fee_collected?: number | null
          title: string
          total_paid_amount?: number | null
          total_travelers?: number | null
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
          group_organizer_email?: string | null
          group_payment_mode?: string | null
          id?: string
          installment_plan_id?: string | null
          is_group_booking?: boolean | null
          number_of_travelers?: number | null
          paid_at?: string | null
          payment_captured_at?: string | null
          payment_intent_id?: string | null
          payment_plan_enabled?: boolean | null
          payment_status?: string | null
          payments_collected?: number | null
          payout_processed_at?: string | null
          refund_guarantee_enabled?: boolean | null
          refund_guarantee_id?: string | null
          rejection_reason?: string | null
          requirements?: Json
          service_fee_collected?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          success_fee_collected?: number | null
          title?: string
          total_paid_amount?: number | null
          total_travelers?: number | null
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
      moderation_actions: {
        Row: {
          action_type: string
          appeal_status: string | null
          appeal_text: string | null
          appealed_at: string | null
          created_at: string | null
          duration_hours: number | null
          enforced_at: string | null
          enforced_by_admin_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          reason: string
          related_flag_id: string | null
          target_user_id: string
        }
        Insert: {
          action_type: string
          appeal_status?: string | null
          appeal_text?: string | null
          appealed_at?: string | null
          created_at?: string | null
          duration_hours?: number | null
          enforced_at?: string | null
          enforced_by_admin_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          reason: string
          related_flag_id?: string | null
          target_user_id: string
        }
        Update: {
          action_type?: string
          appeal_status?: string | null
          appeal_text?: string | null
          appealed_at?: string | null
          created_at?: string | null
          duration_hours?: number | null
          enforced_at?: string | null
          enforced_by_admin_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          reason?: string
          related_flag_id?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_related_flag_id_fkey"
            columns: ["related_flag_id"]
            isOneToOne: false
            referencedRelation: "content_moderation_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_highlight_items: {
        Row: {
          added_at: string | null
          highlight_id: string
          id: string
          moment_id: string
        }
        Insert: {
          added_at?: string | null
          highlight_id: string
          id?: string
          moment_id: string
        }
        Update: {
          added_at?: string | null
          highlight_id?: string
          id?: string
          moment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moment_highlight_items_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "moment_highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_highlight_items_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_highlights: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      moment_views: {
        Row: {
          id: string
          moment_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          moment_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          moment_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moment_views_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          caption: string | null
          created_at: string | null
          duration_seconds: number | null
          expires_at: string | null
          id: string
          media_type: string
          media_url: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          expires_at?: string | null
          id?: string
          media_type: string
          media_url: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          expires_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
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
      package_bookings: {
        Row: {
          booking_reference: string
          booking_status: string
          confirmed_at: string | null
          created_at: string
          currency: string
          customer_id: string
          escrow_transaction_id: string | null
          id: string
          number_of_travelers: number
          package_id: string
          payment_status: string
          special_requests: string | null
          stripe_payment_intent_id: string | null
          total_price: number
          travel_dates_end: string
          travel_dates_start: string
          traveler_details: Json | null
          updated_at: string
        }
        Insert: {
          booking_reference: string
          booking_status?: string
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          escrow_transaction_id?: string | null
          id?: string
          number_of_travelers?: number
          package_id: string
          payment_status?: string
          special_requests?: string | null
          stripe_payment_intent_id?: string | null
          total_price: number
          travel_dates_end: string
          travel_dates_start: string
          traveler_details?: Json | null
          updated_at?: string
        }
        Update: {
          booking_reference?: string
          booking_status?: string
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          escrow_transaction_id?: string | null
          id?: string
          number_of_travelers?: number
          package_id?: string
          payment_status?: string
          special_requests?: string | null
          stripe_payment_intent_id?: string | null
          total_price?: number
          travel_dates_end?: string
          travel_dates_start?: string
          traveler_details?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "package_marketing_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      package_marketing_materials: {
        Row: {
          allow_resale: boolean | null
          best_season: string | null
          booking_count: number | null
          created_at: string
          creator_id: string
          currency: string
          description: string
          destination: string
          difficulty_level: string | null
          duration_days: number
          excluded_items: string[] | null
          gallery_images: string[] | null
          group_size_max: number | null
          group_size_min: number | null
          hero_image_url: string | null
          highlights: string[] | null
          id: string
          included_items: string[] | null
          is_published: boolean | null
          package_name: string
          promotional_video_url: string | null
          requirements: string[] | null
          resale_commission_percentage: number | null
          starting_price: number
          tagline: string | null
          tags: string[] | null
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          allow_resale?: boolean | null
          best_season?: string | null
          booking_count?: number | null
          created_at?: string
          creator_id: string
          currency?: string
          description: string
          destination: string
          difficulty_level?: string | null
          duration_days: number
          excluded_items?: string[] | null
          gallery_images?: string[] | null
          group_size_max?: number | null
          group_size_min?: number | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          included_items?: string[] | null
          is_published?: boolean | null
          package_name: string
          promotional_video_url?: string | null
          requirements?: string[] | null
          resale_commission_percentage?: number | null
          starting_price: number
          tagline?: string | null
          tags?: string[] | null
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          allow_resale?: boolean | null
          best_season?: string | null
          booking_count?: number | null
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string
          destination?: string
          difficulty_level?: string | null
          duration_days?: number
          excluded_items?: string[] | null
          gallery_images?: string[] | null
          group_size_max?: number | null
          group_size_min?: number | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          included_items?: string[] | null
          is_published?: boolean | null
          package_name?: string
          promotional_video_url?: string | null
          requirements?: string[] | null
          resale_commission_percentage?: number | null
          starting_price?: number
          tagline?: string | null
          tags?: string[] | null
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      package_resale_transactions: {
        Row: {
          booking_amount: number
          booking_id: string | null
          commission_amount: number
          commission_percentage: number
          created_at: string
          currency: string
          id: string
          original_creator_id: string
          original_package_id: string
          paid_at: string | null
          reseller_creator_id: string
          resold_package_id: string | null
          status: string
        }
        Insert: {
          booking_amount: number
          booking_id?: string | null
          commission_amount: number
          commission_percentage: number
          created_at?: string
          currency?: string
          id?: string
          original_creator_id: string
          original_package_id: string
          paid_at?: string | null
          reseller_creator_id: string
          resold_package_id?: string | null
          status?: string
        }
        Update: {
          booking_amount?: number
          booking_id?: string | null
          commission_amount?: number
          commission_percentage?: number
          created_at?: string
          currency?: string
          id?: string
          original_creator_id?: string
          original_package_id?: string
          paid_at?: string | null
          reseller_creator_id?: string
          resold_package_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_resale_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "package_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_resale_transactions_original_package_id_fkey"
            columns: ["original_package_id"]
            isOneToOne: false
            referencedRelation: "package_marketing_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_resale_transactions_resold_package_id_fkey"
            columns: ["resold_package_id"]
            isOneToOne: false
            referencedRelation: "package_marketing_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      paid_partnerships: {
        Row: {
          approved_at: string | null
          brand_id: string
          created_at: string
          creator_id: string
          id: string
          post_id: string
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          brand_id: string
          created_at?: string
          creator_id: string
          id?: string
          post_id: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          brand_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          post_id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paid_partnerships_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paid_partnerships_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paid_partnerships_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_analytics: {
        Row: {
          click_throughs: number | null
          comments: number | null
          created_at: string
          date: string
          id: string
          likes: number | null
          partnership_id: string
          saves: number | null
          shares: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          click_throughs?: number | null
          comments?: number | null
          created_at?: string
          date?: string
          id?: string
          likes?: number | null
          partnership_id: string
          saves?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          click_throughs?: number | null
          comments?: number | null
          created_at?: string
          date?: string
          id?: string
          likes?: number | null
          partnership_id?: string
          saves?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_analytics_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "paid_partnerships"
            referencedColumns: ["id"]
          },
        ]
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
      post_collaborators: {
        Row: {
          collaborator_id: string
          created_at: string
          id: string
          invited_at: string
          invited_by: string
          post_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          id?: string
          invited_at?: string
          invited_by: string
          post_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string
          post_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_collaborators_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_user_tags: {
        Row: {
          created_at: string
          id: string
          post_id: string
          tagged_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          tagged_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          tagged_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_user_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string | null
          view_duration_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_orders: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          package_id: string | null
          paid_at: string | null
          platform_fee: number
          product_id: string | null
          quantity: number
          seller_id: string
          seller_payout: number
          shipped_at: string | null
          shipping_address: Json | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          package_id?: string | null
          paid_at?: string | null
          platform_fee: number
          product_id?: string | null
          quantity?: number
          seller_id: string
          seller_payout: number
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          package_id?: string | null
          paid_at?: string | null
          platform_fee?: number
          product_id?: string | null
          quantity?: number
          seller_id?: string
          seller_payout?: number
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "travel_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          creator_id: string
          currency: string
          description: string | null
          id: string
          images: Json | null
          inventory_count: number | null
          is_active: boolean | null
          price: number
          product_type: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          description?: string | null
          id?: string
          images?: Json | null
          inventory_count?: number | null
          is_active?: boolean | null
          price: number
          product_type: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string | null
          id?: string
          images?: Json | null
          inventory_count?: number | null
          is_active?: boolean | null
          price?: number
          product_type?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          account_type: string | null
          auto_share_instagram: boolean | null
          auto_share_tiktok: boolean | null
          avatar_url: string | null
          billing_address: Json | null
          bio: string | null
          country: string | null
          created_at: string
          email_notifications: boolean | null
          first_name: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          instagram_username: string | null
          is_shadowbanned: boolean | null
          is_verified: boolean | null
          last_name: string | null
          last_warning_at: string | null
          location: string | null
          payout_schedule: string | null
          phone: string | null
          preferences: Json | null
          preferred_currency: string | null
          restriction_expires_at: string | null
          sms_notifications: boolean | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_completed: boolean | null
          stripe_payouts_enabled: boolean | null
          tax_id: string | null
          tiktok_username: string | null
          updated_at: string
          username: string | null
          warning_count: number | null
          website: string | null
        }
        Insert: {
          account_status?: string | null
          account_type?: string | null
          auto_share_instagram?: boolean | null
          auto_share_tiktok?: boolean | null
          avatar_url?: string | null
          billing_address?: Json | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email_notifications?: boolean | null
          first_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          instagram_username?: string | null
          is_shadowbanned?: boolean | null
          is_verified?: boolean | null
          last_name?: string | null
          last_warning_at?: string | null
          location?: string | null
          payout_schedule?: string | null
          phone?: string | null
          preferences?: Json | null
          preferred_currency?: string | null
          restriction_expires_at?: string | null
          sms_notifications?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_completed?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tax_id?: string | null
          tiktok_username?: string | null
          updated_at?: string
          username?: string | null
          warning_count?: number | null
          website?: string | null
        }
        Update: {
          account_status?: string | null
          account_type?: string | null
          auto_share_instagram?: boolean | null
          auto_share_tiktok?: boolean | null
          avatar_url?: string | null
          billing_address?: Json | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email_notifications?: boolean | null
          first_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          instagram_username?: string | null
          is_shadowbanned?: boolean | null
          is_verified?: boolean | null
          last_name?: string | null
          last_warning_at?: string | null
          location?: string | null
          payout_schedule?: string | null
          phone?: string | null
          preferences?: Json | null
          preferred_currency?: string | null
          restriction_expires_at?: string | null
          sms_notifications?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_completed?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tax_id?: string | null
          tiktok_username?: string | null
          updated_at?: string
          username?: string | null
          warning_count?: number | null
          website?: string | null
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
      quick_reply_templates: {
        Row: {
          agent_id: string
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          shortcut: string | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          agent_id: string
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          shortcut?: string | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          agent_id?: string
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          shortcut?: string | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_reply_templates_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
        ]
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
      sensitive_content_labels: {
        Row: {
          created_at: string | null
          id: string
          info_url: string | null
          label_type: string
          post_id: string
          requires_click_through: boolean | null
          warning_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          info_url?: string | null
          label_type: string
          post_id: string
          requires_click_through?: boolean | null
          warning_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          info_url?: string | null
          label_type?: string
          post_id?: string
          requires_click_through?: boolean | null
          warning_text?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          view_count: number | null
          visibility: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
          view_count?: number | null
          visibility?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          view_count?: number | null
          visibility?: string
        }
        Relationships: []
      }
      story_interaction_responses: {
        Row: {
          created_at: string
          id: string
          interaction_id: string
          response_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_id: string
          response_data: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_id?: string
          response_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_interaction_responses_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "story_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      story_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_data: Json
          interaction_type: string
          story_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_data?: Json
          interaction_type: string
          story_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_data?: Json
          interaction_type?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_interactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_partnerships: {
        Row: {
          agent_id: string | null
          commission_override: number | null
          created_at: string
          creator_id: string
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          last_booking_date: string | null
          partnership_end_date: string | null
          partnership_start_date: string
          partnership_type: string | null
          supplier_id: string
          total_bookings: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          commission_override?: number | null
          created_at?: string
          creator_id: string
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          last_booking_date?: string | null
          partnership_end_date?: string | null
          partnership_start_date?: string
          partnership_type?: string | null
          supplier_id: string
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          commission_override?: number | null
          created_at?: string
          creator_id?: string
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          last_booking_date?: string | null
          partnership_end_date?: string | null
          partnership_start_date?: string
          partnership_type?: string | null
          supplier_id?: string
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_partnerships_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_partnerships_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_reviews: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          photos: Json | null
          rating: number
          reliability_rating: number | null
          responded_at: string | null
          response_from_supplier: string | null
          review_text: string | null
          reviewer_id: string
          service_quality_rating: number | null
          supplier_id: string
          title: string | null
          updated_at: string
          value_for_money_rating: number | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          photos?: Json | null
          rating: number
          reliability_rating?: number | null
          responded_at?: string | null
          response_from_supplier?: string | null
          review_text?: string | null
          reviewer_id: string
          service_quality_rating?: number | null
          supplier_id: string
          title?: string | null
          updated_at?: string
          value_for_money_rating?: number | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          photos?: Json | null
          rating?: number
          reliability_rating?: number | null
          responded_at?: string | null
          response_from_supplier?: string | null
          review_text?: string | null
          reviewer_id?: string
          service_quality_rating?: number | null
          supplier_id?: string
          title?: string | null
          updated_at?: string
          value_for_money_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_vetting: {
        Row: {
          approval_decision: string | null
          background_check_status: string | null
          created_at: string
          id: string
          insurance_check_status: string | null
          license_check_status: string | null
          red_flags: Json | null
          reference_check_status: string | null
          rejection_reason: string | null
          renewal_required: boolean | null
          strengths: Json | null
          supplier_id: string
          updated_at: string
          vetted_at: string | null
          vetted_by: string | null
          vetting_expires_at: string | null
          vetting_notes: string | null
        }
        Insert: {
          approval_decision?: string | null
          background_check_status?: string | null
          created_at?: string
          id?: string
          insurance_check_status?: string | null
          license_check_status?: string | null
          red_flags?: Json | null
          reference_check_status?: string | null
          rejection_reason?: string | null
          renewal_required?: boolean | null
          strengths?: Json | null
          supplier_id: string
          updated_at?: string
          vetted_at?: string | null
          vetted_by?: string | null
          vetting_expires_at?: string | null
          vetting_notes?: string | null
        }
        Update: {
          approval_decision?: string | null
          background_check_status?: string | null
          created_at?: string
          id?: string
          insurance_check_status?: string | null
          license_check_status?: string | null
          red_flags?: Json | null
          reference_check_status?: string | null
          rejection_reason?: string | null
          renewal_required?: boolean | null
          strengths?: Json | null
          supplier_id?: string
          updated_at?: string
          vetted_at?: string | null
          vetted_by?: string | null
          vetting_expires_at?: string | null
          vetting_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_vetting_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: Json | null
          business_name: string | null
          business_registration_number: string | null
          certifications: string[] | null
          commission_rate: number | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          insurance_verified: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          license_verified: boolean | null
          metadata: Json | null
          name: string
          payment_terms: string | null
          rating: number | null
          services_offered: string[] | null
          supplier_type: Database["public"]["Enums"]["supplier_type"]
          total_reviews: number | null
          trust_score: number | null
          updated_at: string
          verification_documents: Json | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          business_name?: string | null
          business_registration_number?: string | null
          certifications?: string[] | null
          commission_rate?: number | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          insurance_verified?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          license_verified?: boolean | null
          metadata?: Json | null
          name: string
          payment_terms?: string | null
          rating?: number | null
          services_offered?: string[] | null
          supplier_type: Database["public"]["Enums"]["supplier_type"]
          total_reviews?: number | null
          trust_score?: number | null
          updated_at?: string
          verification_documents?: Json | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          business_name?: string | null
          business_registration_number?: string | null
          certifications?: string[] | null
          commission_rate?: number | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          insurance_verified?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          license_verified?: boolean | null
          metadata?: Json | null
          name?: string
          payment_terms?: string | null
          rating?: number | null
          services_offered?: string[] | null
          supplier_type?: Database["public"]["Enums"]["supplier_type"]
          total_reviews?: number | null
          trust_score?: number | null
          updated_at?: string
          verification_documents?: Json | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      template_day_items: {
        Row: {
          activity_description: string | null
          activity_title: string
          activity_type: string | null
          booking_required: boolean | null
          created_at: string
          currency: string | null
          day_number: number
          duration_minutes: number | null
          estimated_cost: number | null
          id: string
          location: string | null
          notes: string | null
          order_index: number
          supplier_id: string | null
          template_id: string
          time_of_day: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_title: string
          activity_type?: string | null
          booking_required?: boolean | null
          created_at?: string
          currency?: string | null
          day_number: number
          duration_minutes?: number | null
          estimated_cost?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          order_index?: number
          supplier_id?: string | null
          template_id: string
          time_of_day?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_title?: string
          activity_type?: string | null
          booking_required?: boolean | null
          created_at?: string
          currency?: string | null
          day_number?: number
          duration_minutes?: number | null
          estimated_cost?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          order_index?: number
          supplier_id?: string | null
          template_id?: string
          time_of_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_day_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_day_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "itinerary_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage_transactions: {
        Row: {
          coins_paid: number | null
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string
          currency: string | null
          id: string
          monetization_type: string
          original_creator_id: string
          package_booking_id: string | null
          paid_at: string | null
          status: string
          template_id: string
          user_creator_id: string
        }
        Insert: {
          coins_paid?: number | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          monetization_type: string
          original_creator_id: string
          package_booking_id?: string | null
          paid_at?: string | null
          status?: string
          template_id: string
          user_creator_id: string
        }
        Update: {
          coins_paid?: number | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          monetization_type?: string
          original_creator_id?: string
          package_booking_id?: string | null
          paid_at?: string | null
          status?: string
          template_id?: string
          user_creator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_transactions_package_booking_id_fkey"
            columns: ["package_booking_id"]
            isOneToOne: false
            referencedRelation: "package_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_transactions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "itinerary_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_progress_metrics: {
        Row: {
          average_rating: number | null
          completion_rate: number | null
          created_at: string
          current_engagement_rate: number | null
          current_followers: number | null
          current_posts: number | null
          id: string
          last_calculated_at: string
          monthly_earnings: number | null
          response_time_hours: number | null
          total_bookings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          completion_rate?: number | null
          created_at?: string
          current_engagement_rate?: number | null
          current_followers?: number | null
          current_posts?: number | null
          id?: string
          last_calculated_at?: string
          monthly_earnings?: number | null
          response_time_hours?: number | null
          total_bookings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_rating?: number | null
          completion_rate?: number | null
          created_at?: string
          current_engagement_rate?: number | null
          current_followers?: number | null
          current_posts?: number | null
          id?: string
          last_calculated_at?: string
          monthly_earnings?: number | null
          response_time_hours?: number | null
          total_bookings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tier_upgrade_history: {
        Row: {
          created_at: string
          from_tier: string
          id: string
          metrics_snapshot: Json | null
          reason: string | null
          to_tier: string
          upgrade_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_tier: string
          id?: string
          metrics_snapshot?: Json | null
          reason?: string | null
          to_tier: string
          upgrade_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_tier?: string
          id?: string
          metrics_snapshot?: Json | null
          reason?: string | null
          to_tier?: string
          upgrade_type?: string
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
          last_active_at: string | null
          license_number: string | null
          payment_processor: string | null
          payout_schedule: string | null
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
          last_active_at?: string | null
          license_number?: string | null
          payment_processor?: string | null
          payout_schedule?: string | null
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
          last_active_at?: string | null
          license_number?: string | null
          payment_processor?: string | null
          payout_schedule?: string | null
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
      travel_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_title: string
          document_type: string
          expiry_date: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          issue_date: string | null
          itinerary_id: string
          mime_type: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_title: string
          document_type: string
          expiry_date?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          issue_date?: string | null
          itinerary_id: string
          mime_type?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_title?: string
          document_type?: string
          expiry_date?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          issue_date?: string | null
          itinerary_id?: string
          mime_type?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_documents_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "trip_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_packages: {
        Row: {
          booking_cta: string | null
          booking_deadline: string | null
          brochure_url: string | null
          created_at: string
          creator_id: string
          creator_story: string | null
          currency: string
          daily_itinerary: Json | null
          dates_info: Json | null
          description: string
          destination: string
          duration_days: number
          faqs: Json | null
          id: string
          images: Json | null
          included_services: Json | null
          is_active: boolean | null
          itinerary: Json
          location_details: Json | null
          max_travelers: number | null
          package_summary: string | null
          price: number
          pricing_details: Json | null
          spots_remaining: number | null
          spots_total: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          testimonials: Json | null
          title: string
          travel_requirements: Json | null
          updated_at: string
          video_url: string | null
          whats_included: Json | null
          whats_not_included: string[] | null
        }
        Insert: {
          booking_cta?: string | null
          booking_deadline?: string | null
          brochure_url?: string | null
          created_at?: string
          creator_id: string
          creator_story?: string | null
          currency?: string
          daily_itinerary?: Json | null
          dates_info?: Json | null
          description: string
          destination: string
          duration_days: number
          faqs?: Json | null
          id?: string
          images?: Json | null
          included_services?: Json | null
          is_active?: boolean | null
          itinerary?: Json
          location_details?: Json | null
          max_travelers?: number | null
          package_summary?: string | null
          price: number
          pricing_details?: Json | null
          spots_remaining?: number | null
          spots_total?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          testimonials?: Json | null
          title: string
          travel_requirements?: Json | null
          updated_at?: string
          video_url?: string | null
          whats_included?: Json | null
          whats_not_included?: string[] | null
        }
        Update: {
          booking_cta?: string | null
          booking_deadline?: string | null
          brochure_url?: string | null
          created_at?: string
          creator_id?: string
          creator_story?: string | null
          currency?: string
          daily_itinerary?: Json | null
          dates_info?: Json | null
          description?: string
          destination?: string
          duration_days?: number
          faqs?: Json | null
          id?: string
          images?: Json | null
          included_services?: Json | null
          is_active?: boolean | null
          itinerary?: Json
          location_details?: Json | null
          max_travelers?: number | null
          package_summary?: string | null
          price?: number
          pricing_details?: Json | null
          spots_remaining?: number | null
          spots_total?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          testimonials?: Json | null
          title?: string
          travel_requirements?: Json | null
          updated_at?: string
          video_url?: string | null
          whats_included?: Json | null
          whats_not_included?: string[] | null
        }
        Relationships: []
      }
      travel_posts: {
        Row: {
          average_watch_percentage: number | null
          caption: string | null
          comment_count: number | null
          created_at: string | null
          duration_seconds: number | null
          embed_platform: string | null
          embed_url: string | null
          id: string
          image_urls: string[] | null
          is_featured: boolean | null
          is_original_content: boolean | null
          like_count: number | null
          location: string | null
          media_type: string | null
          original_creator: string | null
          share_count: number | null
          status: string | null
          thumbnail_url: string | null
          total_watch_time_seconds: number | null
          updated_at: string | null
          user_id: string
          video_duration_seconds: number | null
          video_url: string | null
          view_count: number | null
          viewer_region_data: Json | null
        }
        Insert: {
          average_watch_percentage?: number | null
          caption?: string | null
          comment_count?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          embed_platform?: string | null
          embed_url?: string | null
          id?: string
          image_urls?: string[] | null
          is_featured?: boolean | null
          is_original_content?: boolean | null
          like_count?: number | null
          location?: string | null
          media_type?: string | null
          original_creator?: string | null
          share_count?: number | null
          status?: string | null
          thumbnail_url?: string | null
          total_watch_time_seconds?: number | null
          updated_at?: string | null
          user_id: string
          video_duration_seconds?: number | null
          video_url?: string | null
          view_count?: number | null
          viewer_region_data?: Json | null
        }
        Update: {
          average_watch_percentage?: number | null
          caption?: string | null
          comment_count?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          embed_platform?: string | null
          embed_url?: string | null
          id?: string
          image_urls?: string[] | null
          is_featured?: boolean | null
          is_original_content?: boolean | null
          like_count?: number | null
          location?: string | null
          media_type?: string | null
          original_creator?: string | null
          share_count?: number | null
          status?: string | null
          thumbnail_url?: string | null
          total_watch_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string
          video_duration_seconds?: number | null
          video_url?: string | null
          view_count?: number | null
          viewer_region_data?: Json | null
        }
        Relationships: []
      }
      trip_itineraries: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          destination: string
          end_date: string
          id: string
          is_shared: boolean | null
          job_id: string | null
          share_token: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          destination: string
          end_date: string
          id?: string
          is_shared?: boolean | null
          job_id?: string | null
          share_token?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          destination?: string
          end_date?: string
          id?: string
          is_shared?: boolean | null
          job_id?: string | null
          share_token?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_itineraries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_photos: {
        Row: {
          agent_id: string | null
          booking_id: string | null
          caption: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          location: string | null
          photo_url: string
          taken_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          booking_id?: string | null
          caption?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          location?: string | null
          photo_url: string
          taken_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          booking_id?: string | null
          caption?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          location?: string | null
          photo_url?: string
          taken_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_photos_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_photos_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_reports: {
        Row: {
          agent_id: string | null
          booking_id: string
          created_at: string | null
          destination: string
          id: string
          is_approved: boolean | null
          rating: number | null
          report_content: string
          title: string
          trip_date: string
          updated_at: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          agent_id?: string | null
          booking_id: string
          created_at?: string | null
          destination: string
          id?: string
          is_approved?: boolean | null
          rating?: number | null
          report_content: string
          title: string
          trip_date: string
          updated_at?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          agent_id?: string | null
          booking_id?: string
          created_at?: string | null
          destination?: string
          id?: string
          is_approved?: boolean | null
          rating?: number | null
          report_content?: string
          title?: string
          trip_date?: string
          updated_at?: string | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_reports_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_videos: {
        Row: {
          agent_id: string | null
          booking_id: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_approved: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          agent_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_approved?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          agent_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_approved?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_videos_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_videos_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      user_coin_balance: {
        Row: {
          balance: number
          created_at: string
          id: string
          lifetime_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_purchased?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_conversations: {
        Row: {
          agent_id: string | null
          agent_unread_count: number | null
          conversation_type: string
          created_at: string
          customer_id: string | null
          customer_unread_count: number | null
          id: string
          job_id: string | null
          last_message_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          agent_unread_count?: number | null
          conversation_type?: string
          created_at?: string
          customer_id?: string | null
          customer_unread_count?: number | null
          id?: string
          job_id?: string | null
          last_message_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          agent_unread_count?: number | null
          conversation_type?: string
          created_at?: string
          customer_id?: string | null
          customer_unread_count?: number | null
          id?: string
          job_id?: string | null
          last_message_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          id: string
          last_seen_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id?: string
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
      verification_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      virtual_gifts: {
        Row: {
          coin_cost: number
          created_at: string
          creator_payout_percentage: number
          display_name: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          coin_cost: number
          created_at?: string
          creator_payout_percentage?: number
          display_name: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          coin_cost?: number
          created_at?: string
          creator_payout_percentage?: number
          display_name?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
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
      calculate_advanced_creator_earnings: {
        Args: {
          p_comments: number
          p_likes: number
          p_region_multiplier?: number
          p_retention_rate: number
          p_shares: number
          p_video_duration: number
          p_views: number
          p_watch_time: number
        }
        Returns: number
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
      calculate_creator_earnings: {
        Args: { post_uuid: string }
        Returns: number
      }
      calculate_creator_tier_progress: {
        Args: { p_user_id: string }
        Returns: Json
      }
      calculate_loyalty_tier: {
        Args: { lifetime_points_value: number }
        Returns: string
      }
      calculate_supplier_trust_score: {
        Args: { supplier_uuid: string }
        Returns: number
      }
      check_creator_eligibility: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      convert_currency: {
        Args: { amount: number; from_curr: string; to_curr: string }
        Returns: number
      }
      evaluate_agent_badges: {
        Args: { target_agent_id: string }
        Returns: boolean
      }
      evaluate_and_upgrade_creator_tier: {
        Args: { p_user_id: string }
        Returns: Json
      }
      expire_old_marketplace_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      extract_and_store_hashtags: {
        Args: { p_caption: string; p_post_id: string }
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
      is_user_restricted: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      mark_conversation_messages_read: {
        Args: { p_conversation_id: string; p_user_type: string }
        Returns: undefined
      }
      process_package_resale_commission: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      purchase_template_usage: {
        Args: { p_template_id: string; p_user_creator_id: string }
        Returns: Json
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
      send_virtual_gift: {
        Args: {
          p_gift_id: string
          p_post_id: string
          p_recipient_id: string
          p_sender_id: string
        }
        Returns: Json
      }
      update_agent_performance_metrics: {
        Args: { target_agent_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "agent"
      supplier_type:
        | "hotel"
        | "activity_provider"
        | "tour_guide"
        | "restaurant"
        | "transportation"
        | "other"
      verification_status: "pending" | "verified" | "rejected" | "suspended"
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
      supplier_type: [
        "hotel",
        "activity_provider",
        "tour_guide",
        "restaurant",
        "transportation",
        "other",
      ],
      verification_status: ["pending", "verified", "rejected", "suspended"],
    },
  },
} as const
