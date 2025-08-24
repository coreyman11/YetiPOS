
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Elements } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { stripeApi } from "@/services";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

interface CardFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onClose: () => void;
  amount: number;
}

function CardForm({ clientSecret, onSuccess, onClose, amount }: CardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Special case for free transactions
  useEffect(() => {
    if (clientSecret === "free_transaction") {
      console.log("Processing free transaction");
      onSuccess();
      onClose();
    }
  }, [clientSecret, onSuccess, onClose]);

  const handleManualCardEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      console.log("Processing card payment with client secret:", clientSecret.substring(0, 10) + "...");

      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message || "Failed to process card");
      }

      console.log("Payment method created, confirming payment...");
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id
      });

      if (confirmError) {
        throw new Error(confirmError.message || "Payment failed");
      }

      if (!paymentIntent) {
        throw new Error("No payment intent returned");
      }

      console.log("Payment processed successfully:", paymentIntent.id);
      toast.success("Payment processed successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : "Payment failed");
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle special case for free transactions
  if (clientSecret === "free_transaction") {
    return null; // This will be handled by the useEffect
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <form onSubmit={handleManualCardEntry} className="space-y-4">
          <div className="p-3 border rounded-md bg-white">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
                hidePostalCode: true
              }}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">
              Amount: ${amount.toFixed(2)}
            </div>
            <Button 
              type="submit" 
              disabled={isProcessing || !stripe || !elements}
              className="bg-primary hover:bg-primary/90"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isProcessing ? "Processing..." : "Process Card Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  onSuccess: () => void;
  clientSecret: string | null;
  amount: number;
}

export const CardModal = ({
  isOpen,
  onOpenChange,
  onSuccess,
  clientSecret,
  amount,
  onClose,
}: CardModalProps) => {
  const [stripePromise] = useState(() => stripeApi.getStripePromise());
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onOpenChange(false);
    }
  };

  // Handle the special case for free transactions
  useEffect(() => {
    if (clientSecret === "free_transaction" && isOpen) {
      console.log("Free transaction detected, completing automatically");
      onSuccess();
      handleClose();
    }
  }, [clientSecret, isOpen, onSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        {clientSecret && stripePromise && clientSecret !== "free_transaction" && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CardForm
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onClose={handleClose}
              amount={amount}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};
