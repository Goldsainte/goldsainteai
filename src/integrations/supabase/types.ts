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
      agent_bids: {
        Row: {
          agent_id: string
          created_at: string
          currency: string
          estimated_completion_days: number | null
          id: string
          job_id: string
          proposal_details: string
          proposed_price: number
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          currency?: string
          estimated_completion_days?: number | null
          id?: string
          job_id: string
          proposal_details: string
          proposed_price: number
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          currency?: string
          estimated_completion_days?: number | null
          id?: string
          job_id?: string
          proposal_details?: string
          proposed_price?: number
          status?: string
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
      bookings: {
        Row: {
          booking_data: Json
          booking_reference: string | null
          booking_type: string
          created_at: string
          currency: string
          guest_id: string | null
          id: string
          status: string
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_data: Json
          booking_reference?: string | null
          booking_type: string
          created_at?: string
          currency?: string
          guest_id?: string | null
          id?: string
          status?: string
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_data?: Json
          booking_reference?: string | null
          booking_type?: string
          created_at?: string
          currency?: string
          guest_id?: string | null
          id?: string
          status?: string
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
      marketplace_jobs: {
        Row: {
          assigned_agent_id: string | null
          booking_type: string
          budget_max: number | null
          budget_min: number | null
          created_at: string
          currency: string
          description: string
          destination: string | null
          expires_at: string
          id: string
          number_of_travelers: number | null
          requirements: Json
          status: string
          title: string
          travel_dates: Json | null
          updated_at: string
          user_id: string
          winning_bid_id: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          booking_type: string
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          currency?: string
          description: string
          destination?: string | null
          expires_at?: string
          id?: string
          number_of_travelers?: number | null
          requirements: Json
          status?: string
          title: string
          travel_dates?: Json | null
          updated_at?: string
          user_id: string
          winning_bid_id?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          booking_type?: string
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          currency?: string
          description?: string
          destination?: string | null
          expires_at?: string
          id?: string
          number_of_travelers?: number | null
          requirements?: Json
          status?: string
          title?: string
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
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          payment_method: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          id: string
          phone: string | null
          preferences: Json | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          id: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          username?: string | null
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
      travel_agents: {
        Row: {
          agency_name: string
          bio: string | null
          commission_rate: number | null
          created_at: string
          experience_years: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          license_number: string | null
          profile_image_url: string | null
          rating: number | null
          specializations: string[] | null
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_name: string
          bio?: string | null
          commission_rate?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          profile_image_url?: string | null
          rating?: number | null
          specializations?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_name?: string
          bio?: string | null
          commission_rate?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          profile_image_url?: string | null
          rating?: number | null
          specializations?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_booking_preferences: {
        Row: {
          accessibility_needs: string[] | null
          auto_booking_enabled: boolean | null
          created_at: string
          dietary_restrictions: string[] | null
          id: string
          max_price_per_night: number | null
          meal_preference: string | null
          notification_preferences: Json | null
          preferred_airlines: string[] | null
          preferred_amenities: string[] | null
          preferred_hotel_rating: number | null
          seat_preference: string | null
          special_requests: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility_needs?: string[] | null
          auto_booking_enabled?: boolean | null
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          max_price_per_night?: number | null
          meal_preference?: string | null
          notification_preferences?: Json | null
          preferred_airlines?: string[] | null
          preferred_amenities?: string[] | null
          preferred_hotel_rating?: number | null
          seat_preference?: string | null
          special_requests?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility_needs?: string[] | null
          auto_booking_enabled?: boolean | null
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          max_price_per_night?: number | null
          meal_preference?: string | null
          notification_preferences?: Json | null
          preferred_airlines?: string[] | null
          preferred_amenities?: string[] | null
          preferred_hotel_rating?: number | null
          seat_preference?: string | null
          special_requests?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
