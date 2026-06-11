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
      ai_program_states: {
        Row: {
          applied_corrections: import('./database.types').Json | null
          block_allow_techniques: boolean | null
          block_intensity_pct: number | null
          block_rep_max: number | null
          block_rep_min: number | null
          block_rir_max: number | null
          block_rir_min: number | null
          block_target_sets: number | null
          created_at: string | null
          current_block: string | null
          current_week: number | null
          detected_deficiencies: import('./database.types').Json | null
          id: string
          is_active: boolean | null
          last_analysis_week: number | null
          mesocycle_start_date: string | null
          rm_test_sessions_done: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_corrections?: import('./database.types').Json | null
          block_allow_techniques?: boolean | null
          block_intensity_pct?: number | null
          block_rep_max?: number | null
          block_rep_min?: number | null
          block_rir_max?: number | null
          block_rir_min?: number | null
          block_target_sets?: number | null
          created_at?: string | null
          current_block?: string | null
          current_week?: number | null
          detected_deficiencies?: import('./database.types').Json | null
          id?: string
          is_active?: boolean | null
          last_analysis_week?: number | null
          mesocycle_start_date?: string | null
          rm_test_sessions_done?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_corrections?: import('./database.types').Json | null
          block_allow_techniques?: boolean | null
          block_intensity_pct?: number | null
          block_rep_max?: number | null
          block_rep_min?: number | null
          block_rir_max?: number | null
          block_rir_min?: number | null
          block_target_sets?: number | null
          created_at?: string | null
          current_block?: string | null
          current_week?: number | null
          detected_deficiencies?: import('./database.types').Json | null
          id?: string
          is_active?: boolean | null
          last_analysis_week?: number | null
          mesocycle_start_date?: string | null
          rm_test_sessions_done?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_program_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          motor_action: string | null
          muscle_soreness: number | null
          session_id: string | null
          sleep_hours: number | null
          stress_level: number | null
          user_id: string
          volume_multiplier: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          motor_action?: string | null
          muscle_soreness?: number | null
          session_id?: string | null
          sleep_hours?: number | null
          stress_level?: number | null
          user_id: string
          volume_multiplier?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          motor_action?: string | null
          muscle_soreness?: number | null
          session_id?: string | null
          sleep_hours?: number | null
          stress_level?: number | null
          user_id?: string
          volume_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_muscles: {
        Row: {
          exercise_id: string | null
          id: string
          muscle_group_id: string | null
          role: string
        }
        Insert: {
          exercise_id?: string | null
          id?: string
          muscle_group_id?: string | null
          role: string
        }
        Update: {
          exercise_id?: string | null
          id?: string
          muscle_group_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_muscles_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_muscles_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          has_dropset: boolean | null
          has_rest_pause: boolean | null
          id: string
          is_compound: boolean | null
          name: string
          name_es: string | null
          slug: string
          sort_order: number | null
          technique_notes: string | null
        }
        Insert: {
          created_at?: string | null
          has_dropset?: boolean | null
          has_rest_pause?: boolean | null
          id?: string
          is_compound?: boolean | null
          name: string
          name_es?: string | null
          slug: string
          sort_order?: number | null
          technique_notes?: string | null
        }
        Update: {
          created_at?: string | null
          has_dropset?: boolean | null
          has_rest_pause?: boolean | null
          id?: string
          is_compound?: boolean | null
          name?: string
          name_es?: string | null
          slug?: string
          sort_order?: number | null
          technique_notes?: string | null
        }
        Relationships: []
      }
      muscle_groups: {
        Row: {
          body_region: string
          created_at: string | null
          id: string
          name: string
          name_es: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          body_region: string
          created_at?: string | null
          id?: string
          name: string
          name_es: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          body_region?: string
          created_at?: string | null
          id?: string
          name?: string
          name_es?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          created_at: string | null
          exercise_id: string
          id: string
          record_type: string
          set_id: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          achieved_at?: string
          created_at?: string | null
          exercise_id: string
          id?: string
          record_type: string
          set_id?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          achieved_at?: string
          created_at?: string | null
          exercise_id?: string
          id?: string
          record_type?: string
          set_id?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_rms: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          notes: string | null
          rm_kg: number
          tested_at: string | null
          tested_reps: number | null
          tested_weight: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          rm_kg: number
          tested_at?: string | null
          tested_reps?: number | null
          tested_weight?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          rm_kg?: number
          tested_at?: string | null
          tested_reps?: number | null
          tested_weight?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_rms_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_rms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          body_type: string | null
          created_at: string | null
          full_name: string | null
          goal: string | null
          height_cm: number | null
          id: string
          updated_at: string | null
          username: string
          weight_kg: number | null
        }
        Insert: {
          body_type?: string | null
          created_at?: string | null
          full_name?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          updated_at?: string | null
          username: string
          weight_kg?: number | null
        }
        Update: {
          body_type?: string | null
          created_at?: string | null
          full_name?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          updated_at?: string | null
          username?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          id: string
          intensity_pct: number | null
          notes: string | null
          routine_id: string | null
          set_type: string | null
          sort_order: number
          target_reps: string | null
          target_rir: number | null
          target_sets: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          intensity_pct?: number | null
          notes?: string | null
          routine_id?: string | null
          set_type?: string | null
          sort_order: number
          target_reps?: string | null
          target_rir?: number | null
          target_sets?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          intensity_pct?: number | null
          notes?: string | null
          routine_id?: string | null
          set_type?: string | null
          sort_order?: number
          target_reps?: string | null
          target_rir?: number | null
          target_sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          block_number: number | null
          completed: boolean | null
          created_at: string | null
          date: string
          duration_s: number | null
          id: string
          name: string | null
          notes: string | null
          routine_id: string | null
          user_id: string | null
          week_number: number | null
        }
        Insert: {
          block_number?: number | null
          completed?: boolean | null
          created_at?: string | null
          date?: string
          duration_s?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          routine_id?: string | null
          user_id?: string | null
          week_number?: number | null
        }
        Update: {
          block_number?: number | null
          completed?: boolean | null
          created_at?: string | null
          date?: string
          duration_s?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          routine_id?: string | null
          user_id?: string | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          completed: boolean | null
          created_at: string | null
          drop_reps: number | null
          drop_weight: number | null
          exercise_id: string
          id: string
          is_pr: boolean | null
          reps: number | null
          rest_pause_reps: number | null
          rir_perceived: number | null
          session_id: string | null
          set_number: number
          set_type: string
          technique: string | null
          weight: number | null
          weight_unit: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          drop_reps?: number | null
          drop_weight?: number | null
          exercise_id: string
          id?: string
          is_pr?: boolean | null
          reps?: number | null
          rest_pause_reps?: number | null
          rir_perceived?: number | null
          session_id?: string | null
          set_number: number
          set_type: string
          technique?: string | null
          weight?: number | null
          weight_unit?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          drop_reps?: number | null
          drop_weight?: number | null
          exercise_id?: string
          id?: string
          is_pr?: boolean | null
          reps?: number | null
          rest_pause_reps?: number | null
          rir_perceived?: number | null
          session_id?: string | null
          set_number?: number
          set_type?: string
          technique?: string | null
          weight?: number | null
          weight_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_state: {
        Row: {
          created_at: string | null
          current_block: number
          current_week: number
          id: string
          is_active: boolean | null
          program_start: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_block?: number
          current_week?: number
          id?: string
          is_active?: boolean | null
          program_start?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_block?: number
          current_week?: number
          id?: string
          is_active?: boolean | null
          program_start?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_program_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_session_feedback: {
        Row: {
          cardio_completed: boolean | null
          cardio_duration_min: number | null
          cardio_incline_pct: number | null
          cardio_speed_kmh: number | null
          created_at: string | null
          excessive_fatigue_flag: boolean | null
          id: string
          notes: string | null
          perceived_difficulty: string | null
          perceived_progress: string | null
          rpe_global: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          cardio_completed?: boolean | null
          cardio_duration_min?: number | null
          cardio_incline_pct?: number | null
          cardio_speed_kmh?: number | null
          created_at?: string | null
          excessive_fatigue_flag?: boolean | null
          id?: string
          notes?: string | null
          perceived_difficulty?: string | null
          perceived_progress?: string | null
          rpe_global?: number | null
          session_id: string
          user_id: string
        }
        Update: {
          cardio_completed?: boolean | null
          cardio_duration_min?: number | null
          cardio_incline_pct?: number | null
          cardio_speed_kmh?: number | null
          created_at?: string | null
          excessive_fatigue_flag?: boolean | null
          id?: string
          notes?: string | null
          perceived_difficulty?: string | null
          perceived_progress?: string | null
          rpe_global?: number | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_session_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_session_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_metrics: {
        Row: {
          avg_sleep_hours: number | null
          body_fat_pct: number | null
          created_at: string | null
          daily_protein_g: number | null
          diet_status: string | null
          experience_years: number | null
          goals: import('./database.types').Json | null
          height_cm: number | null
          hydration_liters: number | null
          id: string
          priority_muscles: string[] | null
          somatotype: string | null
          supplementation: import('./database.types').Json | null
          user_id: string
          weak_muscles: string[] | null
          weight_kg: number | null
          weight_unit: string | null
        }
        Insert: {
          avg_sleep_hours?: number | null
          body_fat_pct?: number | null
          created_at?: string | null
          daily_protein_g?: number | null
          diet_status?: string | null
          experience_years?: number | null
          goals?: import('./database.types').Json | null
          height_cm?: number | null
          hydration_liters?: number | null
          id?: string
          priority_muscles?: string[] | null
          somatotype?: string | null
          supplementation?: import('./database.types').Json | null
          user_id: string
          weak_muscles?: string[] | null
          weight_kg?: number | null
          weight_unit?: string | null
        }
        Update: {
          avg_sleep_hours?: number | null
          body_fat_pct?: number | null
          created_at?: string | null
          daily_protein_g?: number | null
          diet_status?: string | null
          experience_years?: number | null
          goals?: import('./database.types').Json | null
          height_cm?: number | null
          hydration_liters?: number | null
          id?: string
          priority_muscles?: string[] | null
          somatotype?: string | null
          supplementation?: import('./database.types').Json | null
          user_id?: string
          weak_muscles?: string[] | null
          weight_kg?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
