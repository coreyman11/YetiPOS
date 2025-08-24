import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Package, Plus, Search, Filter, Grid, List, Eye, EyeOff, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storesApi } from "@/services"
import { Database } from "@/integrations/supabase/types"

type Store = Database['public']['Tables']['online_stores']['Row']
type StoreInventory = Database['public']['Tables']['store_inventory']['Row']

interface StoreProductsTabProps {
  store: Partial<Store>
  onChange: (updates: Partial<Store>) => void
}

export const StoreProductsTab = ({ store, onChange }: StoreProductsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { toast } = useToast()

  const { data: storeInventory = [], refetch } = useQuery({
    queryKey: ['store-inventory', store.id],
    queryFn: () => store.id ? storesApi.getFullStoreInventory(Number(store.id)) : Promise.resolve([]),
    enabled: !!store.id,
  })

  const handleInputChange = (field: keyof Store, value: any) => {
    onChange({ [field]: value })
  }

  const handleSyncInventory = async () => {
    if (!store.id) return
    
    try {
      await storesApi.syncInventoryWithPOS(Number(store.id))
      refetch()
      toast({
        title: "Success",
        description: "Inventory synchronized with POS system",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync inventory",
        variant: "destructive",
      })
    }
  }

  const filteredInventory = storeInventory.filter((item: any) => {
    const matchesSearch = !searchTerm || 
      item.inventory?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inventory?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
      item.inventory?.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(
    storeInventory
      .map((item: any) => item.inventory?.category)
      .filter(Boolean)
  ))

  return (
    <div className="space-y-8">
      {/* Product Display Settings */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Display Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Products per Page</Label>
              <Select
                value={String(store.products_per_page || 12)}
                onValueChange={(value) => handleInputChange('products_per_page', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 products</SelectItem>
                  <SelectItem value="12">12 products</SelectItem>
                  <SelectItem value="24">24 products</SelectItem>
                  <SelectItem value="48">48 products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Search</Label>
                <p className="text-xs text-muted-foreground">
                  Product search bar
                </p>
              </div>
              <Switch
                checked={store.show_search || false}
                onCheckedChange={(checked) => handleInputChange('show_search', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Cart</Label>
                <p className="text-xs text-muted-foreground">
                  Shopping cart icon
                </p>
              </div>
              <Switch
                checked={store.show_cart || false}
                onCheckedChange={(checked) => handleInputChange('show_cart', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Wishlist</Label>
                <p className="text-xs text-muted-foreground">
                  Wishlist functionality
                </p>
              </div>
              <Switch
                checked={store.show_wishlist || false}
                onCheckedChange={(checked) => handleInputChange('show_wishlist', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Inventory Settings */}
        <div>
          <h3 className="text-lg font-medium mb-4">Inventory Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Track Inventory</Label>
                <p className="text-xs text-muted-foreground">
                  Show stock levels
                </p>
              </div>
              <Switch
                checked={store.enable_inventory_tracking || false}
                onCheckedChange={(checked) => handleInputChange('enable_inventory_tracking', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Backorders</Label>
                <p className="text-xs text-muted-foreground">
                  Sell out-of-stock items
                </p>
              </div>
              <Switch
                checked={store.allow_backorders || false}
                onCheckedChange={(checked) => handleInputChange('allow_backorders', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Reviews</Label>
                <p className="text-xs text-muted-foreground">
                  Customer product reviews
                </p>
              </div>
              <Switch
                checked={store.enable_reviews || false}
                onCheckedChange={(checked) => handleInputChange('enable_reviews', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Product Management */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Store Products</h3>
            <div className="flex items-center space-x-2">
              <Button onClick={handleSyncInventory} variant="outline" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Sync with POS
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product List */}
          {filteredInventory.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {storeInventory.length === 0 
                  ? "Sync your inventory from the POS system to start selling online."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {storeInventory.length === 0 && (
                <Button onClick={handleSyncInventory}>
                  <Package className="h-4 w-4 mr-2" />
                  Sync Inventory
                </Button>
              )}
            </Card>
          ) : (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredInventory.map((item: any) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className={`${viewMode === 'grid' ? '' : 'flex'}`}>
                    {item.image_url && (
                      <div className={`${
                        viewMode === 'grid' 
                          ? 'aspect-square' 
                          : 'w-24 h-24 flex-shrink-0'
                      } bg-muted`}>
                        <img
                          src={item.image_url}
                          alt={item.inventory?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`${viewMode === 'grid' ? 'p-4' : 'p-4 flex-1'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{item.inventory?.name}</h4>
                        <div className="flex items-center space-x-1">
                          {item.is_visible ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.inventory?.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${item.price}</span>
                          {item.inventory?.category && (
                            <Badge variant="secondary" className="text-xs">
                              {item.inventory.category}
                            </Badge>
                          )}
                        </div>
                        {store.enable_inventory_tracking && (
                          <span className="text-xs text-muted-foreground">
                            Stock: {item.inventory?.quantity || 0}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}