import React from 'react';
import { Package, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface HomePageProps {
  store: any;
  inventory: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  addToCart: (item: any, quantity: number) => void;
  addedItemId: number | null;
  openProductDialog: (item: any) => void;
  filteredInventory: any[];
}

export function HomePage({
  store,
  inventory,
  searchTerm,
  setSearchTerm,
  addToCart,
  addedItemId,
  openProductDialog,
  filteredInventory
}: HomePageProps) {
  const getProductCardClass = () => {
    const layoutStyle = store.layout_style || 'modern';
    
    if (layoutStyle === 'bold') {
      return 'shadow-lg hover:shadow-xl transition-shadow duration-300 border-2';
    }
    if (layoutStyle === 'minimal') {
      return 'border-0 shadow-none hover:shadow-sm';
    }
    return 'hover:shadow-md';
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      {store.banner_url && (
        <div 
          className="relative w-full h-64 md:h-80 lg:h-96 bg-cover bg-center rounded-lg overflow-hidden" 
          style={{ 
            backgroundImage: `url("${store.banner_url}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white p-6 text-center">
            {store.banner_title && (
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{store.banner_title}</h1>
            )}
            {store.banner_subtitle && (
              <p className="text-lg md:text-xl mb-6 max-w-2xl">{store.banner_subtitle}</p>
            )}
            {store.banner_cta_text && (
              <Button 
                size="lg"
                className="text-lg px-8 py-3"
                style={{ 
                  backgroundColor: store.accent_color,
                  color: '#ffffff',
                  borderColor: store.accent_color
                }}
              >
                {store.banner_cta_text}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Store Description */}
      {store.description && (
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-lg text-muted-foreground leading-relaxed">{store.description}</p>
        </div>
      )}

      {/* Featured Categories or Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: store.primary_color }}>Quality Products</h3>
          <p className="text-sm text-muted-foreground">Carefully curated selection of premium items</p>
        </div>
        <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: store.primary_color }}>Secure Checkout</h3>
          <p className="text-sm text-muted-foreground">Safe and secure payment processing</p>
        </div>
        <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: store.primary_color }}>Easy Shopping</h3>
          <p className="text-sm text-muted-foreground">Find exactly what you're looking for</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h2 className={`font-bold mb-6 text-center ${store.layout_style === 'bold' ? 'text-3xl' : 'text-2xl'}`}
            style={{ color: store.primary_color }}>
          {store.layout_style === 'bold' ? 'Our Menu' : 'Featured Products'}
        </h2>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredInventory.slice(0, 8).map((item: any) => {
            const isOutOfStock = !item.inventory || item.inventory.quantity <= 0;
            
            return (
              <div 
                key={item.id} 
                className={`group relative overflow-hidden rounded-lg border transition-all duration-300 cursor-pointer ${getProductCardClass()} ${
                  addedItemId === item.id 
                    ? 'scale-105 shadow-lg' 
                    : ''
                } ${isOutOfStock ? 'opacity-75' : ''}`}
                style={{
                  borderColor: addedItemId === item.id ? store.accent_color : 'hsl(var(--border))'
                }}
                onClick={() => openProductDialog(item)}
              >
                <div className="aspect-square relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.inventory?.name}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-secondary">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Out of Stock Overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Out of Stock
                      </div>
                    </div>
                  )}
                  
                  {addedItemId === item.id && !isOutOfStock && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center animate-fade-in">
                      <div className="bg-white rounded-full p-2 shadow-lg animate-scale-in">
                        <Check className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold" style={{ color: store.primary_color }}>
                    {item.inventory?.name}
                  </h3>
                  <p className="text-sm line-clamp-2" style={{ color: store.secondary_color }}>
                    {item.inventory?.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className="font-medium"
                      style={{ 
                        backgroundColor: store.accent_color,
                        color: '#ffffff'
                      }}
                    >
                      ${item.price.toFixed(2)}
                    </Badge>
                    <div className="text-right">
                      {isOutOfStock ? (
                        <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Stock: {item.inventory?.quantity}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredInventory.length > 8 && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {/* Navigate to shop page */}}
            >
              View All Products
            </Button>
          </div>
        )}

        {filteredInventory.length === 0 && inventory.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </Button>
          </div>
        )}

        {inventory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No products available</h3>
            <p className="text-muted-foreground">Check back soon for new items.</p>
          </div>
        )}
      </div>
    </div>
  );
}