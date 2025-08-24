
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { discountsApi } from "@/services";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/types/supabase";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Discount = Database['public']['Tables']['discounts']['Row'];

interface DiscountSelectorProps {
  onDiscountSelect: (discount: Discount | null) => void;
  selectedDiscount: Discount | null;
  disabled?: boolean;
}

export const DiscountSelector = ({ 
  onDiscountSelect, 
  selectedDiscount,
  disabled = false 
}: DiscountSelectorProps) => {
  const { data: discounts, isLoading } = useQuery({
    queryKey: ['active-discounts'],
    queryFn: discountsApi.getActive,
  });

  const handleDiscountChange = (discountId: string) => {
    const selected = discounts?.find(d => d.id === discountId) || null;
    onDiscountSelect(selected);
  };

  const handleClearDiscount = () => {
    onDiscountSelect(null);
  };

  const formatDiscountLabel = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${discount.name} (${discount.value}%)`;
    } else {
      return `${discount.name} (${formatCurrency(discount.value)})`;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Select
          value={selectedDiscount?.id || ""}
          onValueChange={handleDiscountChange}
          disabled={disabled || isLoading || !discounts?.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a discount" />
          </SelectTrigger>
          <SelectContent>
            {discounts?.map((discount) => (
              <SelectItem key={discount.id} value={discount.id}>
                {formatDiscountLabel(discount)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedDiscount && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClearDiscount}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
