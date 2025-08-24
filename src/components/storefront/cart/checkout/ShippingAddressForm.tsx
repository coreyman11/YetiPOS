
import React from "react";
import { Input } from "@/components/ui/input";

interface ShippingAddressFormProps {
  customerInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  onChange: (updates: Partial<{
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  }>) => void;
  errors: Record<string, string>;
  deliveryMethod: string;
}

export const ShippingAddressForm = ({
  customerInfo,
  onChange,
  errors,
  deliveryMethod
}: ShippingAddressFormProps) => {
  if (!customerInfo) return null;
  
  const isShipping = deliveryMethod === "ship";
  const title = isShipping ? "Shipping address" : "Contact details";
  
  return (
    <div className="mt-3 space-y-3">
      <h3 className="font-medium text-sm">{title}</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="First name (optional)"
          className="h-9 text-sm"
        />
        <Input
          placeholder="Last name"
          required
          value={customerInfo.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${errors.name ? "border-red-300" : ""} h-9 text-sm`}
        />
      </div>
      
      {isShipping && (
        <>
          <Input
            placeholder="Address"
            required
            value={customerInfo.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className={`${errors.address ? "border-red-300" : ""} h-9 text-sm`}
          />
          
          <Input
            placeholder="Apartment, suite, etc. (optional)"
            className="h-9 text-sm"
          />
          
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="City"
              required
              value={customerInfo.city}
              onChange={(e) => onChange({ city: e.target.value })}
              className={`${errors.city ? "border-red-300" : ""} h-9 text-sm`}
            />
            <Input
              placeholder="State"
              required
              value={customerInfo.state}
              onChange={(e) => onChange({ state: e.target.value })}
              className={`${errors.state ? "border-red-300" : ""} h-9 text-sm`}
            />
            <Input
              placeholder="ZIP code"
              required
              value={customerInfo.zip}
              onChange={(e) => onChange({ zip: e.target.value })}
              className={`${errors.zip ? "border-red-300" : ""} h-9 text-sm`}
            />
          </div>
        </>
      )}
    </div>
  );
};
