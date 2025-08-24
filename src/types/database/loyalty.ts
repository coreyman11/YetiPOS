
import { Json } from "../json"

export interface LoyaltyTables {
  loyalty_program_settings: {
    Row: {
      id: number
      points_per_dollar: number
      minimum_points_redeem: number
      points_value_cents: number
      created_at: string
      updated_at: string
      location_id?: string
    }
    Insert: {
      id?: number
      points_per_dollar: number
      minimum_points_redeem: number
      points_value_cents: number
      created_at?: string
      updated_at?: string
      location_id?: string
    }
    Update: {
      id?: number
      points_per_dollar?: number
      minimum_points_redeem?: number
      points_value_cents?: number
      created_at?: string
      updated_at?: string
      location_id?: string
    }
  }
  loyalty_transactions: {
    Row: {
      id: number
      customer_id: number
      transaction_id: number | null
      points_earned: number | null
      points_redeemed: number | null
      points_balance: number
      type: 'earn' | 'redeem'
      description: string
      created_at: string
      location_id?: string
      loyalty_program_id?: number | null
    }
    Insert: {
      id?: number
      customer_id: number
      transaction_id?: number | null
      points_earned?: number | null
      points_redeemed?: number | null
      points_balance: number
      type: 'earn' | 'redeem'
      description: string
      created_at?: string
      location_id?: string
      loyalty_program_id?: number | null
    }
    Update: {
      id?: number
      customer_id?: number
      transaction_id?: number | null
      points_earned?: number | null
      points_redeemed?: number | null
      points_balance?: number
      type?: 'earn' | 'redeem'
      description?: string
      created_at?: string
      location_id?: string
      loyalty_program_id?: number | null
    }
  }
}
