
import { Json } from "../json"

export interface ShiftsTables {
  shifts: {
    Row: {
      id: number
      name: string
      start_time: string
      end_time: string | null
      assigned_user_id: string | null
      opening_balance: number | null
      closing_balance: number | null
      total_sales: number | null
      cash_discrepancy: number | null
      status: string
      created_at: string
      updated_at: string
      location_id: string | null
    }
    Insert: {
      id?: number
      name: string
      start_time?: string
      end_time?: string | null
      assigned_user_id?: string | null
      opening_balance?: number | null
      closing_balance?: number | null
      total_sales?: number | null
      cash_discrepancy?: number | null
      status?: string
      created_at?: string
      updated_at?: string
      location_id?: string | null
    }
    Update: {
      id?: number
      name?: string
      start_time?: string
      end_time?: string | null
      assigned_user_id?: string | null
      opening_balance?: number | null
      closing_balance?: number | null
      total_sales?: number | null
      cash_discrepancy?: number | null
      status?: string
      created_at?: string
      updated_at?: string
      location_id?: string | null
    }
  }
}
