
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Plus, Store } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storesApi } from "@/services"
import { CreateStoreDialog } from "@/components/portal/CreateStoreDialog"
import { StoreCard } from "@/components/portal/StoreCard"
import { StoreSearch } from "@/components/portal/StoreSearch"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate } from "react-router-dom"

const Portal = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { session } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Redirect to login if not authenticated
  if (!session) {
    navigate('/login')
    return null
  }

  const { data: stores = [], refetch, isError, error } = useQuery({
    queryKey: ['stores'],
    queryFn: storesApi.getAll,
  })

  // Handle any errors from the API
  if (isError) {
    toast({
      title: "Error",
      description: "Failed to load stores. Please try again.",
      variant: "destructive",
    })
  }

  const handleToggleStore = async (id: number, isActive: boolean) => {
    try {
      await storesApi.update(id, { is_active: !isActive })
      refetch()
      toast({
        title: "Success",
        description: "Store updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update store",
        variant: "destructive",
      })
    }
  }

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Online Portal</h2>
          <p className="text-muted-foreground">Create and manage your online stores.</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Store
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <StoreSearch value={searchTerm} onChange={setSearchTerm} />
        </div>

        {filteredStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
            <Store className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No stores found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first online store to get started.
            </p>
            <Button onClick={() => setIsCreating(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Store
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onToggleActive={handleToggleStore}
              />
            ))}
          </div>
        )}
      </div>

      <CreateStoreDialog
        isOpen={isCreating}
        onOpenChange={setIsCreating}
        onSuccess={refetch}
      />
    </div>
  )
}

export default Portal
