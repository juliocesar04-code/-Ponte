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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_metrics: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id: string
          measured_at: string
          user_id?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          carbs_g: number | null
          fat_g: number | null
          id: string
          kcal: number
          logged_at: string
          name: string
          protein_g: number | null
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          fat_g?: number | null
          id: string
          kcal: number
          logged_at: string
          name: string
          protein_g?: number | null
          user_id?: string
        }
        Update: {
          carbs_g?: number | null
          fat_g?: number | null
          id?: string
          kcal?: number
          logged_at?: string
          name?: string
          protein_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      hydration_entries: {
        Row: {
          amount_ml: number
          drink_type: string | null
          id: string
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          drink_type?: string | null
          id: string
          logged_at: string
          user_id?: string
        }
        Update: {
          amount_ml?: number
          drink_type?: string | null
          id?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      links: {
        Row: {
          ativo: boolean
          cor: string
          criado_em: string
          descricao: string
          id: string
          imagem: string
          posicao: number
          titulo: string
          url: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          criado_em?: string
          descricao?: string
          id?: string
          imagem?: string
          posicao?: number
          titulo: string
          url: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          criado_em?: string
          descricao?: string
          id?: string
          imagem?: string
          posicao?: number
          titulo?: string
          url?: string
        }
        Relationships: []
      }
      perfil: {
        Row: {
          arroba: string
          atualizado_em: string
          bio: string
          chamada: string
          foto: string
          foto_alt: string
          id: number
          instagram: string
          nome: string
          nome_destaque: string
          rodape: string
          temas: string
        }
        Insert: {
          arroba?: string
          atualizado_em?: string
          bio?: string
          chamada?: string
          foto?: string
          foto_alt?: string
          id?: number
          instagram?: string
          nome?: string
          nome_destaque?: string
          rodape?: string
          temas?: string
        }
        Update: {
          arroba?: string
          atualizado_em?: string
          bio?: string
          chamada?: string
          foto?: string
          foto_alt?: string
          id?: number
          instagram?: string
          nome?: string
          nome_destaque?: string
          rodape?: string
          temas?: string
        }
        Relationships: []
      }
      ponte_journey_steps: {
        Row: {
          created_at: string
          detail: string
          id: string
          journey_id: string
          position: number
          service_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          detail: string
          id: string
          journey_id: string
          position: number
          service_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          journey_id?: string
          position?: number
          service_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ponte_journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ponte_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponte_journey_steps_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ponte_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ponte_journeys: {
        Row: {
          accent: string
          active: boolean
          created_at: string
          description: string
          eyebrow: string
          id: string
          priority: number
          title: string
          updated_at: string
        }
        Insert: {
          accent: string
          active?: boolean
          created_at?: string
          description: string
          eyebrow: string
          id: string
          priority?: number
          title: string
          updated_at?: string
        }
        Update: {
          accent?: string
          active?: boolean
          created_at?: string
          description?: string
          eyebrow?: string
          id?: string
          priority?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ponte_progress: {
        Row: {
          completed: boolean
          journey_id: string
          step_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          journey_id: string
          step_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          journey_id?: string
          step_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ponte_progress_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ponte_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponte_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "ponte_journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      ponte_saved_services: {
        Row: {
          created_at: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ponte_saved_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ponte_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ponte_service_coverage: {
        Row: {
          created_at: string
          id: number
          municipality_code: string | null
          municipality_name: string | null
          note: string | null
          service_id: string
          state_code: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          municipality_code?: string | null
          municipality_name?: string | null
          note?: string | null
          service_id: string
          state_code?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          municipality_code?: string | null
          municipality_name?: string | null
          note?: string | null
          service_id?: string
          state_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ponte_service_coverage_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ponte_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ponte_services: {
        Row: {
          active: boolean
          agency: string
          category: string
          channel: string
          created_at: string
          documents: string[]
          id: string
          keywords: string[]
          official_label: string
          official_url: string
          preparation: string[]
          scope: string
          source_checked_at: string | null
          source_http_status: number | null
          source_status: string
          summary: string
          title: string
          updated_at: string
          updated_label: string
          why: string
        }
        Insert: {
          active?: boolean
          agency: string
          category: string
          channel: string
          created_at?: string
          documents?: string[]
          id: string
          keywords?: string[]
          official_label: string
          official_url: string
          preparation?: string[]
          scope?: string
          source_checked_at?: string | null
          source_http_status?: number | null
          source_status?: string
          summary: string
          title: string
          updated_at?: string
          updated_label?: string
          why: string
        }
        Update: {
          active?: boolean
          agency?: string
          category?: string
          channel?: string
          created_at?: string
          documents?: string[]
          id?: string
          keywords?: string[]
          official_label?: string
          official_url?: string
          preparation?: string[]
          scope?: string
          source_checked_at?: string | null
          source_http_status?: number | null
          source_status?: string
          summary?: string
          title?: string
          updated_at?: string
          updated_label?: string
          why?: string
        }
        Relationships: []
      }
      ponte_source_checks: {
        Row: {
          checked_at: string
          error_message: string | null
          http_status: number | null
          id: number
          service_id: string
          status: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: never
          service_id: string
          status: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: never
          service_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ponte_source_checks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ponte_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ponte_user_preferences: {
        Row: {
          municipality_code: string | null
          municipality_name: string | null
          state_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          municipality_code?: string | null
          municipality_name?: string | null
          state_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          municipality_code?: string | null
          municipality_name?: string | null
          state_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          display_name: string | null
          experience_level: string | null
          goal: string | null
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          experience_level?: string | null
          goal?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          display_name?: string | null
          experience_level?: string | null
          goal?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_sets: {
        Row: {
          done: boolean
          exercise_name: string
          id: string
          position: number
          reps: number
          session_id: string
          set_index: number
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          done?: boolean
          exercise_name: string
          id: string
          position: number
          reps: number
          session_id: string
          set_index: number
          user_id?: string
          weight_kg?: number | null
        }
        Update: {
          done?: boolean
          exercise_name?: string
          id?: string
          position?: number
          reps?: number
          session_id?: string
          set_index?: number
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      step_entries: {
        Row: {
          id: string
          logged_at: string
          steps: number
          user_id: string
        }
        Insert: {
          id: string
          logged_at: string
          steps: number
          user_id?: string
        }
        Update: {
          id?: string
          logged_at?: string
          steps?: number
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          reps: number
          sets: number
          user_id: string
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          position?: number
          reps?: number
          sets?: number
          user_id?: string
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          reps?: number
          sets?: number
          user_id?: string
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
          workout_id: string
          workout_name: string
        }
        Insert: {
          ended_at?: string | null
          id: string
          started_at: string
          user_id?: string
          workout_id: string
          workout_name: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
          workout_id?: string
          workout_name?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          id: string
          name: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          note?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      e_a_dona: { Args: never; Returns: boolean }
      ponte_search_services: {
        Args: {
          filter_municipality?: string
          filter_state?: string
          result_limit?: number
          search_query?: string
        }
        Returns: {
          agency: string
          category: string
          channel: string
          documents: string[]
          id: string
          keywords: string[]
          official_label: string
          official_url: string
          preparation: string[]
          scope: string
          score: number
          source_checked_at: string
          source_status: string
          summary: string
          title: string
          updated_label: string
          why: string
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
