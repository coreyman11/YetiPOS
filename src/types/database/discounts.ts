
export interface DiscountsTables {
  discounts: {
    Row: {
      id: string
      name: string
      type: 'percentage' | 'fixed'
      value: number
      start_date: string
      end_date: string | null
      is_active: boolean
      created_at: string
      updated_at: string
      description: string | null
      location_id: string | null
    }
    Insert: {
      id?: string
      name: string
      type: 'percentage' | 'fixed'
      value: number
      start_date?: string
      end_date?: string | null
      is_active?: boolean
      created_at?: string
      updated_at?: string
      description?: string | null
      location_id?: string | null
    }
    Update: {
      id?: string
      name?: string
      type?: 'percentage' | 'fixed'
      value?: number
      start_date?: string
      end_date?: string | null
      is_active?: boolean
      created_at?: string
      updated_at?: string
      description?: string | null
      location_id?: string | null
    }
  }
  transaction_discounts: {
    Row: {
      id: string
      transaction_id: number | null
      discount_id: string | null
      discount_amount: number
      created_at: string | null
      location_id: string | null
    }
    Insert: {
      id?: string
      transaction_id?: number | null
      discount_id?: string | null
      discount_amount: number
      created_at?: string | null
      location_id?: string | null
    }
    Update: {
      id?: string
      transaction_id?: number | null
      discount_id?: string | null
      discount_amount?: number
      created_at?: string | null
      location_id?: string | null
    }
  }
}
