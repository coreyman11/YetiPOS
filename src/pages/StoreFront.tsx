import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { storesApi } from "@/services"
import { supabase } from "@/lib/supabase"
import { useState, useMemo } from "react"
import { CartPopup } from "@/components/storefront/CartPopup"
import { ProductDetailsDialog } from "@/components/storefront/ProductDetailsDialog"
import { CustomerAuthDialog } from "@/components/storefront/CustomerAuthDialog"
import { StorefrontAuthProvider, useStorefrontAuth } from "@/contexts/storefront-auth-context"
import { StorefrontNavigation } from "@/components/storefront/StorefrontNavigation"
import { HomePage } from "@/components/storefront/pages/HomePage"
import { AboutUsPage } from "@/components/storefront/pages/AboutUsPage"
import { ShopPage } from "@/components/storefront/pages/ShopPage"
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter"
import { toast } from "sonner"

const StoreFrontContent = () => {
  const { slug } = useParams()
  const { customer, isAuthenticated, logout } = useStorefrontAuth()
  const [cartItems, setCartItems] = useState<{id: number, quantity: number, item: any}[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [addedItemId, setAddedItemId] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState("home")
  
  const { data: store, isLoading } = useQuery({
    queryKey: ['store', slug],
    queryFn: () => storesApi.getBySlug(slug!),
    enabled: !!slug,
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['store-inventory', store?.id, store?.location_id],
    queryFn: () => store ? storesApi.getStoreInventory(store.id, store.location_id) : Promise.resolve([]),
    enabled: !!store,
  })

  // Fetch navigation items
  const { data: navigationItems = [] } = useQuery({
    queryKey: ['store-navigation', store?.id],
    queryFn: async () => {
      if (!store?.id) return []
      const { data, error } = await supabase
        .from('store_navigation')
        .select('*')
        .eq('store_id', store.id)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!store?.id,
  })

  // Fetch store pages (for About Us, etc.)
  const { data: storePages = [] } = useQuery({
    queryKey: ['store-pages', store?.id],
    queryFn: async () => {
      if (!store?.id) return []
      const { data, error } = await supabase
        .from('store_pages')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!store?.id,
  })

  // Get About Us page content
  const aboutUsPage = storePages.find(page => page.slug === 'about-us' || page.title?.toLowerCase().includes('about'))

  // Filter inventory based on search term
  const filteredInventory = useMemo(() => {
    if (!searchTerm.trim()) {
      return inventory;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return inventory.filter((item: any) => {
      const name = item.inventory?.name?.toLowerCase() || '';
      const description = item.inventory?.description?.toLowerCase() || '';
      const brand = item.inventory?.brand?.toLowerCase() || '';
      
      return name.includes(searchLower) || 
             description.includes(searchLower) || 
             brand.includes(searchLower);
    });
  }, [inventory, searchTerm]);

  const addToCart = (item: any, quantity: number = 1) => {
    // Check if item is out of stock
    if (!item.inventory || item.inventory.quantity <= 0) {
      toast.error(`${item.inventory?.name} is out of stock`, {
        position: "bottom-right",
      });
      return;
    }

    // Check if trying to add more than available stock
    const currentCartQuantity = cartItems.find(cartItem => cartItem.id === item.id)?.quantity || 0;
    if (currentCartQuantity + quantity > item.inventory.quantity) {
      toast.error(`Only ${item.inventory.quantity} ${item.inventory?.name} available in stock`, {
        position: "bottom-right",
      });
      return;
    }

    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem => 
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem
        );
      } else {
        return [...prev, { id: item.id, quantity: quantity, item }];
      }
    });
    
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1000);
    
    toast.success(`${item.inventory?.name} added to cart`, {
      position: "bottom-right",
    });
  };

  const removeFromCart = (itemId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems(prev => 
        prev.map(item => item.id === itemId ? { ...item, quantity } : item)
      );
    }
  };

  const openProductDialog = (item: any) => {
    setSelectedProduct(item);
    setIsProductDialogOpen(true);
  };

  const closeProductDialog = () => {
    setIsProductDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading store...</div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Store not found</h1>
        <p className="text-muted-foreground">The store you're looking for doesn't exist.</p>
      </div>
    )
  }

  if (!store.is_active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Store is currently inactive</h1>
        <p className="text-muted-foreground">Please check back later.</p>
      </div>
    )
  }

  // Generate dynamic styles based on store configuration
  const getStoreStyles = () => {
    const fontFamily = store.font_family || 'Inter';
    const primaryColor = store.primary_color || '#000000';
    const secondaryColor = store.secondary_color || '#666666';
    const accentColor = store.accent_color || '#007bff';
    const layoutStyle = store.layout_style || 'modern';

    // Different styling based on store style/layout
    const isOnlineOrdering = layoutStyle === 'bold';
    
    return {
      fontFamily: `${fontFamily}, sans-serif`,
      backgroundColor: isOnlineOrdering ? '#fafafa' : '#ffffff',
      color: primaryColor,
      '--store-primary': primaryColor,
      '--store-secondary': secondaryColor,
      '--store-accent': accentColor,
    } as React.CSSProperties;
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            store={store}
            inventory={inventory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            addToCart={addToCart}
            addedItemId={addedItemId}
            openProductDialog={openProductDialog}
            filteredInventory={filteredInventory}
          />
        );
      case 'shop':
        return (
          <ShopPage
            store={store}
            inventory={inventory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            addToCart={addToCart}
            addedItemId={addedItemId}
            openProductDialog={openProductDialog}
            filteredInventory={filteredInventory}
          />
        );
      case 'about':
      case 'about-us':
        return (
          <AboutUsPage
            store={store}
            pageContent={aboutUsPage}
          />
        );
      default:
        return (
          <HomePage
            store={store}
            inventory={inventory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            addToCart={addToCart}
            addedItemId={addedItemId}
            openProductDialog={openProductDialog}
            filteredInventory={filteredInventory}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={getStoreStyles()}>
      {/* Navigation Header */}
      <StorefrontNavigation
        store={store}
        navigationItems={navigationItems}
        cartItemsCount={cartItemsCount}
        onCartClick={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        isAuthDialogOpen={isAuthDialogOpen}
        setIsAuthDialogOpen={setIsAuthDialogOpen}
      />

      <main className="flex-grow">
        <div className="container py-8">
          {renderCurrentPage()}
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        store.footer_style === 'minimal' ? 'py-3' : 'py-6'
      }`}
      style={{
        backgroundColor: store.layout_style === 'bold' ? store.primary_color : 'hsl(var(--background))',
        borderColor: store.layout_style === 'bold' ? store.accent_color : 'hsl(var(--border))'
      }}>
        <div className="container">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-sm"
               style={{ 
                 color: store.layout_style === 'bold' ? '#ffffff' : store.secondary_color 
               }}>
              Powered by{" "}
              <a 
                href="https://timberpay.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:underline transition-colors"
                style={{ 
                  color: store.layout_style === 'bold' ? store.accent_color : store.accent_color 
                }}
              >
                Timber
              </a>
            </p>
          </div>
        </div>
      </footer>

      <CartPopup
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        total={cartItems.reduce((total, item) => total + (item.quantity * item.item.price), 0)}
        store={store}
        customer={customer}
      />

      <ProductDetailsDialog
        isOpen={isProductDialogOpen}
        onClose={closeProductDialog}
        product={selectedProduct}
        onAddToCart={addToCart}
      />

      <CustomerAuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
      />
    </div>
  )
}

const StoreFront = () => {
  const { slug } = useParams()
  const { data: store } = useQuery({
    queryKey: ['store', slug],
    queryFn: () => storesApi.getBySlug(slug!),
    enabled: !!slug,
  })

  if (!store) {
    return <div>Loading...</div>
  }

  return (
    <StorefrontAuthProvider storeId={store.id} locationId={store.location_id || ''}>
      <StoreFrontContent />
    </StorefrontAuthProvider>
  )
}

export default StoreFront
