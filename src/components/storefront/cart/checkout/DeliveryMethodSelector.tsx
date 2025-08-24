
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Truck, Store } from "lucide-react";

interface DeliveryMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const DeliveryMethodSelector = ({
  value,
  onChange,
  error
}: DeliveryMethodSelectorProps) => {
  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm">
      <h3 className="font-medium text-sm mb-2">Delivery</h3>
      
      <RadioGroup 
        value={value} 
        onValueChange={onChange}
        className="space-y-2"
      >
        <div className={`flex items-center justify-between border rounded-md p-2 ${value === "ship" ? "border-primary" : ""}`}>
          <div className="flex items-center">
            <RadioGroupItem value="ship" id="ship" className="mr-2" />
            <Label htmlFor="ship" className="flex items-center cursor-pointer text-sm">
              <Truck className="h-3 w-3 mr-1" />
              Ship
            </Label>
          </div>
        </div>
        
        <div className={`flex items-center justify-between border rounded-md p-2 ${value === "pickup" ? "border-primary" : ""}`}>
          <div className="flex items-center">
            <RadioGroupItem value="pickup" id="pickup" className="mr-2" />
            <Label htmlFor="pickup" className="flex items-center cursor-pointer text-sm">
              <Store className="h-3 w-3 mr-1" />
              Pickup in store
            </Label>
          </div>
        </div>
      </RadioGroup>
      
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
