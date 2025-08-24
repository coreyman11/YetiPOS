
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { storesApi } from "@/services"
import { Palette, Image, Type, Store, Layout } from "lucide-react"
import { Database } from "@/types/supabase"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

type Store = Database['public']['Tables']['online_stores']['Row']

interface EditStoreDialogProps {
  store: Store
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const EditStoreDialog = ({ store, isOpen, onOpenChange, onSuccess }: EditStoreDialogProps) => {
  const [formData, setFormData] = useState({
    name: store.name,
    slug: store.slug,
    description: store.description || "",
    logo_url: store.logo_url || "",
    banner_url: store.banner_url || "",
    banner_title: store.banner_title || "",
    banner_subtitle: store.banner_subtitle || "",
    banner_cta_text: store.banner_cta_text || "Shop Now",
    theme_color: store.theme_color || "#000000",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast: uiToast } = useToast()

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    try {
      setIsSubmitting(true)
      
      // Prepare the data, ensuring proper format for all fields
      const dataToUpdate = {
        ...formData,
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        // Ensure empty strings are sent as null to avoid database validation errors
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        banner_url: formData.banner_url || null,
        banner_title: formData.banner_title || null,
        banner_subtitle: formData.banner_subtitle || null,
        banner_cta_text: formData.banner_cta_text || "Shop Now",
      }
      
      console.log("Updating store with data:", dataToUpdate)
      
      await storesApi.update(store.id, dataToUpdate)
      
      toast.success("Store updated successfully", {
        position: "bottom-right",
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating store:", error)
      uiToast({
        title: "Error",
        description: "Failed to update store",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Edit Store
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Store Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="flex items-center gap-2">
              URL Path
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="my-store"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your store..."
            />
          </div>

          <Separator className="my-4" />
          
          <h3 className="text-lg font-medium">Visual Assets</h3>

          <div className="space-y-2">
            <Label htmlFor="logo" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo URL
            </Label>
            <Input
              id="logo"
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <Separator className="my-4" />
          
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Banner Configuration
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure the main banner that appears at the top of your online store.
          </p>

          <div className="space-y-2">
            <Label htmlFor="bannerUrl" className="flex items-center gap-2">
              Banner Image URL
            </Label>
            <Input
              id="bannerUrl"
              type="url"
              value={formData.banner_url}
              onChange={(e) => setFormData(prev => ({ ...prev, banner_url: e.target.value }))}
              placeholder="https://example.com/banner.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Recommended size: 1600x500 pixels
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerTitle">
              Banner Title
            </Label>
            <Input
              id="bannerTitle"
              value={formData.banner_title}
              onChange={(e) => setFormData(prev => ({ ...prev, banner_title: e.target.value }))}
              placeholder="Summer Collection"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerSubtitle">
              Banner Subtitle
            </Label>
            <Input
              id="bannerSubtitle"
              value={formData.banner_subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, banner_subtitle: e.target.value }))}
              placeholder="Discover our new products"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerCta">
              Call to Action Text
            </Label>
            <Input
              id="bannerCta"
              value={formData.banner_cta_text}
              onChange={(e) => setFormData(prev => ({ ...prev, banner_cta_text: e.target.value }))}
              placeholder="Shop Now"
            />
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label htmlFor="themeColor" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme Color
            </Label>
            <div className="flex gap-2">
              <Input
                id="themeColor"
                type="color"
                value={formData.theme_color}
                onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                className="w-20 h-10 p-1"
              />
              <Input
                type="text"
                value={formData.theme_color}
                onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                placeholder="#000000"
                className="font-mono"
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
