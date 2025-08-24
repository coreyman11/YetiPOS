
import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Database } from "@/types/supabase";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface LabelTemplateProps {
  item: InventoryItem;
}

export const LabelTemplate = ({ item }: LabelTemplateProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeImage, setBarcodeImage] = useState<string>("");

  useEffect(() => {
    if (canvasRef.current && item.barcode) {
      try {
        // Clear canvas first
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        JsBarcode(canvas, item.barcode, {
          format: "CODE128",
          width: 1,
          height: 20,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000"
        });
        
        // Convert canvas to base64 image for printing
        const imageData = canvas.toDataURL('image/png', 1.0);
        setBarcodeImage(imageData);
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }
  }, [item.barcode]);

  return (
    <div className="label relative bg-white border border-black" 
         style={{ 
           width: '1in', 
           height: '0.5in',
           minWidth: '96px',
           minHeight: '48px',
           padding: '1px',
           display: 'flex',
           flexDirection: 'column',
           justifyContent: 'space-between',
           alignItems: 'center',
           fontSize: '6px',
           lineHeight: '1'
         }}>
      
      {/* Product Name */}
      <div className="w-full text-center" style={{ 
        fontSize: '6px', 
        fontWeight: 'bold', 
        lineHeight: '1',
        maxHeight: '8px',
        overflow: 'hidden'
      }}>
        <div className="break-words" style={{ 
          wordBreak: 'break-word', 
          overflowWrap: 'break-word',
          hyphens: 'auto',
          textAlign: 'center'
        }}>
          {item.name}
        </div>
      </div>
      
      {/* Barcode Section */}
      <div className="flex-1 flex items-center justify-center w-full" style={{ minHeight: '20px' }}>
        {item.barcode && (
          <>
            {/* Canvas for display (hidden in print) */}
            <canvas
              ref={canvasRef}
              className="print:hidden"
              style={{ maxWidth: '90px', height: 'auto' }}
              width={90}
              height={25}
            />
            
            {/* Image for printing (hidden on screen) */}
            {barcodeImage && (
              <img
                src={barcodeImage}
                alt={`Barcode: ${item.barcode}`}
                className="hidden print:block"
                style={{ 
                  maxWidth: '90px', 
                  height: '20px',
                  imageRendering: 'crisp-edges'
                }}
              />
            )}
          </>
        )}
      </div>
      
      {/* Price */}
      <div className="w-full text-center" style={{ 
        fontSize: '7px', 
        fontWeight: 'bold',
        lineHeight: '1'
      }}>
        ${item.price.toFixed(2)}
      </div>
    </div>
  );
};
