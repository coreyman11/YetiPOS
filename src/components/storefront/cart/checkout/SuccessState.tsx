
import React from "react";
import { Check } from "lucide-react";

interface SuccessStateProps {
  message?: string;
}

export const SuccessState = ({ message = "Thank you for your purchase!" }: SuccessStateProps) => {
  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-medium mb-2">Thank you for your purchase!</h3>
        <p className="text-muted-foreground">
          Your order has been placed and is being processed.
        </p>
      </div>
    </div>
  );
};
