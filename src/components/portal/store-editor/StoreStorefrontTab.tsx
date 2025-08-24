import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Globe, Plus, Menu, FileText, Edit, Trash } from "lucide-react"
import { Database } from "@/integrations/supabase/types"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { locationsApi } from '@/services/locations-api'
import { useAuth } from '@/contexts/auth-context'

type Store = Database['public']['Tables']['online_stores']['Row']
type StorePage = Database['public']['Tables']['store_pages']['Row']
type StoreNavigation = Database['public']['Tables']['store_navigation']['Row']

interface StoreStorefrontTabProps {
  store: Partial<Store>
  onChange: (updates: Partial<Store>) => void
}

export const StoreStorefrontTab = ({ store, onChange }: StoreStorefrontTabProps) => {
  const [newPageOpen, setNewPageOpen] = useState(false)
  const [newNavItemOpen, setNewNavItemOpen] = useState(false)
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: ''
  })
  // Default navigation items
  const defaultNavItems = [
    { label: 'Home', url: '/', sort_order: 0 },
    { label: 'Shop', url: '/shop', sort_order: 1 },
    { label: 'About Us', url: '/about', sort_order: 2 }
  ]

  const queryClient = useQueryClient()
  const { userProfile, isAuthenticated } = useAuth()

  const handleInputChange = (field: keyof Store, value: any) => {
    onChange({ [field]: value })
  }

  // Fetch store pages
  const { data: pages = [] } = useQuery({
    queryKey: ['store-pages', store.id],
    queryFn: async () => {
      if (!store.id) return []
      const { data, error } = await supabase
        .from('store_pages')
        .select('*')
        .eq('store_id', store.id)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!store.id
  })

  // Fetch store navigation
  const { data: navigationItems = [] } = useQuery({
    queryKey: ['store-navigation', store.id],
    queryFn: async () => {
      if (!store.id) return []
      const { data, error } = await supabase
        .from('store_navigation')
        .select('*')
        .eq('store_id', store.id)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!store.id
  })

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (pageData: typeof newPageData) => {
      if (!isAuthenticated || !userProfile) {
        throw new Error('You must be logged in to create pages');
      }

      const location = await locationsApi.getCurrentLocation();
      if (!location?.id) {
        throw new Error('No location selected');
      }
      
      const { data, error } = await supabase
        .from('store_pages')
        .insert({
          ...pageData,
          store_id: store.id!,
          location_id: location.id,
          is_published: false
        })
        .select()
        .single()
      
      if (error) {
        console.error('Page creation error:', error)
        throw new Error(`Failed to create page: ${error.message}`)
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-pages', store.id] })
      setNewPageOpen(false)
      setNewPageData({ title: '', slug: '', content: '', meta_description: '' })
      toast.success('Page created successfully')
    },
    onError: (error) => {
      console.error('Page creation failed:', error)
      toast.error(error.message || 'Failed to create page')
    }
  })

  // Create default navigation mutation
  const createDefaultNavMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !userProfile) {
        throw new Error('You must be logged in to create navigation items');
      }

      const location = await locationsApi.getCurrentLocation();
      if (!location?.id) {
        throw new Error('No location selected');
      }
      
      const { data, error } = await supabase
        .from('store_navigation')
        .insert(
          defaultNavItems.map(item => ({
            ...item,
            store_id: store.id!,
            location_id: location.id,
            is_external: item.url.startsWith('http')
          }))
        )
        .select()
      
      if (error) {
        console.error('Navigation creation error:', error)
        throw new Error(`Failed to create navigation items: ${error.message}`)
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-navigation', store.id] })
      toast.success('Default navigation created successfully')
    },
    onError: (error) => {
      console.error('Navigation creation failed:', error)
      toast.error(error.message || 'Failed to create default navigation')
    }
  })

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from('store_pages')
        .delete()
        .eq('id', pageId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-pages', store.id] })
      toast.success('Page deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete page: ' + error.message)
    }
  })

  // Delete navigation mutation
  const deleteNavMutation = useMutation({
    mutationFn: async (navId: string) => {
      const { error } = await supabase
        .from('store_navigation')
        .delete()
        .eq('id', navId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-navigation', store.id] })
      toast.success('Navigation item deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete navigation item: ' + error.message)
    }
  })

  return (
    <div className="space-y-8">
      {/* Checkout Settings */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Checkout Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Checkout Style</Label>
              <Select
                value={store.checkout_style || 'single_page'}
                onValueChange={(value) => handleInputChange('checkout_style', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select checkout style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_page">Single Page</SelectItem>
                  <SelectItem value="multi_step">Multi-Step</SelectItem>
                  <SelectItem value="express">Express Checkout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={store.currency || 'USD'}
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Navigation Management */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Navigation Menu</h3>
            {navigationItems.length === 0 && (
              <Button 
                size="sm" 
                onClick={() => createDefaultNavMutation.mutate()}
                disabled={createDefaultNavMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createDefaultNavMutation.isPending ? 'Creating...' : 'Create Default Navigation'}
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Menu className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteNavMutation.mutate(item.id)}
                        disabled={deleteNavMutation.isPending}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Pages */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Custom Pages</h3>
            <Dialog open={newPageOpen} onOpenChange={setNewPageOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Page</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Page Title</Label>
                      <Input 
                        placeholder="About Us"
                        value={newPageData.title}
                        onChange={(e) => setNewPageData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug</Label>
                      <Input 
                        placeholder="about-us"
                        value={newPageData.slug}
                        onChange={(e) => setNewPageData(prev => ({ ...prev, slug: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Input 
                      placeholder="Brief description for search engines"
                      value={newPageData.meta_description}
                      onChange={(e) => setNewPageData(prev => ({ ...prev, meta_description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea 
                      placeholder="Page content..."
                      rows={6}
                      value={newPageData.content}
                      onChange={(e) => setNewPageData(prev => ({ ...prev, content: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setNewPageOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createPageMutation.mutate(newPageData)}
                      disabled={!newPageData.title || !newPageData.slug || createPageMutation.isPending}
                    >
                      {createPageMutation.isPending ? 'Creating...' : 'Create Page'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{page.title}</h4>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deletePageMutation.mutate(page.id)}
                        disabled={deletePageMutation.isPending}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">/{page.slug}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${
                      page.is_published 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {page.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Footer Configuration */}
        <div>
          <h3 className="text-lg font-medium mb-4">Footer Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Copyright Text</Label>
              <Input
                placeholder="© 2024 Your Store Name. All rights reserved."
                defaultValue={`© ${new Date().getFullYear()} ${store.name || 'Your Store'}. All rights reserved.`}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                type="email"
                placeholder="contact@yourstore.com"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}