
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { storesApi } from "@/services"

interface CreateStoreDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const CreateStoreDialog = ({ isOpen, onOpenChange, onSuccess }: CreateStoreDialogProps) => {
  const [newStore, setNewStore] = useState({
    name: "",
    slug: "",
    description: "",
    themeColor: "#000000"
  })

  const { toast } = useToast()

  const handleCreateStore = async () => {
    try {
      await storesApi.create({
        name: newStore.name,
        slug: newStore.slug.toLowerCase().replace(/\s+/g, '-'),
        description: newStore.description || null,
        logo_url: null,
        banner_url: null,
        banner_title: null,
        banner_subtitle: null,
        banner_cta_text: null,
        theme_color: newStore.themeColor,
        is_active: true
      })
      onOpenChange(false)
      onSuccess()
      toast({
        title: "Success",
        description: "Store created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create store",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Online Store</DialogTitle>
          <DialogDescription>
            Create a new online store to showcase and sell your products.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Store Name</Label>
            <Input
              id="name"
              value={newStore.name}
              onChange={(e) => setNewStore(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="slug">Store URL</Label>
            <Input
              id="slug"
              value={newStore.slug}
              onChange={(e) => setNewStore(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="my-store"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newStore.description}
              onChange={(e) => setNewStore(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="themeColor">Theme Color</Label>
            <Input
              id="themeColor"
              type="color"
              value={newStore.themeColor}
              onChange={(e) => setNewStore(prev => ({ ...prev, themeColor: e.target.value }))}
            />
          </div>
          <Button className="w-full" onClick={handleCreateStore}>
            Create Store
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
