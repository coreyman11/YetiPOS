
import { useState } from "react";
import { useLabelGenerator } from "@/hooks/useLabelGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LabelQueueTable } from "./LabelQueueTable";
import { PrintPreview } from "./PrintPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Tags, Zap } from "lucide-react";

export const LabelGeneratorContent = () => {
  const {
    items,
    selectedItems,
    setSelectedItems,
    isLoading,
    generateBarcodesForSelected,
    markLabelsAsPrinted,
    needsLabelCount
  } = useLabelGenerator();
  
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleGenerateBarcodes = async () => {
    await generateBarcodesForSelected();
  };

  const handlePrintLabels = () => {
    setShowPrintPreview(true);
  };

  const handlePrintComplete = async () => {
    await markLabelsAsPrinted(selectedItems);
    setShowPrintPreview(false);
    setSelectedItems([]);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Label Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate barcodes and print labels for inventory items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {needsLabelCount} items need labels
          </div>
          {selectedItems.length > 0 && (
            <>
              <Button
                onClick={handleGenerateBarcodes}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate Barcodes ({selectedItems.length})
              </Button>
              <Button
                onClick={handlePrintLabels}
                disabled={isLoading}
                size="sm"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Labels ({selectedItems.length})
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Label Queue
          </TabsTrigger>
          <TabsTrigger value="all">All Items</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items Needing Labels</CardTitle>
              <CardDescription>
                Items without barcodes or marked as needing new labels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LabelQueueTable
                items={items.filter(item => item.needs_label)}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
                showOnlyNeedsLabel={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>
                Complete inventory list with label status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LabelQueueTable
                items={items}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
                showOnlyNeedsLabel={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPrintPreview && (
        <PrintPreview
          items={items.filter(item => selectedItems.includes(item.id))}
          onClose={() => setShowPrintPreview(false)}
          onPrintComplete={handlePrintComplete}
        />
      )}
    </div>
  );
};
