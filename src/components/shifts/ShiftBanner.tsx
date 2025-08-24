
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";
import { Clock, DollarSign, AlertTriangle, CreditCard, Wallet, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/services";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Shift = Database['public']['Tables']['shifts']['Row'];

interface ShiftBannerProps {
  shift?: Shift | null;
  activeShift?: Shift | null;
  userId?: string;
}

export const ShiftBanner = ({ shift, activeShift, userId }: ShiftBannerProps) => {
  // Use either shift or activeShift, preferring shift if available
  const currentShift = shift || activeShift;
  
  const { data: salesByMethod, isLoading, isError } = useQuery({
    queryKey: ['shift-sales', currentShift?.id],
    queryFn: async () => {
      if (!currentShift?.id) return null;
      return await transactionsApi.getShiftSales(currentShift.id);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!currentShift?.id
  });

  if (!currentShift) {
    return (
      <div className="p-2 bg-red-50 border-y border-red-200 flex items-center justify-center text-red-700">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">No active shift. Start a shift to process transactions.</span>
      </div>
    );
  }

  // Check if the current user is assigned to the shift or if no specific user is assigned
  const isUserAssigned = !currentShift.assigned_user_id || currentShift.assigned_user_id === userId;
  
  // Calculate total sales from sales by method or fall back to shift.total_sales
  const totalSales = salesByMethod ? 
    Number(salesByMethod.cash || 0) + 
    Number(salesByMethod.credit || 0) + 
    Number(salesByMethod.gift_card || 0) + 
    Number(salesByMethod.other || 0) : 
    Number(currentShift.total_sales || 0);
  
  // Calculate cash vs card percentage for display
  const cashSales = salesByMethod?.cash || 0;
  const cardSales = salesByMethod?.credit || 0;
  const giftCardSales = salesByMethod?.gift_card || 0;
  const otherSales = salesByMethod?.other || 0;
  
  return (
    <div className="p-2 bg-green-50 border-y border-green-200 flex items-center justify-between">
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-2 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          Active Shift: {currentShift.name}
        </span>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center cursor-help">
              <DollarSign className="h-4 w-4 mr-1 text-green-600" />
              <span className="text-sm text-green-700 flex items-center">
                Sales: ${totalSales.toFixed(2)}
                {isLoading && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-2 max-w-xs">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Sales Breakdown:</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="flex items-center">
                  <Wallet className="h-3 w-3 mr-1" />
                  <span className="text-xs">Cash:</span>
                </div>
                <span className="text-xs font-medium text-right">${cashSales.toFixed(2)}</span>
                
                <div className="flex items-center">
                  <CreditCard className="h-3 w-3 mr-1" />
                  <span className="text-xs">Card:</span>
                </div>
                <span className="text-xs font-medium text-right">${cardSales.toFixed(2)}</span>
                
                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  <span className="text-xs">Gift Card:</span>
                </div>
                <span className="text-xs font-medium text-right">${giftCardSales.toFixed(2)}</span>
                
                <div className="flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span className="text-xs">Other:</span>
                </div>
                <span className="text-xs font-medium text-right">${otherSales.toFixed(2)}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
