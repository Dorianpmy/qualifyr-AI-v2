export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email_normalized: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["organization_role"]
          status: Database["public"]["Enums"]["organization_invitation_status"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email_normalized: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          revoked_at?: string | null
          role: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["organization_invitation_status"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email_normalized?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["organization_invitation_status"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          removed_at: string | null
          role: Database["public"]["Enums"]["organization_role"]
          status: Database["public"]["Enums"]["organization_membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          removed_at?: string | null
          role?: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["organization_membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          removed_at?: string | null
          role?: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["organization_membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          business_category: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          creation_request_id: string | null
          currency: string | null
          id: string
          locale: string | null
          name: string
          onboarding_completed_at: string | null
          primary_language: string | null
          slug: string
          team_size_range: string | null
          timezone: string | null
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          business_category?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          creation_request_id?: string | null
          currency?: string | null
          id?: string
          locale?: string | null
          name: string
          onboarding_completed_at?: string | null
          primary_language?: string | null
          slug: string
          team_size_range?: string | null
          timezone?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          business_category?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          creation_request_id?: string | null
          currency?: string | null
          id?: string
          locale?: string | null
          name?: string
          onboarding_completed_at?: string | null
          primary_language?: string | null
          slug?: string
          team_size_range?: string | null
          timezone?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string
          currency: string | null
          first_name: string | null
          last_name: string | null
          locale: string
          primary_language: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          first_name?: string | null
          last_name?: string | null
          locale?: string
          primary_language?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          first_name?: string | null
          last_name?: string | null
          locale?: string
          primary_language?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_request_events: {
        Row: {
          actor_user_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["service_request_event_type"]
          id: string
          metadata: Json
          organization_id: string
          service_request_id: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["service_request_event_type"]
          id?: string
          metadata?: Json
          organization_id: string
          service_request_id: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["service_request_event_type"]
          id?: string
          metadata?: Json
          organization_id?: string
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_events_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address_line_1: string | null
          archived_at: string | null
          assigned_user_id: string | null
          city: string
          closed_at: string | null
          country_code: string
          created_at: string
          created_by: string
          creation_request_id: string
          id: string
          lock_version: number
          organization_id: string
          original_request: string
          postal_code: string
          preferred_contact_channel: Database["public"]["Enums"]["preferred_contact_channel"]
          reference_code: string
          requester_email: string | null
          requester_first_name: string | null
          requester_last_name: string | null
          requester_locale: string | null
          requester_phone: string | null
          service_label: string
          source: Database["public"]["Enums"]["service_request_source"]
          status: Database["public"]["Enums"]["service_request_status"]
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          address_line_1?: string | null
          archived_at?: string | null
          assigned_user_id?: string | null
          city: string
          closed_at?: string | null
          country_code: string
          created_at?: string
          created_by: string
          creation_request_id: string
          id?: string
          lock_version?: number
          organization_id: string
          original_request: string
          postal_code: string
          preferred_contact_channel?: Database["public"]["Enums"]["preferred_contact_channel"]
          reference_code: string
          requester_email?: string | null
          requester_first_name?: string | null
          requester_last_name?: string | null
          requester_locale?: string | null
          requester_phone?: string | null
          service_label: string
          source?: Database["public"]["Enums"]["service_request_source"]
          status?: Database["public"]["Enums"]["service_request_status"]
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          address_line_1?: string | null
          archived_at?: string | null
          assigned_user_id?: string | null
          city?: string
          closed_at?: string | null
          country_code?: string
          created_at?: string
          created_by?: string
          creation_request_id?: string
          id?: string
          lock_version?: number
          organization_id?: string
          original_request?: string
          postal_code?: string
          preferred_contact_channel?: Database["public"]["Enums"]["preferred_contact_channel"]
          reference_code?: string
          requester_email?: string | null
          requester_first_name?: string | null
          requester_last_name?: string | null
          requester_locale?: string | null
          requester_phone?: string | null
          service_label?: string
          source?: Database["public"]["Enums"]["service_request_source"]
          status?: Database["public"]["Enums"]["service_request_status"]
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invitation: {
        Args: { raw_token: string }
        Returns: {
          organization_id: string
          organization_slug: string
        }[]
      }
      assign_service_request: {
        Args: {
          expected_version: number
          requested_assignee: string
          target_organization_id: string
          target_reference: string
        }
        Returns: number
      }
      create_organization_invitation: {
        Args: {
          invitation_expires_at: string
          invited_email: string
          invited_role: Database["public"]["Enums"]["organization_role"]
          target_organization_id: string
          token_hash_hex: string
        }
        Returns: string
      }
      create_organization_with_owner: {
        Args: {
          request_id: string
          requested_business_category: string
          requested_country_code: string
          requested_currency: string
          requested_locale: string
          requested_name: string
          requested_primary_language: string
          requested_slug: string
          requested_team_size_range: string
          requested_timezone: string
        }
        Returns: {
          organization_id: string
          organization_slug: string
        }[]
      }
      create_service_request: {
        Args: {
          request_id: string
          requested_address: string
          requested_assignee: string
          requested_city: string
          requested_contact_channel: Database["public"]["Enums"]["preferred_contact_channel"]
          requested_country_code: string
          requested_email: string
          requested_first_name: string
          requested_last_name: string
          requested_locale: string
          requested_original_request: string
          requested_phone: string
          requested_postal_code: string
          requested_service_label: string
          requested_title: string
          target_organization_id: string
        }
        Returns: {
          lock_version: number
          reference_code: string
        }[]
      }
      delete_service_request: {
        Args: {
          confirmation_reference: string
          target_organization_id: string
          target_reference: string
        }
        Returns: undefined
      }
      list_organization_members: {
        Args: { target_organization_id: string }
        Returns: {
          email: string
          first_name: string
          joined_at: string
          last_name: string
          role: Database["public"]["Enums"]["organization_role"]
          status: Database["public"]["Enums"]["organization_membership_status"]
          user_id: string
        }[]
      }
      list_service_requests: {
        Args: {
          archive_filter?: string
          assignee_filter?: string
          country_filter?: string
          page_number?: number
          page_size?: number
          search_query?: string
          sort_order?: string
          status_filter?: Database["public"]["Enums"]["service_request_status"]
          target_organization_id: string
        }
        Returns: {
          assignee_name: string
          city: string
          country_code: string
          created_at: string
          is_archived: boolean
          reference_code: string
          requester_name: string
          service_label: string
          status: Database["public"]["Enums"]["service_request_status"]
          title: string
          total_count: number
          updated_at: string
        }[]
      }
      record_service_request_export: {
        Args: { target_organization_id: string; target_reference: string }
        Returns: undefined
      }
      remove_organization_member: {
        Args: { target_organization_id: string; target_user_id: string }
        Returns: undefined
      }
      revoke_organization_invitation: {
        Args: { target_invitation_id: string }
        Returns: undefined
      }
      set_service_request_archived: {
        Args: {
          expected_version: number
          should_archive: boolean
          target_organization_id: string
          target_reference: string
        }
        Returns: number
      }
      transition_service_request_status: {
        Args: {
          expected_version: number
          reason: string
          requested_status: Database["public"]["Enums"]["service_request_status"]
          target_organization_id: string
          target_reference: string
        }
        Returns: number
      }
      update_organization_member_role: {
        Args: {
          requested_role: Database["public"]["Enums"]["organization_role"]
          target_organization_id: string
          target_user_id: string
        }
        Returns: undefined
      }
      update_service_request: {
        Args: {
          expected_version: number
          requested_address: string
          requested_city: string
          requested_contact_channel: Database["public"]["Enums"]["preferred_contact_channel"]
          requested_country_code: string
          requested_email: string
          requested_first_name: string
          requested_last_name: string
          requested_locale: string
          requested_original_request: string
          requested_phone: string
          requested_postal_code: string
          requested_service_label: string
          requested_title: string
          target_organization_id: string
          target_reference: string
        }
        Returns: number
      }
    }
    Enums: {
      organization_invitation_status:
        | "pending"
        | "accepted"
        | "expired"
        | "revoked"
      organization_membership_status: "active" | "suspended" | "removed"
      organization_role: "owner" | "admin" | "member"
      preferred_contact_channel: "email" | "phone" | "none"
      service_request_event_type:
        | "created"
        | "updated"
        | "status_changed"
        | "assigned"
        | "unassigned"
        | "archived"
        | "restored"
        | "exported"
        | "deleted"
      service_request_source:
        | "manual"
        | "public_intake"
        | "email"
        | "chat"
        | "import"
      service_request_status:
        | "new"
        | "collecting"
        | "incomplete"
        | "needs_review"
        | "qualified"
        | "routed"
        | "closed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      organization_invitation_status: [
        "pending",
        "accepted",
        "expired",
        "revoked",
      ],
      organization_membership_status: ["active", "suspended", "removed"],
      organization_role: ["owner", "admin", "member"],
      preferred_contact_channel: ["email", "phone", "none"],
      service_request_event_type: [
        "created",
        "updated",
        "status_changed",
        "assigned",
        "unassigned",
        "archived",
        "restored",
        "exported",
        "deleted",
      ],
      service_request_source: [
        "manual",
        "public_intake",
        "email",
        "chat",
        "import",
      ],
      service_request_status: [
        "new",
        "collecting",
        "incomplete",
        "needs_review",
        "qualified",
        "routed",
        "closed",
      ],
    },
  },
} as const
