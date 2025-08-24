
import { Json } from "../json"

export interface ServicesTables {
  services: {
    Row: {
      id: number
      name: string
      price: number
      created_at: string
      inventory_items?: Json
      location_id?: string
    }
    Insert: {
      id?: number
      name: string
      price: number
      created_at?: string
      inventory_items?: Json
      location_id?: string
    }
    Update: {
      id?: number
      name?: string
      price?: number
      created_at?: string
      inventory_items?: Json
      location_id?: string
    }
  }
}
