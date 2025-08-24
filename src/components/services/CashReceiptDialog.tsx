
import React from "react";
import { ReceiptDialog } from "./ReceiptDialog";
import { cn } from "@/lib/utils";

interface CashReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  transactionId: number;
  cashReceived?: number | null;
  totalAmount?: number;
}

export const CashReceiptDialog = ({
  isOpen,
  onOpenChange,
  onClose,
  transactionId,
  cashReceived,
  totalAmount,
}: CashReceiptDialogProps) => {
  // Calculate change if cashReceived is provided
  const change = cashReceived && totalAmount 
    ? Math.max(0, cashReceived - totalAmount).toFixed(2)
    : null;

  const showCashDetails = cashReceived !== null && cashReceived !== undefined && totalAmount;

  return (
    <ReceiptDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onClose={onClose}
      transactionId={transactionId}
      additionalContent={
        showCashDetails ? (
          <div className={cn(
            "mt-4 p-3 border rounded-md bg-green-50 border-green-100",
            "animate-fade-in"
          )}>
            <h3 className="font-medium text-green-800 mb-2">Cash Payment Details</h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div className="text-green-700">Total Amount:</div>
              <div className="text-right font-medium">${totalAmount?.toFixed(2)}</div>
              
              <div className="text-green-700">Cash Received:</div>
              <div className="text-right font-medium">${cashReceived.toFixed(2)}</div>
              
              <div className="text-green-700 font-medium">Change Due:</div>
              <div className="text-right font-bold text-green-800">${change}</div>
            </div>
          </div>
        ) : null
      }
    />
  );
};
