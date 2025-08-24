
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CardReaderPaymentProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
  onFallback: () => void;
}

export const CardReaderPayment: React.FC<CardReaderPaymentProps> = ({
  amount,
  onSuccess,
  onError,
  onFallback
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reader, setReader] = useState<any>(null);

  const connectReader = async () => {
    try {
      setIsLoading(true);
      // Simulating reader connection in this mock implementation
      setTimeout(() => {
        setReader({ connectionStatus: 'connected', id: 'mock-reader-1' });
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to initialize reader:', error);
      setIsLoading(false);
      onError(new Error('Could not connect to card reader'));
    }
  };

  const disconnectReader = () => {
    setReader(null);
  };

  const initializeReader = async () => {
    try {
      if (!reader || reader.connectionStatus !== 'connected') {
        await connectReader();
      }
    } catch (error) {
      console.error('Failed to initialize reader:', error);
      toast.error("Could not connect to card reader. Please try manual entry.");
      onFallback();
    }
  };

  useEffect(() => {
    initializeReader();
    
    return () => {
      if (reader) {
        disconnectReader();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Connecting to card reader...</span>
      </div>
    );
  }

  if (!reader || reader.connectionStatus !== 'connected') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Card Reader Not Connected</AlertTitle>
        <AlertDescription>
          <p className="mb-2">Please ensure the card reader is:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Powered on</li>
            <li>Connected to the same Wi-Fi network</li>
            <li>Not being used by another device</li>
          </ul>
          <div className="flex gap-2 mt-4">
            <Button onClick={initializeReader} variant="outline">
              Retry Connection
            </Button>
            <Button onClick={onFallback} variant="outline">
              Use Manual Entry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Alert>
        <AlertTitle>Reader Ready</AlertTitle>
        <AlertDescription>
          Please insert, swipe, or tap card on the terminal to complete payment.
        </AlertDescription>
      </Alert>
      <Button 
        onClick={onFallback} 
        variant="outline" 
        className="w-full"
      >
        Switch to Manual Entry
      </Button>
    </div>
  );
};
