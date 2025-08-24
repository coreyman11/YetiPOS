import { useState, useEffect } from "react";
import { inventoryApi } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Folder, Loader2, GripVertical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { toast } from "sonner";
import { Database } from "@/types/supabase";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface CategorySidebarProps {
  onSelectCategory: (category: string | null) => void;
  selectedCategory: string | null;
  inventoryItems?: InventoryItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  hideHeader?: boolean;
}

const CATEGORIES_ORDER_STORAGE_KEY = 'services-categories-order';

interface StoredCategory {
  id: number;
  name: string;
  color?: string;
}

export const CategorySidebar = ({ 
  onSelectCategory, 
  selectedCategory,
  inventoryItems = [],
  isCollapsed = false,
  onToggleCollapse,
  hideHeader = false
}: CategorySidebarProps) => {
  const { data: fetchedCategories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => await inventoryApi.getAllCategories(),
  });
  
  const [orderedCategories, setOrderedCategories] = useState<StoredCategory[]>([]);

  useEffect(() => {
    if (fetchedCategories.length > 0) {
      const savedOrder = localStorage.getItem(CATEGORIES_ORDER_STORAGE_KEY);
      
      if (savedOrder) {
        try {
          const savedCategories: StoredCategory[] = JSON.parse(savedOrder);
          
          const savedCategoriesMap = new Map<number, StoredCategory>();
          savedCategories.forEach(category => {
            savedCategoriesMap.set(category.id, category);
          });
          
          const existingCategories = fetchedCategories.filter(category => 
            savedCategoriesMap.has(category.id)
          );
          
          const sortedExistingCategories = [...existingCategories].sort((a, b) => {
            const indexA = savedCategories.findIndex(c => c.id === a.id);
            const indexB = savedCategories.findIndex(c => c.id === b.id);
            return indexA - indexB;
          });
          
          const newCategories = fetchedCategories.filter(category => 
            !savedCategoriesMap.has(category.id)
          );
          
          setOrderedCategories([...sortedExistingCategories, ...newCategories]);
        } catch (error) {
          console.error("Error parsing saved category order:", error);
          setOrderedCategories(fetchedCategories);
        }
      } else {
        setOrderedCategories(fetchedCategories);
      }
    }
  }, [fetchedCategories]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    const items = Array.from(orderedCategories);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    
    setOrderedCategories(items);
    
    localStorage.setItem(CATEGORIES_ORDER_STORAGE_KEY, JSON.stringify(items));
    toast.success("Category order updated", { duration: 1500 });
  };
  
  return (
    <div className="h-full flex flex-col relative">
      {!hideHeader && (
        <div className="p-3 text-sm font-medium border-b bg-gray-50 flex justify-between items-center">
          {!isCollapsed && <div className="uppercase tracking-wide text-gray-500">Categories</div>}
          <button
            onClick={onToggleCollapse}
            className={`flex items-center justify-center h-6 w-6 rounded-md hover:bg-gray-200 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
      
      <TooltipProvider delayDuration={300}>
        {!isCollapsed ? (
          <div className="overflow-y-auto flex-1">
            <button
              className={`w-full text-left py-3 px-4 text-sm border-b transition-colors ${
                selectedCategory === null
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onSelectCategory(null)}
            >
              All Items
            </button>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="categories-list">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {orderedCategories.map((category, index) => (
                        <Draggable 
                          key={category.id.toString()} 
                          draggableId={category.id.toString()} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${
                                snapshot.isDragging ? 'bg-blue-50 shadow-md' : ''
                              }`}
                            >
                              <button
                                className={`w-full text-left py-3 px-4 text-sm border-b transition-colors flex items-center justify-between ${
                                  selectedCategory === category.name
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => onSelectCategory(category.name)}
                              >
                                <div className="flex items-center">
                                  <Folder 
                                    className="h-4 w-4 mr-2" 
                                    style={{ color: category.color || 'currentColor' }}
                                  />
                                  {category.name}
                                </div>
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-move opacity-50 hover:opacity-100"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`w-full flex justify-center items-center py-3 text-sm border-b transition-colors ${
                    selectedCategory === null ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectCategory(null)}
                >
                  <span className="sr-only">All Items</span>
                  <Folder className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">All Items</TooltipContent>
            </Tooltip>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : (
              orderedCategories.map((category) => (
                <Tooltip key={category.id}>
                  <TooltipTrigger asChild>
                    <button
                      className={`w-full flex justify-center items-center py-3 text-sm border-b transition-colors ${
                        selectedCategory === category.name ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                      }`}
                      onClick={() => onSelectCategory(category.name)}
                    >
                      <span className="sr-only">{category.name}</span>
                      <Folder 
                        className="h-4 w-4" 
                        style={{ color: category.color || 'currentColor' }} 
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{category.name}</TooltipContent>
                </Tooltip>
              ))
            )}
          </div>
        )}
      </TooltipProvider>
    </div>
  );
};
