// Auto-generate the full Database type by running:
//   npx supabase gen types typescript --project-id <your-ref> > src/lib/supabase/types.ts
// The hand-written version below reflects the schema in 001_initial_schema.sql.
// It matches the format expected by @supabase/supabase-js v2.x (with Relationships + CompositeTypes).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole =
  | 'admin'                   // מנהל מערכת
  | 'resident'                // דייר
  | 'residents_representative' // נציג דיירים
  | 'residents_lawyer'        // עו"ד דיירים
  | 'residents_supervisor'    // מפקח מטעם הדיירים
  | 'developer'               // יזם
  | 'developer_lawyer'        // עו"ד יזם
  | 'developer_supervisor'    // מפקח מטעם היזם
export type DocStatus = 'missing' | 'pending_review' | 'approved'
export type ProjectStatus = 'pre_planning' | 'planning' | 'permits' | 'construction' | 'finishing' | 'key_delivery'
export type DocumentType = 'id_card' | 'tabu' | 'signed_contract' | 'permit' | 'municipal_approval' | 'construction_plan' | 'other'
export type DocumentSource = 'resident' | 'developer' | 'municipality'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: UserRole
          full_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          full_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          name: string
          status: ProjectStatus
          global_whatsapp_link: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: ProjectStatus
          global_whatsapp_link?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: ProjectStatus
          global_whatsapp_link?: string | null
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      buildings: {
        Row: {
          id: string
          project_id: string
          address: string
          building_number: string | null
          building_whatsapp_link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          address: string
          building_number?: string | null
          building_whatsapp_link?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          address?: string
          building_number?: string | null
          building_whatsapp_link?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      apartments: {
        Row: {
          id: string
          building_id: string
          unit_number: string
          floor: number | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          unit_number: string
          floor?: number | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          unit_number?: string
          floor?: number | null
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          }
        ]
      }
      lawyer_project_assignments: {
        Row: {
          id: string
          lawyer_id: string
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          lawyer_id: string
          project_id: string
          created_at?: string
        }
        Update: {
          id?: string
          lawyer_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lpa_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          owner_id: string | null
          project_id: string | null
          type: DocumentType
          source: DocumentSource
          url: string | null
          storage_path: string | null
          status: DocStatus
          notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          project_id?: string | null
          type: DocumentType
          source?: DocumentSource
          url?: string | null
          storage_path?: string | null
          status?: DocStatus
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          project_id?: string | null
          type?: DocumentType
          source?: DocumentSource
          url?: string | null
          storage_path?: string | null
          status?: DocStatus
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_milestones: {
        Row: {
          id: string
          project_id: string
          stage: ProjectStatus
          label: string
          label_en: string | null
          description: string | null
          target_date: string | null
          completed_at: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          stage: ProjectStatus
          label: string
          label_en?: string | null
          description?: string | null
          target_date?: string | null
          completed_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          stage?: ProjectStatus
          label?: string
          label_en?: string | null
          description?: string | null
          target_date?: string | null
          completed_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      seed_project_milestones: {
        Args: { p_project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role:
        | 'admin'
        | 'resident'
        | 'residents_representative'
        | 'residents_lawyer'
        | 'residents_supervisor'
        | 'developer'
        | 'developer_lawyer'
        | 'developer_supervisor'
      doc_status: DocStatus
      project_status: ProjectStatus
      document_type: DocumentType
      document_source: DocumentSource
    }
    CompositeTypes: Record<string, never>
  }
}

// Convenience aliases
export type UserProfile = Database['public']['Tables']['users']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Building = Database['public']['Tables']['buildings']['Row']
export type Apartment = Database['public']['Tables']['apartments']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Milestone = Database['public']['Tables']['project_milestones']['Row']
export type LawyerAssignment = Database['public']['Tables']['lawyer_project_assignments']['Row']
