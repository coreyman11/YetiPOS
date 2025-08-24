
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CartItemProps {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'inventory';
  onUpdateQuantity: (id: number, type: 'service' | 'inventory', quantity: number) => void;
  onRemove: (id: number, type: 'service' | 'inventory') => void;
}

export const CartItem = ({ 
  id, 
  name, 
  price, 
  quantity, 
  type, 
  onUpdateQuantity, 
  onRemove 
}: CartItemProps) => {
  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex-1">
        <h3 className="font-medium">
          {name}
          <span className="ml-2 text-xs text-muted-foreground">
            ({type})
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">
          ${price.toFixed(2)} × {quantity}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateQuantity(id, type, quantity - 1)}
        >
          -
        </Button>
        <span className="w-8 text-center">{quantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateQuantity(id, type, quantity + 1)}
        >
          +
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(id, type)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
