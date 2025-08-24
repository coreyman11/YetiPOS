
import { supabase } from '@/lib/supabase';
import { subMonths } from 'date-fns';
import { locationsApi } from '../locations-api';

export const getTopProducts = async (limit = 5) => {
  const oneMonthAgo = subMonths(new Date(), 1);
  const location = await locationsApi.getCurrentLocation();

  // Get transaction items for inventory products in the last month for the current location
  const { data: transactionItems, error } = await supabase
    .from('transaction_items')
    .select(`
      inventory_id,
      quantity,
      price
    `)
    .gte('created_at', oneMonthAgo.toISOString())
    .eq('location_id', location?.id)
    .not('inventory_id', 'is', null);

  if (error) throw error;

  // Collect all unique inventory IDs
  const inventoryIds = [...new Set(transactionItems?.map(item => item.inventory_id).filter(Boolean))];
  
  // Fetch inventory items separately to get their names (filter by location too)
  const { data: inventoryItems } = await supabase
    .from('inventory')
    .select('id, name')
    .in('id', inventoryIds)
    .eq('location_id', location?.id);
  
  // Create a map of inventory IDs to names for quick lookup
  const inventoryMap = new Map();
  inventoryItems?.forEach(item => {
    inventoryMap.set(item.id, item.name);
  });

  // Process the data to count sales by product
  const productSales = new Map<number, { id: number, name: string, count: number, total: number }>();

  transactionItems?.forEach(item => {
    if (!item.inventory_id) return;
    
    const productId = item.inventory_id;
    
    // Get product name from our inventory map
    const productName = inventoryMap.get(productId) || 'Unknown Product';
    
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (productSales.has(productId)) {
      const existing = productSales.get(productId)!;
      existing.count += quantity;
      existing.total += price * quantity;
    } else {
      productSales.set(productId, {
        id: productId,
        name: productName,
        count: quantity,
        total: price * quantity
      });
    }
  });

  // Convert to array and sort by total sales
  return Array.from(productSales.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((product, index) => ({
      ...product,
      type: 'inventory',
      rank: index + 1
    }));
};
