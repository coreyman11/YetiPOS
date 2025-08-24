
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Database } from "@/types/supabase"
import { useEffect, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { inventoryApi } from "@/services"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface AddInventoryFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (item: Omit<InventoryItem, 'id' | 'created_at'>) => Promise<void>
}

export const AddInventoryForm = ({ isOpen, onOpenChange, onSubmit }: AddInventoryFormProps) => {
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    quantity: 0,
    price: 0,
    sku: "",
    size: "",
    color: "",
    cost: 0,
    supplier: "",
    barcode: "",
    category: "",
    brand: "",
    min_stock_level: 0,
    max_stock_level: 0,
    location: "",
    vendor_id: "",
    reorder_point: 0,
    needs_label: true, // Add this field
  })
  
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
    await onSubmit(newItem)
    setNewItem({
      name: "",
      description: "",
      quantity: 0,
      price: 0,
      sku: "",
      size: "",
      color: "",
      cost: 0,
      supplier: "",
      barcode: "",
      category: "",
      brand: "",
      min_stock_level: 0,
      max_stock_level: 0,
      location: "",
      vendor_id: "",
      reorder_point: 0,
      needs_label: true, // Add this field to reset as well
    })
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
      
      setNewItem({ ...newItem, category: newCategory.name.toLowerCase() })
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                required
                value={newItem.sku}
                onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={newItem.barcode}
                onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={newItem.brand}
                onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
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
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
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
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={newItem.size}
                onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={newItem.color}
                onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                required
                min="0"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Retail Price</Label>
              <Input
                id="price"
                type="number"
                required
                min="0"
                step="0.01"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                required
                min="0"
                step="0.01"
                value={newItem.cost}
                onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newItem.location}
                placeholder="e.g., Aisle 5, Shelf B"
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_id">Vendor ID</Label>
              <Input
                id="vendor_id"
                value={newItem.vendor_id}
                onChange={(e) => setNewItem({ ...newItem, vendor_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                value={newItem.min_stock_level}
                onChange={(e) => setNewItem({ ...newItem, min_stock_level: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock_level">Maximum Stock Level</Label>
              <Input
                id="max_stock_level"
                type="number"
                min="0"
                value={newItem.max_stock_level}
                onChange={(e) => setNewItem({ ...newItem, max_stock_level: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={newItem.reorder_point}
                onChange={(e) => setNewItem({ ...newItem, reorder_point: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full mt-6">
            Add Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
