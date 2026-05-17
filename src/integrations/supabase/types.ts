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
      cleaning_uploads: {
        Row: {
          area_id: string
          file_type: Database["public"]["Enums"]["upload_file_type"] | null
          file_url: string | null
          id: string
          notes: string | null
          property_id: string
          service_date: string
          status: Database["public"]["Enums"]["upload_status"]
          supervisor_id: string | null
          uploaded_at: string
        }
        Insert: {
          area_id: string
          file_type?: Database["public"]["Enums"]["upload_file_type"] | null
          file_url?: string | null
          id?: string
          notes?: string | null
          property_id: string
          service_date: string
          status?: Database["public"]["Enums"]["upload_status"]
          supervisor_id?: string | null
          uploaded_at?: string
        }
        Update: {
          area_id?: string
          file_type?: Database["public"]["Enums"]["upload_file_type"] | null
          file_url?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          service_date?: string
          status?: Database["public"]["Enums"]["upload_status"]
          supervisor_id?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_uploads_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "property_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_uploads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_reads: {
        Row: {
          id: string
          issue_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          issue_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          issue_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          area_id: string | null
          client_user_id: string | null
          created_at: string
          id: string
          initial_comment: string | null
          property_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          upload_id: string | null
        }
        Insert: {
          area_id?: string | null
          client_user_id?: string | null
          created_at?: string
          id?: string
          initial_comment?: string | null
          property_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          upload_id?: string | null
        }
        Update: {
          area_id?: string | null
          client_user_id?: string | null
          created_at?: string
          id?: string
          initial_comment?: string | null
          property_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "property_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "cleaning_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          body: string
          created_at: string
          id: string
          issue_id: string
          sender_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          body: string
          created_at?: string
          id?: string
          issue_id: string
          sender_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          body?: string
          created_at?: string
          id?: string
          issue_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          organization_name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          organization_name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_name?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          active: boolean
          address: string | null
          client_organization: string | null
          created_at: string
          daily_report_time: string
          daily_report_timezone: string
          id: string
          instant_client_release: boolean
          name: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          client_organization?: string | null
          created_at?: string
          daily_report_time?: string
          daily_report_timezone?: string
          id?: string
          instant_client_release?: boolean
          name: string
        }
        Update: {
          active?: boolean
          address?: string | null
          client_organization?: string | null
          created_at?: string
          daily_report_time?: string
          daily_report_timezone?: string
          id?: string
          instant_client_release?: boolean
          name?: string
        }
        Relationships: []
      }
      property_areas: {
        Row: {
          active: boolean
          area_name: string
          created_at: string
          display_order: number
          id: string
          property_id: string
          required_upload: boolean
        }
        Insert: {
          active?: boolean
          area_name: string
          created_at?: string
          display_order?: number
          id?: string
          property_id: string
          required_upload?: boolean
        }
        Update: {
          active?: boolean
          area_name?: string
          created_at?: string
          display_order?: number
          id?: string
          property_id?: string
          required_upload?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "property_areas_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_assignments: {
        Row: {
          created_at: string
          id: string
          property_id: string
          role_on_property: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          role_on_property: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          role_on_property?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_can_see_property: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_to_property: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "client"
      issue_status: "open" | "in_progress" | "resolved"
      upload_file_type: "image" | "video"
      upload_status: "uploaded" | "missing" | "reviewed"
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
      app_role: ["admin", "supervisor", "client"],
      issue_status: ["open", "in_progress", "resolved"],
      upload_file_type: ["image", "video"],
      upload_status: ["uploaded", "missing", "reviewed"],
    },
  },
} as const
