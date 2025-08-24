
import { Json } from "../json"

export interface TaxesTables {
  tax_configurations: {
    Row: {
      id: number
      name: string
      rate: number
      description: string | null
      is_active: boolean
      created_at: string
      updated_at: string
      location_id?: string
    }
    Insert: {
      id?: number
      name: string
      rate: number
      description?: string | null
      is_active?: boolean
      created_at?: string
      updated_at?: string
      location_id?: string
    }
    Update: {
      id?: number
      name?: string
      rate?: number
      description?: string | null
      is_active?: boolean
      created_at?: string
      updated_at?: string
      location_id?: string
    }
  }
}
