// Auto-generate the full Database type by running:
//   npx supabase gen types typescript --project-id <your-ref> > src/lib/supabase/types.ts
// The hand-written version below reflects the schema in 001_initial_schema.sql.
// It matches the format expected by @supabase/supabase-js v2.x (with Relationships + CompositeTypes).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole =
  | 'admin'                   // מנהל מערכת
  | 'project_manager'         // מנהל פרויקט
  | 'resident'                // דייר
  | 'residents_representative' // נציג דיירים
  | 'residents_lawyer'        // עו"ד דיירים
  | 'residents_supervisor'    // מפקח מטעם הדיירים
  | 'developer'               // יזם
  | 'developer_lawyer'        // עו"ד יזם
  | 'developer_supervisor'    // מפקח מטעם היזם
export type DocStatus = 'missing' | 'pending_review' | 'approved'
export type ProjectStatus = 'pre_planning' | 'planning' | 'permits' | 'construction' | 'finishing' | 'key_delivery'
export type ProjectType = 'tama38a' | 'tama38b' | 'pinui_binui' | 'hitarot_pratiyot'
export type ConsentStatus = 'unsigned' | 'unsigned_neutral' | 'signed' | 'objecting'
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
          project_id: string | null
          building_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          full_name?: string | null
          phone?: string | null
          project_id?: string | null
          building_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          full_name?: string | null
          phone?: string | null
          project_id?: string | null
          building_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          name: string
          status: ProjectStatus
          project_type: ProjectType
          global_whatsapp_link: string | null
          description: string | null
          project_manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: ProjectStatus
          project_type?: ProjectType
          global_whatsapp_link?: string | null
          description?: string | null
          project_manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: ProjectStatus
          project_type?: ProjectType
          global_whatsapp_link?: string | null
          description?: string | null
          project_manager_id?: string | null
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
          consent_status: ConsentStatus
          consent_notes: string | null
          consent_updated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          unit_number: string
          floor?: number | null
          owner_id?: string | null
          consent_status?: ConsentStatus
          consent_notes?: string | null
          consent_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          unit_number?: string
          floor?: number | null
          owner_id?: string | null
          consent_status?: ConsentStatus
          consent_notes?: string | null
          consent_updated_at?: string | null
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
      contacts: {
        Row: {
          id: string
          project_id: string
          building_id: string | null
          full_name: string
          phone_raw: string
          phone_wa: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          building_id?: string | null
          full_name: string
          phone_raw: string
          phone_wa: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          building_id?: string | null
          full_name?: string
          phone_raw?: string
          phone_wa?: string
          notes?: string | null
          created_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          }
        ]
      }
      meetings: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          location?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          created_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      tik_binyan: {
        Row: {
          id: string
          project_id: string
          municipality: string
          municipality_url: string | null
          search_type: string
          file_number: string | null
          request_number: string | null
          address: string | null
          gush: string | null
          helka: string | null
          parsed_data: Json
          sync_status: string
          sync_error: string | null
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          municipality: string
          municipality_url?: string | null
          search_type?: string
          file_number?: string | null
          request_number?: string | null
          address?: string | null
          gush?: string | null
          helka?: string | null
          parsed_data?: Json
          sync_status?: string
          sync_error?: string | null
          last_sync_at?: string | null
        }
        Update: {
          project_id?: string
          municipality?: string
          municipality_url?: string | null
          search_type?: string
          file_number?: string | null
          request_number?: string | null
          address?: string | null
          gush?: string | null
          helka?: string | null
          parsed_data?: Json
          sync_status?: string
          sync_error?: string | null
          last_sync_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tik_binyan_project_id_fkey"
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
        Args: { p_project_id: string; p_project_type?: ProjectType }
        Returns: undefined
      }
    }
    Enums: {
      project_type: ProjectType
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
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Meeting  = Database['public']['Tables']['meetings']['Row']

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  tama38a:           'תמ"א 38 א — חיזוק',
  tama38b:           'תמ"א 38 ב — הריסה ובנייה',
  pinui_binui:       'פינוי-בינוי',
  hitarot_pratiyot:  'היתר פרטי',
}

export const CONSENT_STATUS_LABELS: Record<ConsentStatus, string> = {
  unsigned:         'לא חתם',
  unsigned_neutral: 'לא חתם ולא מתנגד',
  signed:           'חתם',
  objecting:        'מתנגד',
}

export const CONSENT_STATUS_COLORS: Record<ConsentStatus, string> = {
  unsigned:         '#6b7280',
  unsigned_neutral: '#f59e0b',
  signed:           '#22c55e',
  objecting:        '#ef4444',
}

// ─── Tik Binyan (Municipal Building File) ────────────────────────────────────

export type TikBinyanSearchType = 'file_number' | 'request_number' | 'address' | 'gush_helka'

export interface TikBinyanParsedData {
  permit_status: string
  permit_type: string | null
  decision_date: string | null
  applicant: string | null
  request_description: string | null
  timeline: { date: string; event: string; details: string | null }[]
  conditions: string[]
  raw_summary: string
  confidence: number
}

export interface TikBinyanRow {
  id: string
  project_id: string
  municipality: string
  municipality_url: string | null
  search_type: string
  file_number: string | null
  request_number: string | null
  address: string | null
  gush: string | null
  helka: string | null
  parsed_data: TikBinyanParsedData | Record<string, never>
  sync_status: string
  sync_error: string | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}
