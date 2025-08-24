
import { Card } from "@/components/ui/card";
import { Database } from "@/types/supabase";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/services";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface InventoryCardProps {
  item: InventoryItem;
  onAdd: (item: InventoryItem) => void;
  isDragging?: boolean;
}

export const InventoryCard = ({ item, onAdd, isDragging = false }: InventoryCardProps) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => await inventoryApi.getAllCategories(),
    // Reduce stale time to 5 seconds to ensure we get fresher data
    staleTime: 5 * 1000,
  });

  // Find matching category by name, case insensitive
  const categoryColor = item.category 
    ? categories.find(cat => 
        cat.name.toLowerCase() === item.category?.toLowerCase())?.color || "#f97316" // Default to orange if not found
    : "#f97316"; // Default color for items without category

  return (
    <Card
      className={`cursor-grab hover:shadow-md transition-shadow overflow-hidden flex flex-col bg-white h-[100px] border ${
        isDragging ? 'shadow-lg border-primary cursor-grabbing' : 'hover:border-blue-300'
      }`}
      onClick={(e) => {
        // Only trigger click if we're not dragging
        if (!isDragging) {
          onAdd(item);
          e.stopPropagation();
        }
      }}
    >
      <div 
        className="h-1 w-full" 
        style={{ backgroundColor: categoryColor }}
      ></div>
      <div className="flex flex-col justify-between flex-1 p-2">
        <div className="text-sm font-medium line-clamp-2">{item.name}</div>
        <div className="flex items-center justify-between mt-1">
          {/* Only show SKU on non-register pages */}
          {window.location.pathname !== '/register' && item.sku && (
            <div className="text-xs text-gray-500">SKU: {item.sku}</div>
          )}
          <div className="text-sm font-bold text-gray-900">${Number(item.price).toFixed(2)}</div>
        </div>
        {isDragging && (
          <div className="absolute inset-0 bg-primary/5 flex items-center justify-center rounded-lg">
            <div className="text-xs font-medium text-primary">Moving item...</div>
          </div>
        )}
      </div>
    </Card>
  );
};
