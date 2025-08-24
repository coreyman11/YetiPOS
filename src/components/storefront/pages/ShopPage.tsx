import React, { useState, useMemo } from 'react';
import { Package, Search, Check, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface ShopPageProps {
  store: any;
  inventory: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  addToCart: (item: any, quantity: number) => void;
  addedItemId: number | null;
  openProductDialog: (item: any) => void;
  filteredInventory: any[];
}

export function ShopPage({
  store,
  inventory,
  searchTerm,
  setSearchTerm,
  addToCart,
  addedItemId,
  openProductDialog,
  filteredInventory
}: ShopPageProps) {
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(inventory.map(item => item.inventory?.category).filter(Boolean)));
    return ['all', ...cats];
  }, [inventory]);

  // Sort and filter inventory
  const sortedAndFilteredInventory = useMemo(() => {
    let items = [...filteredInventory];

    // Filter by category
    if (filterCategory !== 'all') {
      items = items.filter(item => item.inventory?.category === filterCategory);
    }

    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.inventory?.name || '').localeCompare(b.inventory?.name || '');
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'stock':
          return (b.inventory?.quantity || 0) - (a.inventory?.quantity || 0);
        default:
          return 0;
      }
    });

    return items;
  }, [filteredInventory, filterCategory, sortBy]);

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

  const ProductCard = ({ item }: { item: any }) => {
    const isOutOfStock = !item.inventory || item.inventory.quantity <= 0;
    
    return (
      <div 
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
          {item.inventory?.brand && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.inventory.brand}
            </p>
          )}
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
  };

  const ProductListItem = ({ item }: { item: any }) => {
    const isOutOfStock = !item.inventory || item.inventory.quantity <= 0;
    
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openProductDialog(item)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 flex-shrink-0 relative">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.inventory?.name}
                  className="object-cover w-full h-full rounded"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-secondary rounded">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                  <span className="text-white text-xs font-medium">Out of Stock</span>
                </div>
              )}
            </div>
            
            <div className="flex-grow space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold" style={{ color: store.primary_color }}>
                    {item.inventory?.name}
                  </h3>
                  {item.inventory?.brand && (
                    <p className="text-sm text-muted-foreground">{item.inventory.brand}</p>
                  )}
                </div>
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
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.inventory?.description}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  {item.inventory?.category && (
                    <span className="text-muted-foreground">Category: {item.inventory.category}</span>
                  )}
                </div>
                <div className="text-right">
                  {isOutOfStock ? (
                    <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Stock: {item.inventory?.quantity}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: store.primary_color }}>
          Shop Our Products
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover our complete collection of carefully curated products
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
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

        {/* Filters and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="stock">Stock Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      <div>
        {sortedAndFilteredInventory.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedAndFilteredInventory.map((item: any) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAndFilteredInventory.map((item: any) => (
                <ProductListItem key={item.id} item={item} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No products found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria.</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
              >
                Clear search
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterCategory('all');
                  setSortBy('name');
                }}
              >
                Reset filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      {sortedAndFilteredInventory.length > 0 && (
        <div className="text-center text-muted-foreground">
          Showing {sortedAndFilteredInventory.length} of {inventory.length} products
        </div>
      )}
    </div>
  );
}