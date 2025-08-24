
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/services";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/types/supabase";
import { generateBarcode } from "@/utils/barcode-utils";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export const useLabelGenerator = () => {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => await inventoryApi.getAll(),
  });

  const needsLabelCount = items.filter(item => item.needs_label).length;

  const generateBarcodesForSelected = async () => {
    if (selectedItems.length === 0) return;

    setIsLoading(true);
    try {
      let generatedCount = 0;
      let queuedCount = 0;

      for (const item of items.filter(item => selectedItems.includes(item.id))) {
        let updateData: any = { needs_label: true };
        
        // Generate barcode if item doesn't have one
        if (!item.barcode || item.barcode === '') {
          const newBarcode = generateBarcode(item.id, item.sku || '');
          updateData.barcode = newBarcode;
          generatedCount++;
        } else {
          queuedCount++;
        }
        
        await inventoryApi.update(item.id, updateData);
      }

      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      let message = '';
      if (generatedCount > 0 && queuedCount > 0) {
        message = `Generated ${generatedCount} new barcodes and queued ${queuedCount} existing items for printing`;
      } else if (generatedCount > 0) {
        message = `Generated barcodes for ${generatedCount} items`;
      } else {
        message = `Queued ${queuedCount} items for printing`;
      }
      
      toast({
        title: "Success",
        description: message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate barcodes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markLabelsAsPrinted = async (itemIds: number[]) => {
    if (itemIds.length === 0) return;

    setIsLoading(true);
    try {
      for (const itemId of itemIds) {
        await inventoryApi.update(itemId, {
          needs_label: false,
          label_printed_at: new Date().toISOString()
        });
      }

      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      toast({
        title: "Success",
        description: `Marked ${itemIds.length} labels as printed`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update label status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    items,
    selectedItems,
    setSelectedItems,
    isLoading: isLoading || isLoadingItems,
    generateBarcodesForSelected,
    markLabelsAsPrinted,
    needsLabelCount
  };
};
