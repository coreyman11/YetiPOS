
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { BarcodePreview } from "./BarcodePreview";
import { Search, Zap, Check, X } from "lucide-react";
import { Database } from "@/types/supabase";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface LabelQueueTableProps {
  items: InventoryItem[];
  selectedItems: number[];
  onSelectionChange: (items: number[]) => void;
  showOnlyNeedsLabel: boolean;
}

export const LabelQueueTable = ({
  items,
  selectedItems,
  onSelectionChange,
  showOnlyNeedsLabel
}: LabelQueueTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredItems.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };

  const isAllSelected = filteredItems.length > 0 && 
    filteredItems.every(item => selectedItems.includes(item.id));
  const isPartiallySelected = filteredItems.some(item => selectedItems.includes(item.id)) && 
    !isAllSelected;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredItems.length} items
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <div className="flex items-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  {isPartiallySelected && !isAllSelected && (
                    <div className="absolute w-2 h-0.5 bg-primary rounded-sm transform -translate-x-2 -translate-y-0.5" />
                  )}
                </div>
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => 
                      handleSelectItem(item.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">
                    {item.sku || 'N/A'}
                  </code>
                </TableCell>
                <TableCell>
                  {item.barcode ? (
                    <code className="text-sm bg-muted px-1 py-0.5 rounded">
                      {item.barcode}
                    </code>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">None</span>
                      <Zap className="h-3 w-3 text-orange-500" />
                    </div>
                  )}
                </TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.needs_label ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        <X className="h-3 w-3 mr-1" />
                        Needs Label
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Label Ready
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.barcode && (
                    <BarcodePreview
                      barcode={item.barcode}
                      itemName={item.name}
                      price={item.price}
                      size="small"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
