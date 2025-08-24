
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { storesApi } from "@/services"
import { useToast } from "@/hooks/use-toast"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database } from "@/integrations/supabase/types"

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface StoreInventorySheetProps {
  isOpen: boolean
  onClose: () => void
  storeId: number
  item: InventoryItem
}

export function StoreInventorySheet({ isOpen, onClose, storeId, item }: StoreInventorySheetProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const handleAddToStore = async () => {
    try {
      await storesApi.updateStoreInventory([{
        store_id: storeId,
        inventory_id: item.id,
        price: item.price,
        is_visible: true,
        image_url: null,
        location_id: item.location_id
      }])

      toast({
        title: "Success",
        description: "Item added to store successfully"
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to store"
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Add Item to Store</SheetTitle>
          <SheetDescription>
            Configure the item settings for your store.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name">Item Name</Label>
            <div className="col-span-3">
              <p>{item.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={item.price}
              className="col-span-3"
              readOnly
            />
          </div>
          <Button onClick={handleAddToStore}>Add to Store</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
