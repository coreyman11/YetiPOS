
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <p className="text-sm text-red-500 mb-3">{error}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onRetry}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
};
