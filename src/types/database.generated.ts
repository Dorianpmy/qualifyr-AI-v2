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
      coverage_areas: {
        Row: {
          area_type: Database["public"]["Enums"]["coverage_area_type"]
          country_code: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          service_definition_id: string
          value: string
        }
        Insert: {
          area_type: Database["public"]["Enums"]["coverage_area_type"]
          country_code: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          service_definition_id: string
          value: string
        }
        Update: {
          area_type?: Database["public"]["Enums"]["coverage_area_type"]
          country_code?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          service_definition_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_areas_organization_id_service_definition_id_fkey"
            columns: ["organization_id", "service_definition_id"]
            isOneToOne: false
            referencedRelation: "service_definitions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
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
      playbook_audit_events: {
        Row: {
          actor_user_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["playbook_audit_event_type"]
          id: string
          metadata: Json
          organization_id: string
          playbook_id: string | null
          playbook_version_id: string | null
          service_definition_id: string | null
          service_request_id: string | null
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["playbook_audit_event_type"]
          id?: string
          metadata?: Json
          organization_id: string
          playbook_id?: string | null
          playbook_version_id?: string | null
          service_definition_id?: string | null
          service_request_id?: string | null
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["playbook_audit_event_type"]
          id?: string
          metadata?: Json
          organization_id?: string
          playbook_id?: string | null
          playbook_version_id?: string | null
          service_definition_id?: string | null
          service_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_audit_events_organization_id_playbook_id_fkey"
            columns: ["organization_id", "playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "playbook_audit_events_organization_id_playbook_version_id_fkey"
            columns: ["organization_id", "playbook_version_id"]
            isOneToOne: false
            referencedRelation: "playbook_versions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "playbook_audit_events_organization_id_service_definition_i_fkey"
            columns: ["organization_id", "service_definition_id"]
            isOneToOne: false
            referencedRelation: "service_definitions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "playbook_audit_events_organization_id_service_request_id_fkey"
            columns: ["organization_id", "service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      playbook_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          lock_version: number
          organization_id: string
          playbook_id: string
          published_at: string | null
          published_by: string | null
          schema_definition: Json
          status: Database["public"]["Enums"]["playbook_version_status"]
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          lock_version?: number
          organization_id: string
          playbook_id: string
          published_at?: string | null
          published_by?: string | null
          schema_definition: Json
          status?: Database["public"]["Enums"]["playbook_version_status"]
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          lock_version?: number
          organization_id?: string
          playbook_id?: string
          published_at?: string | null
          published_by?: string | null
          schema_definition?: Json
          status?: Database["public"]["Enums"]["playbook_version_status"]
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "playbook_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_versions_organization_id_playbook_id_fkey"
            columns: ["organization_id", "playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      playbooks: {
        Row: {
          active_version_id: string | null
          code: string
          created_at: string
          created_by: string
          creation_request_id: string
          description: string | null
          id: string
          name: string
          organization_id: string
          service_definition_id: string
          status: Database["public"]["Enums"]["playbook_status"]
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          code: string
          created_at?: string
          created_by: string
          creation_request_id: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          service_definition_id: string
          status?: Database["public"]["Enums"]["playbook_status"]
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          code?: string
          created_at?: string
          created_by?: string
          creation_request_id?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          service_definition_id?: string
          status?: Database["public"]["Enums"]["playbook_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_organization_id_active_version_id_fkey"
            columns: ["organization_id", "active_version_id"]
            isOneToOne: false
            referencedRelation: "playbook_versions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "playbooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbooks_organization_id_service_definition_id_fkey"
            columns: ["organization_id", "service_definition_id"]
            isOneToOne: false
            referencedRelation: "service_definitions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
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
      qualification_results: {
        Row: {
          evaluated_at: string
          evaluated_by: string
          evaluation_version: number
          evidence_values: Json
          failed_rules: Json
          field_values: Json
          human_validation_required: boolean
          id: string
          missing_information: Json
          next_action: string
          organization_id: string
          passed_rules: Json
          playbook_version_id: string
          proofs_expected: number
          proofs_received: number
          recommended_status: Database["public"]["Enums"]["qualification_recommendation"]
          required_fields_completed: number
          required_fields_total: number
          service_request_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          evaluated_at?: string
          evaluated_by: string
          evaluation_version?: number
          evidence_values?: Json
          failed_rules?: Json
          field_values?: Json
          human_validation_required?: boolean
          id?: string
          missing_information?: Json
          next_action: string
          organization_id: string
          passed_rules?: Json
          playbook_version_id: string
          proofs_expected?: number
          proofs_received?: number
          recommended_status?: Database["public"]["Enums"]["qualification_recommendation"]
          required_fields_completed?: number
          required_fields_total?: number
          service_request_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          evaluated_at?: string
          evaluated_by?: string
          evaluation_version?: number
          evidence_values?: Json
          failed_rules?: Json
          field_values?: Json
          human_validation_required?: boolean
          id?: string
          missing_information?: Json
          next_action?: string
          organization_id?: string
          passed_rules?: Json
          playbook_version_id?: string
          proofs_expected?: number
          proofs_received?: number
          recommended_status?: Database["public"]["Enums"]["qualification_recommendation"]
          required_fields_completed?: number
          required_fields_total?: number
          service_request_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_results_organization_id_playbook_version_id_fkey"
            columns: ["organization_id", "playbook_version_id"]
            isOneToOne: false
            referencedRelation: "playbook_versions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "qualification_results_organization_id_service_request_id_fkey"
            columns: ["organization_id", "service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      service_definitions: {
        Row: {
          code: string
          created_at: string
          created_by: string
          creation_request_id: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["service_definition_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          creation_request_id: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["service_definition_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          creation_request_id?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["service_definition_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          playbook_version_id: string | null
          postal_code: string
          preferred_contact_channel: Database["public"]["Enums"]["preferred_contact_channel"]
          reference_code: string
          requester_email: string | null
          requester_first_name: string | null
          requester_last_name: string | null
          requester_locale: string | null
          requester_phone: string | null
          service_definition_id: string | null
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
          playbook_version_id?: string | null
          postal_code: string
          preferred_contact_channel?: Database["public"]["Enums"]["preferred_contact_channel"]
          reference_code: string
          requester_email?: string | null
          requester_first_name?: string | null
          requester_last_name?: string | null
          requester_locale?: string | null
          requester_phone?: string | null
          service_definition_id?: string | null
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
          playbook_version_id?: string | null
          postal_code?: string
          preferred_contact_channel?: Database["public"]["Enums"]["preferred_contact_channel"]
          reference_code?: string
          requester_email?: string | null
          requester_first_name?: string | null
          requester_last_name?: string | null
          requester_locale?: string | null
          requester_phone?: string | null
          service_definition_id?: string | null
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
          {
            foreignKeyName: "service_requests_organization_id_playbook_version_id_fkey"
            columns: ["organization_id", "playbook_version_id"]
            isOneToOne: false
            referencedRelation: "playbook_versions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_requests_organization_id_service_definition_id_fkey"
            columns: ["organization_id", "service_definition_id"]
            isOneToOne: false
            referencedRelation: "service_definitions"
            referencedColumns: ["organization_id", "id"]
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
      add_coverage_area: {
        Args: {
          requested_country_code: string
          requested_type: Database["public"]["Enums"]["coverage_area_type"]
          requested_value: string
          target_organization_id: string
          target_service_id: string
        }
        Returns: string
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
      associate_dossier_playbook: {
        Args: {
          target_organization_id: string
          target_reference: string
          target_version_id: string
        }
        Returns: undefined
      }
      calculate_dossier_qualification: {
        Args: {
          requested_evidence: Json
          requested_values: Json
          target_organization_id: string
          target_reference: string
        }
        Returns: string
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
      create_playbook: {
        Args: {
          request_id: string
          requested_description: string
          requested_name: string
          requested_schema: Json
          target_organization_id: string
          target_service_id: string
        }
        Returns: {
          playbook_id: string
          version_id: string
        }[]
      }
      create_playbook_version: {
        Args: { target_organization_id: string; target_playbook_id: string }
        Returns: string
      }
      create_service_definition: {
        Args: {
          request_id: string
          requested_description: string
          requested_name: string
          target_organization_id: string
        }
        Returns: string
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
      publish_playbook_version: {
        Args: { target_organization_id: string; target_version_id: string }
        Returns: undefined
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
      update_playbook_draft: {
        Args: {
          expected_version: number
          requested_schema: Json
          target_organization_id: string
          target_version_id: string
        }
        Returns: number
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
      validate_dossier_qualification: {
        Args: { target_organization_id: string; target_reference: string }
        Returns: undefined
      }
    }
    Enums: {
      coverage_area_type: "country" | "city" | "postal_code"
      organization_invitation_status:
        | "pending"
        | "accepted"
        | "expired"
        | "revoked"
      organization_membership_status: "active" | "suspended" | "removed"
      organization_role: "owner" | "admin" | "member"
      playbook_audit_event_type:
        | "service_created"
        | "coverage_added"
        | "playbook_created"
        | "version_created"
        | "version_published"
        | "dossier_associated"
        | "qualification_calculated"
        | "qualification_validated"
      playbook_status: "draft" | "active" | "archived"
      playbook_version_status: "draft" | "published"
      preferred_contact_channel: "email" | "phone" | "none"
      qualification_recommendation: "incomplete" | "needs_review" | "qualified"
      service_definition_status: "active" | "inactive" | "archived"
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
      coverage_area_type: ["country", "city", "postal_code"],
      organization_invitation_status: [
        "pending",
        "accepted",
        "expired",
        "revoked",
      ],
      organization_membership_status: ["active", "suspended", "removed"],
      organization_role: ["owner", "admin", "member"],
      playbook_audit_event_type: [
        "service_created",
        "coverage_added",
        "playbook_created",
        "version_created",
        "version_published",
        "dossier_associated",
        "qualification_calculated",
        "qualification_validated",
      ],
      playbook_status: ["draft", "active", "archived"],
      playbook_version_status: ["draft", "published"],
      preferred_contact_channel: ["email", "phone", "none"],
      qualification_recommendation: ["incomplete", "needs_review", "qualified"],
      service_definition_status: ["active", "inactive", "archived"],
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
