
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Database } from "@/types/supabase"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { inventoryApi } from "@/services"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface EditInventoryFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
  onSubmit: (item: InventoryItem) => Promise<void>
  onChange: (item: InventoryItem) => void
}

export const EditInventoryForm = ({ 
  isOpen, 
  onOpenChange, 
  item, 
  onSubmit,
  onChange 
}: EditInventoryFormProps) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => await inventoryApi.getAllCategories(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    try {
      await onSubmit(item)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      })
    }
  }

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsCreatingCategory(true)
      const newCategory = await inventoryApi.createCategory(newCategoryName.trim())
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      
      if (item) {
        onChange({ ...item, category: newCategory.name.toLowerCase() })
      }
      
      setNewCategoryName("")
      setIsAddingCategory(false)
      
      toast({
        title: "Success",
        description: `Category "${newCategory.name}" created successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                required
                value={item.name}
                onChange={(e) => onChange({ ...item, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                required
                value={item.sku}
                onChange={(e) => onChange({ ...item, sku: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-barcode">Barcode</Label>
              <Input
                id="edit-barcode"
                value={item.barcode || ''}
                onChange={(e) => onChange({ ...item, barcode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={item.brand || ''}
                onChange={(e) => onChange({ ...item, brand: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              {isAddingCategory ? (
                <div className="flex gap-2">
                  <Input
                    id="new-category"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    autoFocus
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleAddNewCategory}
                    disabled={isCreatingCategory}
                  >
                    {isCreatingCategory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsAddingCategory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Select
                      value={item.category || ''}
                      onValueChange={(value) => onChange({ ...item, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name.toLowerCase()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingCategory(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-size">Size</Label>
              <Input
                id="edit-size"
                value={item.size || ''}
                onChange={(e) => onChange({ ...item, size: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                value={item.color || ''}
                onChange={(e) => onChange({ ...item, color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                required
                min="0"
                value={item.quantity}
                onChange={(e) => onChange({ ...item, quantity: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Retail Price</Label>
              <Input
                id="edit-price"
                type="number"
                required
                min="0"
                step="0.01"
                value={item.price}
                onChange={(e) => onChange({ ...item, price: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost</Label>
              <Input
                id="edit-cost"
                type="number"
                required
                min="0"
                step="0.01"
                value={item.cost}
                onChange={(e) => onChange({ ...item, cost: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-supplier">Supplier</Label>
              <Input
                id="edit-supplier"
                value={item.supplier || ''}
                onChange={(e) => onChange({ ...item, supplier: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={item.location || ''}
                placeholder="e.g., Aisle 5, Shelf B"
                onChange={(e) => onChange({ ...item, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor-id">Vendor ID</Label>
              <Input
                id="edit-vendor-id"
                value={item.vendor_id || ''}
                onChange={(e) => onChange({ ...item, vendor_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-min-stock">Minimum Stock Level</Label>
              <Input
                id="edit-min-stock"
                type="number"
                min="0"
                value={item.min_stock_level}
                onChange={(e) => onChange({ ...item, min_stock_level: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-max-stock">Maximum Stock Level</Label>
              <Input
                id="edit-max-stock"
                type="number"
                min="0"
                value={item.max_stock_level}
                onChange={(e) => onChange({ ...item, max_stock_level: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reorder-point">Reorder Point</Label>
              <Input
                id="edit-reorder-point"
                type="number"
                min="0"
                value={item.reorder_point}
                onChange={(e) => onChange({ ...item, reorder_point: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={item.description}
              onChange={(e) => onChange({ ...item, description: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full mt-6">
            Update Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
