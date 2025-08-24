import { Input } from "@/components/ui/input";
import { ServiceCard } from "./ServiceCard";
import { InventoryCard } from "./InventoryCard";
import { Database } from "@/types/supabase";
import { Search, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Service = Database['public']['Tables']['services']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];

type ItemPosition = {
  id: string;
  type: 'service' | 'inventory';
};

const ITEMS_ORDER_STORAGE_KEY = 'services-items-order';

interface ItemsSectionProps {
  services: Service[];
  inventoryItems: InventoryItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddToCart: (item: Service | InventoryItem, type: 'service' | 'inventory') => void;
  selectedCategory: string | null;
  onCloseRegister?: () => void;
}

export const ItemsSection = ({
  services,
  inventoryItems,
  searchTerm,
  onSearchChange,
  onAddToCart,
  selectedCategory,
  onCloseRegister
}: ItemsSectionProps) => {
  const queryClient = useQueryClient();
  const restorePositionsComplete = useRef(false);
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const DROPPABLE_ID = "services-items-droppable";

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventory = inventoryItems.filter((item) => {
    const matchesSearch = 
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      !selectedCategory || 
      (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  const createDisplayItems = () => {
    return [
      ...filteredServices.map(service => ({ 
        id: `service-${service.id}`,
        type: 'service' as const,
        data: service 
      })),
      ...filteredInventory.map(item => ({ 
        id: `inventory-${item.id}`, 
        type: 'inventory' as const,
        data: item 
      }))
    ];
  };

  useEffect(() => {
    if (isInitialLoad) {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  }, [isInitialLoad, queryClient]);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      
      const newItems = createDisplayItems();
      
      const savedOrder = localStorage.getItem(ITEMS_ORDER_STORAGE_KEY);
      
      if (savedOrder) {
        try {
          const savedPositions: ItemPosition[] = JSON.parse(savedOrder);
          
          const positionMap = new Map<string, number>();
          savedPositions.forEach((item, index) => {
            positionMap.set(item.id, index);
          });
          
          const sortedItems = [...newItems].sort((a, b) => {
            const posA = positionMap.has(a.id) ? positionMap.get(a.id)! : Number.MAX_SAFE_INTEGER;
            const posB = positionMap.has(b.id) ? positionMap.get(b.id)! : Number.MAX_SAFE_INTEGER;
            return posA - posB;
          });
          
          setDisplayItems(sortedItems);
          console.log("Restored positions for", sortedItems.length, "items from saved order");
        } catch (error) {
          console.error("Error parsing saved item positions:", error);
          setDisplayItems(newItems);
        }
      } else {
        setDisplayItems(newItems);
      }
      
      restorePositionsComplete.current = true;
    } else {
      setDisplayItems(createDisplayItems());
    }
  }, [filteredServices, filteredInventory, searchTerm, selectedCategory, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad && selectedCategory) {
      console.log("Selected category changed:", selectedCategory);
    }
  }, [selectedCategory, isInitialLoad]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    const items = Array.from(displayItems);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    
    setDisplayItems(items);
    
    const itemPositions = items.map(item => ({
      id: item.id,
      type: item.type
    }));
    
    localStorage.setItem(ITEMS_ORDER_STORAGE_KEY, JSON.stringify(itemPositions));
    toast.success("Item positions updated", { duration: 1500 });
    console.log("Saved new positions for", items.length, "items");
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-3 border-b bg-white shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-medium">
            {selectedCategory ? selectedCategory : "All Items"}
          </h2>
          <div className="relative w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={DROPPABLE_ID} direction="horizontal" type="ITEM">
            {(provided) => (
              <div
                className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 p-3"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {displayItems.length > 0 ? (
                  displayItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            zIndex: snapshot.isDragging ? 999 : 'auto'
                          }}
                          className={`${snapshot.isDragging ? 'z-50' : ''}`}
                        >
                          {item.type === 'service' ? (
                            <ServiceCard
                              service={item.data}
                              onAdd={() => onAddToCart(item.data, 'service')}
                              isDragging={snapshot.isDragging}
                            />
                          ) : (
                            <InventoryCard
                              item={item.data}
                              onAdd={() => onAddToCart(item.data, 'inventory')}
                              isDragging={snapshot.isDragging}
                            />
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-gray-500">
                    No items found for this category.
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
    </div>
  );
};
