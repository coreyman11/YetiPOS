
import { Json } from "../json"

export interface InventoryTables {
  inventory: {
    Row: {
      id: number
      name: string
      description: string
      barcode: string
      quantity: number
      price: number
      created_at: string
      size?: string
      color?: string
      cost: number
      supplier?: string
      sku?: string
      category?: string
      brand?: string
      min_stock_level: number
      max_stock_level: number
      location?: string
      location_id?: string
      vendor_id?: string
      last_ordered_date?: string
      reorder_point: number
      needs_label: boolean
      label_printed_at?: string
    }
    Insert: {
      id?: number
      name: string
      description: string
      barcode: string
      quantity: number
      price: number
      created_at?: string
      size?: string
      color?: string
      cost?: number
      supplier?: string
      sku?: string
      category?: string
      brand?: string
      min_stock_level?: number
      max_stock_level?: number
      location?: string
      location_id?: string
      vendor_id?: string
      last_ordered_date?: string
      reorder_point?: number
      needs_label?: boolean
      label_printed_at?: string
    }
    Update: {
      id?: number
      name?: string
      description?: string
      barcode?: string
      quantity?: number
      price?: number
      created_at?: string
      size?: string
      color?: string
      cost?: number
      supplier?: string
      sku?: string
      category?: string
      brand?: string
      min_stock_level?: number
      max_stock_level?: number
      location?: string
      location_id?: string
      vendor_id?: string
      last_ordered_date?: string
      reorder_point?: number
      needs_label?: boolean
      label_printed_at?: string
    }
  }
}
