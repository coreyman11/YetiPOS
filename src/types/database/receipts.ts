
import { Json } from "../json"

export interface ReceiptsTables {
  receipt_settings: {
    Row: {
      id: string
      location_id: string
      business_name: string
      header_text: string
      footer_text: string
      logo_url: string | null
      contact_phone: string | null
      contact_email: string | null
      contact_website: string | null
      template_id: string | null
      show_tax_details: boolean
      show_discount_details: boolean
      include_customer_info: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      location_id: string
      business_name?: string
      header_text?: string
      footer_text?: string
      logo_url?: string | null
      contact_phone?: string | null
      contact_email?: string | null
      contact_website?: string | null
      template_id?: string | null
      show_tax_details?: boolean
      show_discount_details?: boolean
      include_customer_info?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      location_id?: string
      business_name?: string
      header_text?: string
      footer_text?: string
      logo_url?: string | null
      contact_phone?: string | null
      contact_email?: string | null
      contact_website?: string | null
      template_id?: string | null
      show_tax_details?: boolean
      show_discount_details?: boolean
      include_customer_info?: boolean
      created_at?: string
      updated_at?: string
    }
  }
}
