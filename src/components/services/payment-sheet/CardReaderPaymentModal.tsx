
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Check, AlertCircle, RefreshCw } from "lucide-react";
import { terminalApi } from "@/services/terminal-api";
import { useCardReader } from "@/hooks/useCardReader";
import { locationsApi } from "@/services";
import { toast } from "sonner";

interface CardReaderPaymentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
}

export const CardReaderPaymentModal = ({
  isOpen,
  onOpenChange,
  onClose,
  amount,
  onSuccess,
}: CardReaderPaymentModalProps) => {
  const [status, setStatus] = useState<
    "initial" | "checking_existing" | "discovering" | "connecting" | "connected" | "processing" | "success" | "error"
  >("initial");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedReader, setSelectedReader] = useState<any>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  
  const { reader: savedReader } = useCardReader(locationId || undefined);

  useEffect(() => {
    if (isOpen) {
      initializePayment();
    } else {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStatus("initial");
    setErrorMessage(null);
    setSelectedReader(null);
  };

  const initializePayment = async () => {
    try {
      setStatus("initial");
      setErrorMessage(null);

      // Get current location
      const location = await locationsApi.getCurrentLocation();
      if (location) {
        setLocationId(location.id);
      }

      // Try to use a saved/default reader first
      if (savedReader?.id) {
        try {
          setStatus("connecting");
          console.log("Attempting saved reader:", savedReader.id);
          const readerDetails = await terminalApi.getReader(savedReader.id);
          setSelectedReader(readerDetails);
          setStatus("connected");
          
          // Auto-start payment processing
          setTimeout(() => {
            handleProcessPayment(savedReader.id);
          }, 500);
          return;
        } catch (e) {
          console.warn("Saved reader not available, falling back to discovery", e);
        }
      }

      // Fallback to discovery if no saved reader
      await discoverAndConnectReader();
    } catch (error) {
      console.error("Error initializing payment:", error);
      setStatus("error");
      setErrorMessage(error.message || "Failed to initialize card reader");
    }
  };

  const discoverAndConnectReader = async () => {
    try {
      setStatus("discovering");
      console.log("Discovering readers...");

      // Create connection token
      const token = await terminalApi.createConnectionToken();

      // List available readers
      const availableReaders = await terminalApi.listReaders();

      if (availableReaders.length === 0) {
        setStatus("error");
        setErrorMessage("No card readers found. Please ensure your reader is powered on and connected.");
        return;
      }

      // Auto-select the first online reader or any available reader
      const onlineReader = availableReaders.find(reader => reader.status === "online");
      const readerToUse = onlineReader || availableReaders[0];

      if (readerToUse) {
        setStatus("connecting");
        console.log("Connecting to reader:", readerToUse.id);

        if (readerToUse.status !== "online") {
          const connectedReader = await terminalApi.connectById(readerToUse.id);
          setSelectedReader(connectedReader);
        } else {
          setSelectedReader(readerToUse);
        }

        setStatus("connected");
        console.log("Reader connected successfully");
        
        // Auto-start payment processing
        setTimeout(() => {
          handleProcessPayment(readerToUse.id);
        }, 500);
      }
    } catch (error) {
      console.error("Error discovering readers:", error);
      setStatus("error");
      setErrorMessage(error.message || "Failed to connect to card reader");
    }
  };

  const handleProcessPayment = async (readerId?: string) => {
    const readerIdToUse = readerId || selectedReader?.id;
    
    if (!readerIdToUse) {
      setErrorMessage("No reader available for payment");
      return;
    }

    try {
      setStatus("processing");
      setErrorMessage(null);

      console.log(`Processing payment for $${amount} on reader ${readerIdToUse}`);
      console.log("Starting payment process - waiting for customer to present card...");

      // Process the payment using the terminal API
      // Pass the dollar amount directly - the edge function will handle conversion
      const paymentResult = await terminalApi.processPayment(
        readerIdToUse,
        amount,
        `POS Transaction - $${amount.toFixed(2)}`
      );

      console.log("Payment result received:", paymentResult);

      // The edge function returns the complete result after payment is finished
      if (paymentResult && paymentResult.paymentIntent) {
        const paymentIntent = paymentResult.paymentIntent;
        console.log("Payment Intent status:", paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
          console.log("Payment succeeded!");
          setStatus("success");
          toast.success("Payment processed successfully!");
          
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          console.log("Unexpected payment status:", paymentIntent.status);
          setStatus("error");
          setErrorMessage(`Payment not completed. Status: ${paymentIntent.status}`);
          toast.error("Payment was not completed");
        }
      } else if (paymentResult && paymentResult.error) {
        console.error("Payment error from edge function:", paymentResult.error);
        setStatus("error");
        
        if (paymentResult.error.code === 'payment_canceled') {
          setErrorMessage("Payment was canceled by customer");
          toast.error("Payment canceled");
        } else if (paymentResult.error.code === 'payment_timeout') {
          setErrorMessage("Payment timed out. Customer did not present card in time.");
          toast.error("Payment timed out");
        } else if (paymentResult.error.code === 'payment_failed') {
          setErrorMessage("Payment was declined. Please try a different card.");
          toast.error("Payment declined");
        } else {
          setErrorMessage(paymentResult.error.message || "Payment processing failed");
          toast.error("Payment failed: " + (paymentResult.error.message || "Unknown error"));
        }
      } else {
        console.error("Unknown payment result structure:", paymentResult);
        setStatus("error");
        setErrorMessage("Unexpected payment response. Please try again.");
        toast.error("Payment failed - unexpected response");
      }

    } catch (paymentError) {
      console.error("Payment processing error:", paymentError);
      setStatus("error");
      
      if (paymentError.message?.includes('timeout') || paymentError.message?.includes('timed out')) {
        setErrorMessage("Payment timed out. Customer did not present card in time.");
        toast.error("Payment timed out");
      } else if (paymentError.message?.includes('canceled') || paymentError.message?.includes('cancelled')) {
        setErrorMessage("Payment was canceled by customer");
        toast.error("Payment canceled");
      } else {
        setErrorMessage(paymentError.message || "Payment processing failed");
        toast.error("Payment failed: " + (paymentError.message || "Unknown error"));
      }
    }
  };

  const statusMessages = {
    initial: "Initializing payment...",
    checking_existing: "Checking for connected readers...",
    discovering: "Looking for card readers...",
    connecting: "Connecting to card reader...",
    connected: "Reader ready. Starting payment...",
    processing: "Waiting for card - Please insert, tap, or swipe card on the reader",
    success: "Payment approved!",
    error: errorMessage || "An error occurred"
  };

  const canCancel = status === "processing" || status === "connected";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Card Reader Payment</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          {status === "initial" || status === "checking_existing" || status === "discovering" || status === "connecting" ? (
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          ) : status === "connected" || status === "processing" ? (
            <CreditCard className="h-16 w-16 text-primary mb-4 animate-pulse" />
          ) : status === "success" ? (
            <Check className="h-16 w-16 text-green-500 mb-4" />
          ) : (
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          )}
          
          <p className="text-2xl font-bold mb-2 text-primary">
            ${amount.toFixed(2)}
          </p>
          
          <p className="text-center mb-4 text-lg">
            {statusMessages[status]}
          </p>

          {selectedReader && (status === "connected" || status === "processing") && (
            <p className="text-sm text-muted-foreground mb-4">
              Connected to: {selectedReader.device_type} ({selectedReader.id.substring(0, 8)}...)
            </p>
          )}
          
          {status === "processing" && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Present your card on the card reader to complete payment
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing payment on reader...</span>
              </div>
            </div>
          )}
          
          {status === "error" && (
            <div className="space-y-4 w-full">
              <Button variant="outline" onClick={initializePayment} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Payment
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {canCancel && (
            <Button variant="outline" onClick={onClose} className="w-full mt-4">
              Cancel Payment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
