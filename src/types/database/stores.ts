
export interface StoresTables {
  online_stores: {
    Row: {
      id: number
      name: string
      slug: string
      description: string | null
      logo_url: string | null
      banner_url: string | null
      banner_title: string | null
      banner_subtitle: string | null
      banner_cta_text: string | null
      is_active: boolean
      theme_color: string
      primary_color: string
      secondary_color: string
      accent_color: string
      font_family: string
      header_style: string
      footer_style: string
      layout_style: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: number
      name: string
      slug: string
      description?: string | null
      logo_url?: string | null
      banner_url?: string | null
      banner_title?: string | null
      banner_subtitle?: string | null
      banner_cta_text?: string | null
      is_active?: boolean
      theme_color?: string
      primary_color?: string
      secondary_color?: string
      accent_color?: string
      font_family?: string
      header_style?: string
      footer_style?: string
      layout_style?: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: number
      name?: string
      slug?: string
      description?: string | null
      logo_url?: string | null
      banner_url?: string | null
      banner_title?: string | null
      banner_subtitle?: string | null
      banner_cta_text?: string | null
      is_active?: boolean
      theme_color?: string
      primary_color?: string
      secondary_color?: string
      accent_color?: string
      font_family?: string
      header_style?: string
      footer_style?: string
      layout_style?: string
      created_at?: string
      updated_at?: string
    }
  }
  store_inventory: {
    Row: {
      id: number
      store_id: number
      inventory_id: number
      is_visible: boolean
      price: number
      image_url: string | null
      created_at: string
    }
    Insert: {
      id?: number
      store_id: number
      inventory_id: number
      is_visible?: boolean
      price: number
      image_url?: string | null
      created_at?: string
    }
    Update: {
      id?: number
      store_id?: number
      inventory_id?: number
      is_visible?: boolean
      price?: number
      image_url?: string | null
      created_at?: string
    }
  }
}
