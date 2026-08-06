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
      attendance: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          id: string
          user_id: string
          work_date: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          user_id: string
          work_date?: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string
          company_name: string
          helpline: string
          id: string
          phone: string
          support_email: string
          updated_at: string
          website: string
        }
        Insert: {
          address?: string
          company_name?: string
          helpline?: string
          id?: string
          phone?: string
          support_email?: string
          updated_at?: string
          website?: string
        }
        Update: {
          address?: string
          company_name?: string
          helpline?: string
          id?: string
          phone?: string
          support_email?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          created_at: string
          id: string
          proficiency: number
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency?: number
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proficiency?: number
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          department: string
          designation: string
          email: string
          full_name: string
          id: string
          phone: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          department?: string
          designation?: string
          email?: string
          full_name?: string
          id: string
          phone?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          department?: string
          designation?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          link_url: string | null
          mime_type: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          link_url?: string | null
          mime_type?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          link_url?: string | null
          mime_type?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_feedback: {
        Row: {
          admin_id: string
          comment: string
          created_at: string
          id: string
          rating: number | null
          task_id: string
        }
        Insert: {
          admin_id: string
          comment: string
          created_at?: string
          id?: string
          rating?: number | null
          task_id: string
        }
        Update: {
          admin_id?: string
          comment?: string
          created_at?: string
          id?: string
          rating?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_feedback_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          created_at: string
          id: string
          message: string
          task_id: string
          update_type: Database["public"]["Enums"]["update_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          task_id: string
          update_type?: Database["public"]["Enums"]["update_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          task_id?: string
          update_type?: Database["public"]["Enums"]["update_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          description: string
          due_date: string
          id: string
          overdue_notified: boolean
          priority: Database["public"]["Enums"]["task_priority"]
          reminder_24h_sent: boolean
          status: Database["public"]["Enums"]["task_status"]
          submitted_at: string | null
          target_role: Database["public"]["Enums"]["app_role"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          description?: string
          due_date: string
          id?: string
          overdue_notified?: boolean
          priority?: Database["public"]["Enums"]["task_priority"]
          reminder_24h_sent?: boolean
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          target_role: Database["public"]["Enums"]["app_role"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          overdue_notified?: boolean
          priority?: Database["public"]["Enums"]["task_priority"]
          reminder_24h_sent?: boolean
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          target_role?: Database["public"]["Enums"]["app_role"]
          title?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee" | "staff"
      attachment_kind: "file" | "link"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "pending"
        | "in_progress"
        | "submitted"
        | "completed"
        | "late"
      update_type: "progress" | "request"
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
      app_role: ["admin", "employee", "staff"],
      attachment_kind: ["file", "link"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "submitted", "completed", "late"],
      update_type: ["progress", "request"],
    },
  },
} as const
