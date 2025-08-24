
import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LabelTemplate } from "./LabelTemplate";
import { Printer, X } from "lucide-react";
import { Database } from "@/types/supabase";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface PrintPreviewProps {
  items: InventoryItem[];
  onClose: () => void;
  onPrintComplete: () => void;
}

export const PrintPreview = ({ items, onClose, onPrintComplete }: PrintPreviewProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Labels</title>
              <style>
                * { box-sizing: border-box; }
                body { 
                  margin: 0; 
                  padding: 10px; 
                  font-family: Arial, sans-serif; 
                  background: white;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .print-container {
                  display: grid;
                  grid-template-columns: repeat(8, 1fr);
                  gap: 4px;
                  max-width: 8.5in;
                  margin: 0 auto;
                }
                .label {
                  width: 1in !important;
                  height: 0.5in !important;
                  border: 1px solid #000 !important;
                  padding: 1px !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  align-items: center !important;
                  page-break-inside: avoid;
                  background: white !important;
                  position: relative;
                  font-size: 6px !important;
                  line-height: 1 !important;
                }
                .break-words {
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                  hyphens: auto !important;
                  text-align: center !important;
                  line-height: 1 !important;
                  max-height: 8px !important;
                  overflow: hidden !important;
                  font-size: 6px !important;
                }
                img {
                  max-width: 90px !important;
                  height: 20px !important;
                  display: block !important;
                  image-rendering: crisp-edges !important;
                  image-rendering: -webkit-optimize-contrast !important;
                }
                canvas { display: none !important; }
                .print\\:hidden { display: none !important; }
                .hidden { display: block !important; }
                .print\\:block { display: block !important; }
                
                @media print {
                  body { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                  }
                  .print-container { 
                    gap: 2px !important; 
                    page-break-inside: avoid;
                    max-width: none !important;
                  }
                  .label { 
                    border: 1px solid #000 !important; 
                    break-inside: avoid;
                  }
                  @page {
                    margin: 0.25in;
                    size: letter;
                  }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Wait for images to load before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          onPrintComplete();
        }, 1500);
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Preview - {items.length} Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Preview of labels to be printed. Each label is sized for standard 1" x 0.5" label paper.
            Labels will dynamically resize to fit content properly.
          </div>

          <div 
            ref={printRef}
            className="print-container grid grid-cols-8 gap-1 max-w-full justify-items-center"
          >
            {items.map((item) => (
              <LabelTemplate
                key={item.id}
                item={item}
              />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
