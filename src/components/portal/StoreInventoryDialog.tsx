import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Package, DollarSign, Search, Upload, Image, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { inventoryApi, storesApi } from "@/services"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Database } from "@/integrations/supabase/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

type Store = Database['public']['Tables']['online_stores']['Row']
type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface StoreInventoryDialogProps {
  store: Store
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const StoreInventoryDialog = ({ store, isOpen, onOpenChange }: StoreInventoryDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const [syncingInventory, setSyncingInventory] = useState(false)
  const [syncStats, setSyncStats] = useState<{added: number, updated: number} | null>(null)
  const queryClient = useQueryClient()

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => await inventoryApi.getAll(),
    enabled: isOpen,
  })

  const { data: storeInventory = [], refetch, isLoading: storeInventoryLoading } = useQuery({
    queryKey: ['store-inventory', store.id],
    queryFn: () => storesApi.getFullStoreInventory(store.id),
    enabled: isOpen,
  })

  const missingItems = inventory.filter(item => 
    !storeInventory.some((si: any) => si.inventory_id === item.id)
  )

  const itemsNeedingUpdate = inventory.filter(item => {
    const storeItem = storeInventory.find((si: any) => si.inventory_id === item.id);
    return storeItem && (storeItem.price !== item.price);
  })

  const hiddenItems = storeInventory.filter((si: any) => 
    !si.is_visible && inventory.some(item => item.id === si.inventory_id)
  );

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const synchronizeInventory = async () => {
    try {
      setSyncingInventory(true)
      setSyncStats(null)
      
      const result = await storesApi.syncInventoryWithPOS(store.id)
      
      setSyncStats({
        added: result.added || 0,
        updated: result.updated || 0
      })
      
      toast.success(
        result.added + result.updated > 0
          ? `Synced: ${result.added} items added, ${result.updated} items updated`
          : "Store inventory is already in sync with POS"
      )
      
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['store-inventory'] })
    } catch (error) {
      console.error("Error synchronizing inventory:", error)
      toast.error("Could not synchronize inventory items")
    } finally {
      setSyncingInventory(false)
    }
  }

  const handleToggleProduct = async (item: InventoryItem, isInStore: boolean) => {
    try {
      const existingItem = storeInventory.find(
        (si: any) => si.inventory_id === item.id
      )
      
      await storesApi.updateStoreInventory([{
        store_id: store.id,
        inventory_id: item.id,
        is_visible: !isInStore,
        price: existingItem?.price || item.price || 0,
        image_url: existingItem?.image_url || null,
        location_id: store.location_id
      }])
      
      toast.success(`Product ${isInStore ? 'hidden from' : 'added to'} store`)
      refetch()
    } catch (error) {
      toast.error("Failed to update store inventory")
    }
  }

  const updatePrice = async (item: InventoryItem, newPrice: number) => {
    try {
      const existingItem = storeInventory.find((si: any) => si.inventory_id === item.id)
      
      await storesApi.updateStoreInventory([{
        store_id: store.id,
        inventory_id: item.id,
        is_visible: existingItem?.is_visible || true,
        price: newPrice,
        image_url: existingItem?.image_url || null,
        location_id: store.location_id
      }])
      
      toast.success("Price updated successfully")
      refetch()
    } catch (error) {
      toast.error("Failed to update price")
    }
  }

  const handleImageUpload = async (file: File, inventoryId: number) => {
    try {
      setUploading(prev => ({ ...prev, [inventoryId]: true }))

      const formData = new FormData()
      formData.append('file', file)

      // Use the supabase client to call the edge function instead of hardcoded URLs
      const { data, error } = await supabase.functions.invoke('upload-store-image', {
        body: formData,
      })

      if (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload image')
        return
      }

      if (!data || !data.publicUrl) {
        throw new Error('Failed to get image URL')
      }

      const publicUrl = data.publicUrl

      const existingItem = storeInventory.find((si: any) => si.inventory_id === inventoryId)
      
      await storesApi.updateStoreInventory([{
        store_id: store.id,
        inventory_id: inventoryId,
        is_visible: existingItem?.is_visible || true,
        price: existingItem?.price || inventory.find(i => i.id === inventoryId)?.price || 0,
        image_url: publicUrl,
        location_id: store.location_id
      }])

      toast.success("Image uploaded successfully")
      refetch()
    } catch (error) {
      console.error("Image upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setUploading(prev => ({ ...prev, [inventoryId]: false }))
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setSyncStats(null);
    }
  }, [isOpen]);

  const totalItemsNeedingSync = missingItems.length + itemsNeedingUpdate.length + hiddenItems.length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Store Products
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              {syncStats && (
                <div className="flex items-center gap-2 text-xs mr-2">
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    {syncStats.added} added
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    <RefreshCw className="h-3 w-3 mr-1 text-blue-600" />
                    {syncStats.updated} updated
                  </Badge>
                </div>
              )}
              
              <Button 
                variant={totalItemsNeedingSync > 0 ? "default" : "outline"}
                size="sm"
                onClick={synchronizeInventory}
                disabled={syncingInventory}
                className="flex items-center gap-1"
              >
                {syncingInventory ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync with POS
                    {totalItemsNeedingSync > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center">
                        {totalItemsNeedingSync}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {totalItemsNeedingSync > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Product inventory needs synchronization</h4>
                <div className="mt-1 text-xs text-amber-700">
                  <p>{missingItems.length} missing products from POS</p>
                  <p>{itemsNeedingUpdate.length} products need price updates</p>
                  <p>{hiddenItems.length} products are hidden but available in POS</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm" 
                  className="mt-2 h-7 text-xs bg-amber-100 hover:bg-amber-200 text-amber-900"
                  onClick={synchronizeInventory}
                  disabled={syncingInventory}
                >
                  {syncingInventory ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Sync Now
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {inventoryLoading || storeInventoryLoading ? (
            <div className="py-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading inventory...</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredInventory.map((item) => {
                const storeItem = storeInventory.find(
                  (si: any) => si.inventory_id === item.id
                )
                const isInStore = Boolean(storeItem?.is_visible)
                const needsUpdate = storeItem && storeItem.price !== item.price;

                return (
                  <Card key={item.id} className={needsUpdate ? "border-amber-200" : ""}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {item.name}
                          {needsUpdate && (
                            <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700">
                              Price mismatch
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {isInStore ? "Visible" : "Hidden"}
                          </span>
                          <Switch
                            checked={isInStore}
                            onCheckedChange={() => handleToggleProduct(item, isInStore)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    {storeItem && (
                      <CardContent className="py-2">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-medium flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Store Price
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={storeItem?.price || item.price}
                                onChange={(e) => updatePrice(item, parseFloat(e.target.value))}
                                className="h-8 text-sm"
                              />
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                POS Price: ${Number(item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium flex items-center gap-1">
                              <Image className="h-3 w-3" />
                              Product Image
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1">
                                {storeItem?.image_url ? (
                                  <div className="relative w-16 h-16 rounded-md overflow-hidden">
                                    <img
                                      src={storeItem.image_url}
                                      alt={item.name}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center w-16 h-16 bg-secondary rounded-md">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="relative h-8"
                                disabled={uploading[item.id]}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleImageUpload(file, item.id)
                                  }}
                                />
                                {uploading[item.id] ? (
                                  <div className="animate-spin">
                                    <Upload className="h-3 w-3" />
                                  </div>
                                ) : (
                                  <Upload className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}

              {filteredInventory.length === 0 && (
                <div className="py-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No products found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
