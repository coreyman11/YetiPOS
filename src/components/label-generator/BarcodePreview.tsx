
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodePreviewProps {
  barcode: string;
  itemName?: string;
  price?: number;
  size?: "small" | "medium" | "large";
}

export const BarcodePreview = ({ 
  barcode, 
  itemName, 
  price, 
  size = "medium" 
}: BarcodePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && barcode) {
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Generate barcode
        JsBarcode(canvas, barcode, {
          format: "CODE128",
          width: size === "small" ? 1 : size === "large" ? 3 : 2,
          height: size === "small" ? 30 : size === "large" ? 80 : 50,
          displayValue: size !== "small",
          fontSize: size === "small" ? 10 : size === "large" ? 16 : 12,
          margin: 5,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }
  }, [barcode, size]);

  if (!barcode) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No barcode available
      </div>
    );
  }

  const canvasWidth = size === "small" ? 120 : size === "large" ? 300 : 200;
  const canvasHeight = size === "small" ? 40 : size === "large" ? 100 : 70;

  return (
    <div className="flex flex-col items-center space-y-1">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border border-gray-200 rounded"
      />
      {size !== "small" && itemName && (
        <div className="text-xs text-center max-w-[200px]">
          <div className="font-medium truncate">{itemName}</div>
          {price && (
            <div className="text-muted-foreground">${price.toFixed(2)}</div>
          )}
        </div>
      )}
    </div>
  );
};
