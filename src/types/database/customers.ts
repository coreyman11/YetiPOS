
import { Json } from "../json"

export interface CustomersTables {
  customers: {
    Row: {
      id: number
      name: string
      email: string
      phone: string
      first_name: string
      last_name: string
      mobile: string
      address_line1: string
      city: string
      state: string
      zip: string
      credit_card_number: string
      credit_card_expire_date?: string
      token?: string
      span?: string
      bin?: string
      created_at?: string
      loyalty_points: number
    }
    Insert: {
      id?: number
      name: string
      email: string
      phone: string
      first_name?: string
      last_name?: string
      mobile?: string
      address_line1?: string
      city?: string
      state?: string
      zip?: string
      credit_card_number?: string
      credit_card_expire_date?: string
      token?: string
      span?: string
      bin?: string
      created_at?: string
      loyalty_points?: number
    }
    Update: {
      id?: number
      name?: string
      email?: string
      phone?: string
      first_name?: string
      last_name?: string
      mobile?: string
      address_line1?: string
      city?: string
      state?: string
      zip?: string
      credit_card_number?: string
      credit_card_expire_date?: string
      token?: string
      span?: string
      bin?: string
      created_at?: string
      loyalty_points?: number
    }
  }
}
