import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Upload, Globe, ExternalLink } from "lucide-react"
import { Database } from "@/integrations/supabase/types"

type Store = Database['public']['Tables']['online_stores']['Row']

interface StoreGeneralTabProps {
  store: Partial<Store>
  onChange: (updates: Partial<Store>) => void
}

export const StoreGeneralTab = ({ store, onChange }: StoreGeneralTabProps) => {
  const [logoUploading, setLogoUploading] = useState(false)

  const handleInputChange = (field: keyof Store, value: any) => {
    onChange({ [field]: value })
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    handleInputChange('name', name)
    // Auto-generate slug if it's empty or follows the current name pattern
    if (!store.slug || store.slug === generateSlug(store.name || '')) {
      handleInputChange('slug', generateSlug(name))
    }
  }

  return (
    <div className="space-y-8">
      {/* Store Information */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Store Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name *</Label>
              <Input
                id="store-name"
                value={store.name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-slug">Store URL Slug *</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  /store/
                </span>
                <Input
                  id="store-slug"
                  value={store.slug || ''}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="my-awesome-store"
                  className="rounded-l-none"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This will be your store's web address
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="store-description">Store Description</Label>
            <Textarea
              id="store-description"
              value={store.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="A brief description of your store..."
              rows={3}
            />
          </div>
        </div>

        <Separator />

        {/* Logo and Branding */}
        <div>
          <h3 className="text-lg font-medium mb-4">Logo & Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Store Logo</Label>
                <div className="flex items-center space-x-4">
                  {store.logo_url && (
                    <img
                      src={store.logo_url}
                      alt="Store logo"
                      className="w-16 h-16 object-contain border rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <Input
                      value={store.logo_url || ''}
                      onChange={(e) => handleInputChange('logo_url', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <Button variant="outline" size="sm" disabled={logoUploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended size: 300x100px or similar ratio
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme-color">Brand Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={store.theme_color || '#000000'}
                  onChange={(e) => handleInputChange('theme_color', e.target.value)}
                  className="w-20 h-10 p-1 border rounded"
                />
                <Input
                  value={store.theme_color || '#000000'}
                  onChange={(e) => handleInputChange('theme_color', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Store Status */}
        <div>
          <h3 className="text-lg font-medium mb-4">Store Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="store-active">Store Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make your store visible to customers
                </p>
              </div>
              <Switch
                id="store-active"
                checked={store.is_active || false}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
            </div>
            {store.maintenance_mode !== undefined && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Show maintenance page to visitors
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={store.maintenance_mode || false}
                  onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
                />
              </div>
            )}
          </div>
          {store.maintenance_mode && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="maintenance-message">Maintenance Message</Label>
              <Textarea
                id="maintenance-message"
                value={store.maintenance_message || ''}
                onChange={(e) => handleInputChange('maintenance_message', e.target.value)}
                placeholder="We're currently updating our store. Please check back soon!"
                rows={2}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Store Preview */}
        <div>
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="flex space-x-4">
            <Button variant="outline" asChild>
              <a
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span>Preview Store</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}