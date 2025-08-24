import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Upload, Check, Store as StoreIcon, ShoppingBag } from "lucide-react"
import { Database } from "@/integrations/supabase/types"

type Store = Database['public']['Tables']['online_stores']['Row']

interface StoreDesignTabProps {
  store: Partial<Store>
  onChange: (updates: Partial<Store>) => void
}

export const StoreDesignTab = ({ store, onChange }: StoreDesignTabProps) => {
  const [bannerUploading, setBannerUploading] = useState(false)

  const storeStyles = [
    {
      id: 'online_store',
      name: 'Online Store',
      description: 'Perfect for boutiques, gyms, and businesses selling products or memberships',
      icon: StoreIcon,
      primary_color: '#000000',
      secondary_color: '#666666',
      accent_color: '#007bff',
      font_family: 'Inter',
      header_style: 'standard',
      footer_style: 'standard',
      layout_style: 'modern'
    },
    {
      id: 'online_ordering',
      name: 'Online Ordering',
      description: 'Ideal for restaurants and food places with online ordering capabilities',
      icon: ShoppingBag,
      primary_color: '#d73527',
      secondary_color: '#8b1816',
      accent_color: '#f59e0b',
      font_family: 'Poppins',
      header_style: 'minimal',
      footer_style: 'minimal',
      layout_style: 'bold'
    }
  ]

  const applyStyle = (style: typeof storeStyles[0]) => {
    const styleUpdates = {
      primary_color: style.primary_color,
      secondary_color: style.secondary_color,
      accent_color: style.accent_color,
      font_family: style.font_family,
      header_style: style.header_style,
      footer_style: style.footer_style,
      layout_style: style.layout_style
    }
    onChange(styleUpdates)
  }

  const handleInputChange = (field: keyof Store, value: any) => {
    onChange({ [field]: value })
  }

  const selectedStyle = storeStyles.find(s => 
    s.primary_color === store.primary_color && 
    s.layout_style === store.layout_style
  )

  return (
    <div className="space-y-8">
      {/* Store Style Selection */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Store Style</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Choose the style that best fits your business type.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storeStyles.map((style) => {
              const Icon = style.icon
              const isSelected = selectedStyle?.id === style.id
              
              return (
                <Card 
                  key={style.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => applyStyle(style)}
                >
                  <CardHeader className="p-6">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{style.name}</CardTitle>
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <CardDescription className="text-sm mt-1">
                          {style.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Color Customization */}
        <div>
          <h3 className="text-lg font-medium mb-4">Color Palette</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={store.primary_color || '#000000'}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={store.primary_color || '#000000'}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={store.secondary_color || '#666666'}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={store.secondary_color || '#666666'}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  placeholder="#666666"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={store.accent_color || '#007bff'}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={store.accent_color || '#007bff'}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  placeholder="#007bff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Typography */}
        <div>
          <h3 className="text-lg font-medium mb-4">Typography</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={store.font_family || 'Inter'}
                onValueChange={(value) => handleInputChange('font_family', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Layout Options */}
        <div>
          <h3 className="text-lg font-medium mb-4">Layout & Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Header Style</Label>
              <Select
                value={store.header_style || 'standard'}
                onValueChange={(value) => handleInputChange('header_style', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select header style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="centered">Centered</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Footer Style</Label>
              <Select
                value={store.footer_style || 'standard'}
                onValueChange={(value) => handleInputChange('footer_style', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select footer style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Layout Style</Label>
              <Select
                value={store.layout_style || 'modern'}
                onValueChange={(value) => handleInputChange('layout_style', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Banner Configuration */}
        <div>
          <h3 className="text-lg font-medium mb-4">Hero Banner</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="flex items-center space-x-4">
                {store.banner_url && (
                  <img
                    src={store.banner_url}
                    alt="Store banner"
                    className="w-32 h-20 object-cover border rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <Input
                    value={store.banner_url || ''}
                    onChange={(e) => handleInputChange('banner_url', e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                <Button variant="outline" size="sm" disabled={bannerUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Recommended size: 1920x600px
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Banner Title</Label>
                <Input
                  value={store.banner_title || ''}
                  onChange={(e) => handleInputChange('banner_title', e.target.value)}
                  placeholder="Welcome to our store"
                />
              </div>
              <div className="space-y-2">
                <Label>Banner Subtitle</Label>
                <Input
                  value={store.banner_subtitle || ''}
                  onChange={(e) => handleInputChange('banner_subtitle', e.target.value)}
                  placeholder="Discover amazing products"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Call-to-Action Text</Label>
              <Input
                value={store.banner_cta_text || ''}
                onChange={(e) => handleInputChange('banner_cta_text', e.target.value)}
                placeholder="Shop Now"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}