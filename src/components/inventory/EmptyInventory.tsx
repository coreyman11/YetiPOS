
import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyInventoryProps {
  onAddItem: () => void
}

export const EmptyInventory = ({ onAddItem }: EmptyInventoryProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
      <Package className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">No items found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Add your first inventory item to get started.
      </p>
      <Button onClick={onAddItem} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  )
}
