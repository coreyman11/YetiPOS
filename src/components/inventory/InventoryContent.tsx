
import { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Plus, WifiOff, RefreshCw, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddInventoryForm } from "./AddInventoryForm";
import { EditInventoryForm } from "./EditInventoryForm";
import { ViewInventoryDialog } from "./ViewInventoryDialog";
import { InventorySearch } from "./InventorySearch";
import { InventoryList } from "./InventoryList";
import { InventoryPagination } from "./InventoryPagination";
import { EmptyInventory } from "./EmptyInventory";
import { Badge } from "@/components/ui/badge";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { useState } from "react";
import { NetworkStatus } from "@/types/realtime";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface InventoryContentProps {
  items: InventoryItem[];
  filteredItems: InventoryItem[];
  isLoading: boolean;
  isError: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isAddingItem: boolean;
  setIsAddingItem: (value: boolean) => void;
  isEditingItem: boolean;
  setIsEditingItem: (value: boolean) => void;
  isViewingItem: boolean;
  setIsViewingItem: (value: boolean) => void;
  selectedItem: InventoryItem | null;
  setSelectedItem: (item: InventoryItem | null) => void;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  networkStatus: NetworkStatus;
  hasRealtimeUpdates?: boolean;
  handleAddItem: (item: Omit<InventoryItem, 'id' | 'created_at'>) => Promise<void>;
  handleEditItem: (item: InventoryItem) => Promise<void>;
  handleEditClick: (item: InventoryItem) => void;
  handleViewClick: (item: InventoryItem) => void;
  handlePageSizeChange: (value: string) => void;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const InventoryContent = ({
  items,
  filteredItems,
  isLoading,
  isError,
  searchTerm,
  setSearchTerm,
  isAddingItem,
  setIsAddingItem,
  isEditingItem,
  setIsEditingItem,
  isViewingItem,
  setIsViewingItem,
  selectedItem,
  setSelectedItem,
  pageSize,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  networkStatus,
  hasRealtimeUpdates,
  handleAddItem,
  handleEditItem,
  handleEditClick,
  handleViewClick,
  handlePageSizeChange,
  handlePreviousPage,
  handleNextPage
}: InventoryContentProps) => {
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">Loading inventory items...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-destructive">Error loading inventory items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Manage your inventory items.</p>
            {hasRealtimeUpdates && (
              <Badge variant="outline" className="text-green-600 border-green-600 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Real-time updates active
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!networkStatus.online && (
            <div className="flex items-center text-yellow-600 mr-2">
              <WifiOff className="h-4 w-4 mr-1" />
              <span className="text-sm">Offline</span>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={() => setIsCategoriesDialogOpen(true)} 
            disabled={!networkStatus.online}
          >
            <Tag className="mr-2 h-4 w-4" />
            Categories
          </Button>
          <Button onClick={() => setIsAddingItem(true)} disabled={!networkStatus.online}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <InventorySearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />

        {filteredItems.length === 0 ? (
          <EmptyInventory onAddItem={() => setIsAddingItem(true)} />
        ) : (
          <div>
            <InventoryList 
              items={items} 
              onViewItem={handleViewClick}
              onEditItem={handleEditClick}
            />
            
            <InventoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={Math.min(endIndex, filteredItems.length)}
              totalItems={filteredItems.length}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
            />
          </div>
        )}
      </div>

      <AddInventoryForm
        isOpen={isAddingItem}
        onOpenChange={setIsAddingItem}
        onSubmit={handleAddItem}
      />

      <EditInventoryForm
        isOpen={isEditingItem}
        onOpenChange={(open) => {
          setIsEditingItem(open)
          if (!open) setSelectedItem(null)
        }}
        item={selectedItem}
        onSubmit={handleEditItem}
        onChange={setSelectedItem}
      />

      <ViewInventoryDialog
        isOpen={isViewingItem}
        onOpenChange={(open) => {
          setIsViewingItem(open)
          if (!open) setSelectedItem(null)
        }}
        item={selectedItem}
      />

      <ManageCategoriesDialog
        open={isCategoriesDialogOpen}
        onOpenChange={setIsCategoriesDialogOpen}
      />
    </div>
  );
};
