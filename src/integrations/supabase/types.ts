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
      absence_types: {
        Row: {
          company_id: string
          id: string
          name: string
          paid: boolean | null
        }
        Insert: {
          company_id: string
          id?: string
          name: string
          paid?: boolean | null
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
          paid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "absence_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      absences: {
        Row: {
          company_id: string
          created_at: string
          days: number | null
          employee_id: string | null
          end_date: string
          id: string
          note: string | null
          start_date: string
          status: string | null
          type: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          days?: number | null
          employee_id?: string | null
          end_date: string
          id?: string
          note?: string | null
          start_date: string
          status?: string | null
          type?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          days?: number | null
          employee_id?: string | null
          end_date?: string
          id?: string
          note?: string | null
          start_date?: string
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "absences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          company_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          message: string | null
          title: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          message?: string | null
          title?: string | null
          type?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string | null
          title?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_categories: {
        Row: {
          color: string | null
          company_id: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          company_id: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          company_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          all_day: boolean | null
          assigned_to: string | null
          category_id: string | null
          company_id: string
          created_at: string
          done_at: string | null
          end_at: string
          id: string
          note: string | null
          project_id: string | null
          resource_id: string | null
          start_at: string
          title: string
        }
        Insert: {
          all_day?: boolean | null
          assigned_to?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          done_at?: string | null
          end_at: string
          id?: string
          note?: string | null
          project_id?: string | null
          resource_id?: string | null
          start_at: string
          title: string
        }
        Update: {
          all_day?: boolean | null
          assigned_to?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          done_at?: string | null
          end_at?: string
          id?: string
          note?: string | null
          project_id?: string | null
          resource_id?: string | null
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "appointment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          article_number: string | null
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          ean: string | null
          id: string
          image_url: string | null
          list_price: number | null
          manufacturer: string | null
          matchcode: string | null
          name: string
          purchase_price: number | null
          sale_price: number | null
          stock: number | null
          supplier: string | null
          supplier_number: string | null
          unit: string | null
          used_count: number | null
          vat_rate: number | null
        }
        Insert: {
          article_number?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          ean?: string | null
          id?: string
          image_url?: string | null
          list_price?: number | null
          manufacturer?: string | null
          matchcode?: string | null
          name: string
          purchase_price?: number | null
          sale_price?: number | null
          stock?: number | null
          supplier?: string | null
          supplier_number?: string | null
          unit?: string | null
          used_count?: number | null
          vat_rate?: number | null
        }
        Update: {
          article_number?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          ean?: string | null
          id?: string
          image_url?: string | null
          list_price?: number | null
          manufacturer?: string | null
          matchcode?: string | null
          name?: string
          purchase_price?: number | null
          sale_price?: number | null
          stock?: number | null
          supplier?: string | null
          supplier_number?: string | null
          unit?: string | null
          used_count?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          radius_km: number | null
        }
        Insert: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          radius_km?: number | null
        }
        Update: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          radius_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          company_id: string
          created_at: string
          id: string
          items: Json
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          items?: Json
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          items?: Json
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          account_holder: string | null
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          bank: string | null
          bic: string | null
          commercial_register: string | null
          country: string | null
          created_at: string
          default_vat_rate: number
          fax: string | null
          founding_year: string | null
          iban: string | null
          id: string
          legal_form: string | null
          logo_url: string | null
          mobile: string | null
          name: string
          phone: string | null
          primary_color: string | null
          settings: Json
          tax_number: string | null
          vat_id: string | null
        }
        Insert: {
          account_holder?: string | null
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          bank?: string | null
          bic?: string | null
          commercial_register?: string | null
          country?: string | null
          created_at?: string
          default_vat_rate?: number
          fax?: string | null
          founding_year?: string | null
          iban?: string | null
          id?: string
          legal_form?: string | null
          logo_url?: string | null
          mobile?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          settings?: Json
          tax_number?: string | null
          vat_id?: string | null
        }
        Update: {
          account_holder?: string | null
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          bank?: string | null
          bic?: string | null
          commercial_register?: string | null
          country?: string | null
          created_at?: string
          default_vat_rate?: number
          fax?: string | null
          founding_year?: string | null
          iban?: string | null
          id?: string
          legal_form?: string | null
          logo_url?: string | null
          mobile?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          settings?: Json
          tax_number?: string | null
          vat_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          category: Database["public"]["Enums"]["contact_category"]
          company_id: string
          company_name: string | null
          country: string | null
          created_at: string
          custom_fields: Json
          customer_number: string | null
          email: string | null
          first_name: string | null
          id: string
          is_archived: boolean
          last_name: string | null
          mobile: string | null
          notes: string | null
          parent_contact_id: string | null
          phone: string | null
          salutation: string | null
          type: Database["public"]["Enums"]["contact_type"]
        }
        Insert: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          category?: Database["public"]["Enums"]["contact_category"]
          company_id: string
          company_name?: string | null
          country?: string | null
          created_at?: string
          custom_fields?: Json
          customer_number?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_archived?: boolean
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          parent_contact_id?: string | null
          phone?: string | null
          salutation?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
        }
        Update: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          category?: Database["public"]["Enums"]["contact_category"]
          company_id?: string
          company_name?: string | null
          country?: string | null
          created_at?: string
          custom_fields?: Json
          customer_number?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_archived?: boolean
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          parent_contact_id?: string | null
          phone?: string | null
          salutation?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_parent_contact_id_fkey"
            columns: ["parent_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          number: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          number?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_defs: {
        Row: {
          company_id: string
          created_at: string
          entity: string
          field_type: string
          hint: string | null
          id: string
          name: string
          options: Json | null
          sort_order: number | null
          suffix: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          entity?: string
          field_type?: string
          hint?: string | null
          id?: string
          name: string
          options?: Json | null
          sort_order?: number | null
          suffix?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          entity?: string
          field_type?: string
          hint?: string | null
          id?: string
          name?: string
          options?: Json | null
          sort_order?: number | null
          suffix?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_defs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_items: {
        Row: {
          article_id: string | null
          company_id: string
          created_at: string
          description: string | null
          discount_percent: number | null
          document_id: string
          id: string
          kind: Database["public"]["Enums"]["item_kind"]
          line_net: number | null
          markup_percent: number | null
          name: string | null
          position: number | null
          purchase_price: number | null
          quantity: number | null
          service_id: string | null
          sort_order: number
          time_minutes: number | null
          unit: string | null
          unit_price: number | null
          vat_rate: number | null
        }
        Insert: {
          article_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          document_id: string
          id?: string
          kind?: Database["public"]["Enums"]["item_kind"]
          line_net?: number | null
          markup_percent?: number | null
          name?: string | null
          position?: number | null
          purchase_price?: number | null
          quantity?: number | null
          service_id?: string | null
          sort_order?: number
          time_minutes?: number | null
          unit?: string | null
          unit_price?: number | null
          vat_rate?: number | null
        }
        Update: {
          article_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          document_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["item_kind"]
          line_net?: number | null
          markup_percent?: number | null
          name?: string | null
          position?: number | null
          purchase_price?: number | null
          quantity?: number | null
          service_id?: string | null
          sort_order?: number
          time_minutes?: number | null
          unit?: string | null
          unit_price?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      document_texts: {
        Row: {
          base_type: string | null
          company_id: string
          content: string | null
          created_at: string
          id: string
          kind: string
          placement: string | null
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          base_type?: string | null
          company_id: string
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          placement?: string | null
          source?: string
          title: string
          updated_at?: string
        }
        Update: {
          base_type?: string | null
          company_id?: string
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          placement?: string | null
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_texts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          base_type: string
          booking_category: string | null
          booking_relevant: boolean
          company_id: string
          created_at: string
          default_folder_id: string | null
          id: string
          layout: Json
          move_project_to_step_id: string | null
          name: string
          number_range_key: string | null
          sort_order: number | null
          status: string
          subject_prefix: string | null
        }
        Insert: {
          base_type: string
          booking_category?: string | null
          booking_relevant?: boolean
          company_id: string
          created_at?: string
          default_folder_id?: string | null
          id?: string
          layout?: Json
          move_project_to_step_id?: string | null
          name: string
          number_range_key?: string | null
          sort_order?: number | null
          status?: string
          subject_prefix?: string | null
        }
        Update: {
          base_type?: string
          booking_category?: string | null
          booking_relevant?: boolean
          company_id?: string
          created_at?: string
          default_folder_id?: string | null
          id?: string
          layout?: Json
          move_project_to_step_id?: string | null
          name?: string
          number_range_key?: string | null
          sort_order?: number | null
          status?: string
          subject_prefix?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_types_default_folder_id_fkey"
            columns: ["default_folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          base_type: string
          company_id: string
          company_snapshot: Json | null
          contact_person_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount_amount: number
          discount_percent: number
          doc_date: string
          doc_type_id: string | null
          due_date: string | null
          finalized_at: string | null
          folder_id: string | null
          gross_amount: number
          id: string
          intro_text: string | null
          is_deleted: boolean
          layout: Json
          layout_snapshot: Json | null
          name: string | null
          net_amount: number
          number: string | null
          open_amount: number
          outro_text: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pdf_url: string | null
          project_id: string | null
          recipient_snapshot: Json | null
          reference_document_id: string | null
          reverse_charge: boolean
          sent_at: string | null
          service_date: string | null
          status: Database["public"]["Enums"]["document_status"]
          subject: string | null
          updated_at: string
          vat_amount: number
        }
        Insert: {
          base_type?: string
          company_id: string
          company_snapshot?: Json | null
          contact_person_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number
          discount_percent?: number
          doc_date?: string
          doc_type_id?: string | null
          due_date?: string | null
          finalized_at?: string | null
          folder_id?: string | null
          gross_amount?: number
          id?: string
          intro_text?: string | null
          is_deleted?: boolean
          layout?: Json
          layout_snapshot?: Json | null
          name?: string | null
          net_amount?: number
          number?: string | null
          open_amount?: number
          outro_text?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pdf_url?: string | null
          project_id?: string | null
          recipient_snapshot?: Json | null
          reference_document_id?: string | null
          reverse_charge?: boolean
          sent_at?: string | null
          service_date?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subject?: string | null
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          base_type?: string
          company_id?: string
          company_snapshot?: Json | null
          contact_person_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number
          discount_percent?: number
          doc_date?: string
          doc_type_id?: string | null
          due_date?: string | null
          finalized_at?: string | null
          folder_id?: string | null
          gross_amount?: number
          id?: string
          intro_text?: string | null
          is_deleted?: boolean
          layout?: Json
          layout_snapshot?: Json | null
          name?: string | null
          net_amount?: number
          number?: string | null
          open_amount?: number
          outro_text?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pdf_url?: string | null
          project_id?: string | null
          recipient_snapshot?: Json | null
          reference_document_id?: string | null
          reverse_charge?: boolean
          sent_at?: string | null
          service_date?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subject?: string | null
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_doc_type_id_fkey"
            columns: ["doc_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reference_document_id_fkey"
            columns: ["reference_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      dunning_levels: {
        Row: {
          active: boolean | null
          company_id: string
          fee: number | null
          id: string
          interval_days: number
          level: number
          name: string
          sort_order: number | null
          type: string
        }
        Insert: {
          active?: boolean | null
          company_id: string
          fee?: number | null
          id?: string
          interval_days?: number
          level: number
          name: string
          sort_order?: number | null
          type?: string
        }
        Update: {
          active?: boolean | null
          company_id?: string
          fee?: number | null
          id?: string
          interval_days?: number
          level?: number
          name?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dunning_levels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dunnings: {
        Row: {
          company_id: string
          created_at: string
          document_id: string
          id: string
          level: number
          note: string | null
          sent_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          document_id: string
          id?: string
          level?: number
          note?: string | null
          sent_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          document_id?: string
          id?: string
          level?: number
          note?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dunnings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dunnings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string | null
          company_id: string
          context: string | null
          created_at: string
          id: string
          is_system: boolean
          name: string
          subject: string | null
        }
        Insert: {
          body?: string | null
          company_id: string
          context?: string | null
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          subject?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string
          context?: string | null
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_contracts: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string
          customer_id: string | null
          due_date: string | null
          id: string
          interval_unit: string | null
          interval_value: number | null
          last_appointment: string | null
          name: string
          project_id: string | null
          reminder: string | null
          runtime_unit: string | null
          runtime_value: number | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          interval_unit?: string | null
          interval_value?: number | null
          last_appointment?: string | null
          name: string
          project_id?: string | null
          reminder?: string | null
          runtime_unit?: string | null
          runtime_value?: number | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          interval_unit?: string | null
          interval_value?: number | null
          last_appointment?: string | null
          name?: string
          project_id?: string | null
          reminder?: string | null
          runtime_unit?: string | null
          runtime_value?: number | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_contracts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      number_ranges: {
        Row: {
          company_id: string
          id: string
          key: string
          name: string
          next_number: number
          prefix: string
          start_number: number
        }
        Insert: {
          company_id: string
          id?: string
          key: string
          name: string
          next_number?: number
          prefix: string
          start_number?: number
        }
        Update: {
          company_id?: string
          id?: string
          key?: string
          name?: string
          next_number?: number
          prefix?: string
          start_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "number_ranges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          assigned_to: string | null
          company_id: string
          contact_person_id: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          end_at: string | null
          id: string
          order_number: string | null
          start_at: string | null
          status: string | null
          title: string
          type: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          company_id: string
          contact_person_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          order_number?: string | null
          start_at?: string | null
          status?: string | null
          title: string
          type?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          company_id?: string
          contact_person_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          order_number?: string | null
          start_at?: string | null
          status?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          document_id: string
          id: string
          method: string | null
          note: string | null
          paid_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          document_id: string
          id?: string
          method?: string | null
          note?: string | null
          paid_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          document_id?: string
          id?: string
          method?: string | null
          note?: string | null
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          company_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_kind: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_kind?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_kind?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sources: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_steps: {
        Row: {
          base_status: string
          company_id: string
          created_at: string
          id: string
          name: string
          project_type_id: string
          sort_order: number
          status_code: number
        }
        Insert: {
          base_status: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          project_type_id: string
          sort_order?: number
          status_code: number
        }
        Update: {
          base_status?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          project_type_id?: string
          sort_order?: number
          status_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_steps_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      project_types: {
        Row: {
          code: string | null
          color: string | null
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          is_standard: boolean
          name: string
          sort_order: number | null
          status: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_standard?: boolean
          name: string
          sort_order?: number | null
          status?: string
        }
        Update: {
          code?: string | null
          color?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_standard?: boolean
          name?: string
          sort_order?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          assigned_to: string | null
          branch_id: string | null
          company_id: string
          contact_person_id: string | null
          created_at: string
          current_step_id: string | null
          custom_fields: Json
          customer_id: string | null
          id: string
          is_archived: boolean
          name: string | null
          priority: number | null
          project_number: number
          project_type_id: string | null
          reachability: string | null
          reminder_at: string | null
          source_id: string | null
          value: number | null
        }
        Insert: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          company_id: string
          contact_person_id?: string | null
          created_at?: string
          current_step_id?: string | null
          custom_fields?: Json
          customer_id?: string | null
          id?: string
          is_archived?: boolean
          name?: string | null
          priority?: number | null
          project_number: number
          project_type_id?: string | null
          reachability?: string | null
          reminder_at?: string | null
          source_id?: string | null
          value?: number | null
        }
        Update: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          company_id?: string
          contact_person_id?: string | null
          created_at?: string
          current_step_id?: string | null
          custom_fields?: Json
          customer_id?: string | null
          id?: string
          is_archived?: boolean
          name?: string | null
          priority?: number | null
          project_number?: number
          project_type_id?: string | null
          reachability?: string | null
          reminder_at?: string | null
          source_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "project_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "project_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          category: string | null
          company_id: string
          contact_id: string | null
          cost_center_id: string | null
          created_at: string
          doc_date: string | null
          due_date: string | null
          exported: boolean | null
          file_url: string | null
          gross_amount: number | null
          id: string
          net_amount: number | null
          open_amount: number | null
          project_id: string | null
          receipt_number: string | null
          status: string | null
          type: string
          value_date: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          contact_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          doc_date?: string | null
          due_date?: string | null
          exported?: boolean | null
          file_url?: string | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          open_amount?: number | null
          project_id?: string | null
          receipt_number?: string | null
          status?: string | null
          type?: string
          value_date?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          contact_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          doc_date?: string | null
          due_date?: string | null
          exported?: boolean | null
          file_url?: string | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          open_amount?: number | null
          project_id?: string | null
          receipt_number?: string | null
          status?: string | null
          type?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          company_id: string
          id: string
          name: string
          profile_id: string | null
          type: string | null
        }
        Insert: {
          company_id: string
          id?: string
          name: string
          profile_id?: string | null
          type?: string | null
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
          profile_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_prices: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_standard: boolean
          markup_percent: number
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_standard?: boolean
          markup_percent?: number
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_standard?: boolean
          markup_percent?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_prices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          ean: string | null
          id: string
          internal_name: string | null
          manufacturer: string | null
          name: string
          price: number | null
          service_number: string | null
          time_minutes: number | null
          unit: string | null
          vat_rate: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          ean?: string | null
          id?: string
          internal_name?: string | null
          manufacturer?: string | null
          name: string
          price?: number | null
          service_number?: string | null
          time_minutes?: number | null
          unit?: string | null
          vat_rate?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          ean?: string | null
          id?: string
          internal_name?: string | null
          manufacturer?: string | null
          name?: string
          price?: number | null
          service_number?: string | null
          time_minutes?: number | null
          unit?: string | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          article_id: string | null
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          planned_stock: number | null
          stock: number | null
          stock_number: string | null
        }
        Insert: {
          article_id?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          planned_stock?: number | null
          stock?: number | null
          stock_number?: string | null
        }
        Update: {
          article_id?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          planned_stock?: number | null
          stock?: number | null
          stock_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          booking_number: string | null
          company_id: string
          created_at: string
          created_by: string | null
          document_id: string | null
          id: string
          new_stock: number | null
          note: string | null
          old_stock: number | null
          project_id: string | null
          quantity: number
          stock_item_id: string
          type: string
        }
        Insert: {
          booking_number?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          new_stock?: number | null
          note?: string | null
          old_stock?: number | null
          project_id?: string | null
          quantity?: number
          stock_item_id: string
          type: string
        }
        Update: {
          booking_number?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          new_stock?: number | null
          note?: string | null
          old_stock?: number | null
          project_id?: string | null
          quantity?: number
          stock_item_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          done_at: string | null
          due_date: string | null
          id: string
          project_id: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          done_at?: string | null
          due_date?: string | null
          id?: string
          project_id?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          done_at?: string | null
          due_date?: string | null
          id?: string
          project_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_categories: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          work_relevant: boolean | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          work_relevant?: boolean | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          work_relevant?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "time_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          break_minutes: number | null
          category_id: string | null
          company_id: string
          created_at: string
          duration_minutes: number | null
          employee_id: string | null
          end_time: string | null
          entry_date: string
          id: string
          note: string | null
          project_id: string | null
          start_time: string | null
          status: string | null
        }
        Insert: {
          break_minutes?: number | null
          category_id?: string | null
          company_id: string
          created_at?: string
          duration_minutes?: number | null
          employee_id?: string | null
          end_time?: string | null
          entry_date?: string
          id?: string
          note?: string | null
          project_id?: string | null
          start_time?: string | null
          status?: string | null
        }
        Update: {
          break_minutes?: number | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          duration_minutes?: number | null
          employee_id?: string | null
          end_time?: string | null
          entry_date?: string
          id?: string
          note?: string | null
          project_id?: string | null
          start_time?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "time_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wage_groups: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          self_cost: number | null
          total_cost: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          self_cost?: number | null
          total_cost?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          self_cost?: number | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wage_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_company: { Args: { p_name?: string }; Returns: string }
      current_company_id: { Args: never; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      finalize_document: { Args: { p_doc: string }; Returns: string }
      next_document_number: {
        Args: { p_company: string; p_key: string }
        Returns: string
      }
      next_prefixed_number: {
        Args: {
          p_col: string
          p_company: string
          p_prefix: string
          p_start?: number
          p_table: string
        }
        Returns: string
      }
      next_project_number: { Args: { p_company: string }; Returns: number }
      recompute_document_payment: {
        Args: { p_doc: string }
        Returns: undefined
      }
      recompute_document_totals: { Args: { p_doc: string }; Returns: undefined }
      save_document: { Args: { payload: Json }; Returns: string }
      seed_module_defaults: { Args: { p_company: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "geschaeftsfuehrer"
        | "niederlassungsleiter"
        | "buchhaltung"
        | "vertriebler"
        | "monteur"
      contact_category: "kunde" | "lieferant" | "partner" | "ansprechpartner"
      contact_type: "person" | "firma"
      document_status:
        | "entwurf"
        | "import_erforderlich"
        | "in_bearbeitung"
        | "erstellt"
        | "versendet"
        | "erneut_versendet"
        | "angenommen"
        | "abgelehnt"
        | "storniert"
        | "geloescht"
      item_kind: "artikel" | "leistung" | "titel" | "text"
      payment_status:
        | "offen"
        | "teilzahlung"
        | "bezahlt"
        | "ueberfaellig"
        | "storniert"
      user_type: "standard" | "app"
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
      app_role: [
        "geschaeftsfuehrer",
        "niederlassungsleiter",
        "buchhaltung",
        "vertriebler",
        "monteur",
      ],
      contact_category: ["kunde", "lieferant", "partner", "ansprechpartner"],
      contact_type: ["person", "firma"],
      document_status: [
        "entwurf",
        "import_erforderlich",
        "in_bearbeitung",
        "erstellt",
        "versendet",
        "erneut_versendet",
        "angenommen",
        "abgelehnt",
        "storniert",
        "geloescht",
      ],
      item_kind: ["artikel", "leistung", "titel", "text"],
      payment_status: [
        "offen",
        "teilzahlung",
        "bezahlt",
        "ueberfaellig",
        "storniert",
      ],
      user_type: ["standard", "app"],
    },
  },
} as const
