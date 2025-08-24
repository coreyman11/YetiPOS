import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, Save, Settings, Palette, Package, Globe, Search, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storesApi } from "@/services"
import { StoreGeneralTab } from "@/components/portal/store-editor/StoreGeneralTab"
import { StoreDesignTab } from "@/components/portal/store-editor/StoreDesignTab"
import { StoreProductsTab } from "@/components/portal/store-editor/StoreProductsTab"
import { StoreStorefrontTab } from "@/components/portal/store-editor/StoreStorefrontTab"
import { StoreSEOTab } from "@/components/portal/store-editor/StoreSEOTab"
import { StoreAdvancedTab } from "@/components/portal/store-editor/StoreAdvancedTab"
import { StorePreview } from "@/components/portal/store-editor/StorePreview"
import { Database } from "@/integrations/supabase/types"

type Store = Database['public']['Tables']['online_stores']['Row']

const StoreEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("general")
  const [showPreview, setShowPreview] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [formData, setFormData] = useState<Partial<Store>>({})

  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store', id],
    queryFn: () => storesApi.getById(Number(id)),
    enabled: !!id,
  })

  useEffect(() => {
    if (store) {
      setFormData(store)
    }
  }, [store])

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Store>) => storesApi.update(Number(id), data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store updated successfully",
      })
      setHasUnsavedChanges(false)
      queryClient.invalidateQueries({ queryKey: ['store', id] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update store",
        variant: "destructive",
      })
    },
  })

  const handleSave = () => {
    saveMutation.mutate(formData)
  }

  const handleFormChange = (updates: Partial<Store>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: Settings,
      description: "Basic store information, SEO, and domain settings"
    },
    {
      id: "design",
      label: "Design",
      icon: Palette,
      description: "Themes, colors, fonts, and visual customization"
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      description: "Manage inventory, collections, and product settings"
    },
    {
      id: "storefront",
      label: "Storefront",
      icon: Globe,
      description: "Navigation, pages, and content management"
    },
    {
      id: "seo",
      label: "SEO & Marketing",
      icon: Search,
      description: "Search engine optimization and marketing tools"
    },
    {
      id: "advanced",
      label: "Advanced",
      icon: Zap,
      description: "Custom code, integrations, and advanced settings"
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">Store not found</h1>
        <Button onClick={() => navigate('/portal')}>
          Back to Portal
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/portal')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Portal</span>
              </Button>
              <div className="border-l pl-4">
                <h1 className="text-xl font-semibold">{store.name}</h1>
                <p className="text-sm text-muted-foreground">Store Editor</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || saveMutation.isPending}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Editor */}
          <div className={`${showPreview ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-300`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Tab Navigation */}
              <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-1 bg-muted">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex flex-col items-center space-y-2 p-4 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium text-xs">{tab.label}</div>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {/* Tab Content */}
              <div className="mt-6">
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>General Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Configure your store's basic information, domain, and general settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StoreGeneralTab
                        store={formData}
                        onChange={handleFormChange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="design" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Palette className="h-5 w-5" />
                        <span>Design & Branding</span>
                      </CardTitle>
                      <CardDescription>
                        Customize your store's appearance, choose themes, and set up your branding.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StoreDesignTab
                        store={formData}
                        onChange={handleFormChange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="products" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Package className="h-5 w-5" />
                        <span>Products & Inventory</span>
                      </CardTitle>
                      <CardDescription>
                        Manage your products, inventory, collections, and product settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StoreProductsTab
                        store={formData}
                        onChange={handleFormChange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="storefront" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5" />
                        <span>Storefront Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Configure navigation, create custom pages, and manage your store's content.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StoreStorefrontTab
                        store={formData}
                        onChange={handleFormChange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="seo" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Search className="h-5 w-5" />
                        <span>SEO & Marketing</span>
                      </CardTitle>
                      <CardDescription>
                        Optimize for search engines and set up marketing integrations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StoreSEOTab
                        store={formData}
                        onChange={handleFormChange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Advanced Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Custom code, third-party integrations, and advanced configurations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StoreAdvancedTab
                        store={formData}
                        onChange={handleFormChange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Live Preview Sidebar */}
          {showPreview && (
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>Live Preview</span>
                    </CardTitle>
                    <CardDescription>
                      See how your store looks to customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <StorePreview store={formData} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StoreEditor