
import { Json } from "../json"

export interface GiftCardsTables {
  gift_cards: {
    Row: {
      id: number
      card_number: string
      initial_balance: number
      current_balance: number
      created_at: string
      expiration_date: string | null
      last_used_at: string | null
      activated_at: string | null
      created_by_transaction_id: number | null
      notes: string | null
      is_active: boolean | null
    }
    Insert: {
      id?: number
      card_number: string
      initial_balance?: number
      current_balance?: number
      created_at?: string
      expiration_date?: string | null
      last_used_at?: string | null
      activated_at?: string | null
      created_by_transaction_id?: number | null
      notes?: string | null
      is_active?: boolean | null
    }
    Update: {
      id?: number
      card_number?: string
      initial_balance?: number
      current_balance?: number
      created_at?: string
      expiration_date?: string | null
      last_used_at?: string | null
      activated_at?: string | null
      created_by_transaction_id?: number | null
      notes?: string | null
      is_active?: boolean | null
    }
  }
  gift_card_transactions: {
    Row: {
      id: number
      gift_card_id: number
      transaction_id: number | null
      type: string
      amount: number
      balance_after: number
      created_at: string
    }
    Insert: {
      id?: number
      gift_card_id: number
      transaction_id?: number | null
      type: string
      amount: number
      balance_after: number
      created_at?: string
    }
    Update: {
      id?: number
      gift_card_id?: number
      transaction_id?: number | null
      type?: string
      amount?: number
      balance_after?: number
      created_at?: string
    }
  }
}
