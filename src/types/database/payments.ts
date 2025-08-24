
import { Json } from "../json"

export interface PaymentsTables {
  stripe_payments: {
    Row: {
      id: number
      transaction_id: number
      payment_intent_id: string
      payment_method_id: string | null
      payment_status: string
      amount: number
      currency: string
      card_last4: string | null
      card_brand: string | null
      created_at: string
    }
    Insert: {
      id?: number
      transaction_id: number
      payment_intent_id: string
      payment_method_id?: string | null
      payment_status: string
      amount: number
      currency?: string
      card_last4?: string | null
      card_brand?: string | null
      created_at?: string
    }
    Update: {
      id?: number
      transaction_id?: number
      payment_intent_id?: string
      payment_method_id?: string | null
      payment_status?: string
      amount?: number
      currency?: string
      card_last4?: string | null
      card_brand?: string | null
      created_at?: string
    }
  }
}
