
import { Json } from "../json"

export interface TransactionsTables {
  transactions: {
    Row: {
      id: number
      payment_method: string
      customer_id: number | null
      status: string
      total_amount: number
      subtotal: number
      tax_amount: number
      tax_rate: number
      created_at: string
      use_loyalty_points: boolean
      assigned_user_id: string | null
      gift_card_id: number | null
      is_split_payment: boolean
      source: string
      store_id: number | null
      refunded_amount: number
      shift_id: number | null
      location_id?: string
      discount_total?: number
      loyalty_program_id?: number | null
      user_data?: {
        id: string
        full_name: string | null
        email: string
        employee_code: string | null
      }
    }
    Insert: {
      id?: number
      payment_method: string
      customer_id?: number | null
      status?: string
      total_amount: number
      subtotal: number
      tax_amount: number
      tax_rate: number
      created_at?: string
      use_loyalty_points?: boolean
      assigned_user_id?: string | null
      gift_card_id?: number | null
      is_split_payment?: boolean
      source?: string
      store_id?: number | null
      refunded_amount?: number
      shift_id?: number | null
      location_id?: string
      discount_total?: number
      loyalty_program_id?: number | null
    }
    Update: {
      id?: number
      payment_method?: string
      customer_id?: number | null
      status?: string
      total_amount?: number
      subtotal?: number
      tax_amount?: number
      tax_rate?: number
      created_at?: string
      use_loyalty_points?: boolean
      assigned_user_id?: string | null
      gift_card_id?: number | null
      is_split_payment?: boolean
      source?: string
      store_id?: number | null
      refunded_amount?: number
      shift_id?: number | null
      location_id?: string
      discount_total?: number
      loyalty_program_id?: number | null
    }
  }
  transaction_items: {
    Row: {
      id: number
      transaction_id: number
      service_id: number | null
      inventory_id: number | null
      quantity: number
      price: number
      created_at: string
      location_id?: string
    }
    Insert: {
      id?: number
      transaction_id: number
      service_id?: number | null
      inventory_id?: number | null
      quantity: number
      price: number
      created_at?: string
      location_id?: string
    }
    Update: {
      id?: number
      transaction_id?: number
      service_id?: number | null
      inventory_id?: number | null
      quantity?: number
      price?: number
      created_at?: string
      location_id?: string
    }
  }
  refunds: {
    Row: {
      id: number
      transaction_id: number
      refund_amount: number
      payment_method: string
      refunded_at: string
      refunded_by: string | null
      notes: string | null
      status: string
      location_id?: string
    }
    Insert: {
      id?: number
      transaction_id: number
      refund_amount: number
      payment_method: string
      refunded_at?: string
      refunded_by?: string | null
      notes?: string | null
      status?: string
      location_id?: string
    }
    Update: {
      id?: number
      transaction_id?: number
      refund_amount?: number
      payment_method?: string
      refunded_at?: string
      refunded_by?: string | null
      notes?: string | null
      status?: string
      location_id?: string
    }
  }
}
