
import { Json } from "../json"

export interface PrintersTables {
  printer_configurations: {
    Row: {
      id: number
      name: string
      type: 'wifi' | 'bluetooth' | 'local' | 'network'
      connection_details: Json
      is_default: boolean
      status: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: number
      name: string
      type: 'wifi' | 'bluetooth' | 'local' | 'network'
      connection_details: Json
      is_default?: boolean
      status?: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: number
      name?: string
      type?: 'wifi' | 'bluetooth' | 'local' | 'network'
      connection_details?: Json
      is_default?: boolean
      status?: string
      created_at?: string
      updated_at?: string
    }
  }
  receipts: {
    Row: {
      id: number
      transaction_id: number
      created_at: string
      printed: boolean
      template: string
      printer_id: string | null
      status: string
      error_message: string | null
    }
    Insert: {
      id?: number
      transaction_id: number
      created_at?: string
      printed?: boolean
      template: string
      printer_id?: string | null
      status?: string
      error_message?: string | null
    }
    Update: {
      id?: number
      transaction_id?: number
      created_at?: string
      printed?: boolean
      template?: string
      printer_id?: string | null
      status?: string
      error_message?: string | null
    }
  }
}
