
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Minus } from "lucide-react";

interface ProductDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onAddToCart: (product: any, quantity: number) => void;
}

export function ProductDetailsDialog({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: ProductDetailsDialogProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isOutOfStock = !product.inventory || product.inventory.quantity <= 0;
  const availableStock = product.inventory?.quantity || 0;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  const incrementQuantity = () => {
    if (quantity < availableStock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>{product.inventory?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Image */}
          <div className="aspect-square relative rounded-lg overflow-hidden bg-secondary">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.inventory?.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            
            {/* Out of Stock Overlay in Dialog */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="bg-red-600 text-white px-3 py-2 rounded-full text-sm font-medium">
                  Out of Stock
                </div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">{product.inventory?.name}</h3>
              {product.inventory?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {product.inventory.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-lg font-bold">
                ${product.price.toFixed(2)}
              </Badge>
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-sm">
                  Out of Stock
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {availableStock} in stock
                </span>
              )}
            </div>

            {/* Quantity Selector - Only show if in stock */}
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={incrementQuantity}
                    disabled={quantity >= availableStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full"
              size="lg"
              disabled={isOutOfStock}
            >
              {isOutOfStock ? (
                "Out of Stock"
              ) : (
                `Add ${quantity > 1 ? `${quantity} items` : 'to Cart'} - $${(product.price * quantity).toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
