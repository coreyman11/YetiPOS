
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Globe, ExternalLink, Settings, Package } from "lucide-react"
import { Database } from "@/integrations/supabase/types"
import { EditStoreDialog } from "./EditStoreDialog"
import { StoreInventoryDialog } from "./StoreInventoryDialog"
import { Link } from "react-router-dom"

type Store = Database['public']['Tables']['online_stores']['Row']

interface StoreCardProps {
  store: Store
  onToggleActive: (id: number, isActive: boolean) => void
}

export const StoreCard = ({ store, onToggleActive }: StoreCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isManagingProducts, setIsManagingProducts] = useState(false)

  const storeUrl = `/store/${store.slug}`

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" style={{ color: store.theme_color }} />
                {store.name}
              </CardTitle>
              <CardDescription>{store.description}</CardDescription>
            </div>
            <Switch
              checked={store.is_active}
              onCheckedChange={() => onToggleActive(store.id, store.is_active)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={store.is_active ? "default" : "secondary"}>
                {store.is_active ? "Active" : "Inactive"}
              </Badge>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsManagingProducts(true)}>
                  <Package className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/portal/store/${store.id}/edit`}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={storeUrl} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditStoreDialog
        store={store}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        onSuccess={() => {
          window.location.reload()
        }}
      />

      <StoreInventoryDialog
        store={store}
        isOpen={isManagingProducts}
        onOpenChange={setIsManagingProducts}
      />
    </>
  )
}
