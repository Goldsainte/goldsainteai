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
      account_restrictions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          restricted_until: string
          restriction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          restricted_until: string
          restriction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          restricted_until?: string
          restriction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          request_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          admin_role: string | null
          can_approve_agents: boolean | null
          can_approve_brands: boolean | null
          can_manage_disputes: boolean | null
          can_view_analytics: boolean | null
          created_at: string | null
          department: string | null
          id: string
          is_super_admin: boolean | null
          notes: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_role?: string | null
          can_approve_agents?: boolean | null
          can_approve_brands?: boolean | null
          can_manage_disputes?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          department?: string | null
          id?: string
          is_super_admin?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_role?: string | null
          can_approve_agents?: boolean | null
          can_approve_brands?: boolean | null
          can_manage_disputes?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          department?: string | null
          id?: string
          is_super_admin?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      agent_applications: {
        Row: {
          accepted_gdpr: boolean | null
          accepted_privacy: boolean | null
          accepted_terms: boolean | null
          accepted_vendor: boolean | null
          accreditations: string | null
          active_clients_count: number | null
          admin_notes: string | null
          admin_reviewer_id: string | null
          agency_name: string
          annual_sales_volume: string | null
          approval_notes: string | null
          approved_at: string | null
          average_trip_value: string | null
          background_check_completed_at: string | null
          background_check_provider: string | null
          background_check_report_id: string | null
          background_check_status: string | null
          bank_account_encrypted: string | null
          business_address: string
          business_city: string | null
          business_country: string | null
          business_postal_code: string | null
          business_registration_number: string | null
          business_state: string | null
          business_type: string
          cancellation_policy: string | null
          certifications: Json | null
          client_testimonials: Json | null
          commission_rate: number | null
          content_creation_experience: boolean | null
          created_at: string | null
          date_of_birth: string | null
          destinations: string[] | null
          document_business_license: string | null
          document_government_id: string | null
          document_headshot: string | null
          document_insurance_cert: string | null
          documents: Json | null
          email: string
          email_notifications_enabled: boolean | null
          extended_data: Json | null
          first_name: string
          host_agency_name: string | null
          iban: string | null
          id: string
          insurance_coverage_amount: number | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          languages: string[] | null
          last_name: string
          license_expiry: string | null
          license_number: string | null
          license_state: string | null
          minimum_booking_value: number | null
          monthly_bookings: string | null
          payment_processor: string | null
          phone: string
          preferred_contact_method: string | null
          preferred_currency: string | null
          previous_platforms: string[] | null
          primary_focus: string[] | null
          rejected_at: string | null
          rejection_reason: string | null
          repeat_clients_percentage: number | null
          reviewed_at: string | null
          risk_factors: Json | null
          risk_score: number | null
          routing_number_encrypted: string | null
          service_types: string[] | null
          sms_notifications_enabled: boolean | null
          social_media: Json | null
          social_media_followers_total: number | null
          specialties: string[] | null
          status: string | null
          stripe_verification_document_back: string | null
          stripe_verification_document_front: string | null
          stripe_verification_report: Json | null
          stripe_verification_session_id: string | null
          stripe_verification_status: string | null
          stripe_verified_at: string | null
          submitted_at: string | null
          swift_code: string | null
          tax_country: string | null
          tax_id: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string | null
          user_id: string | null
          vat_number: string | null
          video_content_creation: boolean | null
          website: string | null
          whatsapp_notifications_enabled: boolean | null
          why_goldsainte: string | null
          year_established: number | null
          years_experience: number
        }
        Insert: {
          accepted_gdpr?: boolean | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          accepted_vendor?: boolean | null
          accreditations?: string | null
          active_clients_count?: number | null
          admin_notes?: string | null
          admin_reviewer_id?: string | null
          agency_name: string
          annual_sales_volume?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          average_trip_value?: string | null
          background_check_completed_at?: string | null
          background_check_provider?: string | null
          background_check_report_id?: string | null
          background_check_status?: string | null
          bank_account_encrypted?: string | null
          business_address: string
          business_city?: string | null
          business_country?: string | null
          business_postal_code?: string | null
          business_registration_number?: string | null
          business_state?: string | null
          business_type: string
          cancellation_policy?: string | null
          certifications?: Json | null
          client_testimonials?: Json | null
          commission_rate?: number | null
          content_creation_experience?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          destinations?: string[] | null
          document_business_license?: string | null
          document_government_id?: string | null
          document_headshot?: string | null
          document_insurance_cert?: string | null
          documents?: Json | null
          email: string
          email_notifications_enabled?: boolean | null
          extended_data?: Json | null
          first_name: string
          host_agency_name?: string | null
          iban?: string | null
          id?: string
          insurance_coverage_amount?: number | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          languages?: string[] | null
          last_name: string
          license_expiry?: string | null
          license_number?: string | null
          license_state?: string | null
          minimum_booking_value?: number | null
          monthly_bookings?: string | null
          payment_processor?: string | null
          phone: string
          preferred_contact_method?: string | null
          preferred_currency?: string | null
          previous_platforms?: string[] | null
          primary_focus?: string[] | null
          rejected_at?: string | null
          rejection_reason?: string | null
          repeat_clients_percentage?: number | null
          reviewed_at?: string | null
          risk_factors?: Json | null
          risk_score?: number | null
          routing_number_encrypted?: string | null
          service_types?: string[] | null
          sms_notifications_enabled?: boolean | null
          social_media?: Json | null
          social_media_followers_total?: number | null
          specialties?: string[] | null
          status?: string | null
          stripe_verification_document_back?: string | null
          stripe_verification_document_front?: string | null
          stripe_verification_report?: Json | null
          stripe_verification_session_id?: string | null
          stripe_verification_status?: string | null
          stripe_verified_at?: string | null
          submitted_at?: string | null
          swift_code?: string | null
          tax_country?: string | null
          tax_id?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
          video_content_creation?: boolean | null
          website?: string | null
          whatsapp_notifications_enabled?: boolean | null
          why_goldsainte?: string | null
          year_established?: number | null
          years_experience: number
        }
        Update: {
          accepted_gdpr?: boolean | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          accepted_vendor?: boolean | null
          accreditations?: string | null
          active_clients_count?: number | null
          admin_notes?: string | null
          admin_reviewer_id?: string | null
          agency_name?: string
          annual_sales_volume?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          average_trip_value?: string | null
          background_check_completed_at?: string | null
          background_check_provider?: string | null
          background_check_report_id?: string | null
          background_check_status?: string | null
          bank_account_encrypted?: string | null
          business_address?: string
          business_city?: string | null
          business_country?: string | null
          business_postal_code?: string | null
          business_registration_number?: string | null
          business_state?: string | null
          business_type?: string
          cancellation_policy?: string | null
          certifications?: Json | null
          client_testimonials?: Json | null
          commission_rate?: number | null
          content_creation_experience?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          destinations?: string[] | null
          document_business_license?: string | null
          document_government_id?: string | null
          document_headshot?: string | null
          document_insurance_cert?: string | null
          documents?: Json | null
          email?: string
          email_notifications_enabled?: boolean | null
          extended_data?: Json | null
          first_name?: string
          host_agency_name?: string | null
          iban?: string | null
          id?: string
          insurance_coverage_amount?: number | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          languages?: string[] | null
          last_name?: string
          license_expiry?: string | null
          license_number?: string | null
          license_state?: string | null
          minimum_booking_value?: number | null
          monthly_bookings?: string | null
          payment_processor?: string | null
          phone?: string
          preferred_contact_method?: string | null
          preferred_currency?: string | null
          previous_platforms?: string[] | null
          primary_focus?: string[] | null
          rejected_at?: string | null
          rejection_reason?: string | null
          repeat_clients_percentage?: number | null
          reviewed_at?: string | null
          risk_factors?: Json | null
          risk_score?: number | null
          routing_number_encrypted?: string | null
          service_types?: string[] | null
          sms_notifications_enabled?: boolean | null
          social_media?: Json | null
          social_media_followers_total?: number | null
          specialties?: string[] | null
          status?: string | null
          stripe_verification_document_back?: string | null
          stripe_verification_document_front?: string | null
          stripe_verification_report?: Json | null
          stripe_verification_session_id?: string | null
          stripe_verification_status?: string | null
          stripe_verified_at?: string | null
          submitted_at?: string | null
          swift_code?: string | null
          tax_country?: string | null
          tax_id?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
          video_content_creation?: boolean | null
          website?: string | null
          whatsapp_notifications_enabled?: boolean | null
          why_goldsainte?: string | null
          year_established?: number | null
          years_experience?: number
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
        Relationships: []
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
        Relationships: []
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
          additional_emails: Json | null
          ai_match_score: number | null
          assigned_agent_id: string | null
          contacted_at: string | null
          conversation_data: Json
          converted_to_job_id: string | null
          created_at: string
          generated_itinerary: Json | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          inquiry_source: string
          marketplace_job_id: string | null
          matched_agent_ids: string[] | null
          notes: string | null
          notification_sent_at: string | null
          priority: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          additional_emails?: Json | null
          ai_match_score?: number | null
          assigned_agent_id?: string | null
          contacted_at?: string | null
          conversation_data?: Json
          converted_to_job_id?: string | null
          created_at?: string
          generated_itinerary?: Json | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          inquiry_source?: string
          marketplace_job_id?: string | null
          matched_agent_ids?: string[] | null
          notes?: string | null
          notification_sent_at?: string | null
          priority?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          additional_emails?: Json | null
          ai_match_score?: number | null
          assigned_agent_id?: string | null
          contacted_at?: string | null
          conversation_data?: Json
          converted_to_job_id?: string | null
          created_at?: string
          generated_itinerary?: Json | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          inquiry_source?: string
          marketplace_job_id?: string | null
          matched_agent_ids?: string[] | null
          notes?: string | null
          notification_sent_at?: string | null
          priority?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_inquiries_converted_to_job_id_fkey"
            columns: ["converted_to_job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_inquiries_marketplace_job_id_fkey"
            columns: ["marketplace_job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_packages: {
        Row: {
          agent_commission_percentage: number
          agent_id: string
          agent_notes: string | null
          available_from: string | null
          available_until: string | null
          base_price_per_person: number | null
          booking_approval_type: string | null
          booking_deadline_days: number | null
          cancellation_policy: string | null
          cover_image_url: string | null
          created_at: string
          creator_video_url: string | null
          currency: string
          deposit_amount: number | null
          deposit_percentage: number | null
          description: string | null
          destination: string
          duration_days: number
          emergency_contact_required: boolean | null
          exclusions: Json | null
          faq: Json | null
          hashtags: string[] | null
          highlights: Json | null
          id: string
          ideal_for: string | null
          images: Json | null
          inclusions: Json | null
          influencer_commission_percentage: number
          is_active: boolean | null
          max_participants: number | null
          min_group_size: number | null
          min_signups_to_confirm: number | null
          package_name: string
          payment_plan_type: string | null
          platform_fee_percentage: number
          promotional_materials: Json | null
          refund_policy: string | null
          retail_price: number
          status: string
          terms_conditions: string | null
          travel_requirements: string | null
          trip_type: string | null
          updated_at: string
          upgrade_options: Json | null
          waiver_text: string | null
          wholesale_cost: number
          why_this_trip: string | null
        }
        Insert: {
          agent_commission_percentage?: number
          agent_id: string
          agent_notes?: string | null
          available_from?: string | null
          available_until?: string | null
          base_price_per_person?: number | null
          booking_approval_type?: string | null
          booking_deadline_days?: number | null
          cancellation_policy?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_video_url?: string | null
          currency?: string
          deposit_amount?: number | null
          deposit_percentage?: number | null
          description?: string | null
          destination: string
          duration_days: number
          emergency_contact_required?: boolean | null
          exclusions?: Json | null
          faq?: Json | null
          hashtags?: string[] | null
          highlights?: Json | null
          id?: string
          ideal_for?: string | null
          images?: Json | null
          inclusions?: Json | null
          influencer_commission_percentage?: number
          is_active?: boolean | null
          max_participants?: number | null
          min_group_size?: number | null
          min_signups_to_confirm?: number | null
          package_name: string
          payment_plan_type?: string | null
          platform_fee_percentage?: number
          promotional_materials?: Json | null
          refund_policy?: string | null
          retail_price: number
          status?: string
          terms_conditions?: string | null
          travel_requirements?: string | null
          trip_type?: string | null
          updated_at?: string
          upgrade_options?: Json | null
          waiver_text?: string | null
          wholesale_cost: number
          why_this_trip?: string | null
        }
        Update: {
          agent_commission_percentage?: number
          agent_id?: string
          agent_notes?: string | null
          available_from?: string | null
          available_until?: string | null
          base_price_per_person?: number | null
          booking_approval_type?: string | null
          booking_deadline_days?: number | null
          cancellation_policy?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_video_url?: string | null
          currency?: string
          deposit_amount?: number | null
          deposit_percentage?: number | null
          description?: string | null
          destination?: string
          duration_days?: number
          emergency_contact_required?: boolean | null
          exclusions?: Json | null
          faq?: Json | null
          hashtags?: string[] | null
          highlights?: Json | null
          id?: string
          ideal_for?: string | null
          images?: Json | null
          inclusions?: Json | null
          influencer_commission_percentage?: number
          is_active?: boolean | null
          max_participants?: number | null
          min_group_size?: number | null
          min_signups_to_confirm?: number | null
          package_name?: string
          payment_plan_type?: string | null
          platform_fee_percentage?: number
          promotional_materials?: Json | null
          refund_policy?: string | null
          retail_price?: number
          status?: string
          terms_conditions?: string | null
          travel_requirements?: string | null
          trip_type?: string | null
          updated_at?: string
          upgrade_options?: Json | null
          waiver_text?: string | null
          wholesale_cost?: number
          why_this_trip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_packages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agent_packages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["user_id"]
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
        Relationships: []
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
            foreignKeyName: "agent_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_terms_acceptance: {
        Row: {
          accepted_at: string | null
          agent_id: string
          id: string
          ip_address: string | null
          privacy_version: string
          terms_version: string
          user_agent: string | null
          vendor_version: string
        }
        Insert: {
          accepted_at?: string | null
          agent_id: string
          id?: string
          ip_address?: string | null
          privacy_version: string
          terms_version: string
          user_agent?: string | null
          vendor_version: string
        }
        Update: {
          accepted_at?: string | null
          agent_id?: string
          id?: string
          ip_address?: string | null
          privacy_version?: string
          terms_version?: string
          user_agent?: string | null
          vendor_version?: string
        }
        Relationships: []
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
            referencedRelation: "agent_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agent_verification_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["user_id"]
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
      ai_bundled_packages: {
        Row: {
          bundled_price: number
          car_details: Json | null
          created_at: string | null
          currency: string | null
          departure_date: string
          destination: string
          flight_details: Json | null
          hotel_details: Json | null
          id: string
          return_date: string
          savings_amount: number
          status: string | null
          total_price: number
          travelers_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bundled_price: number
          car_details?: Json | null
          created_at?: string | null
          currency?: string | null
          departure_date: string
          destination: string
          flight_details?: Json | null
          hotel_details?: Json | null
          id?: string
          return_date: string
          savings_amount: number
          status?: string | null
          total_price: number
          travelers_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bundled_price?: number
          car_details?: Json | null
          created_at?: string | null
          currency?: string | null
          departure_date?: string
          destination?: string
          flight_details?: Json | null
          hotel_details?: Json | null
          id?: string
          return_date?: string
          savings_amount?: number
          status?: string | null
          total_price?: number
          travelers_count?: number | null
          updated_at?: string | null
          user_id?: string
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
            foreignKeyName: "ai_matching_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_error_logs: {
        Row: {
          created_at: string
          endpoint: string
          error_details: Json | null
          error_message: string | null
          error_type: string
          http_status: number | null
          id: string
          request_params: Json | null
          resolved_at: string | null
          service_name: string
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_details?: Json | null
          error_message?: string | null
          error_type: string
          http_status?: number | null
          id?: string
          request_params?: Json | null
          resolved_at?: string | null
          service_name: string
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_details?: Json | null
          error_message?: string | null
          error_type?: string
          http_status?: number | null
          id?: string
          request_params?: Json | null
          resolved_at?: string | null
          service_name?: string
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      api_health_metrics: {
        Row: {
          checked_at: string
          endpoint: string
          id: string
          metadata: Json | null
          response_time_ms: number | null
          service_name: string
          success: boolean
        }
        Insert: {
          checked_at?: string
          endpoint: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name: string
          success: boolean
        }
        Update: {
          checked_at?: string
          endpoint?: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name?: string
          success?: boolean
        }
        Relationships: []
      }
      apple_music_credentials: {
        Row: {
          created_at: string | null
          id: string
          key_id: string
          p8_key: string
          team_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_id: string
          p8_key: string
          team_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_id?: string
          p8_key?: string
          team_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      apple_signin_credentials: {
        Row: {
          created_at: string
          id: string
          key_id: string
          p8_key: string
          services_id: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_id: string
          p8_key: string
          services_id: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_id?: string
          p8_key?: string
          services_id?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      application_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string | null
          application_id: string
          application_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string | null
          application_id: string
          application_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string | null
          application_id?: string
          application_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
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
        Relationships: []
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
      booking_cancellation_policies: {
        Row: {
          booking_type: string
          created_at: string | null
          description: string | null
          hours_before_checkin: number
          id: string
          is_active: boolean | null
          policy_name: string
          refund_percentage: number
          updated_at: string | null
        }
        Insert: {
          booking_type: string
          created_at?: string | null
          description?: string | null
          hours_before_checkin: number
          id?: string
          is_active?: boolean | null
          policy_name: string
          refund_percentage: number
          updated_at?: string | null
        }
        Update: {
          booking_type?: string
          created_at?: string | null
          description?: string | null
          hours_before_checkin?: number
          id?: string
          is_active?: boolean | null
          policy_name?: string
          refund_percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_cancellations: {
        Row: {
          booking_id: string
          created_at: string
          decided_at: string | null
          decision_by: string | null
          decision_reason: string | null
          id: string
          reason_details: string | null
          reason_short: string
          requested_at: string
          requested_by: string
          requested_role: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          decided_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          id?: string
          reason_details?: string | null
          reason_short: string
          requested_at?: string
          requested_by: string
          requested_role: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          decided_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          id?: string
          reason_details?: string | null
          reason_short?: string
          requested_at?: string
          requested_by?: string
          requested_role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings_ops_view"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_interests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          status: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_milestones: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string | null
          currency: string
          description: string | null
          due_condition: string | null
          due_date: string | null
          funded_at: string | null
          id: string
          released_at: string | null
          released_to: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string | null
          currency?: string
          description?: string | null
          due_condition?: string | null
          due_date?: string | null
          funded_at?: string | null
          id?: string
          released_at?: string | null
          released_to?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          due_condition?: string | null
          due_date?: string | null
          funded_at?: string | null
          id?: string
          released_at?: string | null
          released_to?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
        Relationships: []
      }
      booking_refunds: {
        Row: {
          booking_id: string
          cancellation_id: string
          created_at: string | null
          currency: string
          failure_reason: string | null
          id: string
          refund_amount: number
          refunded_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          cancellation_id: string
          created_at?: string | null
          currency?: string
          failure_reason?: string | null
          id?: string
          refund_amount: number
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          cancellation_id?: string
          created_at?: string | null
          currency?: string
          failure_reason?: string | null
          id?: string
          refund_amount?: number
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          reason: string | null
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings_ops_view"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          agent_commission_pct: number | null
          agent_earnings: number | null
          agent_id: string | null
          agent_payout_cents: number | null
          agent_reviewed: boolean | null
          agent_share: number | null
          booking_number: string
          brand_commission_pct: number | null
          brand_id: string | null
          brand_payout_cents: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string | null
          creator_commission_pct: number | null
          creator_earnings: number | null
          creator_id: string | null
          creator_payout_cents: number | null
          creator_reviewed: boolean | null
          creator_share: number | null
          currency: string
          destination: string
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_resolution: string | null
          dispute_resolved_at: string | null
          end_date: string
          escrow_held_cents: number | null
          escrow_released_cents: number | null
          id: string
          is_disputed: boolean | null
          milestone_payment_enabled: boolean | null
          milestones: Json | null
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          payout_completed_at: string | null
          payout_eligible_at: string | null
          payout_expected_at: string | null
          payout_paid_at: string | null
          payout_scheduled_at: string | null
          payout_status: Database["public"]["Enums"]["payout_status"] | null
          platform_commission_pct: number | null
          platform_fee: number | null
          platform_fee_cents: number | null
          proposal_id: string | null
          refund_amount_cents: number | null
          refunded_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id: string | null
          total_amount: number | null
          total_price_cents: number
          traveler_id: string
          traveler_reviewed: boolean | null
          travelers_count: number
          trip_id: string | null
          trip_proposal_id: string | null
          trip_request_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_commission_pct?: number | null
          agent_earnings?: number | null
          agent_id?: string | null
          agent_payout_cents?: number | null
          agent_reviewed?: boolean | null
          agent_share?: number | null
          booking_number: string
          brand_commission_pct?: number | null
          brand_id?: string | null
          brand_payout_cents?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          creator_commission_pct?: number | null
          creator_earnings?: number | null
          creator_id?: string | null
          creator_payout_cents?: number | null
          creator_reviewed?: boolean | null
          creator_share?: number | null
          currency?: string
          destination: string
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          end_date: string
          escrow_held_cents?: number | null
          escrow_released_cents?: number | null
          id?: string
          is_disputed?: boolean | null
          milestone_payment_enabled?: boolean | null
          milestones?: Json | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payout_completed_at?: string | null
          payout_eligible_at?: string | null
          payout_expected_at?: string | null
          payout_paid_at?: string | null
          payout_scheduled_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          platform_commission_pct?: number | null
          platform_fee?: number | null
          platform_fee_cents?: number | null
          proposal_id?: string | null
          refund_amount_cents?: number | null
          refunded_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
          total_price_cents: number
          traveler_id: string
          traveler_reviewed?: boolean | null
          travelers_count: number
          trip_id?: string | null
          trip_proposal_id?: string | null
          trip_request_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_commission_pct?: number | null
          agent_earnings?: number | null
          agent_id?: string | null
          agent_payout_cents?: number | null
          agent_reviewed?: boolean | null
          agent_share?: number | null
          booking_number?: string
          brand_commission_pct?: number | null
          brand_id?: string | null
          brand_payout_cents?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          creator_commission_pct?: number | null
          creator_earnings?: number | null
          creator_id?: string | null
          creator_payout_cents?: number | null
          creator_reviewed?: boolean | null
          creator_share?: number | null
          currency?: string
          destination?: string
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          end_date?: string
          escrow_held_cents?: number | null
          escrow_released_cents?: number | null
          id?: string
          is_disputed?: boolean | null
          milestone_payment_enabled?: boolean | null
          milestones?: Json | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payout_completed_at?: string | null
          payout_eligible_at?: string | null
          payout_expected_at?: string | null
          payout_paid_at?: string | null
          payout_scheduled_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          platform_commission_pct?: number | null
          platform_fee?: number | null
          platform_fee_cents?: number | null
          proposal_id?: string | null
          refund_amount_cents?: number | null
          refunded_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
          total_price_cents?: number
          traveler_id?: string
          traveler_reviewed?: boolean | null
          travelers_count?: number
          trip_id?: string | null
          trip_proposal_id?: string | null
          trip_request_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_proposal_id_fkey"
            columns: ["trip_proposal_id"]
            isOneToOne: false
            referencedRelation: "trip_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_request_id_fkey"
            columns: ["trip_request_id"]
            isOneToOne: false
            referencedRelation: "trip_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_applications: {
        Row: {
          admin_notes: string | null
          admin_reviewer_id: string | null
          amenities: string[] | null
          approval_notes: string | null
          approved_at: string | null
          bio: string | null
          brand_category: string | null
          brand_name: string
          brand_profile_id: string | null
          brand_story: string | null
          brand_type: string
          business_address: string | null
          business_city: string | null
          business_country: string | null
          business_postal_code: string | null
          business_registration_number: string | null
          business_state: string | null
          capacity_max: number | null
          capacity_min: number | null
          cities: string[] | null
          cover_image_url: string | null
          created_at: string | null
          documents: Json | null
          facebook_url: string | null
          gallery_urls: string[] | null
          id: string
          instagram_handle: string | null
          linkedin_url: string | null
          logo_url: string | null
          price_range: string | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string
          primary_contact_title: string | null
          quality_certifications: string[] | null
          regions: string[] | null
          rejected_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          room_types: Json | null
          status: string | null
          stripe_verification_report: Json | null
          stripe_verification_session_id: string | null
          stripe_verification_status: string | null
          stripe_verified_at: string | null
          style_tags: string[] | null
          submitted_at: string | null
          sustainability_certifications: string[] | null
          tagline: string | null
          tax_id: string | null
          tiktok_handle: string | null
          updated_at: string | null
          user_id: string | null
          vat_number: string | null
          video_urls: string[] | null
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_reviewer_id?: string | null
          amenities?: string[] | null
          approval_notes?: string | null
          approved_at?: string | null
          bio?: string | null
          brand_category?: string | null
          brand_name: string
          brand_profile_id?: string | null
          brand_story?: string | null
          brand_type: string
          business_address?: string | null
          business_city?: string | null
          business_country?: string | null
          business_postal_code?: string | null
          business_registration_number?: string | null
          business_state?: string | null
          capacity_max?: number | null
          capacity_min?: number | null
          cities?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          documents?: Json | null
          facebook_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          price_range?: string | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string
          primary_contact_title?: string | null
          quality_certifications?: string[] | null
          regions?: string[] | null
          rejected_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          room_types?: Json | null
          status?: string | null
          stripe_verification_report?: Json | null
          stripe_verification_session_id?: string | null
          stripe_verification_status?: string | null
          stripe_verified_at?: string | null
          style_tags?: string[] | null
          submitted_at?: string | null
          sustainability_certifications?: string[] | null
          tagline?: string | null
          tax_id?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
          video_urls?: string[] | null
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_reviewer_id?: string | null
          amenities?: string[] | null
          approval_notes?: string | null
          approved_at?: string | null
          bio?: string | null
          brand_category?: string | null
          brand_name?: string
          brand_profile_id?: string | null
          brand_story?: string | null
          brand_type?: string
          business_address?: string | null
          business_city?: string | null
          business_country?: string | null
          business_postal_code?: string | null
          business_registration_number?: string | null
          business_state?: string | null
          capacity_max?: number | null
          capacity_min?: number | null
          cities?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          documents?: Json | null
          facebook_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          price_range?: string | null
          primary_contact_email?: string
          primary_contact_name?: string
          primary_contact_phone?: string
          primary_contact_title?: string | null
          quality_certifications?: string[] | null
          regions?: string[] | null
          rejected_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          room_types?: Json | null
          status?: string | null
          stripe_verification_report?: Json | null
          stripe_verification_session_id?: string | null
          stripe_verification_status?: string | null
          stripe_verified_at?: string | null
          style_tags?: string[] | null
          submitted_at?: string | null
          sustainability_certifications?: string[] | null
          tagline?: string | null
          tax_id?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
          video_urls?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      brand_collections: {
        Row: {
          brand_profile_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_profile_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_profile_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_collections_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_collections_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_engagement_daily_stats: {
        Row: {
          brand_profile_id: string
          discovered_count: number
          event_date: string
          moodboard_save_count: number
          profile_view_count: number
          trip_inquiry_count: number
        }
        Insert: {
          brand_profile_id: string
          discovered_count?: number
          event_date: string
          moodboard_save_count?: number
          profile_view_count?: number
          trip_inquiry_count?: number
        }
        Update: {
          brand_profile_id?: string
          discovered_count?: number
          event_date?: string
          moodboard_save_count?: number
          profile_view_count?: number
          trip_inquiry_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_engagement_daily_stats_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_engagement_daily_stats_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_engagement_events: {
        Row: {
          actor_user_id: string | null
          brand_profile_id: string
          context_id: string | null
          context_type: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["brand_engagement_type"]
          id: string
          metadata: Json
        }
        Insert: {
          actor_user_id?: string | null
          brand_profile_id: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["brand_engagement_type"]
          id?: string
          metadata?: Json
        }
        Update: {
          actor_user_id?: string | null
          brand_profile_id?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["brand_engagement_type"]
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brand_engagement_events_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_engagement_events_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          average_rating: number | null
          bio: string | null
          brand_name: string
          brand_type: string
          cities: string[] | null
          cover_image_url: string | null
          created_at: string | null
          gallery_urls: string[] | null
          id: string
          is_featured: boolean | null
          logo_url: string | null
          owner_user_id: string
          regions: string[] | null
          review_count: number | null
          status: string | null
          stripe_connect_account_id: string | null
          style_tags: string[] | null
          tagline: string | null
          total_bookings: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          brand_name: string
          brand_type: string
          cities?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          owner_user_id: string
          regions?: string[] | null
          review_count?: number | null
          status?: string | null
          stripe_connect_account_id?: string | null
          style_tags?: string[] | null
          tagline?: string | null
          total_bookings?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          brand_name?: string
          brand_type?: string
          cities?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          owner_user_id?: string
          regions?: string[] | null
          review_count?: number | null
          status?: string | null
          stripe_connect_account_id?: string | null
          style_tags?: string[] | null
          tagline?: string | null
          total_bookings?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      bundle_purchases: {
        Row: {
          amount_paid: number
          bundle_id: string
          buyer_id: string
          created_at: string
          currency: string
          id: string
          partner_payout: number
          platform_commission: number
          stripe_payment_intent_id: string | null
          trip_booking_id: string | null
        }
        Insert: {
          amount_paid: number
          bundle_id: string
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          partner_payout?: number
          platform_commission?: number
          stripe_payment_intent_id?: string | null
          trip_booking_id?: string | null
        }
        Update: {
          amount_paid?: number
          bundle_id?: string
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          partner_payout?: number
          platform_commission?: number
          stripe_payment_intent_id?: string | null
          trip_booking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_purchases_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_verifications: {
        Row: {
          business_address: Json | null
          business_license_url: string | null
          business_name: string
          created_at: string | null
          id: string
          registration_document_url: string | null
          registration_number: string | null
          rejection_reason: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          business_address?: Json | null
          business_license_url?: string | null
          business_name: string
          created_at?: string | null
          id?: string
          registration_document_url?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          business_address?: Json | null
          business_license_url?: string | null
          business_name?: string
          created_at?: string | null
          id?: string
          registration_document_url?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
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
      cancellation_policies: {
        Row: {
          booking_type: string
          created_at: string | null
          description: string | null
          hours_before_checkin: number
          id: string
          is_active: boolean | null
          name: string
          policy_name: string
          refund_percentage: number
          updated_at: string | null
        }
        Insert: {
          booking_type: string
          created_at?: string | null
          description?: string | null
          hours_before_checkin: number
          id?: string
          is_active?: boolean | null
          name: string
          policy_name: string
          refund_percentage: number
          updated_at?: string | null
        }
        Update: {
          booking_type?: string
          created_at?: string | null
          description?: string | null
          hours_before_checkin?: number
          id?: string
          is_active?: boolean | null
          name?: string
          policy_name?: string
          refund_percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          input_type: string | null
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          input_type?: string | null
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          input_type?: string | null
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_safety_events: {
        Row: {
          conversation_id: string
          created_at: string
          event_type: string
          id: string
          message_id: string | null
          original_text: string
          reasons: string[]
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          event_type: string
          id?: string
          message_id?: string | null
          original_text: string
          reasons: string[]
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          event_type?: string
          id?: string
          message_id?: string | null
          original_text?: string
          reasons?: string[]
          sender_id?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      city_image_usage: {
        Row: {
          city_slug: string
          created_at: string | null
          id: string
          last_used_at: string | null
          photographer: string | null
          unsplash_photo_id: string
          unsplash_url: string
          used_count: number | null
        }
        Insert: {
          city_slug: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          photographer?: string | null
          unsplash_photo_id: string
          unsplash_url: string
          used_count?: number | null
        }
        Update: {
          city_slug?: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          photographer?: string | null
          unsplash_photo_id?: string
          unsplash_url?: string
          used_count?: number | null
        }
        Relationships: []
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
      cocurated_trip_requests: {
        Row: {
          additional_emails: Json | null
          assigned_agent_id: string | null
          budget_range_max: number | null
          budget_range_min: number | null
          created_at: string
          destination: string | null
          generated_itinerary: Json | null
          id: string
          notify_all_emails: boolean | null
          preferred_dates: Json | null
          quoted_details: string | null
          quoted_price: number | null
          requester_email: string | null
          special_requests: string | null
          status: string
          total_travelers: number | null
          trip_items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_emails?: Json | null
          assigned_agent_id?: string | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          created_at?: string
          destination?: string | null
          generated_itinerary?: Json | null
          id?: string
          notify_all_emails?: boolean | null
          preferred_dates?: Json | null
          quoted_details?: string | null
          quoted_price?: number | null
          requester_email?: string | null
          special_requests?: string | null
          status?: string
          total_travelers?: number | null
          trip_items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_emails?: Json | null
          assigned_agent_id?: string | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          created_at?: string
          destination?: string | null
          generated_itinerary?: Json | null
          id?: string
          notify_all_emails?: boolean | null
          preferred_dates?: Json | null
          quoted_details?: string | null
          quoted_price?: number | null
          requester_email?: string | null
          special_requests?: string | null
          status?: string
          total_travelers?: number | null
          trip_items?: Json
          updated_at?: string
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
      commission_payout_requests: {
        Row: {
          amount: number
          booking_ids: Json | null
          created_at: string
          currency: string
          id: string
          payout_details: Json | null
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          status: string
          stripe_transfer_id: string | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          amount: number
          booking_ids?: Json | null
          created_at?: string
          currency?: string
          id?: string
          payout_details?: Json | null
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          amount?: number
          booking_ids?: Json | null
          created_at?: string
          currency?: string
          id?: string
          payout_details?: Json | null
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payout_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payout_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payout_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payout_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      concierge_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "concierge_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_sessions: {
        Row: {
          created_at: string
          id: string
          last_active_at: string
          linked_storyboard_id: string | null
          linked_trip_request_id: string | null
          mode: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_active_at?: string
          linked_storyboard_id?: string | null
          linked_trip_request_id?: string | null
          mode: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_active_at?: string
          linked_storyboard_id?: string | null
          linked_trip_request_id?: string | null
          mode?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      creator_collab_requests: {
        Row: {
          actual_revenue: number | null
          agent_id: string
          agent_notes: string | null
          compensation: string | null
          created_at: string
          creator_id: string
          creator_response: string | null
          estimated_revenue: number | null
          id: string
          package_id: string | null
          proposal_text: string
          status: string
          trip_story_id: string | null
          trip_title: string
          updated_at: string
        }
        Insert: {
          actual_revenue?: number | null
          agent_id: string
          agent_notes?: string | null
          compensation?: string | null
          created_at?: string
          creator_id: string
          creator_response?: string | null
          estimated_revenue?: number | null
          id?: string
          package_id?: string | null
          proposal_text: string
          status?: string
          trip_story_id?: string | null
          trip_title: string
          updated_at?: string
        }
        Update: {
          actual_revenue?: number | null
          agent_id?: string
          agent_notes?: string | null
          compensation?: string | null
          created_at?: string
          creator_id?: string
          creator_response?: string | null
          estimated_revenue?: number | null
          id?: string
          package_id?: string | null
          proposal_text?: string
          status?: string
          trip_story_id?: string | null
          trip_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_collab_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_collab_requests_trip_story_id_fkey"
            columns: ["trip_story_id"]
            isOneToOne: false
            referencedRelation: "trip_stories"
            referencedColumns: ["id"]
          },
        ]
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
      creator_media: {
        Row: {
          caption: string | null
          created_at: string | null
          external_id: string | null
          external_url: string | null
          id: string
          is_cover: boolean | null
          media_type: string
          sort_order: number | null
          source: string
          thumbnail_url: string | null
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          is_cover?: boolean | null
          media_type: string
          sort_order?: number | null
          source?: string
          thumbnail_url?: string | null
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          is_cover?: boolean | null
          media_type?: string
          sort_order?: number | null
          source?: string
          thumbnail_url?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          avatar_url: string | null
          best_for: string[] | null
          bio: string | null
          certifications: string[] | null
          clients_served: number | null
          created_at: string
          display_name: string | null
          handle: string | null
          not_ideal_for: string[] | null
          primary_niches: string[] | null
          primary_regions: string[] | null
          response_time_hours: number | null
          specialties: string[] | null
          tiktok_handle: string | null
          tiktok_url: string | null
          travel_styles: string[] | null
          trips_completed: number | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          best_for?: string[] | null
          bio?: string | null
          certifications?: string[] | null
          clients_served?: number | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          not_ideal_for?: string[] | null
          primary_niches?: string[] | null
          primary_regions?: string[] | null
          response_time_hours?: number | null
          specialties?: string[] | null
          tiktok_handle?: string | null
          tiktok_url?: string | null
          travel_styles?: string[] | null
          trips_completed?: number | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          best_for?: string[] | null
          bio?: string | null
          certifications?: string[] | null
          clients_served?: number | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          not_ideal_for?: string[] | null
          primary_niches?: string[] | null
          primary_regions?: string[] | null
          response_time_hours?: number | null
          specialties?: string[] | null
          tiktok_handle?: string | null
          tiktok_url?: string | null
          travel_styles?: string[] | null
          trips_completed?: number | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
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
      creator_services: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string
          currency: string
          delivery_days: number | null
          delivery_time_option: string | null
          description: string | null
          duration_minutes: number | null
          file_url: string | null
          has_priority_support: boolean | null
          id: string
          includes: Json | null
          is_active: boolean | null
          revisions: number | null
          service_tier: string | null
          sort_order: number | null
          starting_price_cents: number | null
          title: string
          trip_days: number | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          delivery_days?: number | null
          delivery_time_option?: string | null
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          has_priority_support?: boolean | null
          id?: string
          includes?: Json | null
          is_active?: boolean | null
          revisions?: number | null
          service_tier?: string | null
          sort_order?: number | null
          starting_price_cents?: number | null
          title: string
          trip_days?: number | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          delivery_days?: number | null
          delivery_time_option?: string | null
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          has_priority_support?: boolean | null
          id?: string
          includes?: Json | null
          is_active?: boolean | null
          revisions?: number | null
          service_tier?: string | null
          sort_order?: number | null
          starting_price_cents?: number | null
          title?: string
          trip_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_services_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_services_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_social_accounts: {
        Row: {
          created_at: string | null
          followers_count: number
          handle: string
          id: string
          platform: string
          profile_url: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          followers_count?: number
          handle: string
          id?: string
          platform: string
          profile_url: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          followers_count?: number
          handle?: string
          id?: string
          platform?: string
          profile_url?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      curated_hotels: {
        Row: {
          address: string
          amenities: Json
          city: string
          city_code: string
          country_code: string
          created_at: string
          currency: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          name: string
          price_per_night: number
          rating: number
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: Json
          city: string
          city_code: string
          country_code?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          price_per_night: number
          rating?: number
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: Json
          city?: string
          city_code?: string
          country_code?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          price_per_night?: number
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      curated_itineraries_cache: {
        Row: {
          behavioral_hash: string | null
          created_at: string
          expires_at: string
          id: string
          itineraries: Json
          preferences_hash: string
          user_id: string
        }
        Insert: {
          behavioral_hash?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          itineraries: Json
          preferences_hash: string
          user_id: string
        }
        Update: {
          behavioral_hash?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          itineraries?: Json
          preferences_hash?: string
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
          stripe_verification_session_id: string | null
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
          stripe_verification_session_id?: string | null
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
          stripe_verification_session_id?: string | null
          updated_at?: string
          user_id?: string
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachments: Json | null
          body: string
          conversation_id: string
          created_at: string | null
          filtered_content: string | null
          flagged_for_review: boolean | null
          flagged_reason: string | null
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          message_type: string
          metadata: Json
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          conversation_id: string
          created_at?: string | null
          filtered_content?: string | null
          flagged_for_review?: boolean | null
          flagged_reason?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          message_type?: string
          metadata?: Json
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          conversation_id?: string
          created_at?: string | null
          filtered_content?: string | null
          flagged_for_review?: boolean | null
          flagged_reason?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          message_type?: string
          metadata?: Json
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_submissions: {
        Row: {
          booking_reference: string | null
          created_at: string | null
          description: string
          dispute_type: string
          email: string
          id: string
          name: string
          phone: string | null
          preferred_contact_method: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_reference?: string | null
          created_at?: string | null
          description: string
          dispute_type: string
          email: string
          id?: string
          name: string
          phone?: string | null
          preferred_contact_method?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_reference?: string | null
          created_at?: string | null
          description?: string
          dispute_type?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          preferred_contact_method?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          raised_by: string
          reason: string | null
          resolution: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          raised_by: string
          reason?: string | null
          resolution?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          raised_by?: string
          reason?: string | null
          resolution?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      dm_conversations: {
        Row: {
          created_at: string | null
          id: string
          initiated_by: string
          last_message_at: string | null
          last_message_preview: string | null
          participant_1: string
          participant_2: string
          status: string
          trip_id: string | null
          trip_title: string | null
          unread_count_p1: number | null
          unread_count_p2: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          initiated_by: string
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_1: string
          participant_2: string
          status?: string
          trip_id?: string | null
          trip_title?: string | null
          unread_count_p1?: number | null
          unread_count_p2?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          initiated_by?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_1?: string
          participant_2?: string
          status?: string
          trip_id?: string | null
          trip_title?: string | null
          unread_count_p1?: number | null
          unread_count_p2?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_conversations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_conversations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_conversations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      earnings_ledger: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          payout_id: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          payout_id?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          payout_id?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earnings_ledger_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_connections: {
        Row: {
          access_token: string
          auto_sync_enabled: boolean | null
          created_at: string
          creator_id: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          platform: string
          refresh_token: string | null
          store_name: string | null
          store_url: string
          sync_error_message: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          auto_sync_enabled?: boolean | null
          created_at?: string
          creator_id: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          platform: string
          refresh_token?: string | null
          store_name?: string | null
          store_url: string
          sync_error_message?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          auto_sync_enabled?: boolean | null
          created_at?: string
          creator_id?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          platform?: string
          refresh_token?: string | null
          store_name?: string | null
          store_url?: string
          sync_error_message?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      engagement_rate_limits: {
        Row: {
          action_count: number
          action_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          action_count?: number
          action_type: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action_count?: number
          action_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      facebook_signin_credentials: {
        Row: {
          app_id: string
          app_secret: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          app_id: string
          app_secret: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          app_secret?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
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
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      group_trips: {
        Row: {
          budget_per_person: number | null
          created_at: string
          creator_id: string
          description: string | null
          destination: string
          end_date: string
          id: string
          notification_settings: Json | null
          spending_limits: Json | null
          start_date: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_per_person?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          destination: string
          end_date: string
          id?: string
          notification_settings?: Json | null
          spending_limits?: Json | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_per_person?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          destination?: string
          end_date?: string
          id?: string
          notification_settings?: Json | null
          spending_limits?: Json | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      instagram_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          instagram_user_id: string
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instagram_user_id: string
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instagram_user_id?: string
          updated_at?: string | null
          user_id?: string
          username?: string | null
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
      itinerary_products: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string
          currency: string
          days: Json
          description: string | null
          destination: string
          duration_days: number
          id: string
          price: number
          status: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          days?: Json
          description?: string | null
          destination: string
          duration_days: number
          id?: string
          price: number
          status?: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          days?: Json
          description?: string | null
          destination?: string
          duration_days?: number
          id?: string
          price?: number
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      itinerary_purchases: {
        Row: {
          amount_paid: number
          buyer_id: string
          currency: string | null
          id: string
          product_id: string
          purchased_at: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_paid: number
          buyer_id: string
          currency?: string | null
          id?: string
          product_id: string
          purchased_at?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_paid?: number
          buyer_id?: string
          currency?: string | null
          id?: string
          product_id?: string
          purchased_at?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "itinerary_products"
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
      journal_analytics: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          referrer: string | null
          scroll_depth_percent: number | null
          session_id: string | null
          user_id: string | null
          view_duration_seconds: number | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string | null
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string | null
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_analytics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "journal_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_article_blocks: {
        Row: {
          article_id: string
          block_order: number
          block_type: string
          content: Json
          created_at: string | null
          id: string
        }
        Insert: {
          article_id: string
          block_order: number
          block_type: string
          content: Json
          created_at?: string | null
          id?: string
        }
        Update: {
          article_id?: string
          block_order?: number
          block_type?: string
          content?: Json
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_article_blocks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "journal_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_articles: {
        Row: {
          categories: string[] | null
          created_at: string | null
          creator_id: string | null
          dek: string | null
          hero_image_alt: string | null
          hero_image_credit: string | null
          hero_image_url: string
          id: string
          is_sponsored: boolean | null
          location_tags: string[] | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          publish_date: string | null
          read_time_minutes: number | null
          slug: string
          sponsor_disclosure_text: string | null
          sponsor_link_url: string | null
          sponsor_logo_url: string | null
          sponsor_name: string | null
          status: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          creator_id?: string | null
          dek?: string | null
          hero_image_alt?: string | null
          hero_image_credit?: string | null
          hero_image_url: string
          id?: string
          is_sponsored?: boolean | null
          location_tags?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          publish_date?: string | null
          read_time_minutes?: number | null
          slug: string
          sponsor_disclosure_text?: string | null
          sponsor_link_url?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          creator_id?: string | null
          dek?: string | null
          hero_image_alt?: string | null
          hero_image_credit?: string | null
          hero_image_url?: string
          id?: string
          is_sponsored?: boolean | null
          location_tags?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          publish_date?: string | null
          read_time_minutes?: number | null
          slug?: string
          sponsor_disclosure_text?: string | null
          sponsor_link_url?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_articles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "journal_creators"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_creators: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
          social_links: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      journal_related_articles: {
        Row: {
          article_id: string
          display_order: number | null
          id: string
          related_article_id: string
        }
        Insert: {
          article_id: string
          display_order?: number | null
          id?: string
          related_article_id: string
        }
        Update: {
          article_id?: string
          display_order?: number | null
          id?: string
          related_article_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_related_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "journal_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_related_articles_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "journal_articles"
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
          additional_emails: Json | null
          agent_payout_amount: number | null
          agent_payout_status: string | null
          ai_matched_agents: string[] | null
          assigned_agent_id: string | null
          booking_type: string
          budget_max: number | null
          budget_min: number | null
          completed_at: string | null
          completion_notes: string | null
          contact_info: Json | null
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
          inquiry_source: string | null
          installment_plan_id: string | null
          is_group_booking: boolean | null
          notify_all_emails: boolean | null
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
          additional_emails?: Json | null
          agent_payout_amount?: number | null
          agent_payout_status?: string | null
          ai_matched_agents?: string[] | null
          assigned_agent_id?: string | null
          booking_type: string
          budget_max?: number | null
          budget_min?: number | null
          completed_at?: string | null
          completion_notes?: string | null
          contact_info?: Json | null
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
          inquiry_source?: string | null
          installment_plan_id?: string | null
          is_group_booking?: boolean | null
          notify_all_emails?: boolean | null
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
          additional_emails?: Json | null
          agent_payout_amount?: number | null
          agent_payout_status?: string | null
          ai_matched_agents?: string[] | null
          assigned_agent_id?: string | null
          booking_type?: string
          budget_max?: number | null
          budget_min?: number | null
          completed_at?: string | null
          completion_notes?: string | null
          contact_info?: Json | null
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
          inquiry_source?: string | null
          installment_plan_id?: string | null
          is_group_booking?: boolean | null
          notify_all_emails?: boolean | null
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
      media_library: {
        Row: {
          created_at: string
          id: string
          label: string | null
          owner_id: string | null
          source: string
          tags: string[] | null
          thumb_url: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          owner_id?: string | null
          source: string
          tags?: string[] | null
          thumb_url?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          owner_id?: string | null
          source?: string
          tags?: string[] | null
          thumb_url?: string | null
          url?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_settings: {
        Row: {
          allow_message_requests: boolean | null
          blocked_users: string[] | null
          created_at: string | null
          filter_requests: boolean | null
          show_read_receipts: boolean | null
          updated_at: string | null
          user_id: string
          who_can_message: string | null
        }
        Insert: {
          allow_message_requests?: boolean | null
          blocked_users?: string[] | null
          created_at?: string | null
          filter_requests?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string | null
          user_id: string
          who_can_message?: string | null
        }
        Update: {
          allow_message_requests?: boolean | null
          blocked_users?: string[] | null
          created_at?: string | null
          filter_requests?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string | null
          user_id?: string
          who_can_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          body: string
          booking_id: string | null
          contains_sensitive_info: boolean | null
          created_at: string | null
          flagged_for_review: boolean | null
          flagged_reason: string | null
          id: string
          is_read: boolean | null
          notification_email_sent_at: string | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string
          trip_request_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          body: string
          booking_id?: string | null
          contains_sensitive_info?: boolean | null
          created_at?: string | null
          flagged_for_review?: boolean | null
          flagged_reason?: string | null
          id?: string
          is_read?: boolean | null
          notification_email_sent_at?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id: string
          trip_request_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          body?: string
          booking_id?: string | null
          contains_sensitive_info?: boolean | null
          created_at?: string | null
          flagged_for_review?: boolean | null
          flagged_reason?: string | null
          id?: string
          is_read?: boolean | null
          notification_email_sent_at?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string
          trip_request_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_trip_request_id_fkey"
            columns: ["trip_request_id"]
            isOneToOne: false
            referencedRelation: "trip_requests"
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
      moment_interaction_responses: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          moment_id: string
          response_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          moment_id: string
          response_data: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          moment_id?: string
          response_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moment_interaction_responses_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_reactions: {
        Row: {
          created_at: string
          id: string
          moment_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moment_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moment_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moment_reactions_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
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
          drawing_data: string | null
          duration_seconds: number | null
          expires_at: string | null
          id: string
          interactions: Json | null
          media_type: string
          media_url: string | null
          music_album_art: string | null
          music_preview_url: string | null
          music_service: string | null
          music_track_artist: string | null
          music_track_id: string | null
          music_track_name: string | null
          spotify_audio_start_time: number | null
          text_styling: Json | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          drawing_data?: string | null
          duration_seconds?: number | null
          expires_at?: string | null
          id?: string
          interactions?: Json | null
          media_type: string
          media_url?: string | null
          music_album_art?: string | null
          music_preview_url?: string | null
          music_service?: string | null
          music_track_artist?: string | null
          music_track_id?: string | null
          music_track_name?: string | null
          spotify_audio_start_time?: number | null
          text_styling?: Json | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          drawing_data?: string | null
          duration_seconds?: number | null
          expires_at?: string | null
          id?: string
          interactions?: Json | null
          media_type?: string
          media_url?: string | null
          music_album_art?: string | null
          music_preview_url?: string | null
          music_service?: string | null
          music_track_artist?: string | null
          music_track_id?: string | null
          music_track_name?: string | null
          spotify_audio_start_time?: number | null
          text_styling?: Json | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "moments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          read_at: string | null
          sent_via_email: boolean | null
          sent_via_push: boolean | null
          sent_via_sms: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          read_at?: string | null
          sent_via_email?: boolean | null
          sent_via_push?: boolean | null
          sent_via_sms?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          read_at?: string | null
          sent_via_email?: boolean | null
          sent_via_push?: boolean | null
          sent_via_sms?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          app_origin: string | null
          created_at: string | null
          expires_at: string
          id: string
          platform: string
          provider: string | null
          state: string
        }
        Insert: {
          app_origin?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          platform: string
          provider?: string | null
          state: string
        }
        Update: {
          app_origin?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          platform?: string
          provider?: string | null
          state?: string
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
      package_collaborators: {
        Row: {
          commission_percentage: number
          created_at: string
          id: string
          invited_at: string
          package_id: string
          responded_at: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_percentage: number
          created_at?: string
          id?: string
          invited_at?: string
          package_id: string
          responded_at?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_percentage?: number
          created_at?: string
          id?: string
          invited_at?: string
          package_id?: string
          responded_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_collaborators_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "agent_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_disputes: {
        Row: {
          booking_id: string | null
          created_at: string
          creator_id: string | null
          description: string
          dispute_type: string
          evidence_urls: Json | null
          id: string
          package_id: string
          package_type: string
          raised_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          creator_id?: string | null
          description: string
          dispute_type: string
          evidence_urls?: Json | null
          id?: string
          package_id: string
          package_type: string
          raised_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string
          dispute_type?: string
          evidence_urls?: Json | null
          id?: string
          package_id?: string
          package_type?: string
          raised_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "package_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      package_itinerary: {
        Row: {
          accommodation: string | null
          activities: Json | null
          created_at: string
          day_number: number
          description: string | null
          id: string
          is_featured_day: boolean | null
          meals_included: string[] | null
          package_id: string
          title: string
          updated_at: string
        }
        Insert: {
          accommodation?: string | null
          activities?: Json | null
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          is_featured_day?: boolean | null
          meals_included?: string[] | null
          package_id: string
          title: string
          updated_at?: string
        }
        Update: {
          accommodation?: string | null
          activities?: Json | null
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          is_featured_day?: boolean | null
          meals_included?: string[] | null
          package_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_itinerary_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "agent_packages"
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
      package_media_gallery: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          is_cover: boolean | null
          media_type: string
          media_url: string
          package_id: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_cover?: boolean | null
          media_type: string
          media_url: string
          package_id: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_cover?: boolean | null
          media_type?: string
          media_url?: string
          package_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_media_gallery_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "agent_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_payment_milestones: {
        Row: {
          amount_percentage: number
          created_at: string
          description: string | null
          due_days_before_trip: number
          id: string
          milestone_name: string
          milestone_number: number
          package_id: string
          updated_at: string
        }
        Insert: {
          amount_percentage: number
          created_at?: string
          description?: string | null
          due_days_before_trip: number
          id?: string
          milestone_name: string
          milestone_number: number
          package_id: string
          updated_at?: string
        }
        Update: {
          amount_percentage?: number
          created_at?: string
          description?: string | null
          due_days_before_trip?: number
          id?: string
          milestone_name?: string
          milestone_number?: number
          package_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_payment_milestones_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "agent_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_post_tags: {
        Row: {
          created_at: string | null
          id: string
          package_id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          package_id: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          package_id?: string
          post_id?: string
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
      packaged_trips: {
        Row: {
          accommodation_type: string | null
          activity_level: string | null
          agent_id: string | null
          available_from: string | null
          available_until: string | null
          balance_due_days: number | null
          booking_count: number | null
          cancellation_policy: string | null
          cover_image_url: string | null
          created_at: string
          creator_id: string | null
          creator_type: string
          currency: string
          current_bookings: number | null
          departure_dates: Json | null
          deposit_percentage: number | null
          description: string | null
          destination: string
          difficulty_level: string | null
          duration_days: number
          duration_nights: number | null
          essential_info: Json | null
          faqs: Json | null
          fitness_level_required: string | null
          group_size_note: string | null
          highlights: Json | null
          host_tagline: string | null
          id: string
          image_gallery: Json | null
          included: Json | null
          instant_booking: boolean
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          max_participants: number | null
          meals_included: string[] | null
          min_participants: number | null
          minimum_age: number | null
          not_included: Json | null
          original_price: number | null
          passport_required: boolean | null
          price_per_person: number
          published_at: string | null
          rating: number | null
          recommended_arrival_airport: string | null
          recommended_departure_airport: string | null
          refund_policy: string | null
          review_count: number | null
          slug: string | null
          status: string
          tags: string[] | null
          terms_conditions: string | null
          title: string
          trip_type: string | null
          updated_at: string
          vaccination_required: boolean | null
          video_url: string | null
          view_count: number | null
          visa_required: boolean | null
          wishlist_count: number | null
        }
        Insert: {
          accommodation_type?: string | null
          activity_level?: string | null
          agent_id?: string | null
          available_from?: string | null
          available_until?: string | null
          balance_due_days?: number | null
          booking_count?: number | null
          cancellation_policy?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string | null
          creator_type?: string
          currency?: string
          current_bookings?: number | null
          departure_dates?: Json | null
          deposit_percentage?: number | null
          description?: string | null
          destination: string
          difficulty_level?: string | null
          duration_days: number
          duration_nights?: number | null
          essential_info?: Json | null
          faqs?: Json | null
          fitness_level_required?: string | null
          group_size_note?: string | null
          highlights?: Json | null
          host_tagline?: string | null
          id?: string
          image_gallery?: Json | null
          included?: Json | null
          instant_booking?: boolean
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          max_participants?: number | null
          meals_included?: string[] | null
          min_participants?: number | null
          minimum_age?: number | null
          not_included?: Json | null
          original_price?: number | null
          passport_required?: boolean | null
          price_per_person: number
          published_at?: string | null
          rating?: number | null
          recommended_arrival_airport?: string | null
          recommended_departure_airport?: string | null
          refund_policy?: string | null
          review_count?: number | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          terms_conditions?: string | null
          title: string
          trip_type?: string | null
          updated_at?: string
          vaccination_required?: boolean | null
          video_url?: string | null
          view_count?: number | null
          visa_required?: boolean | null
          wishlist_count?: number | null
        }
        Update: {
          accommodation_type?: string | null
          activity_level?: string | null
          agent_id?: string | null
          available_from?: string | null
          available_until?: string | null
          balance_due_days?: number | null
          booking_count?: number | null
          cancellation_policy?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string | null
          creator_type?: string
          currency?: string
          current_bookings?: number | null
          departure_dates?: Json | null
          deposit_percentage?: number | null
          description?: string | null
          destination?: string
          difficulty_level?: string | null
          duration_days?: number
          duration_nights?: number | null
          essential_info?: Json | null
          faqs?: Json | null
          fitness_level_required?: string | null
          group_size_note?: string | null
          highlights?: Json | null
          host_tagline?: string | null
          id?: string
          image_gallery?: Json | null
          included?: Json | null
          instant_booking?: boolean
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          max_participants?: number | null
          meals_included?: string[] | null
          min_participants?: number | null
          minimum_age?: number | null
          not_included?: Json | null
          original_price?: number | null
          passport_required?: boolean | null
          price_per_person?: number
          published_at?: string | null
          rating?: number | null
          recommended_arrival_airport?: string | null
          recommended_departure_airport?: string | null
          refund_policy?: string | null
          review_count?: number | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          terms_conditions?: string | null
          title?: string
          trip_type?: string | null
          updated_at?: string
          vaccination_required?: boolean | null
          video_url?: string | null
          view_count?: number | null
          visa_required?: boolean | null
          wishlist_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packaged_trips_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaged_trips_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaged_trips_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaged_trips_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "paid_partnerships_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "paid_partnerships_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      payment_intents: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          provider: string
          provider_intent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_intent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_intent_id?: string | null
          status?: string
          updated_at?: string
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
        Relationships: []
      }
      payout_accounts: {
        Row: {
          created_at: string
          currency: string
          id: string
          provider: string
          provider_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          provider: string
          provider_payout_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_payout_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_payout_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_metrics: {
        Row: {
          active_users_today: number | null
          approved_applications_today: number | null
          cancelled_bookings_today: number | null
          completed_bookings_today: number | null
          created_at: string | null
          id: string
          messages_sent_today: number | null
          metric_date: string
          new_bookings_today: number | null
          new_users_today: number | null
          payouts_today_cents: number | null
          pending_agent_applications: number | null
          pending_brand_applications: number | null
          platform_fees_cents: number | null
          proposals_sent_today: number | null
          revenue_today_cents: number | null
          total_bookings: number | null
          total_revenue_cents: number | null
          total_users: number | null
        }
        Insert: {
          active_users_today?: number | null
          approved_applications_today?: number | null
          cancelled_bookings_today?: number | null
          completed_bookings_today?: number | null
          created_at?: string | null
          id?: string
          messages_sent_today?: number | null
          metric_date: string
          new_bookings_today?: number | null
          new_users_today?: number | null
          payouts_today_cents?: number | null
          pending_agent_applications?: number | null
          pending_brand_applications?: number | null
          platform_fees_cents?: number | null
          proposals_sent_today?: number | null
          revenue_today_cents?: number | null
          total_bookings?: number | null
          total_revenue_cents?: number | null
          total_users?: number | null
        }
        Update: {
          active_users_today?: number | null
          approved_applications_today?: number | null
          cancelled_bookings_today?: number | null
          completed_bookings_today?: number | null
          created_at?: string | null
          id?: string
          messages_sent_today?: number | null
          metric_date?: string
          new_bookings_today?: number | null
          new_users_today?: number | null
          payouts_today_cents?: number | null
          pending_agent_applications?: number | null
          pending_brand_applications?: number | null
          platform_fees_cents?: number | null
          proposals_sent_today?: number | null
          revenue_today_cents?: number | null
          total_bookings?: number | null
          total_revenue_cents?: number | null
          total_users?: number | null
        }
        Relationships: []
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
          ip_address: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
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
          ip_address: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
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
      processed_payments: {
        Row: {
          amount_cents: number
          currency: string
          id: string
          metadata: Json | null
          payment_intent_id: string
          payment_type: string
          processed_at: string
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          currency: string
          id?: string
          metadata?: Json | null
          payment_intent_id: string
          payment_type: string
          processed_at?: string
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          currency?: string
          id?: string
          metadata?: Json | null
          payment_intent_id?: string
          payment_type?: string
          processed_at?: string
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_bundles: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string
          currency: string
          description: string | null
          guide_ids: string[]
          id: string
          price: number
          status: string
          title: string
          trip_id: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          description?: string | null
          guide_ids?: string[]
          id?: string
          price: number
          status?: string
          title: string
          trip_id?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string | null
          guide_ids?: string[]
          id?: string
          price?: number
          status?: string
          title?: string
          trip_id?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_bundles_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
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
          external_product_id: string | null
          external_store_id: string | null
          external_url: string | null
          id: string
          images: Json | null
          inventory_count: number | null
          is_active: boolean | null
          last_synced_at: string | null
          price: number
          product_type: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          sync_source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          description?: string | null
          external_product_id?: string | null
          external_store_id?: string | null
          external_url?: string | null
          id?: string
          images?: Json | null
          inventory_count?: number | null
          is_active?: boolean | null
          last_synced_at?: string | null
          price: number
          product_type: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          sync_source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string | null
          external_product_id?: string | null
          external_store_id?: string | null
          external_url?: string | null
          id?: string
          images?: Json | null
          inventory_count?: number | null
          is_active?: boolean | null
          last_synced_at?: string | null
          price?: number
          product_type?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          sync_source?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_external_store_id_fkey"
            columns: ["external_store_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepts_booking_calls: boolean | null
          accepts_safety_policy: boolean | null
          accepts_transparency_agreement: boolean | null
          account_status: string | null
          account_type: string | null
          aesthetic_alignment: string[] | null
          agency_name: string | null
          agent_agency_name: string | null
          agent_license_authority: string | null
          agent_license_number: string | null
          agent_specialties: string[] | null
          agent_verification_status: string | null
          agent_years_experience: number | null
          ai_calls_reset_at: string | null
          ai_calls_used: number | null
          ai_persona_audience: string[] | null
          ai_persona_tone: string | null
          ai_subscription_tier: string | null
          auto_share_instagram: boolean | null
          auto_share_tiktok: boolean | null
          availability_status: string | null
          avatar_url: string | null
          billing_address: Json | null
          bio: string | null
          brand_verification_status: string | null
          content_style_tags: string[] | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          creator_agreement_accepted_at: string | null
          creator_agreement_version: string | null
          creator_approved_at: string | null
          creator_approved_by: string | null
          creator_avg_views: number | null
          creator_budget_levels: string[] | null
          creator_followers: number | null
          creator_niches: string[] | null
          creator_pov: string | null
          creator_rejection_reason: string | null
          creator_status: string
          creator_tier: string
          destinations_focus_tags: string[] | null
          display_name: string | null
          email: string | null
          email_notifications: boolean | null
          email_verified: boolean | null
          featured_photos: string[] | null
          featured_tiktok_videos: Json
          first_name: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          has_completed_creator_onboarding: boolean | null
          home_base: string | null
          id: string
          identity_verified: boolean | null
          instagram_handle: string | null
          instagram_username: string | null
          is_business_verified: boolean | null
          is_profile_complete: boolean | null
          is_shadowbanned: boolean | null
          is_verified: boolean | null
          itinerary_fee_amount: number | null
          languages: string[] | null
          last_name: string | null
          last_seen_at: string | null
          last_warning_at: string | null
          lifetime_sales_count: number
          location: string | null
          metadata: Json | null
          notification_preferences: Json | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          payout_schedule: string | null
          phone: string | null
          phone_verified: boolean | null
          planning_fee_amount: number | null
          preferences: Json | null
          preferred_brand_tiers: string[] | null
          preferred_currency: string | null
          preferred_hotel_brands: string[] | null
          preferred_language: string | null
          pricing_model: string | null
          primary_platform: string | null
          privacy_accepted_at: string | null
          privacy_version: string | null
          profile_visibility: string | null
          response_commitment_hours: number | null
          restriction_expires_at: string | null
          role: string | null
          safety_policy_signed_at: string | null
          show_account_type: boolean | null
          sms_notifications: boolean | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_charges_enabled: boolean | null
          stripe_connect_account_id: string | null
          stripe_connect_payouts_enabled: boolean | null
          stripe_customer_id: string | null
          stripe_onboarding_completed: boolean | null
          stripe_payouts_enabled: boolean | null
          tax_id: string | null
          tiktok_access_token: string | null
          tiktok_connected_at: string | null
          tiktok_follower_count: number | null
          tiktok_followers: number | null
          tiktok_handle: string | null
          tiktok_niche_tags: string[] | null
          tiktok_refresh_token: string | null
          tiktok_token_expires_at: string | null
          tiktok_username: string | null
          tiktok_verified: boolean | null
          tiktok_verified_at: string | null
          time_zone: string | null
          tos_accepted_at: string | null
          tos_version: string | null
          transparency_agreement_signed_at: string | null
          travel_philosophy: string | null
          unavailable_until: string | null
          updated_at: string
          username: string | null
          warning_count: number | null
          website: string | null
          welcome_shown: boolean
        }
        Insert: {
          accepts_booking_calls?: boolean | null
          accepts_safety_policy?: boolean | null
          accepts_transparency_agreement?: boolean | null
          account_status?: string | null
          account_type?: string | null
          aesthetic_alignment?: string[] | null
          agency_name?: string | null
          agent_agency_name?: string | null
          agent_license_authority?: string | null
          agent_license_number?: string | null
          agent_specialties?: string[] | null
          agent_verification_status?: string | null
          agent_years_experience?: number | null
          ai_calls_reset_at?: string | null
          ai_calls_used?: number | null
          ai_persona_audience?: string[] | null
          ai_persona_tone?: string | null
          ai_subscription_tier?: string | null
          auto_share_instagram?: boolean | null
          auto_share_tiktok?: boolean | null
          availability_status?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          bio?: string | null
          brand_verification_status?: string | null
          content_style_tags?: string[] | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_agreement_accepted_at?: string | null
          creator_agreement_version?: string | null
          creator_approved_at?: string | null
          creator_approved_by?: string | null
          creator_avg_views?: number | null
          creator_budget_levels?: string[] | null
          creator_followers?: number | null
          creator_niches?: string[] | null
          creator_pov?: string | null
          creator_rejection_reason?: string | null
          creator_status?: string
          creator_tier?: string
          destinations_focus_tags?: string[] | null
          display_name?: string | null
          email?: string | null
          email_notifications?: boolean | null
          email_verified?: boolean | null
          featured_photos?: string[] | null
          featured_tiktok_videos?: Json
          first_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          has_completed_creator_onboarding?: boolean | null
          home_base?: string | null
          id: string
          identity_verified?: boolean | null
          instagram_handle?: string | null
          instagram_username?: string | null
          is_business_verified?: boolean | null
          is_profile_complete?: boolean | null
          is_shadowbanned?: boolean | null
          is_verified?: boolean | null
          itinerary_fee_amount?: number | null
          languages?: string[] | null
          last_name?: string | null
          last_seen_at?: string | null
          last_warning_at?: string | null
          lifetime_sales_count?: number
          location?: string | null
          metadata?: Json | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          payout_schedule?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          planning_fee_amount?: number | null
          preferences?: Json | null
          preferred_brand_tiers?: string[] | null
          preferred_currency?: string | null
          preferred_hotel_brands?: string[] | null
          preferred_language?: string | null
          pricing_model?: string | null
          primary_platform?: string | null
          privacy_accepted_at?: string | null
          privacy_version?: string | null
          profile_visibility?: string | null
          response_commitment_hours?: number | null
          restriction_expires_at?: string | null
          role?: string | null
          safety_policy_signed_at?: string | null
          show_account_type?: boolean | null
          sms_notifications?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_connect_account_id?: string | null
          stripe_connect_payouts_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_onboarding_completed?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tax_id?: string | null
          tiktok_access_token?: string | null
          tiktok_connected_at?: string | null
          tiktok_follower_count?: number | null
          tiktok_followers?: number | null
          tiktok_handle?: string | null
          tiktok_niche_tags?: string[] | null
          tiktok_refresh_token?: string | null
          tiktok_token_expires_at?: string | null
          tiktok_username?: string | null
          tiktok_verified?: boolean | null
          tiktok_verified_at?: string | null
          time_zone?: string | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          transparency_agreement_signed_at?: string | null
          travel_philosophy?: string | null
          unavailable_until?: string | null
          updated_at?: string
          username?: string | null
          warning_count?: number | null
          website?: string | null
          welcome_shown?: boolean
        }
        Update: {
          accepts_booking_calls?: boolean | null
          accepts_safety_policy?: boolean | null
          accepts_transparency_agreement?: boolean | null
          account_status?: string | null
          account_type?: string | null
          aesthetic_alignment?: string[] | null
          agency_name?: string | null
          agent_agency_name?: string | null
          agent_license_authority?: string | null
          agent_license_number?: string | null
          agent_specialties?: string[] | null
          agent_verification_status?: string | null
          agent_years_experience?: number | null
          ai_calls_reset_at?: string | null
          ai_calls_used?: number | null
          ai_persona_audience?: string[] | null
          ai_persona_tone?: string | null
          ai_subscription_tier?: string | null
          auto_share_instagram?: boolean | null
          auto_share_tiktok?: boolean | null
          availability_status?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          bio?: string | null
          brand_verification_status?: string | null
          content_style_tags?: string[] | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_agreement_accepted_at?: string | null
          creator_agreement_version?: string | null
          creator_approved_at?: string | null
          creator_approved_by?: string | null
          creator_avg_views?: number | null
          creator_budget_levels?: string[] | null
          creator_followers?: number | null
          creator_niches?: string[] | null
          creator_pov?: string | null
          creator_rejection_reason?: string | null
          creator_status?: string
          creator_tier?: string
          destinations_focus_tags?: string[] | null
          display_name?: string | null
          email?: string | null
          email_notifications?: boolean | null
          email_verified?: boolean | null
          featured_photos?: string[] | null
          featured_tiktok_videos?: Json
          first_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          has_completed_creator_onboarding?: boolean | null
          home_base?: string | null
          id?: string
          identity_verified?: boolean | null
          instagram_handle?: string | null
          instagram_username?: string | null
          is_business_verified?: boolean | null
          is_profile_complete?: boolean | null
          is_shadowbanned?: boolean | null
          is_verified?: boolean | null
          itinerary_fee_amount?: number | null
          languages?: string[] | null
          last_name?: string | null
          last_seen_at?: string | null
          last_warning_at?: string | null
          lifetime_sales_count?: number
          location?: string | null
          metadata?: Json | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          payout_schedule?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          planning_fee_amount?: number | null
          preferences?: Json | null
          preferred_brand_tiers?: string[] | null
          preferred_currency?: string | null
          preferred_hotel_brands?: string[] | null
          preferred_language?: string | null
          pricing_model?: string | null
          primary_platform?: string | null
          privacy_accepted_at?: string | null
          privacy_version?: string | null
          profile_visibility?: string | null
          response_commitment_hours?: number | null
          restriction_expires_at?: string | null
          role?: string | null
          safety_policy_signed_at?: string | null
          show_account_type?: boolean | null
          sms_notifications?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_connect_account_id?: string | null
          stripe_connect_payouts_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_onboarding_completed?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tax_id?: string | null
          tiktok_access_token?: string | null
          tiktok_connected_at?: string | null
          tiktok_follower_count?: number | null
          tiktok_followers?: number | null
          tiktok_handle?: string | null
          tiktok_niche_tags?: string[] | null
          tiktok_refresh_token?: string | null
          tiktok_token_expires_at?: string | null
          tiktok_username?: string | null
          tiktok_verified?: boolean | null
          tiktok_verified_at?: string | null
          time_zone?: string | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          transparency_agreement_signed_at?: string | null
          travel_philosophy?: string | null
          unavailable_until?: string | null
          updated_at?: string
          username?: string | null
          warning_count?: number | null
          website?: string | null
          welcome_shown?: boolean
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          clicked_at: string | null
          converted: boolean | null
          created_at: string | null
          id: string
          package_id: string
          promo_code: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          converted?: boolean | null
          created_at?: string | null
          id?: string
          package_id: string
          promo_code: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          converted?: boolean | null
          created_at?: string | null
          id?: string
          package_id?: string
          promo_code?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      promoted_posts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          duration_days: number
          expires_at: string
          id: string
          plan_id: string
          post_id: string
          reach_estimate: string | null
          started_at: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          duration_days: number
          expires_at: string
          id?: string
          plan_id: string
          post_id: string
          reach_estimate?: string | null
          started_at?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          duration_days?: number
          expires_at?: string
          id?: string
          plan_id?: string
          post_id?: string
          reach_estimate?: string | null
          started_at?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoted_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
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
      proposal_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          proposal_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          proposal_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          proposal_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_attachments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "trip_proposals"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          updated_at: string | null
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string
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
      reports: {
        Row: {
          booking_id: string | null
          conversation_id: string | null
          created_at: string
          description: string | null
          id: string
          message_id: string | null
          report_type: string
          reported_user_id: string | null
          reporter_id: string
          status: string
        }
        Insert: {
          booking_id?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string | null
          report_type: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string
        }
        Update: {
          booking_id?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string | null
          report_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      reserved_usernames: {
        Row: {
          username: string
        }
        Insert: {
          username: string
        }
        Update: {
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          communication_rating: number | null
          created_at: string | null
          experience_rating: number | null
          flagged_reason: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          photos: string[] | null
          professionalism_rating: number | null
          rating: number
          responded_at: string | null
          response: string | null
          reviewee_id: string
          reviewee_type: string
          reviewer_id: string
          status: string | null
          title: string | null
          updated_at: string | null
          value_rating: number | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          experience_rating?: number | null
          flagged_reason?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          photos?: string[] | null
          professionalism_rating?: number | null
          rating: number
          responded_at?: string | null
          response?: string | null
          reviewee_id: string
          reviewee_type: string
          reviewer_id: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          value_rating?: number | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          experience_rating?: number | null
          flagged_reason?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          photos?: string[] | null
          professionalism_rating?: number | null
          rating?: number
          responded_at?: string | null
          response?: string | null
          reviewee_id?: string
          reviewee_type?: string
          reviewer_id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      search_cache: {
        Row: {
          cache_key: string
          cached_at: string | null
          data: Json
          expires_at: string
        }
        Insert: {
          cache_key: string
          cached_at?: string | null
          data: Json
          expires_at: string
        }
        Update: {
          cache_key?: string
          cached_at?: string | null
          data?: Json
          expires_at?: string
        }
        Relationships: []
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
      shared_commission_bookings: {
        Row: {
          agent_commission: number
          agent_payout_status: string
          booking_date: string
          booking_status: string
          created_at: string
          currency: string
          customer_id: string | null
          customer_payment_status: string
          guest_email: string | null
          guest_name: string | null
          id: string
          influencer_commission: number
          influencer_payout_status: string
          package_id: string
          participants: number
          platform_fee: number
          promotion_id: string | null
          retail_price: number
          stripe_payment_intent_id: string | null
          total_margin: number
          travel_date: string
          updated_at: string
          wholesale_cost: number
        }
        Insert: {
          agent_commission: number
          agent_payout_status?: string
          booking_date: string
          booking_status?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          customer_payment_status?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          influencer_commission: number
          influencer_payout_status?: string
          package_id: string
          participants?: number
          platform_fee: number
          promotion_id?: string | null
          retail_price: number
          stripe_payment_intent_id?: string | null
          total_margin: number
          travel_date: string
          updated_at?: string
          wholesale_cost: number
        }
        Update: {
          agent_commission?: number
          agent_payout_status?: string
          booking_date?: string
          booking_status?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          customer_payment_status?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          influencer_commission?: number
          influencer_payout_status?: string
          package_id?: string
          participants?: number
          platform_fee?: number
          promotion_id?: string | null
          retail_price?: number
          stripe_payment_intent_id?: string | null
          total_margin?: number
          travel_date?: string
          updated_at?: string
          wholesale_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_commission_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_commission_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_commission_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "agent_packages"
            referencedColumns: ["id"]
          },
        ]
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
      story_highlights: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
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
      storyboard_collaborators: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          role: string
          storyboard_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          role?: string
          storyboard_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          role?: string
          storyboard_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storyboard_collaborators_storyboard_id_fkey"
            columns: ["storyboard_id"]
            isOneToOne: false
            referencedRelation: "storyboards"
            referencedColumns: ["id"]
          },
        ]
      }
      storyboard_items: {
        Row: {
          bookable_product_id: string | null
          bookable_product_type: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          item_type: string
          metadata: Json | null
          position: number
          repinned_from_item_id: string | null
          repinned_from_user_id: string | null
          section_id: string | null
          source_id: string | null
          source_type: string | null
          storyboard_id: string
          subtitle: string | null
          title: string | null
          video_url: string | null
        }
        Insert: {
          bookable_product_id?: string | null
          bookable_product_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_type: string
          metadata?: Json | null
          position?: number
          repinned_from_item_id?: string | null
          repinned_from_user_id?: string | null
          section_id?: string | null
          source_id?: string | null
          source_type?: string | null
          storyboard_id: string
          subtitle?: string | null
          title?: string | null
          video_url?: string | null
        }
        Update: {
          bookable_product_id?: string | null
          bookable_product_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string
          metadata?: Json | null
          position?: number
          repinned_from_item_id?: string | null
          repinned_from_user_id?: string | null
          section_id?: string | null
          source_id?: string | null
          source_type?: string | null
          storyboard_id?: string
          subtitle?: string | null
          title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyboard_items_repinned_from_item_id_fkey"
            columns: ["repinned_from_item_id"]
            isOneToOne: false
            referencedRelation: "storyboard_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "storyboard_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_items_storyboard_id_fkey"
            columns: ["storyboard_id"]
            isOneToOne: false
            referencedRelation: "storyboards"
            referencedColumns: ["id"]
          },
        ]
      }
      storyboard_media_library: {
        Row: {
          created_at: string
          created_by: string | null
          destination_tags: string[] | null
          id: string
          is_featured: boolean | null
          label: string | null
          mood_tags: string[] | null
          thumbnail_url: string | null
          url: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination_tags?: string[] | null
          id?: string
          is_featured?: boolean | null
          label?: string | null
          mood_tags?: string[] | null
          thumbnail_url?: string | null
          url: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination_tags?: string[] | null
          id?: string
          is_featured?: boolean | null
          label?: string | null
          mood_tags?: string[] | null
          thumbnail_url?: string | null
          url?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      storyboard_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          section_type: string
          storyboard_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          section_type?: string
          storyboard_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          section_type?: string
          storyboard_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storyboard_sections_storyboard_id_fkey"
            columns: ["storyboard_id"]
            isOneToOne: false
            referencedRelation: "storyboards"
            referencedColumns: ["id"]
          },
        ]
      }
      storyboards: {
        Row: {
          accommodation_style: string | null
          budget_level: string | null
          budget_max: number | null
          budget_min: number | null
          budget_per_person: boolean | null
          cover_image_url: string | null
          created_at: string
          dealbreakers: string[] | null
          departure_city: string | null
          description: string | null
          destination: string | null
          end_date: string | null
          flexibility: string | null
          forked_count: number
          id: string
          interests: string[] | null
          is_public: boolean
          must_haves: string[] | null
          occasion: string | null
          original_storyboard_id: string | null
          owner_id: string
          pace: string | null
          role: string
          slug: string | null
          source_creator_id: string | null
          special_notes: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          travelers_adults: number | null
          travelers_children: number | null
          trip_length_days: number | null
          trip_request_id: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          accommodation_style?: string | null
          budget_level?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_per_person?: boolean | null
          cover_image_url?: string | null
          created_at?: string
          dealbreakers?: string[] | null
          departure_city?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string | null
          flexibility?: string | null
          forked_count?: number
          id?: string
          interests?: string[] | null
          is_public?: boolean
          must_haves?: string[] | null
          occasion?: string | null
          original_storyboard_id?: string | null
          owner_id: string
          pace?: string | null
          role: string
          slug?: string | null
          source_creator_id?: string | null
          special_notes?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          travelers_adults?: number | null
          travelers_children?: number | null
          trip_length_days?: number | null
          trip_request_id?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          accommodation_style?: string | null
          budget_level?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_per_person?: boolean | null
          cover_image_url?: string | null
          created_at?: string
          dealbreakers?: string[] | null
          departure_city?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string | null
          flexibility?: string | null
          forked_count?: number
          id?: string
          interests?: string[] | null
          is_public?: boolean
          must_haves?: string[] | null
          occasion?: string | null
          original_storyboard_id?: string | null
          owner_id?: string
          pace?: string | null
          role?: string
          slug?: string | null
          source_creator_id?: string | null
          special_notes?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          travelers_adults?: number | null
          travelers_children?: number | null
          trip_length_days?: number | null
          trip_request_id?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "storyboards_original_storyboard_id_fkey"
            columns: ["original_storyboard_id"]
            isOneToOne: false
            referencedRelation: "storyboards"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_participants: {
        Row: {
          created_at: string
          id: string
          status: string
          suggestion_id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          suggestion_id: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          suggestion_id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_participants_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "trip_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "group_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          rating: number
          responded_at: string | null
          response_text: string | null
          review_text: string | null
          supplier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          rating: number
          responded_at?: string | null
          response_text?: string | null
          review_text?: string | null
          supplier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          rating?: number
          responded_at?: string | null
          response_text?: string | null
          review_text?: string | null
          supplier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
          created_at: string | null
          id: string
          insurance_check_status: string | null
          license_check_status: string | null
          reference_check_status: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          supplier_id: string
          updated_at: string | null
          vetting_notes: string | null
          vetting_status: string | null
        }
        Insert: {
          approval_decision?: string | null
          background_check_status?: string | null
          created_at?: string | null
          id?: string
          insurance_check_status?: string | null
          license_check_status?: string | null
          reference_check_status?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          supplier_id: string
          updated_at?: string | null
          vetting_notes?: string | null
          vetting_status?: string | null
        }
        Update: {
          approval_decision?: string | null
          background_check_status?: string | null
          created_at?: string | null
          id?: string
          insurance_check_status?: string | null
          license_check_status?: string | null
          reference_check_status?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          supplier_id?: string
          updated_at?: string | null
          vetting_notes?: string | null
          vetting_status?: string | null
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
          business_address: string | null
          business_name: string | null
          commission_rate: number | null
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          insurance_verified: boolean | null
          is_active: boolean | null
          is_verified: boolean | null
          license_verified: boolean | null
          name: string
          rating: number | null
          supplier_type: string
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          business_address?: string | null
          business_name?: string | null
          commission_rate?: number | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          insurance_verified?: boolean | null
          is_active?: boolean | null
          is_verified?: boolean | null
          license_verified?: boolean | null
          name: string
          rating?: number | null
          supplier_type: string
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          business_address?: string | null
          business_name?: string | null
          commission_rate?: number | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          insurance_verified?: boolean | null
          is_active?: boolean | null
          is_verified?: boolean | null
          license_verified?: boolean | null
          name?: string
          rating?: number | null
          supplier_type?: string
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      suspicious_activity_logs: {
        Row: {
          action_taken: string | null
          activity_type: string
          created_at: string
          details: Json
          flagged_at: string
          id: string
          ip_address: string | null
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          activity_type: string
          created_at?: string
          details?: Json
          flagged_at?: string
          id?: string
          ip_address?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          activity_type?: string
          created_at?: string
          details?: Json
          flagged_at?: string
          id?: string
          ip_address?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_history: {
        Row: {
          completed_at: string | null
          connection_id: string
          error_message: string | null
          id: string
          metadata: Json | null
          products_created: number | null
          products_fetched: number | null
          products_skipped: number | null
          products_updated: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          products_created?: number | null
          products_fetched?: number | null
          products_skipped?: number | null
          products_updated?: number | null
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          products_created?: number | null
          products_fetched?: number | null
          products_skipped?: number | null
          products_updated?: number | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_history_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_connections"
            referencedColumns: ["id"]
          },
        ]
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
      tiktok_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          tiktok_user_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          tiktok_user_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          tiktok_user_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transportation_vendors: {
        Row: {
          amenities: string[] | null
          average_response_time_minutes: number | null
          base_hourly_rate: number | null
          cancellation_policy: string | null
          commercial_license_expiry: string | null
          commercial_license_number: string | null
          created_at: string | null
          dot_number: string | null
          featured_badge: string | null
          fleet_size: number | null
          id: string
          insurance_expiry_date: string | null
          insurance_policy_number: string | null
          is_promoted_vendor: boolean | null
          languages_supported: string[] | null
          minimum_booking_hours: number | null
          on_time_percentage: number | null
          pricing_model: string | null
          promoted_until: string | null
          promotion_tier: string | null
          service_areas: string[] | null
          supplier_id: string
          total_bookings: number | null
          total_revenue: number | null
          updated_at: string | null
          vehicle_types: string[] | null
          years_in_business: number | null
        }
        Insert: {
          amenities?: string[] | null
          average_response_time_minutes?: number | null
          base_hourly_rate?: number | null
          cancellation_policy?: string | null
          commercial_license_expiry?: string | null
          commercial_license_number?: string | null
          created_at?: string | null
          dot_number?: string | null
          featured_badge?: string | null
          fleet_size?: number | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          is_promoted_vendor?: boolean | null
          languages_supported?: string[] | null
          minimum_booking_hours?: number | null
          on_time_percentage?: number | null
          pricing_model?: string | null
          promoted_until?: string | null
          promotion_tier?: string | null
          service_areas?: string[] | null
          supplier_id: string
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          vehicle_types?: string[] | null
          years_in_business?: number | null
        }
        Update: {
          amenities?: string[] | null
          average_response_time_minutes?: number | null
          base_hourly_rate?: number | null
          cancellation_policy?: string | null
          commercial_license_expiry?: string | null
          commercial_license_number?: string | null
          created_at?: string | null
          dot_number?: string | null
          featured_badge?: string | null
          fleet_size?: number | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          is_promoted_vendor?: boolean | null
          languages_supported?: string[] | null
          minimum_booking_hours?: number | null
          on_time_percentage?: number | null
          pricing_model?: string | null
          promoted_until?: string | null
          promotion_tier?: string | null
          service_areas?: string[] | null
          supplier_id?: string
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          vehicle_types?: string[] | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_vendors_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_agents: {
        Row: {
          acceptance_rate: number | null
          agency_name: string
          average_rating: number | null
          background_check_status: string | null
          bio: string | null
          business_address: string | null
          business_type: string
          cancelled_bookings: number | null
          completed_bookings: number | null
          completion_rate: number | null
          created_at: string | null
          current_booking_count: number | null
          destinations: string[] | null
          disputed_bookings: number | null
          email: string | null
          experience_years: number | null
          id: string
          identity_verified: boolean | null
          insurance_verified: boolean | null
          is_accepting_requests: boolean | null
          is_active: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          last_active_at: string | null
          max_budget: number | null
          max_concurrent_bookings: number | null
          min_budget: number | null
          onboarded_at: string | null
          phone: string | null
          primary_contact_name: string | null
          professional_license_verified: boolean | null
          profile_image_url: string | null
          rating: number | null
          regions: string[] | null
          response_time_avg_minutes: number | null
          review_count: number | null
          service_types: string[] | null
          specializations: string[] | null
          status: string | null
          stripe_connect_account_id: string | null
          stripe_onboarding_complete: boolean | null
          stripe_payouts_enabled: boolean | null
          suspended_at: string | null
          suspension_reason: string | null
          terms_accepted: boolean | null
          total_bookings: number | null
          total_revenue_cents: number | null
          total_reviews: number | null
          trust_score: number | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          agency_name: string
          average_rating?: number | null
          background_check_status?: string | null
          bio?: string | null
          business_address?: string | null
          business_type: string
          cancelled_bookings?: number | null
          completed_bookings?: number | null
          completion_rate?: number | null
          created_at?: string | null
          current_booking_count?: number | null
          destinations?: string[] | null
          disputed_bookings?: number | null
          email?: string | null
          experience_years?: number | null
          id?: string
          identity_verified?: boolean | null
          insurance_verified?: boolean | null
          is_accepting_requests?: boolean | null
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_active_at?: string | null
          max_budget?: number | null
          max_concurrent_bookings?: number | null
          min_budget?: number | null
          onboarded_at?: string | null
          phone?: string | null
          primary_contact_name?: string | null
          professional_license_verified?: boolean | null
          profile_image_url?: string | null
          rating?: number | null
          regions?: string[] | null
          response_time_avg_minutes?: number | null
          review_count?: number | null
          service_types?: string[] | null
          specializations?: string[] | null
          status?: string | null
          stripe_connect_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          suspended_at?: string | null
          suspension_reason?: string | null
          terms_accepted?: boolean | null
          total_bookings?: number | null
          total_revenue_cents?: number | null
          total_reviews?: number | null
          trust_score?: number | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          agency_name?: string
          average_rating?: number | null
          background_check_status?: string | null
          bio?: string | null
          business_address?: string | null
          business_type?: string
          cancelled_bookings?: number | null
          completed_bookings?: number | null
          completion_rate?: number | null
          created_at?: string | null
          current_booking_count?: number | null
          destinations?: string[] | null
          disputed_bookings?: number | null
          email?: string | null
          experience_years?: number | null
          id?: string
          identity_verified?: boolean | null
          insurance_verified?: boolean | null
          is_accepting_requests?: boolean | null
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_active_at?: string | null
          max_budget?: number | null
          max_concurrent_bookings?: number | null
          min_budget?: number | null
          onboarded_at?: string | null
          phone?: string | null
          primary_contact_name?: string | null
          professional_license_verified?: boolean | null
          profile_image_url?: string | null
          rating?: number | null
          regions?: string[] | null
          response_time_avg_minutes?: number | null
          review_count?: number | null
          service_types?: string[] | null
          specializations?: string[] | null
          status?: string | null
          stripe_connect_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          suspended_at?: string | null
          suspension_reason?: string | null
          terms_accepted?: boolean | null
          total_bookings?: number | null
          total_revenue_cents?: number | null
          total_reviews?: number | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
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
          city: string | null
          country: string | null
          created_at: string
          creator_id: string
          creator_story: string | null
          currency: string
          dates_info: Json | null
          description: string | null
          destination: string
          duration_days: number
          id: string
          images: string[] | null
          is_active: boolean | null
          location_details: Json | null
          package_summary: string | null
          price: number
          pricing_details: Json | null
          region: string | null
          title: string
          updated_at: string
          video_url: string | null
          whats_included: Json | null
        }
        Insert: {
          booking_cta?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          creator_id: string
          creator_story?: string | null
          currency?: string
          dates_info?: Json | null
          description?: string | null
          destination: string
          duration_days: number
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location_details?: Json | null
          package_summary?: string | null
          price: number
          pricing_details?: Json | null
          region?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          whats_included?: Json | null
        }
        Update: {
          booking_cta?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          creator_id?: string
          creator_story?: string | null
          currency?: string
          dates_info?: Json | null
          description?: string | null
          destination?: string
          duration_days?: number
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location_details?: Json | null
          package_summary?: string | null
          price?: number
          pricing_details?: Json | null
          region?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          whats_included?: Json | null
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
          music_album_art: string | null
          music_preview_url: string | null
          music_service: string | null
          music_track_artist: string | null
          music_track_id: string | null
          music_track_name: string | null
          music_volume: number | null
          native_video_volume: number | null
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
          music_album_art?: string | null
          music_preview_url?: string | null
          music_service?: string | null
          music_track_artist?: string | null
          music_track_id?: string | null
          music_track_name?: string | null
          music_volume?: number | null
          native_video_volume?: number | null
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
          music_album_art?: string | null
          music_preview_url?: string | null
          music_service?: string | null
          music_track_artist?: string | null
          music_track_id?: string | null
          music_track_name?: string | null
          music_volume?: number | null
          native_video_volume?: number | null
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
      trip_activities: {
        Row: {
          activity_order: number | null
          additional_fee: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_included: boolean | null
          name: string
          trip_id: string
        }
        Insert: {
          activity_order?: number | null
          additional_fee?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_included?: boolean | null
          name: string
          trip_id: string
        }
        Update: {
          activity_order?: number | null
          additional_fee?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_included?: boolean | null
          name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_activities_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_addons: {
        Row: {
          addon_type: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_optional: boolean | null
          max_quantity: number | null
          name: string
          price: number
          trip_id: string
        }
        Insert: {
          addon_type: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_optional?: boolean | null
          max_quantity?: number | null
          name: string
          price: number
          trip_id: string
        }
        Update: {
          addon_type?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_optional?: boolean | null
          max_quantity?: number | null
          name?: string
          price?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_addons_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_bookings: {
        Row: {
          created_at: string
          currency: string
          deposit_amount: number | null
          deposit_percentage: number | null
          id: string
          metadata: Json | null
          partner_id: string | null
          partner_payout: number
          partner_role: string
          payment_client_secret: string | null
          payment_url: string | null
          payout_paid_at: string | null
          platform_commission: number
          proposal_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          stripe_transfer_group: string | null
          total_price: number
          traveler_id: string
          trip_request_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          deposit_percentage?: number | null
          id?: string
          metadata?: Json | null
          partner_id?: string | null
          partner_payout?: number
          partner_role: string
          payment_client_secret?: string | null
          payment_url?: string | null
          payout_paid_at?: string | null
          platform_commission?: number
          proposal_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_transfer_group?: string | null
          total_price: number
          traveler_id: string
          trip_request_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          deposit_percentage?: number | null
          id?: string
          metadata?: Json | null
          partner_id?: string | null
          partner_payout?: number
          partner_role?: string
          payment_client_secret?: string | null
          payment_url?: string | null
          payout_paid_at?: string | null
          platform_commission?: number
          proposal_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_transfer_group?: string | null
          total_price?: number
          traveler_id?: string
          trip_request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_bookings_trip_request_id_fkey"
            columns: ["trip_request_id"]
            isOneToOne: false
            referencedRelation: "trip_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_contracts: {
        Row: {
          agent_id: string
          agent_signature: string | null
          agent_signed_at: string | null
          contract_sections: Json
          created_at: string
          creator_id: string | null
          creator_signature: string | null
          creator_signed_at: string | null
          field_values: Json
          id: string
          status: string
          traveler_id: string
          traveler_info: Json
          traveler_signature: string | null
          traveler_signed_at: string | null
          trip_id: string
          trip_info: Json
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_signature?: string | null
          agent_signed_at?: string | null
          contract_sections?: Json
          created_at?: string
          creator_id?: string | null
          creator_signature?: string | null
          creator_signed_at?: string | null
          field_values?: Json
          id?: string
          status?: string
          traveler_id: string
          traveler_info?: Json
          traveler_signature?: string | null
          traveler_signed_at?: string | null
          trip_id: string
          trip_info?: Json
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_signature?: string | null
          agent_signed_at?: string | null
          contract_sections?: Json
          created_at?: string
          creator_id?: string | null
          creator_signature?: string | null
          creator_signed_at?: string | null
          field_values?: Json
          id?: string
          status?: string
          traveler_id?: string
          traveler_info?: Json
          traveler_signature?: string | null
          traveler_signed_at?: string | null
          trip_id?: string
          trip_info?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_contracts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_contracts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_contracts_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_contracts_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_contracts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_files: {
        Row: {
          created_at: string
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          trip_request_id: string
          uploader_user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          trip_request_id: string
          uploader_user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          trip_request_id?: string
          uploader_user_id?: string
        }
        Relationships: []
      }
      trip_internal_notes: {
        Row: {
          author_user_id: string
          created_at: string
          id: string
          note: string
          trip_request_id: string
        }
        Insert: {
          author_user_id: string
          created_at?: string
          id?: string
          note: string
          trip_request_id: string
        }
        Update: {
          author_user_id?: string
          created_at?: string
          id?: string
          note?: string
          trip_request_id?: string
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
      trip_itinerary_days: {
        Row: {
          accommodation: string | null
          accommodation_type: string | null
          activities: Json | null
          created_at: string | null
          day_number: number
          description: string | null
          id: string
          is_featured_day: boolean | null
          meals_included: string[] | null
          overnight_location: string | null
          title: string
          trip_id: string
        }
        Insert: {
          accommodation?: string | null
          accommodation_type?: string | null
          activities?: Json | null
          created_at?: string | null
          day_number: number
          description?: string | null
          id?: string
          is_featured_day?: boolean | null
          meals_included?: string[] | null
          overnight_location?: string | null
          title: string
          trip_id: string
        }
        Update: {
          accommodation?: string | null
          accommodation_type?: string | null
          activities?: Json | null
          created_at?: string | null
          day_number?: number
          description?: string | null
          id?: string
          is_featured_day?: boolean | null
          meals_included?: string[] | null
          overnight_location?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_itinerary_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_matches: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          provider_type: string
          score: number
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          provider_type: string
          score?: number
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          provider_type?: string
          score?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_matches_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string
          id: string
          role: string | null
          status: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          status?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          status?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "group_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          message: string
          parent_message_id: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message: string
          parent_message_id?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message?: string
          parent_message_id?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "trip_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "group_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          trip_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          trip_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          trip_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_notifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "group_trips"
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
        Relationships: []
      }
      trip_proposals: {
        Row: {
          accepted_at: string | null
          agent_commission_pct: number | null
          agent_id: string | null
          cancellation_policy_id: string | null
          created_at: string | null
          creator_commission_pct: number | null
          creator_id: string | null
          currency: string | null
          custom_cancellation_terms: string | null
          declined_at: string | null
          deposit_due_days: number | null
          deposit_percentage: number | null
          end_date: string | null
          exclusions: string[] | null
          expires_at: string | null
          headline: string | null
          id: string
          inclusions: string[] | null
          is_collaborative: boolean | null
          itinerary_summary: string | null
          message: string
          nights: number | null
          payment_schedule: Json | null
          price_breakdown: Json | null
          price_currency: string | null
          price_from: number | null
          proposer_id: string
          proposer_role: string
          responded_at: string | null
          start_date: string | null
          status: string | null
          trip_request_id: string
          updated_at: string | null
          valid_until: string | null
          viewed_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          agent_commission_pct?: number | null
          agent_id?: string | null
          cancellation_policy_id?: string | null
          created_at?: string | null
          creator_commission_pct?: number | null
          creator_id?: string | null
          currency?: string | null
          custom_cancellation_terms?: string | null
          declined_at?: string | null
          deposit_due_days?: number | null
          deposit_percentage?: number | null
          end_date?: string | null
          exclusions?: string[] | null
          expires_at?: string | null
          headline?: string | null
          id?: string
          inclusions?: string[] | null
          is_collaborative?: boolean | null
          itinerary_summary?: string | null
          message: string
          nights?: number | null
          payment_schedule?: Json | null
          price_breakdown?: Json | null
          price_currency?: string | null
          price_from?: number | null
          proposer_id: string
          proposer_role: string
          responded_at?: string | null
          start_date?: string | null
          status?: string | null
          trip_request_id: string
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          agent_commission_pct?: number | null
          agent_id?: string | null
          cancellation_policy_id?: string | null
          created_at?: string | null
          creator_commission_pct?: number | null
          creator_id?: string | null
          currency?: string | null
          custom_cancellation_terms?: string | null
          declined_at?: string | null
          deposit_due_days?: number | null
          deposit_percentage?: number | null
          end_date?: string | null
          exclusions?: string[] | null
          expires_at?: string | null
          headline?: string | null
          id?: string
          inclusions?: string[] | null
          is_collaborative?: boolean | null
          itinerary_summary?: string | null
          message?: string
          nights?: number | null
          payment_schedule?: Json | null
          price_breakdown?: Json | null
          price_currency?: string | null
          price_from?: number | null
          proposer_id?: string
          proposer_role?: string
          responded_at?: string | null
          start_date?: string | null
          status?: string | null
          trip_request_id?: string
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_proposals_cancellation_policy_id_fkey"
            columns: ["cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_proposals_trip_request_id_fkey"
            columns: ["trip_request_id"]
            isOneToOne: false
            referencedRelation: "trip_requests"
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
        Relationships: []
      }
      trip_request_assignments: {
        Row: {
          assigned_by: string | null
          assignee_profile_id: string
          assignee_role: string
          created_at: string
          id: string
          trip_request_id: string
        }
        Insert: {
          assigned_by?: string | null
          assignee_profile_id: string
          assignee_role: string
          created_at?: string
          id?: string
          trip_request_id: string
        }
        Update: {
          assigned_by?: string | null
          assignee_profile_id?: string
          assignee_role?: string
          created_at?: string
          id?: string
          trip_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_request_assignments_assignee_profile_id_fkey"
            columns: ["assignee_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_request_assignments_assignee_profile_id_fkey"
            columns: ["assignee_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_request_matches: {
        Row: {
          candidate_profile_id: string
          created_at: string
          id: string
          match_score: number
          reasons: string | null
          role: string
          status: string
          trip_request_id: string
          updated_at: string
        }
        Insert: {
          candidate_profile_id: string
          created_at?: string
          id?: string
          match_score: number
          reasons?: string | null
          role: string
          status?: string
          trip_request_id: string
          updated_at?: string
        }
        Update: {
          candidate_profile_id?: string
          created_at?: string
          id?: string
          match_score?: number
          reasons?: string | null
          role?: string
          status?: string
          trip_request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_request_matches_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_request_matches_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_request_matches_trip_request_id_fkey"
            columns: ["trip_request_id"]
            isOneToOne: false
            referencedRelation: "trip_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_request_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean | null
          proposal_id: string | null
          sender_id: string
          trip_request_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          proposal_id?: string | null
          sender_id: string
          trip_request_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          proposal_id?: string | null
          sender_id?: string
          trip_request_id?: string
        }
        Relationships: []
      }
      trip_request_modifications: {
        Row: {
          created_at: string | null
          id: string
          modification_reason: string | null
          modified_by: string | null
          new_data: Json
          previous_data: Json
          trip_request_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          modification_reason?: string | null
          modified_by?: string | null
          new_data: Json
          previous_data: Json
          trip_request_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          modification_reason?: string | null
          modified_by?: string | null
          new_data?: Json
          previous_data?: Json
          trip_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_request_modifications_trip_request_id_fkey"
            columns: ["trip_request_id"]
            isOneToOne: false
            referencedRelation: "cocurated_trip_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_requests: {
        Row: {
          accessibility_needs: string[] | null
          accommodation_preferences: string[] | null
          accommodation_style: string | null
          booked_at: string | null
          budget_currency: string | null
          budget_level: string | null
          budget_max: number | null
          budget_min: number | null
          budget_per_person: boolean | null
          created_at: string | null
          date_flexibility_days: number | null
          departure_city: string | null
          description: string | null
          destination: string | null
          dietary_restrictions: string[] | null
          end_date: string | null
          flexibility: string | null
          flexible_dates: boolean | null
          id: string
          inspiration_links: string[] | null
          interests: string[] | null
          occasion: string | null
          pace: string | null
          preferred_agent_id: string | null
          preferred_creator_id: string | null
          selected_proposal_id: string | null
          source_brand_profile_id: string | null
          source_collection_id: string | null
          source_media: Json | null
          source_metadata: Json | null
          special_notes: string | null
          start_date: string | null
          status: string | null
          tiktok_link: string | null
          title: string | null
          travel_styles: string[] | null
          travelers_adults: number | null
          travelers_children: number | null
          travelers_infants: number | null
          trip_style: string[] | null
          updated_at: string | null
          user_id: string
          wants_role: string | null
        }
        Insert: {
          accessibility_needs?: string[] | null
          accommodation_preferences?: string[] | null
          accommodation_style?: string | null
          booked_at?: string | null
          budget_currency?: string | null
          budget_level?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_per_person?: boolean | null
          created_at?: string | null
          date_flexibility_days?: number | null
          departure_city?: string | null
          description?: string | null
          destination?: string | null
          dietary_restrictions?: string[] | null
          end_date?: string | null
          flexibility?: string | null
          flexible_dates?: boolean | null
          id?: string
          inspiration_links?: string[] | null
          interests?: string[] | null
          occasion?: string | null
          pace?: string | null
          preferred_agent_id?: string | null
          preferred_creator_id?: string | null
          selected_proposal_id?: string | null
          source_brand_profile_id?: string | null
          source_collection_id?: string | null
          source_media?: Json | null
          source_metadata?: Json | null
          special_notes?: string | null
          start_date?: string | null
          status?: string | null
          tiktok_link?: string | null
          title?: string | null
          travel_styles?: string[] | null
          travelers_adults?: number | null
          travelers_children?: number | null
          travelers_infants?: number | null
          trip_style?: string[] | null
          updated_at?: string | null
          user_id: string
          wants_role?: string | null
        }
        Update: {
          accessibility_needs?: string[] | null
          accommodation_preferences?: string[] | null
          accommodation_style?: string | null
          booked_at?: string | null
          budget_currency?: string | null
          budget_level?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_per_person?: boolean | null
          created_at?: string | null
          date_flexibility_days?: number | null
          departure_city?: string | null
          description?: string | null
          destination?: string | null
          dietary_restrictions?: string[] | null
          end_date?: string | null
          flexibility?: string | null
          flexible_dates?: boolean | null
          id?: string
          inspiration_links?: string[] | null
          interests?: string[] | null
          occasion?: string | null
          pace?: string | null
          preferred_agent_id?: string | null
          preferred_creator_id?: string | null
          selected_proposal_id?: string | null
          source_brand_profile_id?: string | null
          source_collection_id?: string | null
          source_media?: Json | null
          source_metadata?: Json | null
          special_notes?: string | null
          start_date?: string | null
          status?: string | null
          tiktok_link?: string | null
          title?: string | null
          travel_styles?: string[] | null
          travelers_adults?: number | null
          travelers_children?: number | null
          travelers_infants?: number | null
          trip_style?: string[] | null
          updated_at?: string | null
          user_id?: string
          wants_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_requests_source_brand_profile_id_fkey"
            columns: ["source_brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_requests_source_brand_profile_id_fkey"
            columns: ["source_brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles_discovery"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      trip_stories: {
        Row: {
          caption: string
          created_at: string
          hero_image_url: string | null
          hook: string | null
          id: string
          itinerary_lines: string[] | null
          journey_id: string | null
          platforms: string[] | null
          status: string | null
          tiktok_post_id: string | null
          tiktok_published_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption: string
          created_at?: string
          hero_image_url?: string | null
          hook?: string | null
          id?: string
          itinerary_lines?: string[] | null
          journey_id?: string | null
          platforms?: string[] | null
          status?: string | null
          tiktok_post_id?: string | null
          tiktok_published_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string
          created_at?: string
          hero_image_url?: string | null
          hook?: string | null
          id?: string
          itinerary_lines?: string[] | null
          journey_id?: string | null
          platforms?: string[] | null
          status?: string | null
          tiktok_post_id?: string | null
          tiktok_published_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_stories_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_suggestions: {
        Row: {
          created_at: string
          day_number: number | null
          description: string | null
          display_order: number | null
          id: string
          location: string | null
          price: number | null
          scheduled_date: string | null
          status: string | null
          suggested_by: string
          suggestion_data: Json | null
          suggestion_type: string
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          day_number?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          location?: string | null
          price?: number | null
          scheduled_date?: string | null
          status?: string | null
          suggested_by: string
          suggestion_data?: Json | null
          suggestion_type: string
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          day_number?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          location?: string | null
          price?: number | null
          scheduled_date?: string | null
          status?: string | null
          suggested_by?: string
          suggestion_data?: Json | null
          suggestion_type?: string
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_suggestions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "group_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_variants: {
        Row: {
          created_at: string
          generated_itinerary: Json
          id: string
          modifiers: Json
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_itinerary?: Json
          id?: string
          modifiers?: Json
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_itinerary?: Json
          id?: string
          modifiers?: Json
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_variants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
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
        Relationships: []
      }
      trip_votes: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          suggestion_id: string
          updated_at: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          suggestion_id: string
          updated_at?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          suggestion_id?: string
          updated_at?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "trip_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_wishlists: {
        Row: {
          created_at: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_wishlists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget_range: string | null
          created_at: string
          description: string | null
          destination: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string
          title: string | null
          traveler_id: string
          travelers_count: number | null
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          description?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          title?: string | null
          traveler_id: string
          travelers_count?: number | null
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          description?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          title?: string | null
          traveler_id?: string
          travelers_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      uber_ride_requests: {
        Row: {
          created_at: string | null
          currency: string | null
          dropoff_address: string | null
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_price: number | null
          fare_id: string | null
          id: string
          pickup_address: string | null
          pickup_latitude: number
          pickup_longitude: number
          product_id: string
          ride_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          dropoff_address?: string | null
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_price?: number | null
          fare_id?: string | null
          id?: string
          pickup_address?: string | null
          pickup_latitude: number
          pickup_longitude: number
          product_id: string
          ride_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          dropoff_address?: string | null
          dropoff_latitude?: number
          dropoff_longitude?: number
          estimated_price?: number | null
          fare_id?: string | null
          id?: string
          pickup_address?: string | null
          pickup_latitude?: number
          pickup_longitude?: number
          product_id?: string
          ride_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
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
          trip_id: string | null
          trip_title: string | null
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
          trip_id?: string | null
          trip_title?: string | null
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
          trip_id?: string | null
          trip_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_conversations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "packaged_trips"
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
          ip_address: string | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      user_ip_tracking: {
        Row: {
          action_count: number | null
          created_at: string
          first_seen: string
          id: string
          ip_address: string
          last_seen: string
          user_id: string
        }
        Insert: {
          action_count?: number | null
          created_at?: string
          first_seen?: string
          id?: string
          ip_address: string
          last_seen?: string
          user_id: string
        }
        Update: {
          action_count?: number | null
          created_at?: string
          first_seen?: string
          id?: string
          ip_address?: string
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          music_volume: number
          native_video_volume: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          music_volume?: number
          native_video_volume?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          music_volume?: number
          native_video_volume?: number
          updated_at?: string
          user_id?: string
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
        Relationships: []
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
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_travel_preferences: {
        Row: {
          accessibility_needs: string[] | null
          booking_preferences: Json | null
          budget_preference: string | null
          conversation_context: Json | null
          created_at: string
          dietary_restrictions: string[] | null
          id: string
          is_discoverable: boolean | null
          last_updated_at: string
          preferred_accommodation_types: string[] | null
          preferred_airlines: string[] | null
          preferred_destinations: string[] | null
          travel_companions: string | null
          travel_style: string[] | null
          trip_frequency: string | null
          user_id: string
        }
        Insert: {
          accessibility_needs?: string[] | null
          booking_preferences?: Json | null
          budget_preference?: string | null
          conversation_context?: Json | null
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          is_discoverable?: boolean | null
          last_updated_at?: string
          preferred_accommodation_types?: string[] | null
          preferred_airlines?: string[] | null
          preferred_destinations?: string[] | null
          travel_companions?: string | null
          travel_style?: string[] | null
          trip_frequency?: string | null
          user_id: string
        }
        Update: {
          accessibility_needs?: string[] | null
          booking_preferences?: Json | null
          budget_preference?: string | null
          conversation_context?: Json | null
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          is_discoverable?: boolean | null
          last_updated_at?: string
          preferred_accommodation_types?: string[] | null
          preferred_airlines?: string[] | null
          preferred_destinations?: string[] | null
          travel_companions?: string | null
          travel_style?: string[] | null
          trip_frequency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      username_history: {
        Row: {
          changed_at: string
          id: string
          new_username: string | null
          old_username: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_username?: string | null
          old_username?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_username?: string | null
          old_username?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_availability: {
        Row: {
          block_reason: string | null
          booking_id: string | null
          created_at: string | null
          driver_id: string | null
          end_datetime: string
          id: string
          is_blocked: boolean | null
          start_datetime: string
          updated_at: string | null
          vehicle_id: string | null
          vendor_id: string
        }
        Insert: {
          block_reason?: string | null
          booking_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_datetime: string
          id?: string
          is_blocked?: boolean | null
          start_datetime: string
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_id: string
        }
        Update: {
          block_reason?: string | null
          booking_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_datetime?: string
          id?: string
          is_blocked?: boolean | null
          start_datetime?: string
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_availability_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "vendor_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_availability_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vendor_fleet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_availability_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "transportation_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_document_uploads: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_drivers: {
        Row: {
          background_check_date: string | null
          background_check_status: string | null
          certifications: Json | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          languages: string[] | null
          license_expiry_date: string
          license_number: string
          name: string
          phone: string | null
          photo_url: string | null
          rating: number | null
          total_trips: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          background_check_date?: string | null
          background_check_status?: string | null
          certifications?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          license_expiry_date: string
          license_number: string
          name: string
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          total_trips?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          background_check_date?: string | null
          background_check_status?: string | null
          certifications?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          license_expiry_date?: string
          license_number?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          total_trips?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_drivers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "transportation_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_fleet: {
        Row: {
          amenities: string[] | null
          created_at: string | null
          daily_rate: number | null
          hourly_rate: number | null
          id: string
          insurance_expiry_date: string | null
          is_available: boolean | null
          last_maintenance_date: string | null
          license_plate: string
          luggage_capacity: number | null
          make: string
          model: string
          next_maintenance_date: string | null
          passenger_capacity: number
          registration_expiry_date: string | null
          updated_at: string | null
          vehicle_photos: Json | null
          vehicle_type: string
          vendor_id: string
          year: number
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string | null
          daily_rate?: number | null
          hourly_rate?: number | null
          id?: string
          insurance_expiry_date?: string | null
          is_available?: boolean | null
          last_maintenance_date?: string | null
          license_plate: string
          luggage_capacity?: number | null
          make: string
          model: string
          next_maintenance_date?: string | null
          passenger_capacity: number
          registration_expiry_date?: string | null
          updated_at?: string | null
          vehicle_photos?: Json | null
          vehicle_type: string
          vendor_id: string
          year: number
        }
        Update: {
          amenities?: string[] | null
          created_at?: string | null
          daily_rate?: number | null
          hourly_rate?: number | null
          id?: string
          insurance_expiry_date?: string | null
          is_available?: boolean | null
          last_maintenance_date?: string | null
          license_plate?: string
          luggage_capacity?: number | null
          make?: string
          model?: string
          next_maintenance_date?: string | null
          passenger_capacity?: number
          registration_expiry_date?: string | null
          updated_at?: string | null
          vehicle_photos?: Json | null
          vehicle_type?: string
          vendor_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_fleet_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "transportation_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_promotion_analytics: {
        Row: {
          ad_spend: number | null
          booking_inquiries: number | null
          clicks: number | null
          conversion_rate: number | null
          conversions: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          profile_views: number | null
          revenue_generated: number | null
          roi: number | null
          vendor_id: string
        }
        Insert: {
          ad_spend?: number | null
          booking_inquiries?: number | null
          clicks?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          profile_views?: number | null
          revenue_generated?: number | null
          roi?: number | null
          vendor_id: string
        }
        Update: {
          ad_spend?: number | null
          booking_inquiries?: number | null
          clicks?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          profile_views?: number | null
          revenue_generated?: number | null
          roi?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_promotion_analytics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "transportation_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_promotion_subscriptions: {
        Row: {
          auto_renew: boolean | null
          commission_rate: number
          created_at: string | null
          expires_at: string | null
          id: string
          monthly_price: number
          payment_method_id: string | null
          started_at: string
          status: string
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          commission_rate?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          monthly_price: number
          payment_method_id?: string | null
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          auto_renew?: boolean | null
          commission_rate?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          monthly_price?: number
          payment_method_id?: string | null
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_promotion_subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "transportation_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_promotional_media: {
        Row: {
          analytics: Json | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          file_url: string
          hashtags: string[] | null
          id: string
          is_cover: boolean | null
          media_type: string
          thumbnail_url: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          analytics?: Json | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_url: string
          hashtags?: string[] | null
          id?: string
          is_cover?: boolean | null
          media_type: string
          thumbnail_url?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          analytics?: Json | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_url?: string
          hashtags?: string[] | null
          id?: string
          is_cover?: boolean | null
          media_type?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_promotional_media_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "transportation_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_promotional_packages: {
        Row: {
          created_at: string | null
          current_bookings: number | null
          description: string | null
          discount_percentage: number | null
          exclusions: string[] | null
          id: string
          inclusions: string[] | null
          is_active: boolean | null
          max_bookings: number | null
          package_name: string
          package_photos: Json | null
          promotional_price: number
          regular_price: number
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          current_bookings?: number | null
          description?: string | null
          discount_percentage?: number | null
          exclusions?: string[] | null
          id?: string
          inclusions?: string[] | null
          is_active?: boolean | null
          max_bookings?: number | null
          package_name: string
          package_photos?: Json | null
          promotional_price: number
          regular_price: number
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          current_bookings?: number | null
          description?: string | null
          discount_percentage?: number | null
          exclusions?: string[] | null
          id?: string
          inclusions?: string[] | null
          is_active?: boolean | null
          max_bookings?: number | null
          package_name?: string
          package_photos?: Json | null
          promotional_price?: number
          regular_price?: number
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_promotional_packages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "transportation_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_promotions: {
        Row: {
          amount_spent: number | null
          bookings: number | null
          campaign_description: string | null
          campaign_name: string
          clicks: number | null
          created_at: string | null
          daily_budget: number | null
          discount_code: string | null
          discount_percentage: number | null
          end_date: string
          id: string
          impressions: number | null
          is_active: boolean | null
          payment_status: string | null
          promotion_type: string
          promotional_image_url: string | null
          special_offer_text: string | null
          start_date: string
          target_locations: string[] | null
          target_trip_types: string[] | null
          total_budget: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          amount_spent?: number | null
          bookings?: number | null
          campaign_description?: string | null
          campaign_name: string
          clicks?: number | null
          created_at?: string | null
          daily_budget?: number | null
          discount_code?: string | null
          discount_percentage?: number | null
          end_date: string
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          payment_status?: string | null
          promotion_type: string
          promotional_image_url?: string | null
          special_offer_text?: string | null
          start_date: string
          target_locations?: string[] | null
          target_trip_types?: string[] | null
          total_budget?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          amount_spent?: number | null
          bookings?: number | null
          campaign_description?: string | null
          campaign_name?: string
          clicks?: number | null
          created_at?: string | null
          daily_budget?: number | null
          discount_code?: string | null
          discount_percentage?: number | null
          end_date?: string
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          payment_status?: string | null
          promotion_type?: string
          promotional_image_url?: string | null
          special_offer_text?: string | null
          start_date?: string
          target_locations?: string[] | null
          target_trip_types?: string[] | null
          total_budget?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_promotions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "transportation_vendors"
            referencedColumns: ["id"]
          },
        ]
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
      view_dedup: {
        Row: {
          created_at: string
          day: string
          entity_id: string
          ip_hash: string
          kind: string
        }
        Insert: {
          created_at?: string
          day?: string
          entity_id: string
          ip_hash: string
          kind: string
        }
        Update: {
          created_at?: string
          day?: string
          entity_id?: string
          ip_hash?: string
          kind?: string
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
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
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
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_source: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string
          processing_duration_ms: number | null
          processing_status: string
          provider: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_source?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string
          processing_duration_ms?: number | null
          processing_status?: string
          provider?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_source?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
          processing_duration_ms?: number | null
          processing_status?: string
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      agent_leaderboard: {
        Row: {
          agency_name: string | null
          avatar_url: string | null
          average_rating: number | null
          completion_rate: number | null
          full_name: string | null
          id: string | null
          rating_rank: number | null
          revenue_rank: number | null
          review_count: number | null
          total_bookings: number | null
          total_revenue_cents: number | null
          user_id: string | null
        }
        Relationships: []
      }
      brand_profiles_discovery: {
        Row: {
          avatar_url: string | null
          bio: string | null
          brand_type: string | null
          categories: string[] | null
          cover_image_url: string | null
          created_at: string | null
          is_featured: boolean | null
          name: string | null
          profile_id: string | null
          regions: string[] | null
          status: string | null
          supplier_rating: number | null
          supplier_reviews: number | null
          supplier_type: string | null
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          brand_type?: string | null
          categories?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          is_featured?: boolean | null
          name?: string | null
          profile_id?: string | null
          regions?: string[] | null
          status?: string | null
          supplier_rating?: number | null
          supplier_reviews?: number | null
          supplier_type?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          brand_type?: string | null
          categories?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          is_featured?: boolean | null
          name?: string | null
          profile_id?: string | null
          regions?: string[] | null
          status?: string | null
          supplier_rating?: number | null
          supplier_reviews?: number | null
          supplier_type?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_analytics: {
        Row: {
          total_agents: number | null
          total_booking_value: number | null
          total_bookings: number | null
          total_creators: number | null
          total_proposals: number | null
          total_travelers: number | null
          total_trip_requests: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string | null
          is_verified: boolean | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          username?: string | null
        }
        Relationships: []
      }
      trip_bookings_ops_view: {
        Row: {
          created_at: string | null
          currency: string | null
          destination: string | null
          id: string | null
          metadata: Json | null
          partner_email: string | null
          partner_id: string | null
          partner_payout: number | null
          partner_role: string | null
          payment_client_secret: string | null
          payment_url: string | null
          platform_commission: number | null
          proposal_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          stripe_transfer_group: string | null
          total_price: number | null
          traveler_email: string | null
          traveler_id: string | null
          trip_request_id: string | null
          trip_title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_bookings_trip_request_id_fkey"
            columns: ["trip_request_id"]
            isOneToOne: false
            referencedRelation: "trip_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _email_fanout_post: { Args: { payload: Json }; Returns: undefined }
      accept_proposal_rpc: {
        Args: { proposal_id_input: string }
        Returns: Json
      }
      admin_update_trip_booking_status: {
        Args: { p_booking_id: string; p_new_status: string }
        Returns: undefined
      }
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
      calculate_commission_split:
        | {
            Args: {
              _agent_commission_pct: number
              _brand_commission_pct: number
              _creator_commission_pct: number
              _platform_commission_pct: number
              _total_price_cents: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_agent_percentage: number
              p_influencer_percentage: number
              p_platform_percentage: number
              p_retail_price: number
              p_wholesale_cost: number
            }
            Returns: Json
          }
        | {
            Args: {
              agent_pct?: number
              creator_pct?: number
              platform_pct?: number
              total_amount: number
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
      can_approve_agents: { Args: { p_user_id?: string }; Returns: boolean }
      can_approve_brands: { Args: { p_user_id?: string }; Returns: boolean }
      can_perform_engagement: {
        Args: {
          p_action_type: string
          p_ip_address?: string
          p_user_id: string
        }
        Returns: Json
      }
      check_creator_eligibility: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      cleanup_expired_itinerary_cache: { Args: never; Returns: undefined }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      convert_currency: {
        Args: { amount: number; from_curr: string; to_curr: string }
        Returns: number
      }
      create_bundle_purchase: {
        Args: {
          _amount_paid: number
          _bundle_id: string
          _buyer_id: string
          _commission_pct: number
          _creator_id: string
          _currency: string
          _guide_ids: string[]
          _partner_payout: number
          _platform_commission: number
          _stripe_payment_intent_id: string
          _trip_id: string
        }
        Returns: Record<string, unknown>
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      detect_bot_pattern: { Args: { p_user_id: string }; Returns: boolean }
      email_infra_cron_status: {
        Args: never
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
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
      expire_old_marketplace_jobs: { Args: never; Returns: undefined }
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
      generate_booking_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      get_agent_user_id: { Args: { _agent_id: string }; Returns: string }
      get_api_error_rate: {
        Args: { p_minutes_ago?: number; p_service_name: string }
        Returns: {
          error_count: number
          error_rate: number
          total_requests: number
        }[]
      }
      get_creator_tiktok_lab_metrics: {
        Args: { creator_id_input: string }
        Returns: Json
      }
      get_marketplace_signals: {
        Args: never
        Returns: {
          active_trips: number
          new_creators_count: number
          recently_booked_count: number
          total_saves_this_month: number
          trending_count: number
        }[]
      }
      get_total_users_count: { Args: never; Returns: number }
      get_user_active_alerts_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_ai_usage_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      get_user_tier_bonus: { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_lifetime_sales: {
        Args: { _delta?: number; _user_id: string }
        Returns: undefined
      }
      increment_product_view: {
        Args: { _product_id: string }
        Returns: undefined
      }
      increment_trip_view: { Args: { _trip_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_storyboard_collaborator: {
        Args: { storyboard_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_storyboard_owner: {
        Args: { storyboard_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_super_admin: { Args: { p_user_id?: string }; Returns: boolean }
      is_trip_member: {
        Args: { p_status?: string; p_trip_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_restricted: { Args: { target_user_id: string }; Returns: boolean }
      log_brand_engagement: {
        Args: {
          p_brand_profile_id: string
          p_context_id?: string
          p_context_type?: string
          p_event_type: Database["public"]["Enums"]["brand_engagement_type"]
          p_metadata?: Json
        }
        Returns: undefined
      }
      mark_conversation_messages_read: {
        Args: { p_conversation_id: string; p_user_type: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notify_admins_trip_pending_review: {
        Args: { _trip_id: string; _trip_title: string }
        Returns: undefined
      }
      notify_trip_members: {
        Args: {
          p_data?: Json
          p_exclude_user_id?: string
          p_message: string
          p_title: string
          p_trip_id: string
          p_type: string
        }
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
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_engagement_action: {
        Args: {
          p_action_type: string
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      refresh_creator_stats: { Args: { p_user_id: string }; Returns: undefined }
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_view_atomic: {
        Args: { _entity_id: string; _ip_hash: string; _kind: string }
        Returns: boolean
      }
      update_agent_performance_metrics: {
        Args: { target_agent_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "agent" | "brand"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
        | "refunded"
      brand_engagement_type:
        | "discovered"
        | "profile_view"
        | "moodboard_save"
        | "trip_inquiry"
      payment_status:
        | "pending"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
        | "partially_refunded"
      payout_status:
        | "not_eligible"
        | "pending"
        | "in_transit"
        | "paid"
        | "failed"
        | "reversed"
        | "released"
        | "on_hold"
      subscription_tier: "free" | "premium" | "enterprise"
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
      app_role: ["admin", "user", "agent", "brand"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
        "refunded",
      ],
      brand_engagement_type: [
        "discovered",
        "profile_view",
        "moodboard_save",
        "trip_inquiry",
      ],
      payment_status: [
        "pending",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      payout_status: [
        "not_eligible",
        "pending",
        "in_transit",
        "paid",
        "failed",
        "reversed",
        "released",
        "on_hold",
      ],
      subscription_tier: ["free", "premium", "enterprise"],
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
