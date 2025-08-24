
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Package, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Database } from "@/integrations/supabase/types"
import { useQuery } from "@tanstack/react-query"
import { storesApi } from "@/services"
import { StoreInventorySheet } from "./StoreInventorySheet"

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface InventoryItemCardProps {
  item: InventoryItem
  onAdd: (item: InventoryItem) => void
}

export const InventoryCard = ({ item, onAdd }: InventoryItemCardProps) => {
  const [isStoreSheetOpen, setIsStoreSheetOpen] = useState(false)
  
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: storesApi.getAll,
  })

  const activeStore = stores[0] // For now, just use the first store

  return (
    <>
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary ${
          item.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={() => item.quantity > 0 && onAdd(item)}
      >
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xl">{item.name}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            SKU: {item.sku}
          </p>
        </CardHeader>
        <CardFooter className="flex justify-between items-center">
          <span className="text-xl font-bold">
            ${Number(item.price).toFixed(2)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Stock: {item.quantity}
            </span>
            {activeStore && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsStoreSheetOpen(true)
                }}
              >
                <Store className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {activeStore && (
        <StoreInventorySheet
          isOpen={isStoreSheetOpen}
          onClose={() => setIsStoreSheetOpen(false)}
          storeId={activeStore.id}
          item={item}
        />
      )}
    </>
  )
}

export default InventoryCard
