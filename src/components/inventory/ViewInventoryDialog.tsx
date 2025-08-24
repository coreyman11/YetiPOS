
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Database } from "@/types/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface ViewInventoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
}

export const ViewInventoryDialog = ({ 
  isOpen, 
  onOpenChange, 
  item 
}: ViewInventoryDialogProps) => {
  if (!item) return null

  const calculateProfitMargin = () => {
    if (!item.cost || item.cost === 0) return 0;
    return ((item.price - item.cost) / item.price * 100).toFixed(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
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
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Stock Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Current Stock:</span> {item.quantity}
                    </div>
                    <div>
                      <span className="font-medium">Minimum Level:</span> {item.min_stock_level}
                    </div>
                    <div>
                      <span className="font-medium">Maximum Level:</span> {item.max_stock_level}
                    </div>
                    <div>
                      <span className="font-medium">Reorder Point:</span> {item.reorder_point}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Pricing</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Retail Price:</span> ${item.price.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Cost:</span> ${item.cost.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Profit Margin:</span> {calculateProfitMargin()}%
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Additional Details</h4>
                  <div className="space-y-2 text-sm">
                    {item.supplier && (
                      <div>
                        <span className="font-medium">Supplier:</span> {item.supplier}
                      </div>
                    )}
                    {item.location && (
                      <div>
                        <span className="font-medium">Location:</span> {item.location}
                      </div>
                    )}
                    {(item.size || item.color) && (
                      <div>
                        <span className="font-medium">Variant:</span> {[item.size, item.color].filter(Boolean).join(' - ')}
                      </div>
                    )}
                    {item.last_ordered_date && (
                      <div>
                        <span className="font-medium">Last Ordered:</span> {new Date(item.last_ordered_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
