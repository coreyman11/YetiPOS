
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExportButton } from "./ExportButton";
import { ReportTable } from "./ReportTable";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/services/inventory-api";
import { useRealtime } from "@/contexts/realtime-context";
import { format, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";

export const InventoryReport = () => {
  const { networkStatus } = useRealtime();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Fetch inventory data
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => inventoryApi.getAll(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
    networkMode: networkStatus.online ? 'online' : 'always',
  });
  
  // Fetch categories for filtering
  const { data: categories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => inventoryApi.getAllCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    networkMode: networkStatus.online ? 'online' : 'always',
  });
  
  // Apply filters to inventory data
  const filteredInventory = React.useMemo(() => {
    if (!inventory) return [];
    
    let filtered = [...inventory];
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category?.toLowerCase() === categoryFilter.toLowerCase());
    }
    
    // Apply stock level filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(item => {
        const reorderPoint = item.reorder_point || 0;
        return item.quantity > 0 && item.quantity <= reorderPoint;
      });
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(item => item.quantity === 0);
    }
    
    return filtered;
  }, [inventory, categoryFilter, stockFilter]);
  
  // Calculate inventory valuation
  const calculateInventoryValue = () => {
    if (!filteredInventory.length) return { cost: 0, retail: 0 };
    
    return filteredInventory.reduce((acc, item) => {
      const cost = Number(item.cost) * item.quantity;
      const retail = Number(item.price) * item.quantity;
      
      return {
        cost: acc.cost + cost,
        retail: acc.retail + retail
      };
    }, { cost: 0, retail: 0 });
  };
  
  const inventoryValue = calculateInventoryValue();
  
  // Get stock status
  const getStockStatus = (item: any) => {
    if (item.quantity === 0) return { status: 'Out of Stock', variant: 'destructive' };
    const reorderPoint = item.reorder_point || 0;
    if (item.quantity <= reorderPoint) return { status: 'Low Stock', variant: 'warning' };
    return { status: 'In Stock', variant: 'success' };
  };

  // Format number with commas
  const formatNumber = (value: number | string) => {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Define table columns
  const columns = [
    { 
      key: 'name', 
      header: 'Product Name',
    },
    { 
      key: 'sku', 
      header: 'SKU',
    },
    { 
      key: 'category', 
      header: 'Category',
      cell: (row) => row.category || '—',
    },
    { 
      key: 'quantity', 
      header: 'Quantity',
      cell: (row) => {
        const status = getStockStatus(row);
        return (
          <div className="flex items-center gap-2">
            <span>{row.quantity.toLocaleString()}</span>
            {status.variant !== 'success' && <AlertTriangle size={16} className="text-warning" />}
          </div>
        );
      },
    },
    { 
      key: 'stock_status', 
      header: 'Stock Status',
      cell: (row) => {
        const status = getStockStatus(row);
        return <Badge variant={status.variant as any}>{status.status}</Badge>;
      },
    },
    { 
      key: 'cost', 
      header: 'Cost',
      cell: (row) => `$${formatNumber(row.cost)}`,
    },
    { 
      key: 'price', 
      header: 'Price',
      cell: (row) => `$${formatNumber(row.price)}`,
    },
    { 
      key: 'inventory_value', 
      header: 'Inventory Value',
      cell: (row) => `$${formatNumber(Number(row.cost) * row.quantity)}`,
    },
    { 
      key: 'retail_value', 
      header: 'Potential Revenue',
      cell: (row) => `$${formatNumber(Number(row.price) * row.quantity)}`,
    },
    { 
      key: 'supplier', 
      header: 'Supplier',
      cell: (row) => row.supplier || '—',
    },
  ];

  // Transform data for export
  const transformDataForExport = (data: any[]) => {
    return data.map(item => ({
      'Product ID': item.id,
      'Name': item.name,
      'Description': item.description,
      'SKU': item.sku,
      'Barcode': item.barcode || '—',
      'Category': item.category || '—',
      'Quantity': item.quantity.toLocaleString(),
      'Min Stock Level': (item.min_stock_level || 0).toLocaleString(),
      'Reorder Point': (item.reorder_point || 0).toLocaleString(),
      'Stock Status': getStockStatus(item).status,
      'Cost Price': `$${formatNumber(item.cost)}`,
      'Selling Price': `$${formatNumber(item.price)}`,
      'Markup %': ((Number(item.price) / Number(item.cost) - 1) * 100).toFixed(2) + '%',
      'Inventory Value': `$${formatNumber(Number(item.cost) * item.quantity)}`,
      'Potential Revenue': `$${formatNumber(Number(item.price) * item.quantity)}`,
      'Supplier': item.supplier || '—',
      'Location': item.location || '—',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Inventory Report</h3>
          <p className="text-sm text-muted-foreground">
            View inventory levels, valuation, and stock status
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category: any) => (
                <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Stock Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock Levels</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton 
            data={filteredInventory} 
            filename="inventory-report" 
            transformData={transformDataForExport}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Package className="h-8 w-8 mb-2 text-primary" />
            <h3 className="text-xl font-bold">{filteredInventory.length.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold">${formatNumber(inventoryValue.cost)}</h3>
            <p className="text-sm text-muted-foreground">Total Inventory Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold">${formatNumber(inventoryValue.retail)}</h3>
            <p className="text-sm text-muted-foreground">Potential Revenue</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 flex justify-center">
            <p>Loading inventory data...</p>
          </CardContent>
        </Card>
      ) : (
        <ReportTable 
          data={filteredInventory} 
          columns={columns}
          emptyMessage="No inventory items found matching the selected criteria."
        />
      )}
    </div>
  );
};
