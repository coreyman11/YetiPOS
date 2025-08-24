
import { Button } from "@/components/ui/button"
import { Eye, Package, Pencil } from "lucide-react"
import { Database } from "@/types/supabase"

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface InventoryItemCardProps {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onView: (item: InventoryItem) => void
}

export const InventoryItemCard = ({ item, onEdit, onView }: InventoryItemCardProps) => {
  const calculateProfitMargin = () => {
    if (!item.cost || item.cost === 0) return 0;
    return ((item.price - item.cost) / item.price * 100).toFixed(1);
  };

  return (
    <div className="group rounded-lg border p-4 hover:bg-accent transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold">{item.name}</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(item)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
            <div>
              <span className="font-medium">SKU:</span> {item.sku}
            </div>
            {item.barcode && (
              <div>
                <span className="font-medium">Barcode:</span> {item.barcode}
              </div>
            )}
            {item.brand && (
              <div>
                <span className="font-medium">Brand:</span> {item.brand}
              </div>
            )}
            {item.category && (
              <div>
                <span className="font-medium">Category:</span> {item.category}
              </div>
            )}
            <div>
              <span className="font-medium">Quantity:</span> {item.quantity}
            </div>
            {(item.size || item.color) && (
              <div>
                <span className="font-medium">Variant:</span>{' '}
                {[item.size, item.color].filter(Boolean).join(' - ')}
              </div>
            )}
            <div>
              <span className="font-medium">Price:</span> ${item.price.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Margin:</span> {calculateProfitMargin()}%
            </div>
            {item.location && (
              <div>
                <span className="font-medium">Location:</span> {item.location}
              </div>
            )}
            {item.quantity <= (item.reorder_point || 0) && (
              <div className="col-span-2 mt-2">
                <span className="text-red-500 font-medium">
                  Low Stock Alert: Reorder Needed
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
