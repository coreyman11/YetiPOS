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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      billing_cycles: {
        Row: {
          amount_cents: number
          created_at: string
          customer_membership_id: string
          cycle_end: string
          cycle_start: string
          id: string
          location_id: string | null
          processed_at: string | null
          status: string
          updated_at: string
          usage_data: Json | null
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          customer_membership_id: string
          cycle_end: string
          cycle_start: string
          id?: string
          location_id?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          usage_data?: Json | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          customer_membership_id?: string
          cycle_end?: string
          cycle_start?: string
          id?: string
          location_id?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          usage_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycles_customer_membership_id_fkey"
            columns: ["customer_membership_id"]
            isOneToOne: false
            referencedRelation: "customer_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_cents: number
          billing_cycle_id: string | null
          created_at: string
          currency: string | null
          customer_membership_id: string
          due_date: string
          failed_at: string | null
          failure_reason: string | null
          id: string
          invoice_number: string
          line_items: Json | null
          location_id: string | null
          paid_at: string | null
          retry_count: number | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          tax_cents: number | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents: number
          billing_cycle_id?: string | null
          created_at?: string
          currency?: string | null
          customer_membership_id: string
          due_date: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          invoice_number: string
          line_items?: Json | null
          location_id?: string | null
          paid_at?: string | null
          retry_count?: number | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          tax_cents?: number | null
          total_cents: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          billing_cycle_id?: string | null
          created_at?: string
          currency?: string | null
          customer_membership_id?: string
          due_date?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json | null
          location_id?: string | null
          paid_at?: string | null
          retry_count?: number | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          tax_cents?: number | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_customer_membership_id_fkey"
            columns: ["customer_membership_id"]
            isOneToOne: false
            referencedRelation: "customer_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          auto_suspend_after_grace: boolean | null
          billing_timezone: string | null
          created_at: string
          grace_period_days: number | null
          id: string
          location_id: string | null
          max_retry_attempts: number | null
          reminder_days_before: number | null
          retry_delay_hours: number | null
          send_payment_reminders: boolean | null
          settings: Json | null
          updated_at: string
          usage_calculation_method: string | null
        }
        Insert: {
          auto_suspend_after_grace?: boolean | null
          billing_timezone?: string | null
          created_at?: string
          grace_period_days?: number | null
          id?: string
          location_id?: string | null
          max_retry_attempts?: number | null
          reminder_days_before?: number | null
          retry_delay_hours?: number | null
          send_payment_reminders?: boolean | null
          settings?: Json | null
          updated_at?: string
          usage_calculation_method?: string | null
        }
        Update: {
          auto_suspend_after_grace?: boolean | null
          billing_timezone?: string | null
          created_at?: string
          grace_period_days?: number | null
          id?: string
          location_id?: string | null
          max_retry_attempts?: number | null
          reminder_days_before?: number | null
          retry_delay_hours?: number | null
          send_payment_reminders?: boolean | null
          settings?: Json | null
          updated_at?: string
          usage_calculation_method?: string | null
        }
        Relationships: []
      }
      card_reader_configurations: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          last_connection_time: string | null
          location_id: string | null
          model: string | null
          reader_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_connection_time?: string | null
          location_id?: string | null
          model?: string | null
          reader_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_connection_time?: string | null
          location_id?: string | null
          model?: string | null
          reader_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_reader_configurations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          inventory_id: number
          sort_order: number | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          inventory_id: number
          sort_order?: number | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          inventory_id?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "product_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_memberships: {
        Row: {
          billing_status: string | null
          billing_type: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_id: number
          failed_payment_attempts: number | null
          grace_period_end: string | null
          id: string
          last_billed_date: string | null
          location_id: string | null
          membership_plan_id: string
          next_billing_date: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end_date: string | null
          updated_at: string
        }
        Insert: {
          billing_status?: string | null
          billing_type?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id: number
          failed_payment_attempts?: number | null
          grace_period_end?: string | null
          id?: string
          last_billed_date?: string | null
          location_id?: string | null
          membership_plan_id: string
          next_billing_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end_date?: string | null
          updated_at?: string
        }
        Update: {
          billing_status?: string | null
          billing_type?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: number
          failed_payment_attempts?: number | null
          grace_period_end?: string | null
          id?: string
          last_billed_date?: string | null
          location_id?: string | null
          membership_plan_id?: string
          next_billing_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_completion_sent_at: string | null
          account_completion_token: string | null
          address_line1: string | null
          auth_user_id: string | null
          bin: string | null
          city: string | null
          created_at: string
          credit_card_expire_date: string | null
          credit_card_number: string | null
          email: string
          first_name: string | null
          id: number
          last_name: string | null
          location_id: string | null
          loyalty_points: number
          mobile: string | null
          name: string
          online_account_active: boolean | null
          password_hash: string | null
          password_reset_sent_at: string | null
          password_reset_token: string | null
          phone: string
          span: string | null
          state: string | null
          stripe_customer_id: string | null
          token: string | null
          zip: string | null
        }
        Insert: {
          account_completion_sent_at?: string | null
          account_completion_token?: string | null
          address_line1?: string | null
          auth_user_id?: string | null
          bin?: string | null
          city?: string | null
          created_at?: string
          credit_card_expire_date?: string | null
          credit_card_number?: string | null
          email: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          location_id?: string | null
          loyalty_points?: number
          mobile?: string | null
          name: string
          online_account_active?: boolean | null
          password_hash?: string | null
          password_reset_sent_at?: string | null
          password_reset_token?: string | null
          phone: string
          span?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          token?: string | null
          zip?: string | null
        }
        Update: {
          account_completion_sent_at?: string | null
          account_completion_token?: string | null
          address_line1?: string | null
          auth_user_id?: string | null
          bin?: string | null
          city?: string | null
          created_at?: string
          credit_card_expire_date?: string | null
          credit_card_number?: string | null
          email?: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          location_id?: string | null
          loyalty_points?: number
          mobile?: string | null
          name?: string
          online_account_active?: boolean | null
          password_hash?: string | null
          password_reset_sent_at?: string | null
          password_reset_token?: string | null
          phone?: string
          span?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          token?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          name: string
          start_date: string | null
          type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          name: string
          start_date?: string | null
          type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          name?: string
          start_date?: string | null
          type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discounts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_reports: {
        Row: {
          average_sale: number
          cash_sales: number
          credit_card_sales: number
          discounts_applied: number
          employee_id: string | null
          gift_card_sales: number
          id: string
          location_id: string | null
          report_date: string
          return_transactions: number
          total_sales: number
          transaction_count: number
          unique_customers: number
        }
        Insert: {
          average_sale?: number
          cash_sales?: number
          credit_card_sales?: number
          discounts_applied?: number
          employee_id?: string | null
          gift_card_sales?: number
          id?: string
          location_id?: string | null
          report_date: string
          return_transactions?: number
          total_sales?: number
          transaction_count?: number
          unique_customers?: number
        }
        Update: {
          average_sale?: number
          cash_sales?: number
          credit_card_sales?: number
          discounts_applied?: number
          employee_id?: string | null
          gift_card_sales?: number
          id?: string
          location_id?: string | null
          report_date?: string
          return_transactions?: number
          total_sales?: number
          transaction_count?: number
          unique_customers?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_reports_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_definitions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_core: boolean
          is_visible: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_core?: boolean
          is_visible?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_core?: boolean
          is_visible?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_toggles: {
        Row: {
          created_at: string
          disabled_at: string | null
          disabled_by: string | null
          enabled_at: string | null
          enabled_by: string | null
          feature_id: string
          id: string
          is_enabled: boolean
          location_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          feature_id: string
          id?: string
          is_enabled?: boolean
          location_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          feature_id?: string
          id?: string
          is_enabled?: boolean
          location_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_toggles_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          gift_card_id: number
          id: number
          location_id: string | null
          transaction_id: number | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          gift_card_id: number
          id?: number
          location_id?: string | null
          transaction_id?: number | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          gift_card_id?: number
          id?: number
          location_id?: string | null
          transaction_id?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          activated_at: string | null
          card_number: string
          created_at: string
          created_by_transaction_id: number | null
          current_balance: number
          expiration_date: string | null
          id: number
          initial_balance: number
          is_active: boolean | null
          is_open_amount: boolean | null
          last_used_at: string | null
          location_id: string | null
          max_balance: number | null
          notes: string | null
        }
        Insert: {
          activated_at?: string | null
          card_number: string
          created_at?: string
          created_by_transaction_id?: number | null
          current_balance?: number
          expiration_date?: string | null
          id?: number
          initial_balance?: number
          is_active?: boolean | null
          is_open_amount?: boolean | null
          last_used_at?: string | null
          location_id?: string | null
          max_balance?: number | null
          notes?: string | null
        }
        Update: {
          activated_at?: string | null
          card_number?: string
          created_at?: string
          created_by_transaction_id?: number | null
          current_balance?: number
          expiration_date?: string | null
          id?: number
          initial_balance?: number
          is_active?: boolean | null
          is_open_amount?: boolean | null
          last_used_at?: string | null
          location_id?: string | null
          max_balance?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_created_by_transaction_id_fkey"
            columns: ["created_by_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          color: string | null
          cost: number
          created_at: string
          description: string | null
          id: number
          label_printed_at: string | null
          last_ordered_date: string | null
          location: string | null
          location_id: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          name: string
          needs_label: boolean | null
          price: number
          quantity: number
          reorder_point: number | null
          size: string | null
          sku: string
          supplier: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: number
          label_printed_at?: string | null
          last_ordered_date?: string | null
          location?: string | null
          location_id?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name: string
          needs_label?: boolean | null
          price?: number
          quantity?: number
          reorder_point?: number | null
          size?: string | null
          sku: string
          supplier?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: number
          label_printed_at?: string | null
          last_ordered_date?: string | null
          location?: string | null
          location_id?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name?: string
          needs_label?: boolean | null
          price?: number
          quantity?: number
          reorder_point?: number | null
          size?: string | null
          sku?: string
          supplier?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          color: string | null
          created_at: string
          id: number
          location_id: string | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: number
          location_id?: string | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: number
          location_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      logo_settings: {
        Row: {
          created_at: string
          id: string
          location_id: string
          logo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          logo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          logo_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_program_settings: {
        Row: {
          created_at: string
          id: number
          location_id: string | null
          minimum_points_redeem: number
          points_per_dollar: number
          points_value_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          location_id?: string | null
          minimum_points_redeem?: number
          points_per_dollar?: number
          points_value_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          location_id?: string | null
          minimum_points_redeem?: number
          points_per_dollar?: number
          points_value_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_program_settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean | null
          location_id: string | null
          minimum_points_redeem: number
          name: string
          points_per_dollar: number
          points_value_cents: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          location_id?: string | null
          minimum_points_redeem?: number
          name: string
          points_per_dollar?: number
          points_value_cents?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          location_id?: string | null
          minimum_points_redeem?: number
          name?: string
          points_per_dollar?: number
          points_value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          customer_id: number | null
          description: string
          id: number
          location_id: string | null
          loyalty_program_id: number | null
          points_balance: number
          points_earned: number | null
          points_redeemed: number | null
          transaction_id: number | null
          type: string
        }
        Insert: {
          created_at?: string
          customer_id?: number | null
          description: string
          id?: number
          location_id?: string | null
          loyalty_program_id?: number | null
          points_balance: number
          points_earned?: number | null
          points_redeemed?: number | null
          transaction_id?: number | null
          type?: string
        }
        Update: {
          created_at?: string
          customer_id?: number | null
          description?: string
          id?: number
          location_id?: string | null
          loyalty_program_id?: number | null
          points_balance?: number
          points_earned?: number | null
          points_redeemed?: number | null
          transaction_id?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_loyalty_program_id_fkey"
            columns: ["loyalty_program_id"]
            isOneToOne: false
            referencedRelation: "loyalty_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_benefits: {
        Row: {
          benefit_type: string
          benefit_value: number | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          location_id: string | null
          membership_plan_id: string
        }
        Insert: {
          benefit_type: string
          benefit_value?: number | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          membership_plan_id: string
        }
        Update: {
          benefit_type?: string
          benefit_value?: number | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          membership_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_benefits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_benefits_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plan_locations: {
        Row: {
          created_at: string
          id: string
          location_id: string
          membership_plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          membership_plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          membership_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_plan_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_plan_locations_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          billing_day_of_month: number | null
          billing_interval: string
          billing_interval_count: number
          billing_type: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location_id: string | null
          max_members: number | null
          name: string
          price_cents: number
          stripe_price_id: string | null
          trial_days: number | null
          updated_at: string
          usage_based: boolean | null
          usage_rate_cents: number | null
        }
        Insert: {
          billing_day_of_month?: number | null
          billing_interval?: string
          billing_interval_count?: number
          billing_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_id?: string | null
          max_members?: number | null
          name: string
          price_cents?: number
          stripe_price_id?: string | null
          trial_days?: number | null
          updated_at?: string
          usage_based?: boolean | null
          usage_rate_cents?: number | null
        }
        Update: {
          billing_day_of_month?: number | null
          billing_interval?: string
          billing_interval_count?: number
          billing_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_id?: string | null
          max_members?: number | null
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          trial_days?: number | null
          updated_at?: string
          usage_based?: boolean | null
          usage_rate_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_trials: {
        Row: {
          converted: boolean | null
          converted_at: string | null
          created_at: string
          customer_membership_id: string
          id: string
          location_id: string | null
          trial_end: string
          trial_start: string
          updated_at: string
        }
        Insert: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          customer_membership_id: string
          id?: string
          location_id?: string | null
          trial_end: string
          trial_start?: string
          updated_at?: string
        }
        Update: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          customer_membership_id?: string
          id?: string
          location_id?: string | null
          trial_end?: string
          trial_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_trials_customer_membership_id_fkey"
            columns: ["customer_membership_id"]
            isOneToOne: true
            referencedRelation: "customer_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      online_stores: {
        Row: {
          accent_color: string | null
          allow_backorders: boolean | null
          banner_cta_text: string | null
          banner_subtitle: string | null
          banner_title: string | null
          banner_url: string | null
          checkout_style: string | null
          created_at: string
          currency: string | null
          custom_css: string | null
          custom_js: string | null
          description: string | null
          enable_inventory_tracking: boolean | null
          enable_reviews: boolean | null
          font_family: string | null
          footer_style: string | null
          header_style: string | null
          id: number
          is_active: boolean | null
          layout_style: string | null
          location_id: string | null
          logo_url: string | null
          maintenance_message: string | null
          maintenance_mode: boolean | null
          name: string
          primary_color: string | null
          products_per_page: number | null
          secondary_color: string | null
          show_cart: boolean | null
          show_search: boolean | null
          show_wishlist: boolean | null
          slug: string
          theme_color: string | null
          theme_id: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          allow_backorders?: boolean | null
          banner_cta_text?: string | null
          banner_subtitle?: string | null
          banner_title?: string | null
          banner_url?: string | null
          checkout_style?: string | null
          created_at?: string
          currency?: string | null
          custom_css?: string | null
          custom_js?: string | null
          description?: string | null
          enable_inventory_tracking?: boolean | null
          enable_reviews?: boolean | null
          font_family?: string | null
          footer_style?: string | null
          header_style?: string | null
          id?: number
          is_active?: boolean | null
          layout_style?: string | null
          location_id?: string | null
          logo_url?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          name: string
          primary_color?: string | null
          products_per_page?: number | null
          secondary_color?: string | null
          show_cart?: boolean | null
          show_search?: boolean | null
          show_wishlist?: boolean | null
          slug: string
          theme_color?: string | null
          theme_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          allow_backorders?: boolean | null
          banner_cta_text?: string | null
          banner_subtitle?: string | null
          banner_title?: string | null
          banner_url?: string | null
          checkout_style?: string | null
          created_at?: string
          currency?: string | null
          custom_css?: string | null
          custom_js?: string | null
          description?: string | null
          enable_inventory_tracking?: boolean | null
          enable_reviews?: boolean | null
          font_family?: string | null
          footer_style?: string | null
          header_style?: string | null
          id?: number
          is_active?: boolean | null
          layout_style?: string | null
          location_id?: string | null
          logo_url?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          name?: string
          primary_color?: string | null
          products_per_page?: number | null
          secondary_color?: string | null
          show_cart?: boolean | null
          show_search?: boolean | null
          show_wishlist?: boolean | null
          slug?: string
          theme_color?: string | null
          theme_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_stores_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_stores_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "store_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: number
          inventory_id: number | null
          item_name: string
          location_id: string | null
          notes: string | null
          order_id: number
          price: number
          quantity: number
          service_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          inventory_id?: number | null
          item_name: string
          location_id?: string | null
          notes?: string | null
          order_id: number
          price?: number
          quantity?: number
          service_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          inventory_id?: number | null
          item_name?: string
          location_id?: string | null
          notes?: string | null
          order_id?: number
          price?: number
          quantity?: number
          service_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      order_settings: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          order_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          order_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          order_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_user_id: string | null
          created_at: string
          customer_email: string | null
          customer_id: number | null
          customer_name: string | null
          customer_phone: string | null
          estimated_ready_time: string | null
          id: number
          location_id: string | null
          notes: string | null
          order_number: string
          order_type: string
          shipping_address: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_ready_time?: string | null
          id?: number
          location_id?: string | null
          notes?: string | null
          order_number: string
          order_type?: string
          shipping_address?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_ready_time?: string | null
          id?: number
          location_id?: string | null
          notes?: string | null
          order_number?: string
          order_type?: string
          shipping_address?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_splits: {
        Row: {
          amount: number
          created_at: string
          gift_card_id: number | null
          id: number
          location_id: string | null
          payment_method: string
          transaction_id: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          gift_card_id?: number | null
          id?: number
          location_id?: string | null
          payment_method: string
          transaction_id?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          gift_card_id?: number | null
          id?: number
          location_id?: string | null
          payment_method?: string
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_splits_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_splits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_splits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_definitions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      printer_configurations: {
        Row: {
          connection_details: Json
          created_at: string
          id: number
          is_default: boolean | null
          location_id: string | null
          name: string
          status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          connection_details: Json
          created_at?: string
          id?: number
          is_default?: boolean | null
          location_id?: string | null
          name: string
          status?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          connection_details?: Json
          created_at?: string
          id?: number
          is_default?: boolean | null
          location_id?: string | null
          name?: string
          status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_configurations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          slug: string
          sort_order: number | null
          store_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          store_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          store_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          cost: number | null
          created_at: string
          id: string
          image_url: string | null
          inventory_id: number
          is_active: boolean | null
          name: string
          options: Json | null
          price: number
          quantity: number | null
          sku: string | null
          store_id: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          inventory_id: number
          is_active?: boolean | null
          name: string
          options?: Json | null
          price: number
          quantity?: number | null
          sku?: string | null
          store_id: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          inventory_id?: number
          is_active?: boolean | null
          name?: string
          options?: Json | null
          price?: number
          quantity?: number | null
          sku?: string | null
          store_id?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      receipt_settings: {
        Row: {
          business_name: string
          contact_email: string | null
          contact_phone: string | null
          contact_website: string | null
          created_at: string | null
          footer_text: string
          header_text: string
          id: string
          include_customer_info: boolean | null
          location_id: string | null
          logo_url: string | null
          show_discount_details: boolean | null
          show_tax_details: boolean | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_website?: string | null
          created_at?: string | null
          footer_text?: string
          header_text?: string
          id?: string
          include_customer_info?: boolean | null
          location_id?: string | null
          logo_url?: string | null
          show_discount_details?: boolean | null
          show_tax_details?: boolean | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_website?: string | null
          created_at?: string | null
          footer_text?: string
          header_text?: string
          id?: string
          include_customer_info?: boolean | null
          location_id?: string | null
          logo_url?: string | null
          show_discount_details?: boolean | null
          show_tax_details?: boolean | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          error_message: string | null
          id: number
          location_id: string | null
          printed: boolean | null
          printer_id: string | null
          status: string
          template: string
          transaction_id: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: number
          location_id?: string | null
          printed?: boolean | null
          printer_id?: string | null
          status?: string
          template: string
          transaction_id: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: number
          location_id?: string | null
          printed?: boolean | null
          printer_id?: string | null
          status?: string
          template?: string
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          id: number
          location_id: string | null
          notes: string | null
          payment_method: string
          refund_amount: number
          refunded_at: string | null
          refunded_by: string | null
          status: string | null
          transaction_id: number | null
        }
        Insert: {
          id?: number
          location_id?: string | null
          notes?: string | null
          payment_method: string
          refund_amount: number
          refunded_at?: string | null
          refunded_by?: string | null
          status?: string | null
          transaction_id?: number | null
        }
        Update: {
          id?: number
          location_id?: string | null
          notes?: string | null
          payment_method?: string
          refund_amount?: number
          refunded_at?: string | null
          refunded_by?: string | null
          status?: string | null
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          role_scope: Database["public"]["Enums"]["role_scope"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          role_scope?: Database["public"]["Enums"]["role_scope"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          role_scope?: Database["public"]["Enums"]["role_scope"]
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          event_category: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          location_id: string | null
          risk_level: string
          user_agent: string | null
          user_identifier: string | null
        }
        Insert: {
          created_at?: string
          event_category?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          location_id?: string | null
          risk_level?: string
          user_agent?: string | null
          user_identifier?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          location_id?: string | null
          risk_level?: string
          user_agent?: string | null
          user_identifier?: string | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          incident_type: string
          ip_address: unknown | null
          location_id: string | null
          metadata: Json | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_identifier: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          incident_type: string
          ip_address?: unknown | null
          location_id?: string | null
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_identifier?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          ip_address?: unknown | null
          location_id?: string | null
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_identifier?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          id: number
          inventory_items: Json | null
          location_id: string | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          id?: number
          inventory_items?: Json | null
          location_id?: string | null
          name: string
          price: number
        }
        Update: {
          created_at?: string
          id?: number
          inventory_items?: Json | null
          location_id?: string | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          assigned_user_id: string | null
          cash_discrepancy: number | null
          closing_balance: number | null
          created_at: string
          end_time: string | null
          id: number
          location_id: string | null
          name: string
          opening_balance: number | null
          start_time: string
          status: string
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          cash_discrepancy?: number | null
          closing_balance?: number | null
          created_at?: string
          end_time?: string | null
          id?: never
          location_id?: string | null
          name: string
          opening_balance?: number | null
          start_time: string
          status?: string
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          cash_discrepancy?: number | null
          closing_balance?: number | null
          created_at?: string
          end_time?: string | null
          id?: never
          location_id?: string | null
          name?: string
          opening_balance?: number | null
          start_time?: string
          status?: string
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      store_inventory: {
        Row: {
          created_at: string
          id: number
          image_url: string | null
          inventory_id: number | null
          is_visible: boolean | null
          location_id: string | null
          price: number
          store_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          image_url?: string | null
          inventory_id?: number | null
          is_visible?: boolean | null
          location_id?: string | null
          price: number
          store_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string | null
          inventory_id?: number | null
          is_visible?: boolean | null
          location_id?: string | null
          price?: number
          store_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "store_inventory_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "online_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_navigation: {
        Row: {
          created_at: string
          id: string
          is_external: boolean | null
          label: string
          location_id: string | null
          parent_id: string | null
          sort_order: number | null
          store_id: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_external?: boolean | null
          label: string
          location_id?: string | null
          parent_id?: string | null
          sort_order?: number | null
          store_id: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_external?: boolean | null
          label?: string
          location_id?: string | null
          parent_id?: string | null
          sort_order?: number | null
          store_id?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_navigation_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_navigation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "store_navigation"
            referencedColumns: ["id"]
          },
        ]
      }
      store_pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_published: boolean | null
          location_id: string | null
          meta_description: string | null
          meta_title: string | null
          slug: string
          sort_order: number | null
          store_id: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          location_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          sort_order?: number | null
          store_id: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          location_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          sort_order?: number | null
          store_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_pages_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      store_seo_settings: {
        Row: {
          created_at: string
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          store_id: number
          structured_data: Json | null
          twitter_description: string | null
          twitter_image_url: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          store_id: number
          structured_data?: Json | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          store_id?: number
          structured_data?: Json | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_themes: {
        Row: {
          accent_color: string | null
          category: string | null
          config: Json
          created_at: string
          description: string | null
          font_family: string | null
          footer_style: string | null
          header_style: string | null
          id: string
          is_premium: boolean | null
          layout_style: string | null
          name: string
          preview_image_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          category?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          font_family?: string | null
          footer_style?: string | null
          header_style?: string | null
          id?: string
          is_premium?: boolean | null
          layout_style?: string | null
          name: string
          preview_image_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          category?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          font_family?: string | null
          footer_style?: string | null
          header_style?: string | null
          id?: string
          is_premium?: boolean | null
          layout_style?: string | null
          name?: string
          preview_image_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_widgets: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean | null
          position: string | null
          sort_order: number | null
          store_id: number
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          sort_order?: number | null
          store_id: number
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          sort_order?: number | null
          store_id?: number
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_payments: {
        Row: {
          amount: number
          card_brand: string | null
          card_last4: string | null
          created_at: string
          currency: string
          id: number
          payment_intent_id: string
          payment_method_id: string | null
          payment_status: string
          transaction_id: number | null
        }
        Insert: {
          amount: number
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string
          currency?: string
          id?: never
          payment_intent_id: string
          payment_method_id?: string | null
          payment_status: string
          transaction_id?: number | null
        }
        Update: {
          amount?: number
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string
          currency?: string
          id?: never
          payment_intent_id?: string
          payment_method_id?: string | null
          payment_status?: string
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_configurations: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean | null
          location_id: string | null
          name: string
          rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          location_id?: string | null
          name: string
          rate: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          location_id?: string | null
          name?: string
          rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_configurations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_discounts: {
        Row: {
          created_at: string | null
          discount_amount: number
          discount_id: string | null
          id: string
          location_id: string | null
          transaction_id: number | null
        }
        Insert: {
          created_at?: string | null
          discount_amount: number
          discount_id?: string | null
          id?: string
          location_id?: string | null
          transaction_id?: number | null
        }
        Update: {
          created_at?: string | null
          discount_amount?: number
          discount_id?: string | null
          id?: string
          location_id?: string | null
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_discounts_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_discounts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_discounts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          created_at: string
          gift_card_id: number | null
          id: number
          inventory_id: number | null
          location_id: string | null
          price: number
          quantity: number
          service_id: number | null
          transaction_id: number
        }
        Insert: {
          created_at?: string
          gift_card_id?: number | null
          id?: number
          inventory_id?: number | null
          location_id?: string | null
          price: number
          quantity: number
          service_id?: number | null
          transaction_id: number
        }
        Update: {
          created_at?: string
          gift_card_id?: number | null
          id?: number
          inventory_id?: number | null
          location_id?: string | null
          price?: number
          quantity?: number
          service_id?: number | null
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          assigned_user_id: string | null
          created_at: string
          customer_id: number | null
          discount_id: string | null
          discount_total: number | null
          gift_card_id: number | null
          id: number
          is_split_payment: boolean | null
          location_id: string | null
          loyalty_program_id: number | null
          notes: string | null
          payment_method: string
          refunded_amount: number | null
          shift_id: number | null
          source: string
          status: string
          store_id: number | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          use_loyalty_points: boolean | null
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string
          customer_id?: number | null
          discount_id?: string | null
          discount_total?: number | null
          gift_card_id?: number | null
          id?: number
          is_split_payment?: boolean | null
          location_id?: string | null
          loyalty_program_id?: number | null
          notes?: string | null
          payment_method: string
          refunded_amount?: number | null
          shift_id?: number | null
          source?: string
          status?: string
          store_id?: number | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount: number
          use_loyalty_points?: boolean | null
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string
          customer_id?: number | null
          discount_id?: string | null
          discount_total?: number | null
          gift_card_id?: number | null
          id?: number
          is_split_payment?: boolean | null
          location_id?: string | null
          loyalty_program_id?: number | null
          notes?: string | null
          payment_method?: string
          refunded_amount?: number | null
          shift_id?: number | null
          source?: string
          status?: string
          store_id?: number | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          use_loyalty_points?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_loyalty_program_id_fkey"
            columns: ["loyalty_program_id"]
            isOneToOne: false
            referencedRelation: "loyalty_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "online_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          active_minutes: number | null
          created_at: string
          customer_membership_id: string
          id: string
          location_id: string | null
          metadata: Json | null
          revenue_cents: number | null
          tracking_date: string
          transaction_count: number | null
          unique_customers: number | null
          updated_at: string
        }
        Insert: {
          active_minutes?: number | null
          created_at?: string
          customer_membership_id: string
          id?: string
          location_id?: string | null
          metadata?: Json | null
          revenue_cents?: number | null
          tracking_date?: string
          transaction_count?: number | null
          unique_customers?: number | null
          updated_at?: string
        }
        Update: {
          active_minutes?: number | null
          created_at?: string
          customer_membership_id?: string
          id?: string
          location_id?: string | null
          metadata?: Json | null
          revenue_cents?: number | null
          tracking_date?: string
          transaction_count?: number | null
          unique_customers?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_customer_membership_id_fkey"
            columns: ["customer_membership_id"]
            isOneToOne: false
            referencedRelation: "customer_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          granted: boolean
          granted_at: string
          granted_by: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          granted?: boolean
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          granted?: boolean
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          allowed_locations: string[] | null
          created_at: string
          email: string
          employee_code: string | null
          full_name: string | null
          id: string
          role: string | null
          role_id: string | null
        }
        Insert: {
          allowed_locations?: string[] | null
          created_at?: string
          email: string
          employee_code?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          role_id?: string | null
        }
        Update: {
          allowed_locations?: string[] | null
          created_at?: string
          email?: string
          employee_code?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          location_id: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_to_refunded_amount: {
        Args: { p_amount: number; p_transaction_id: number }
        Returns: number
      }
      adjust_inventory_quantity: {
        Args: { p_adjustment: number; p_inventory_id: number }
        Returns: undefined
      }
      calculate_loyalty_points: {
        Args: { transaction_amount: number }
        Returns: number
      }
      calculate_loyalty_points_for_location: {
        Args: {
          p_location_id: string
          p_program_id?: number
          transaction_amount: number
        }
        Returns: number
      }
      create_storefront_customer: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_location_id?: string
          p_name: string
          p_phone: string
        }
        Returns: {
          email: string
          first_name: string
          id: number
          last_name: string
          location_id: string
          loyalty_points: number
          name: string
          phone: string
        }[]
      }
      generate_gift_card_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_safe_customer_data: {
        Args: { p_customer_id: number }
        Returns: {
          email: string
          first_name: string
          id: number
          last_name: string
          location_id: string
          loyalty_points: number
          name: string
          online_account_active: boolean
        }[]
      }
      get_user_effective_permissions: {
        Args: { p_user_id: string }
        Returns: {
          granted: boolean
          permission_id: string
          permission_name: string
          source: string
        }[]
      }
      get_user_effective_permissions_with_features: {
        Args: { p_location_id?: string; p_user_id: string }
        Returns: {
          feature_enabled: boolean
          granted: boolean
          permission_id: string
          permission_name: string
          source: string
        }[]
      }
      is_feature_enabled: {
        Args: { feature_name: string; location_id: string }
        Returns: boolean
      }
      is_valid_inventory_items: {
        Args: { items: Json }
        Returns: boolean
      }
      is_vendor_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_category?: string
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_location_id?: string
          p_risk_level?: string
          p_user_agent?: string
          p_user_identifier?: string
        }
        Returns: string
      }
      process_gift_card_transaction: {
        Args: {
          p_amount: number
          p_gift_card_id: number
          p_transaction_id: number
          p_type: string
        }
        Returns: undefined
      }
      process_hourly_billing: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_loyalty_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      trigger_billing_for_location: {
        Args: { location_uuid: string }
        Returns: Json
      }
      verify_storefront_customer: {
        Args: { p_email: string; p_location_id: string; p_phone: string }
        Returns: {
          email: string
          first_name: string
          id: number
          last_name: string
          location_id: string
          loyalty_points: number
          name: string
          phone: string
        }[]
      }
    }
    Enums: {
      role_scope: "customer" | "vendor"
      user_role: "admin" | "manager" | "employee"
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
      role_scope: ["customer", "vendor"],
      user_role: ["admin", "manager", "employee"],
    },
  },
} as const
